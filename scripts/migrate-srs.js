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
  `CREATE TABLE IF NOT EXISTS card_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    card_id UUID REFERENCES cards(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    rating INT NOT NULL,
    prev_interval NUMERIC,
    new_interval NUMERIC,
    reviewed_at TIMESTAMPTZ DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS idx_card_reviews_card ON card_reviews(card_id, reviewed_at DESC)`,
  `CREATE INDEX IF NOT EXISTS idx_card_reviews_user_date ON card_reviews(user_id, reviewed_at DESC)`,
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
