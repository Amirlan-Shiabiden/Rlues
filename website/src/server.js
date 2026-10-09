require('dotenv').config();
const path = require('path');
const express = require('express');
const db = require('./db');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Express 4 не ловит ошибки async-обработчиков сам — оборачиваем.
const wrap = (router) => {
  for (const layer of router.stack) {
    for (const r of layer.route?.stack || []) {
      const fn = r.handle;
      r.handle = (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
    }
  }
  return router;
};

app.get('/api/health', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT version() AS version, now() AS time');
    res.json({ status: 'ok', db: rows[0] });
  } catch (err) {
    res.status(503).json({ status: 'error', error: err.message });
  }
});

app.use('/api/users', wrap(require('./routes/users')));
app.use('/api/posts', wrap(require('./routes/posts')));

app.use((err, req, res, next) => {
  if (err.code === '22P02') return res.status(400).json({ error: 'Некорректный id' });
  console.error(err);
  res.status(500).json({ error: 'Внутренняя ошибка сервера' });
});

const port = Number(process.env.PORT) || 3000;
app.listen(port, () => console.log(`http://localhost:${port}`));
