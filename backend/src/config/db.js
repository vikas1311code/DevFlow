const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
});

pool.on('connect', () => {
  console.log('PostgreSQL se connected!');
});

pool.on('error', (err) => {
  console.error('Database error bhai:', err.message);
});

const query = async (text, params) => {
  const start = Date.now();
  const res = await pool.query(text, params);
  const duration = Date.now() - start;
  console.log('Query chali:', { text, duration: `${duration}ms`, rows: res.rowCount });
  return res;
};

module.exports = { query, pool };
