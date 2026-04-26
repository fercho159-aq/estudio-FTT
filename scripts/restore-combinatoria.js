const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

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
} catch (e) { console.error('No .env.local'); process.exit(1); }

const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

const RESTORE = [
  {
    front: '¿Qué establece el principio fundamental del conteo (regla del producto)?',
    back: 'Si una decisión tiene $k$ etapas con $n_1, n_2, \\ldots, n_k$ formas respectivamente, el total es $N = n_1 \\cdot n_2 \\cdots n_k$.'
  },
  {
    front: '¿Cuándo se usa el principio aditivo?',
    back: 'Cuando la tarea se realiza de una forma **o** de otra (mutuamente excluyentes): $N = n_1 + n_2$.'
  },
  {
    front: 'Diferencia clave entre permutación y combinación',
    back: 'En permutación **el orden importa**; en combinación NO. Pregunta: ¿*ABC* y *CBA* cuentan distinto? Sí → permutación.'
  }
];

async function main() {
  const { rows: [user] } = await pool.query(`SELECT id FROM users WHERE username = 'fercho30'`);
  const { rows: [deck] } = await pool.query(
    `SELECT id FROM decks WHERE user_id = $1 AND name = 'Probabilidad'`, [user.id]
  );
  for (const c of RESTORE) {
    // Evitar duplicados
    const { rows } = await pool.query(
      `SELECT id FROM cards WHERE deck_id = $1 AND front = $2`, [deck.id, c.front]
    );
    if (rows.length > 0) { console.log(`(ya existe) ${c.front.slice(0, 60)}`); continue; }
    await pool.query(
      `INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3)`,
      [deck.id, c.front, c.back]
    );
    console.log(`✓ ${c.front.slice(0, 60)}`);
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
