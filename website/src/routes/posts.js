const express = require('express');
const db = require('../db');

const router = express.Router();

const SELECT_POST = `
  SELECT p.id, p.title, p.body, p.created_at, p.updated_at,
         u.id AS user_id, u.name AS author
    FROM posts p JOIN users u ON u.id = p.user_id`;

router.get('/', async (req, res) => {
  const params = [];
  let where = '';
  if (req.query.user_id) {
    params.push(req.query.user_id);
    where = 'WHERE p.user_id = $1';
  }
  const { rows } = await db.query(`${SELECT_POST} ${where} ORDER BY p.created_at DESC`, params);
  res.json(rows);
});

router.get('/:id', async (req, res) => {
  const { rows } = await db.query(`${SELECT_POST} WHERE p.id = $1`, [req.params.id]);
  if (!rows.length) return res.status(404).json({ error: 'Запись не найдена' });
  res.json(rows[0]);
});

router.post('/', async (req, res) => {
  const userId = Number(req.body.user_id);
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '');
  if (!userId || !title) return res.status(400).json({ error: 'Нужны user_id и title' });
  try {
    const { rows } = await db.query(
      'INSERT INTO posts (user_id, title, body) VALUES ($1, $2, $3) RETURNING id',
      [userId, title, body]
    );
    const created = await db.query(`${SELECT_POST} WHERE p.id = $1`, [rows[0].id]);
    res.status(201).json(created.rows[0]);
  } catch (err) {
    if (err.code === '23503') return res.status(400).json({ error: 'Пользователь не существует' });
    throw err;
  }
});

router.put('/:id', async (req, res) => {
  const title = String(req.body.title || '').trim();
  const body = String(req.body.body || '');
  if (!title) return res.status(400).json({ error: 'Нужен title' });
  const { rowCount } = await db.query(
    'UPDATE posts SET title = $1, body = $2, updated_at = now() WHERE id = $3',
    [title, body, req.params.id]
  );
  if (!rowCount) return res.status(404).json({ error: 'Запись не найдена' });
  const { rows } = await db.query(`${SELECT_POST} WHERE p.id = $1`, [req.params.id]);
  res.json(rows[0]);
});

router.delete('/:id', async (req, res) => {
  const { rowCount } = await db.query('DELETE FROM posts WHERE id = $1', [req.params.id]);
  if (!rowCount) return res.status(404).json({ error: 'Запись не найдена' });
  res.status(204).end();
});

module.exports = router;
