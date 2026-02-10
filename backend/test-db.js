const { Client } = require('pg');

// Use DATABASE_URL if provided; default to local dev without embedded credentials.
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/brdg_db'
});
client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.query('SELECT NOW()');
  })
  .then(res => console.log('Query result:', res.rows[0]))
  .catch(e => console.error('Connection error', e))
  .finally(() => client.end());
