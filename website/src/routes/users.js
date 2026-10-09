const express = require('express');
const db = require('../db');

const router = express.Router();

router.get('/', async (req, res) => {
  const { rows } = await db.query(
    `SELECT u.id, u.name, u.email, u.created_at, COUNT(p.id)::int AS posts_count
       FROM users u LEFT JOIN posts p ON p.user_id = u.id
      GROUP BY u.id ORDER BY u.id`
  );
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(
    'SELECT id, name, email, created_at FROM users WHERE id = $1',
    [req.params.id]
  );
  if (!rows.length) return res.status(404).json({ error: 'Пользователь не найден' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  if (!name || !email) return res.status(400).json({ error: 'Нужны name и email' });
  try {
    const { rows } = await db.query(
      'INSERT INTO users (name, email) VALUES ($1, $2) RETURNING id, name, email, created_at',
      [name, email]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Email уже занят' });
    throw err;
  }
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM users WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Пользователь не найден' });
  res.status(204).end();
});

module.exports = router;
