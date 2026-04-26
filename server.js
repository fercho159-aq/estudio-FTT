const express = require('express');
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

// Load .env / .env.local
for (const envFile of ['.env', '.env.local']) {
  try {
    fs.readFileSync(path.join(__dirname, envFile), 'utf8').split('\n').forEach(line => {
      const i = line.indexOf('=');
      if (i > 0) {
        const key = line.slice(0, i).trim();
        const val = line.slice(i + 1).trim();
        if (key && !key.startsWith('#')) process.env[key] = val;
      }
    });
  } catch (e) {}
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'mnemo-dev-fallback';
const app = express();
app.use(express.json());
app.use((req, res, next) => {
  if (req.path === '/sw.js' || req.path === '/manifest.json') {
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
  }
  next();
});
app.use(express.static(path.join(__dirname, 'public')));

const h = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(err => {
  console.error(err);
  res.status(500).json({ error: err.message });
});

// ── Auth middleware ──

function auth(req, res, next) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'No autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch (e) {
    res.status(401).json({ error: 'Sesión expirada' });
  }
}

// ── Auth routes ──

app.post('/api/register', h(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Completa todos los campos' });
  if (username.length < 3) return res.status(400).json({ error: 'El usuario debe tener al menos 3 caracteres' });
  if (password.length < 4) return res.status(400).json({ error: 'La contraseña debe tener al menos 4 caracteres' });

  const exists = await pool.query('SELECT id FROM users WHERE username = $1', [username.toLowerCase().trim()]);
  if (exists.rows.length > 0) return res.status(400).json({ error: 'Ese usuario ya existe' });

  const hash = await bcrypt.hash(password, 10);
  const { rows: [user] } = await pool.query(
    'INSERT INTO users (username, password_hash) VALUES ($1, $2) RETURNING id, username',
    [username.toLowerCase().trim(), hash]
  );

  // Claim existing unassigned decks for the first user
  await pool.query('UPDATE decks SET user_id = $1 WHERE user_id IS NULL', [user.id]);

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '90d' });
  res.json({ token, user: { id: user.id, username: user.username } });
}));

app.post('/api/login', h(async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Completa todos los campos' });

  const { rows: [user] } = await pool.query(
    'SELECT id, username, password_hash FROM users WHERE username = $1',
    [username.toLowerCase().trim()]
  );
  if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '90d' });
  res.json({ token, user: { id: user.id, username: user.username } });
}));

app.get('/api/me', auth, h(async (req, res) => {
  res.json({ id: req.user.id, username: req.user.username });
}));

// ── Decks (protected) ──

app.get('/api/decks', auth, h(async (req, res) => {
  const { rows } = await pool.query(`
    SELECT d.*,
      COUNT(c.id)::int AS card_count,
      COUNT(CASE WHEN c.next_review <= NOW() THEN 1 END)::int AS due_count,
      COUNT(CASE WHEN c.interval_days >= 30
                  AND c.review_count >= 5
                  AND (c.correct_count::float / NULLIF(c.review_count,0)) >= 0.85
                  THEN 1 END)::int AS mastered_count,
      COUNT(CASE WHEN c.review_count > 0
                  AND NOT (c.interval_days >= 30
                           AND c.review_count >= 5
                           AND (c.correct_count::float / NULLIF(c.review_count,0)) >= 0.85)
                  THEN 1 END)::int AS learning_count,
      COUNT(CASE WHEN COALESCE(c.lapse_count,0) >= 4 THEN 1 END)::int AS leech_count
    FROM decks d
    LEFT JOIN cards c ON c.deck_id = d.id
    WHERE d.user_id = $1
    GROUP BY d.id
    ORDER BY d.created_at DESC
  `, [req.user.id]);
  res.json(rows);
}));

app.post('/api/decks', auth, h(async (req, res) => {
  const { name, emoji } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO decks (name, emoji, user_id) VALUES ($1, $2, $3) RETURNING *',
    [name, emoji || '📚', req.user.id]
  );
  res.json(rows[0]);
}));

