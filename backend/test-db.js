const { Client } = require('pg');
const { env } = require('./scripts/env');

const client = new Client({
  connectionString: env.databaseUrl,
});
client.connect()
  .then(() => {
    console.log('Connected successfully');
    return client.query('SELECT NOW()');
  })
  .then(res => console.log('Query result:', res.rows[0]))
  .catch(e => console.error('Connection error', e))
  .finally(() => client.end());
