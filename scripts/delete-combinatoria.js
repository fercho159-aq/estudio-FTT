// Borra tarjetas de combinatoria/permutación del mazo Probabilidad de fercho30.
// Uso:
//   node scripts/delete-combinatoria.js          → dry-run (lista)
//   node scripts/delete-combinatoria.js --apply  → borra de verdad

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
} catch (e) {
  console.error('No .env.local'); process.exit(1);
}

const apply = process.argv.includes('--apply');
const pool = new Pool({ connectionString: process.env.DATABASE_URL, ssl: { rejectUnauthorized: false } });

async function main() {
  const { rows: [user] } = await pool.query(
    `SELECT id FROM users WHERE username = 'fercho30'`
  );
  if (!user) throw new Error('Usuario no existe');

  const { rows: [deck] } = await pool.query(
    `SELECT id FROM decks WHERE user_id = $1 AND name = 'Probabilidad'`,
    [user.id]
  );
  if (!deck) throw new Error('Mazo Probabilidad no existe');

  // Patrones inclusivos de combinatoria
  const SQL_FILTER = `
    deck_id = $1 AND (
      front ILIKE '%permutac%' OR
      front ILIKE '%combinac%' OR
      front ILIKE '%conteo%' OR
      front ILIKE '%aditivo%'
    )
  `;

  const { rows: matches } = await pool.query(
    `SELECT id, front FROM cards WHERE ${SQL_FILTER} ORDER BY created_at`,
    [deck.id]
  );

  console.log(`\nMatches (${matches.length}):\n`);
  matches.forEach((c, i) => console.log(`  ${i + 1}. ${c.front.slice(0, 90)}`));

  if (!apply) {
    console.log('\n[dry-run] Para borrar de verdad: node scripts/delete-combinatoria.js --apply');
  } else {
    const { rowCount } = await pool.query(
      `DELETE FROM cards WHERE ${SQL_FILTER}`,
      [deck.id]
    );
    console.log(`\n✓ ${rowCount} tarjetas borradas`);
  }
  await pool.end();
}

main().catch(e => { console.error(e.message); pool.end(); process.exit(1); });
