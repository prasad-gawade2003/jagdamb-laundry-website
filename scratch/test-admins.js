const { Pool } = require('pg');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config({ path: path.join(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const res = await pool.query('SELECT username, role, display_name FROM admins');
    console.log('Admins in DB:', res.rows);
  } catch (err) {
    console.error('ERROR querying admins:', err);
  } finally {
    await pool.end();
  }
})();
