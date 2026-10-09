// Наполняет базу демонстрационными данными (безопасно запускать повторно).
const { pool } = require('../src/db');

async function seed() {
  const { rows } = await pool.query(
    `INSERT INTO users (name, email) VALUES
       ('Амирлан', 'amirlan@example.com'),
       ('Алия', 'aliya@example.com')
     ON CONFLICT (email) DO UPDATE SET name = EXCLUDED.name
     RETURNING id, email`
  );
  const [first] = rows;
  const { rows: existing } = await pool.query('SELECT 1 FROM posts LIMIT 1');
  if (existing.length === 0) {
    await pool.query(
      `INSERT INTO posts (user_id, title, body) VALUES
         ($1, 'Первая запись', 'Сайт подключён к PostgreSQL.'),
         ($1, 'Вторая запись', 'Записи хранятся в таблице posts.')`,
      [first.id]
    );
  }
  console.log('seed done');
}

seed()
  .catch((err) => {
    console.error('seed failed:', err.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
