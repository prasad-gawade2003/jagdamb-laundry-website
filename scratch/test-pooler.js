const { Pool } = require('pg');

const connectionString = 'postgresql://postgres.dydvnserezuyfvuxxcnz:Prasad%404415@aws-0-ap-south-1.pooler.supabase.com:6543/postgres';
console.log('Testing connection to pooler...');

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

(async () => {
  try {
    const res = await pool.query('SELECT NOW()');
    console.log('SUCCESS connecting to pooler. Time:', res.rows[0]);
  } catch (err) {
    console.error('ERROR connecting to pooler:', err);
  } finally {
    await pool.end();
  }
})();
