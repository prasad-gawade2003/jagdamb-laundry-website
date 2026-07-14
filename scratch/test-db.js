const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

console.log('DATABASE_URL:', process.env.DATABASE_URL);
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS connecting to database. Time:', res.rows[0]);
    const tables = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema='public'
    `);
    console.log('Tables in database:', tables.rows.map(r => r.table_name));
  } catch (err) {
    console.error('ERROR connecting to database:', err);
  } finally {
    await pool.end();
  }
})();
