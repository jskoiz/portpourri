const { spawnSync } = require('child_process');
const path = require('path');

const connectionString =
  process.env.DATABASE_URL ||
  'postgresql://brdg_user:brdg_password@localhost:5433/brdg_db';

const timeoutMs = Number(process.env.DB_WAIT_TIMEOUT_MS || 30000);
const intervalMs = Number(process.env.DB_WAIT_INTERVAL_MS || 1000);
const repoBackendDir = path.resolve(__dirname, '..');

function getNpxCommand() {
  return process.platform === 'win32' ? 'npx.cmd' : 'npx';
}

function canRunQuery(connectionUrl) {
  const result = spawnSync(
    getNpxCommand(),
    ['prisma', 'db', 'execute', '--stdin', '--url', connectionUrl],
    {
      cwd: repoBackendDir,
      env: process.env,
      input: 'SELECT 1;',
      stdio: ['pipe', 'ignore', 'ignore'],
    },
  );

  return result.status === 0;
}

async function main() {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    if (canRunQuery(connectionString)) {
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
