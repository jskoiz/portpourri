const { Client } = require('pg');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://brdg_user:brdg_password@localhost:5433/brdg_db';

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 30000);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS || 1000);

async function canConnect() {
  const client = new Client({ connectionString });
  try {
    await client.connect();
    await client.query('SELECT 1');
    return true;
  } catch {
    return false;
  } finally {
    await client.end().catch(() => undefined);
  }
}

async function main() {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (await canConnect()) {
      console.log('Database is ready.');
      return;
    }

    process.stdout.write('.');
    await new Promise((resolve) => setTimeout(resolve, intervalMs));
  }

  console.error(`\nDatabase not reachable after ${timeoutMs}ms`);
  process.exit(1);
}

main();
