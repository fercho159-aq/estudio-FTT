// Sube un mazo .md de Obsidian a la DB de Mnemo.
// Uso: node scripts/upload-md-deck.js <username> <ruta-md>

const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

// Cargar .env.local
try {
  fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8')
    .split('\n').forEach(line => {
      const i = line.indexOf('=');
      if (i > 0) {
        const key = line.slice(0, i).trim();
        const val = line.slice(i + 1).trim();
        if (key && !key.startsWith('#')) process.env[key] = val;
      }
    });
} catch (e) {
  console.error('No se pudo leer .env.local:', e.message);
  process.exit(1);
}

const [, , username, mdPath] = process.argv;
if (!username || !mdPath) {
  console.error('Uso: node scripts/upload-md-deck.js <username> <ruta-md>');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function parseFrontmatter(md) {
  const m = md.match(/^---\n([\s\S]*?)\n---\n/);
  if (!m) return { meta: {}, body: md };
  const meta = {};
  m[1].split('\n').forEach(l => {
    const i = l.indexOf(':');
    if (i > 0) meta[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  });
  return { meta, body: md.slice(m[0].length) };
}

function parseCards(body) {
  const blocks = body.split(/^---\s*$/m);
  const cards = [];
  for (const block of blocks) {
    const lines = block.split('\n');
    let qIdx = -1, aIdx = -1;
    for (let i = 0; i < lines.length; i++) {
      if (qIdx < 0 && /^Q:\s*/.test(lines[i])) qIdx = i;
      else if (qIdx >= 0 && aIdx < 0 && /^A:\s*/.test(lines[i])) { aIdx = i; break; }
    }
    if (qIdx < 0 || aIdx < 0) continue;

    let front = lines[qIdx].replace(/^Q:\s*/, '').trim();
    for (let i = qIdx + 1; i < aIdx; i++) {
      const t = lines[i].trim();
      if (t) front += '\n' + t;
    }

    let backFirst = lines[aIdx].replace(/^A:\s*/, '').trim();
    const tail = [];
    for (let i = aIdx + 1; i < lines.length; i++) {
      tail.push(lines[i].replace(/^  /, ''));
    }
    while (tail.length && !tail[tail.length - 1].trim()) tail.pop();
    while (tail.length && !tail[0].trim()) tail.shift();

    let back;
    if (backFirst === '|') {
      back = tail.join('\n');
    } else {
      back = tail.length ? backFirst + '\n' + tail.join('\n') : backFirst;
    }

    cards.push({ front: front.trim(), back: back.trim() });
  }
  return cards;
}

// Parser de tabla markdown: | Frente | Reverso |
function parseCardsTable(body) {
  const lines = body.split('\n');
  const cards = [];
  let inTable = false;
  const PIPE = '__ESC_PIPE__';
  for (const raw of lines) {
    const line = raw.trim();
    if (!line.startsWith('|')) { inTable = false; continue; }
    if (/^\|\s*[-:]{2,}/.test(line)) { inTable = true; continue; }
    if (!inTable && /Frente/i.test(line) && /Reverso/i.test(line)) continue;
    if (!inTable) continue;
    const cols = line.replace(/\\\|/g, PIPE).split('|').slice(1, -1)
      .map(c => c.split(PIPE).join('|').trim());
    if (cols.length < 2) continue;
    const front = cols[0].replace(/<br\s*\/?>/gi, '\n').trim();
    const back = cols[1].replace(/<br\s*\/?>/gi, '\n').trim();
    if (front && back) cards.push({ front, back });
  }
  return cards;
}

async function main() {
  const md = fs.readFileSync(mdPath, 'utf8');
  const { meta, body } = parseFrontmatter(md);
  const deckName = meta.mazo || path.basename(mdPath, '.md');
  const emoji = meta.emoji || '📚';
  let cards = parseCards(body);
  if (cards.length === 0) cards = parseCardsTable(body);
  console.log(`Mazo: ${deckName} ${emoji} — ${cards.length} tarjetas`);
  if (cards.length === 0) throw new Error('No se detectaron tarjetas (formatos: Q:/A: o tabla | Frente | Reverso |)');

  const { rows: [user] } = await pool.query(
    'SELECT id FROM users WHERE username = $1', [username.toLowerCase()]
  );
  if (!user) throw new Error(`Usuario "${username}" no existe`);

  const existing = await pool.query(
    'SELECT id FROM decks WHERE user_id = $1 AND name = $2',
    [user.id, deckName]
  );
  if (existing.rows[0]) {
    throw new Error(`Mazo "${deckName}" ya existe (id=${existing.rows[0].id}). Bórralo primero o cambia el nombre.`);
  }

  const { rows: [deck] } = await pool.query(
    'INSERT INTO decks (name, emoji, user_id) VALUES ($1, $2, $3) RETURNING id',
    [deckName, emoji, user.id]
  );
  console.log(`Mazo creado, id=${deck.id}`);

  for (const c of cards) {
    await pool.query(
      'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)',
      [deck.id, c.front, c.back]
    );
  }
  console.log(`✓ ${cards.length} tarjetas insertadas`);
  await pool.end();
}

main().catch(e => { console.error('Error:', e.message); pool.end(); process.exit(1); });
