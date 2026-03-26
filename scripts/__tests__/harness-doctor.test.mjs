import test from 'node:test';
import assert from 'node:assert/strict';
import { collectDoctorReport } from '../harness-doctor.mjs';

function createRunCommand(overrides = {}) {
  return (command, args) => {
    const key = `${command} ${args.join(' ')}`;
    return overrides[key] ?? { status: 0, stdout: '', stderr: '' };
  };
}

test('collectDoctorReport surfaces provenance warnings without failing the run', () => {
  const report = collectDoctorReport({
    runCommand: createRunCommand({
      'git branch --show-current': { status: 0, stdout: 'feature/provenance\n', stderr: '' },
      'git rev-parse HEAD': { status: 0, stdout: 'abcdef1234567890\n', stderr: '' },
      'git rev-parse --abbrev-ref --symbolic-full-name @{u}': { status: 0, stdout: 'origin/feature/provenance\n', stderr: '' },
      'git rev-list --left-right --count HEAD...origin/feature/provenance': { status: 0, stdout: '2 1\n', stderr: '' },
      'git status --porcelain': { status: 0, stdout: ' M docs/APP_STORE_RELEASE.md\n', stderr: '' },
      'git status --porcelain -- artifacts/repo-index.json': { status: 0, stdout: ' M artifacts/repo-index.json\n', stderr: '' },
      'docker info': { status: 0, stdout: 'Server: Docker Engine\n', stderr: '' },
    }),
    spawnCommand: createRunCommand({
      'npx expo-doctor --version': { status: 0, stdout: '1.0.0\n', stderr: '' },
    }),
    pathExists: () => true,
    nodeVersion: '22.4.0',
    platform: 'linux',
  });

  assert.deepEqual(report.failures, []);
  assert.equal(report.lines.some((line) => line.label === 'Branch policy' && line.status === 'warn'), true);
  assert.equal(report.lines.some((line) => line.label === 'Git upstream sync' && line.detail === 'ahead 2, behind 1'), true);
  assert.equal(report.lines.some((line) => line.label === 'Working tree' && line.status === 'warn'), true);
  assert.equal(report.lines.some((line) => line.label === 'repo index git status' && line.status === 'warn'), true);
});

test('collectDoctorReport fails when core environment prerequisites are missing', () => {
  const report = collectDoctorReport({
    runCommand: createRunCommand({
      'git branch --show-current': { status: 0, stdout: '\n', stderr: '' },
      'git rev-parse HEAD': { status: 1, stdout: '', stderr: 'fatal: not a git repository' },
      'git rev-parse --abbrev-ref --symbolic-full-name @{u}': { status: 1, stdout: '', stderr: 'fatal: no upstream' },
      'git status --porcelain': { status: 0, stdout: '', stderr: '' },
      'git status --porcelain -- artifacts/repo-index.json': { status: 0, stdout: '', stderr: '' },
      'docker info': { status: 1, stdout: '', stderr: 'Cannot connect to the Docker daemon' },
      'xcodebuild -version': { status: 1, stdout: '', stderr: 'xcodebuild: command not found' },
    }),
    spawnCommand: createRunCommand({
      'npx expo-doctor --version': { status: 1, stdout: '', stderr: 'expo-doctor unavailable' },
    }),
    pathExists: (relativePath) => !['backend/node_modules', 'mobile/.env.production'].includes(relativePath),
    nodeVersion: '20.10.0',
    platform: 'darwin',
  });

  assert.equal(report.failures.length >= 3, true);
  assert.equal(report.lines.some((line) => line.label === 'Git branch' && line.status === 'warn'), true);
  assert.equal(report.lines.some((line) => line.label === 'Node version' && line.status === 'fail'), true);
  assert.equal(report.lines.some((line) => line.label === 'backend dependencies' && line.status === 'fail'), true);
  assert.equal(report.lines.some((line) => line.label === 'mobile production env' && line.status === 'warn'), true);
  assert.equal(report.lines.some((line) => line.label === 'Xcode build tools' && line.status === 'warn'), true);
  assert.equal(report.lines.some((line) => line.label === 'Docker' && line.status === 'fail'), true);
});
