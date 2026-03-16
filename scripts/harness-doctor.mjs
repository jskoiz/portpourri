import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');

function run(command, args) {
  return spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
  });
}

function exists(relativePath) {
  return fs.existsSync(path.join(repoRoot, relativePath));
}

function statusLine(status, label, detail) {
  const prefix = status === 'ok' ? '[ok]' : status === 'warn' ? '[warn]' : '[fail]';
  console.log(`${prefix} ${label}${detail ? `: ${detail}` : ''}`);
}

function main() {
  const failures = [];

  const branch = run('git', ['branch', '--show-current']);
  const currentBranch = branch.stdout.trim();
  if (branch.status !== 0) {
    failures.push('Unable to read git branch.');
    statusLine('fail', 'Git', branch.stderr.trim());
  } else if (!currentBranch) {
    statusLine('warn', 'Git branch', 'detached HEAD');
  } else {
    statusLine('ok', 'Git branch', currentBranch);
  }

  const dirty = run('git', ['status', '--porcelain']);
  if (dirty.stdout.trim()) {
    statusLine('warn', 'Working tree', 'uncommitted changes present');
  } else {
    statusLine('ok', 'Working tree', 'clean');
  }

  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10);
  if (Number.isNaN(nodeMajor) || nodeMajor < 22) {
    failures.push('Node 22 or newer is required.');
    statusLine('fail', 'Node version', process.versions.node);
  } else {
    statusLine('ok', 'Node version', process.versions.node);
  }

  for (const [label, relativePath] of [
    ['backend dependencies', 'backend/node_modules'],
    ['mobile dependencies', 'mobile/node_modules'],
    ['backend env source', exists('backend/.env') ? 'backend/.env' : 'backend/.env.example'],
    ['mobile env example', 'mobile/.env.example'],
  ]) {
    if (exists(relativePath)) {
      statusLine('ok', label, relativePath);
    } else {
      failures.push(`Missing required path: ${relativePath}`);
      statusLine('fail', label, relativePath);
    }
  }

  const expoDoctor = spawnSync('npx', ['expo-doctor', '--version'], {
    cwd: path.join(repoRoot, 'mobile'),
    encoding: 'utf8',
  });
  if (expoDoctor.status === 0) {
    statusLine('ok', 'Expo doctor', expoDoctor.stdout.trim() || 'available via npx');
  } else {
    failures.push('expo-doctor is not available through npx in mobile/.');
    statusLine('fail', 'Expo doctor', expoDoctor.stderr.trim() || 'unavailable');
  }

  const docker = run('docker', ['info']);
  if (docker.status === 0) {
    statusLine('ok', 'Docker', 'running');
  } else if (docker.error) {
    failures.push('Docker CLI is unavailable.');
    statusLine('fail', 'Docker', docker.error.message);
  } else {
    failures.push('Docker daemon is not reachable.');
    statusLine('fail', 'Docker', docker.stderr.trim() || 'not running');
  }

  if (failures.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
