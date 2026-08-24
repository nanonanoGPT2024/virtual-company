const { Pool } = require('pg');
const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5433', 10),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'company_os',
  connectionTimeoutMillis: 3000,
});
pool.query('SELECT 1').then(r => {
  console.log('DB SUCCESS:', r.rows);
  process.exit(0);
}).catch(e => {
  console.error('DB ERROR:', e.message);
  process.exit(1);
});
