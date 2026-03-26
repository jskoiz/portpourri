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

export function collectDoctorReport({
  runCommand = run,
  spawnCommand = spawnSync,
  pathExists = exists,
  nodeVersion = process.versions.node,
  platform = process.platform,
} = {}) {
  const failures = [];
  const lines = [];
  const pushLine = (status, label, detail) => {
    lines.push({ status, label, detail });
  };

  const branch = runCommand('git', ['branch', '--show-current']);
  const currentBranch = branch.stdout.trim();
  if (branch.status !== 0) {
    failures.push('Unable to read git branch.');
    pushLine('fail', 'Git', branch.stderr.trim());
  } else if (!currentBranch) {
    pushLine('warn', 'Git branch', 'detached HEAD');
  } else {
    pushLine('ok', 'Git branch', currentBranch);
  }

  const gitHead = runCommand('git', ['rev-parse', 'HEAD']);
  if (gitHead.status === 0) {
    pushLine('ok', 'Git HEAD', gitHead.stdout.trim());
  } else {
    failures.push('Unable to read git HEAD SHA.');
    pushLine('fail', 'Git HEAD', gitHead.stderr.trim());
  }

  if (currentBranch) {
    const branchPolicy =
      currentBranch === 'main'
        ? 'main'
        : currentBranch.startsWith('release/')
          ? 'release branch'
          : 'feature branch';
    pushLine(branchPolicy === 'feature branch' ? 'warn' : 'ok', 'Branch policy', branchPolicy);
  }

  const upstream = runCommand('git', ['rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}']);
  const upstreamName = upstream.status === 0 ? upstream.stdout.trim() : '';
  if (upstreamName) {
    pushLine('ok', 'Git upstream', upstreamName);
  } else {
    pushLine('warn', 'Git upstream', 'missing');
  }

  if (upstreamName) {
    const aheadBehind = runCommand('git', ['rev-list', '--left-right', '--count', `HEAD...${upstreamName}`]);
    if (aheadBehind.status === 0) {
      const [ahead = '0', behind = '0'] = aheadBehind.stdout.trim().split(/\s+/);
      pushLine(
        ahead === '0' && behind === '0' ? 'ok' : 'warn',
        'Git upstream sync',
        `ahead ${ahead}, behind ${behind}`,
      );
    } else {
      pushLine('warn', 'Git upstream sync', aheadBehind.stderr.trim() || 'unable to determine');
    }
  }

  const dirty = runCommand('git', ['status', '--porcelain']);
  if (dirty.stdout.trim()) {
    pushLine('warn', 'Working tree', 'uncommitted changes present');
  } else {
    pushLine('ok', 'Working tree', 'clean');
  }

  const nodeMajor = Number.parseInt(nodeVersion.split('.')[0], 10);
  if (Number.isNaN(nodeMajor) || nodeMajor < 22) {
    failures.push('Node 22 or newer is required.');
    pushLine('fail', 'Node version', nodeVersion);
  } else {
    pushLine('ok', 'Node version', nodeVersion);
  }

  for (const [label, relativePath] of [
    ['backend dependencies', 'backend/node_modules'],
    ['mobile dependencies', 'mobile/node_modules'],
    ['backend env source', pathExists('backend/.env') ? 'backend/.env' : 'backend/.env.example'],
    ['mobile env example', 'mobile/.env.example'],
  ]) {
    if (pathExists(relativePath)) {
      pushLine('ok', label, relativePath);
    } else {
      failures.push(`Missing required path: ${relativePath}`);
      pushLine('fail', label, relativePath);
    }
  }

  const hasMobileProdEnv = pathExists('mobile/.env.production');
  pushLine(
    hasMobileProdEnv ? 'ok' : 'warn',
    'mobile production env',
    hasMobileProdEnv ? 'mobile/.env.production' : 'missing',
  );
  const hasRepoIndex = pathExists('artifacts/repo-index.json');
  pushLine(
    hasRepoIndex ? 'ok' : 'warn',
    'repo index artifact',
    hasRepoIndex ? 'artifacts/repo-index.json' : 'missing',
  );

  const repoIndexDirty = runCommand('git', ['status', '--porcelain', '--', 'artifacts/repo-index.json']);
  if (repoIndexDirty.status === 0) {
    pushLine(
      repoIndexDirty.stdout.trim() ? 'warn' : 'ok',
      'repo index git status',
      repoIndexDirty.stdout.trim() ? 'artifacts/repo-index.json has local changes' : 'clean',
    );
  }

  const expoDoctor = spawnCommand('npx', ['expo-doctor', '--version'], {
    cwd: path.join(repoRoot, 'mobile'),
    encoding: 'utf8',
  });
  if (expoDoctor.status === 0) {
    pushLine('ok', 'Expo doctor', expoDoctor.stdout.trim() || 'available via npx');
  } else {
    failures.push('expo-doctor is not available through npx in mobile/.');
    pushLine('fail', 'Expo doctor', expoDoctor.stderr.trim() || 'unavailable');
  }

  if (platform === 'darwin') {
    const xcodebuild = runCommand('xcodebuild', ['-version']);
    pushLine(
      xcodebuild.status === 0 ? 'ok' : 'warn',
      'Xcode build tools',
      xcodebuild.status === 0 ? xcodebuild.stdout.split('\n')[0].trim() : (xcodebuild.stderr.trim() || 'xcodebuild unavailable'),
    );
  }

  const docker = runCommand('docker', ['info']);
  if (docker.status === 0) {
    pushLine('ok', 'Docker', 'running');
  } else if (docker.error) {
    failures.push('Docker CLI is unavailable.');
    pushLine('fail', 'Docker', docker.error.message);
  } else {
    failures.push('Docker daemon is not reachable.');
    pushLine('fail', 'Docker', docker.stderr.trim() || 'not running');
  }

  return { failures, lines };
}

function main() {
  const report = collectDoctorReport();
  for (const line of report.lines) {
    statusLine(line.status, line.label, line.detail);
  }

  if (report.failures.length > 0) {
    process.exit(1);
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
