// Migración idempotente para SRS de 4 botones.
// Uso: node scripts/migrate-srs.js

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
  console.error('No .env.local:', e.message);
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const MIGRATIONS = [
  `ALTER TABLE cards ADD COLUMN IF NOT EXISTS lapse_count INT DEFAULT 0`,
  `ALTER TABLE cards ADD COLUMN IF NOT EXISTS last_reviewed TIMESTAMPTZ`,
];

async function main() {
  for (const sql of MIGRATIONS) {
    console.log(`→ ${sql}`);
    await pool.query(sql);
  }
  console.log('✓ Migración completa');
  await pool.end();
}

main().catch(e => { console.error('Error:', e.message); pool.end(); process.exit(1); });