app.put('/api/decks/:id', auth, h(async (req, res) => {
  const { name, emoji } = req.body;
  const { rows } = await pool.query(
    'UPDATE decks SET name = $1, emoji = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
    [name, emoji, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Mazo no encontrado' });
  res.json(rows[0]);
}));

app.delete('/api/decks/:id', auth, h(async (req, res) => {
  await pool.query('DELETE FROM decks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  res.json({ ok: true });
}));

// ── Cards (protected) ──

app.get('/api/decks/:id/cards', auth, h(async (req, res) => {
  // Verify deck ownership
  const deck = await pool.query('SELECT id FROM decks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!deck.rows[0]) return res.status(404).json({ error: 'Mazo no encontrado' });

  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE deck_id = $1 ORDER BY created_at',
    [req.params.id]
  );
  res.json(rows);
}));

app.post('/api/decks/:id/cards', auth, h(async (req, res) => {
  const deck = await pool.query('SELECT id FROM decks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!deck.rows[0]) return res.status(404).json({ error: 'Mazo no encontrado' });

  const { front, back } = req.body;
  const { rows } = await pool.query(
    'INSERT INTO cards (deck_id, front, back) VALUES ($1, $2, $3) RETURNING *',
    [req.params.id, front, back]
  );
  res.json(rows[0]);
}));

app.put('/api/cards/:id', auth, h(async (req, res) => {
  const { front, back } = req.body;
  const { rows } = await pool.query(
    `UPDATE cards SET front = $1, back = $2
     WHERE id = $3 AND deck_id IN (SELECT id FROM decks WHERE user_id = $4)
     RETURNING *`,
    [front, back, req.params.id, req.user.id]
  );
  if (!rows[0]) return res.status(404).json({ error: 'Tarjeta no encontrada' });
  res.json(rows[0]);
}));

app.delete('/api/cards/:id', auth, h(async (req, res) => {
  await pool.query(
    `DELETE FROM cards WHERE id = $1 AND deck_id IN (SELECT id FROM decks WHERE user_id = $2)`,
    [req.params.id, req.user.id]
  );
  res.json({ ok: true });
}));

// ── Study (protected) ──

app.get('/api/decks/:id/study', auth, h(async (req, res) => {
  const deck = await pool.query('SELECT id FROM decks WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
  if (!deck.rows[0]) return res.status(404).json({ error: 'Mazo no encontrado' });

  const { rows } = await pool.query(
    'SELECT * FROM cards WHERE deck_id = $1 AND next_review <= NOW() ORDER BY next_review LIMIT 15',
    [req.params.id]
  );
  for (let i = rows.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rows[i], rows[j]] = [rows[j], rows[i]];
  }
  res.json(rows);
}));

const MAX_INTERVAL_DAYS = 180;

app.post('/api/cards/:id/review', auth, h(async (req, res) => {
  const { rating } = req.body;
  if (![0, 1, 2, 3].includes(rating)) {
    return res.status(400).json({ error: 'Rating inválido (0–3)' });
  }
  const { rows: [card] } = await pool.query(
    `SELECT c.* FROM cards c JOIN decks d ON c.deck_id = d.id
     WHERE c.id = $1 AND d.user_id = $2`,
    [req.params.id, req.user.id]
  );
  if (!card) return res.status(404).json({ error: 'Tarjeta no encontrada' });

  let { interval_days, ease_factor, review_count, correct_count, lapse_count } = card;
  lapse_count = lapse_count || 0;
  let next_review;

  if (rating === 0) {
    // Otra vez: lapso, vuelve a la cola en 1 minuto
    interval_days = 0;
    ease_factor = Math.max(1.3, ease_factor - 0.2);
    lapse_count++;
    next_review = new Date(Date.now() + 60 * 1000);
  } else if (rating === 1) {
    // Difícil: acierto pero costoso
    interval_days = interval_days === 0 ? 1 : Math.max(1, interval_days * 1.2);
    ease_factor = Math.max(1.3, ease_factor - 0.15);
    correct_count++;
  } else if (rating === 2) {
    // Bien: acierto normal
    interval_days = interval_days === 0 ? 3 : Math.max(1, interval_days * ease_factor);
    correct_count++;
  } else {
    // Fácil
    interval_days = interval_days === 0 ? 7 : Math.max(1, interval_days * ease_factor * 1.3);
    ease_factor = Math.min(3.0, ease_factor + 0.15);
    correct_count++;
  }

  if (rating > 0) {
    interval_days = Math.min(interval_days, MAX_INTERVAL_DAYS);
    next_review = new Date(Date.now() + interval_days * 86400000);
  }
  review_count++;

  const { rows: [updated] } = await pool.query(
    `UPDATE cards SET interval_days=$1, ease_factor=$2, review_count=$3,
     correct_count=$4, lapse_count=$5, next_review=$6, last_reviewed=NOW()
     WHERE id=$7 RETURNING *`,
    [interval_days, ease_factor, review_count, correct_count, lapse_count, next_review, req.params.id]
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
