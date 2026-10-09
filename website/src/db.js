// Единый пул подключений к PostgreSQL.
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : undefined,
});

pool.on('error', (err) => console.error('postgres pool error:', err.message));

module.exports = {
  pool,
  query: (text, params) => pool.query(text, params),
};
