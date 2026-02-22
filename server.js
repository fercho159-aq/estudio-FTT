const express = require('express');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

// Load .env
try {
  fs.readFileSync(path.join(__dirname, '.env'), 'utf8').split('\n').forEach(line => {
    const i = line.indexOf('=');
    if (i > 0) {
      const key = line.slice(0, i).trim();
      const val = line.slice(i + 1).trim();
      if (key && !key.startsWith('#')) process.env[key] = val;
    }
  });
} catch (e) {}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// ── Decks ──

app.get('/api/decks', h(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT d.*,
      COUNT(c.id)::int AS card_count,
      COUNT(CASE WHEN c.next_review <= NOW() THEN 1 END)::int AS due_count,
      COUNT(CASE WHEN c.interval_days >= 21 THEN 1 END)::int AS mastered_count,
      COUNT(CASE WHEN c.review_count > 0 AND c.interval_days < 21 THEN 1 END)::int AS learning_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `);
  res.json(rows);
}));

app.post('/api/decks', h(async (req, res) => {
  const { name, emoji } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO decks (name, emoji) VALUES ($1, $2) RETURNING *',
    [name, emoji || '📚']
  );
  res.json(rows[0]);
}));

app.put('/api/decks/:id', h(async (req, res) => {
  const { name, emoji } = req.body;
  const { rows } = await pool.query(
    'UPDATE decks SET name = $1, emoji = $2 WHERE id = $3 RETURNING *',
    [name, emoji, req.params.id]
  );
  res.json(rows[0]);
}));

app.delete('/api/decks/:id', h(async (req, res) => {
  await pool.query('DELETE FROM decks WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ── Cards ──

app.get('/api/decks/:id/cards', h(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE deck_id = $1 ORDER BY created_at',
    [req.params.id]
  );
  res.json(rows);
}));

app.post('/api/decks/:id/cards', h(async (req, res) => {
  const { front, back } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, front, back]
  );
  res.json(rows[0]);
}));

app.put('/api/cards/:id', h(async (req, res) => {
  const { front, back } = req.body;
  const { rows } = await pool.query(
    'UPDATE cards SET front = $1, back = $2 WHERE id = $3 RETURNING *',
    [front, back, req.params.id]
  );
  res.json(rows[0]);
}));

app.delete('/api/cards/:id', h(async (req, res) => {
  await pool.query('DELETE FROM cards WHERE id = $1', [req.params.id]);
  res.json({ ok: true });
}));

// ── Study ──

app.get('/api/decks/:id/study', h(async (req, res) => {
  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE deck_id = $1 AND next_review <= NOW() ORDER BY next_review LIMIT 50',
    [req.params.id]
  );
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  res.json(rows);
}));

app.post('/api/cards/:id/review', h(async (req, res) => {
  const { rating } = req.body;
  const { rows: [card] } = await pool.query('SELECT * FROM cards WHERE id = $1', [req.params.id]);
  if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada' });

  let { interval_days, ease_factor, review_count, correct_count } = card;

  if (rating === 1) {
    interval_days = interval_days === 0 ? 1 : Math.max(1, interval_days * 1.2);
    ease_factor = Math.max(1.3, ease_factor - 0.2);
  } else if (rating === 2) {
    interval_days = interval_days === 0 ? 3 : Math.max(1, interval_days * ease_factor);
    correct_count++;
  } else {
    interval_days = interval_days === 0 ? 7 : Math.max(1, interval_days * ease_factor * 1.3);
    ease_factor = Math.min(3.0, ease_factor + 0.15);
    correct_count++;
  }
  review_count++;

  const next_review = new Date(Date.now() + interval_days * 86400000);
  const { rows: [updated] } = await pool.query(
    `UPDATE cards SET interval_days=$1, ease_factor=$2, review_count=$3,
     correct_count=$4, next_review=$5 WHERE id=$6 RETURNING *`,
    [interval_days, ease_factor, review_count, correct_count, next_review, req.params.id]
  );
  res.json(updated);
}));

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Vercel serverless export
module.exports = app;

// Local dev server
if (!process.env.VERCEL) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`\n  🧠 Mnemo corriendo en http://localhost:${PORT}\n`);
  });
}
