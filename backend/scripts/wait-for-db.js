const net = require('net');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://brdg_user:brdg_password@localhost:5433/brdg_db';

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 30000);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS || 1000);

function getTarget(connectionUrl) {
  const url = new URL(connectionUrl);
  return {
    host: url.hostname || 'localhost',
    port: Number(url.port || 5432),
  };
}

function canConnect({ host, port }) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });

    const finish = (ready) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ready);
    };

    socket.setTimeout(intervalMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
  });
}

async function main() {
  const start = Date.now();
  const target = getTarget(connectionString);

  while (Date.now() - start < timeoutMs) {
    if (await canConnect(target)) {
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
