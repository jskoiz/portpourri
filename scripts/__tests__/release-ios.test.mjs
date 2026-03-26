import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const releaseScriptPath = path.resolve(testDir, '../release-ios.sh');

function run(command, args, options = {}) {
  return spawnSync(command, args, {
    encoding: 'utf8',
    ...options,
  });
}

function exec(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    ...options,
  }).trim();
}

function writeExecutable(filePath, content) {
  fs.writeFileSync(filePath, content, { encoding: 'utf8', mode: 0o755 });
}

function createFixture({ withUpstream = true } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-release-ios-'));
  fs.mkdirSync(path.join(repoRoot, 'scripts'), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, 'mobile'), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, 'bin'), { recursive: true });

  fs.copyFileSync(releaseScriptPath, path.join(repoRoot, 'scripts/release-ios.sh'));
  fs.chmodSync(path.join(repoRoot, 'scripts/release-ios.sh'), 0o755);

  fs.writeFileSync(path.join(repoRoot, 'mobile/package.json'), JSON.stringify({
    name: 'mobile',
    version: '1.2.3',
  }, null, 2));
  fs.writeFileSync(path.join(repoRoot, 'mobile/eas.json'), JSON.stringify({
    submit: {
      production: {
        ios: {
          appleTeamId: 'TEAM123456',
        },
      },
    },
  }, null, 2));
  fs.writeFileSync(
    path.join(repoRoot, 'mobile/.env.production'),
    [
      'EXPO_PUBLIC_API_URL=https://api.example.test',
      'IOS_BUNDLE_IDENTIFIER=com.example.brdg',
      'IOS_BUILD_NUMBER=5',
      'ASC_LIVE_BUILD_NUMBER=4',
      'ASC_BUILD_NUMBER_VERIFIED_AT=2026-03-25T12:00:00Z',
    ].join('\n') + '\n',
  );

  writeExecutable(
    path.join(repoRoot, 'bin/npm'),
    '#!/usr/bin/env bash\nif [[ "$1" == "run" && "$2" == "check" ]]; then exit 0; fi\nexit 0\n',
  );

  exec('git', ['init', '--initial-branch=main'], { cwd: repoRoot });
  exec('git', ['config', 'user.name', 'Codex'], { cwd: repoRoot });
  exec('git', ['config', 'user.email', 'codex@example.test'], { cwd: repoRoot });
  exec('git', ['add', '.'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'initial'], { cwd: repoRoot });

  if (withUpstream) {
    const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-release-ios-remote-'));
    exec('git', ['init', '--bare', remoteRoot], { cwd: repoRoot });
    exec('git', ['remote', 'add', 'origin', remoteRoot], { cwd: repoRoot });
    exec('git', ['push', '-u', 'origin', 'main'], { cwd: repoRoot });
  }

  return repoRoot;
}

function runReleaseCheck(repoRoot) {
  return run('bash', ['scripts/release-ios.sh', '--check-only', '--mode', 'xcode'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PATH: `${path.join(repoRoot, 'bin')}:${process.env.PATH}`,
    },
  });
}

test('release-ios keeps explicit environment overrides instead of clobbering them from .env.production', () => {
  const repoRoot = createFixture();
  const result = run('bash', ['scripts/release-ios.sh', '--check-only', '--mode', 'xcode'], {
    cwd: repoRoot,
    env: {
      ...process.env,
      PATH: `${path.join(repoRoot, 'bin')}:${process.env.PATH}`,
      IOS_BUILD_NUMBER: '13',
      ASC_LIVE_BUILD_NUMBER: '12',
      ASC_BUILD_NUMBER_VERIFIED_AT: '2026-03-26T12:23:48Z',
    },
  });

  assert.equal(result.status, 0, result.stderr);

  const manifestPath = path.join(repoRoot, 'mobile/build/ios-release-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.iosBuildNumber, '13');
  assert.equal(manifest.appStoreConnectLiveBuildNumber, '12');
  assert.equal(
    manifest.appStoreConnectBuildNumberVerifiedAt,
    '2026-03-26T12:23:48Z',
  );
});

test('release-ios check-only writes a provenance-rich manifest without tagging', () => {
  const repoRoot = createFixture();
  const result = runReleaseCheck(repoRoot);

  assert.equal(result.status, 0, result.stderr);

  const manifestPath = path.join(repoRoot, 'mobile/build/ios-release-manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  assert.equal(manifest.appVersion, '1.2.3');
  assert.equal(manifest.preflightOnly, true);
  assert.equal(manifest.authMode, 'xcode-account');
  assert.equal(manifest.appStoreConnectLiveBuildNumber, '4');
  assert.equal(manifest.releaseEligibility.cleanTree, true);
  assert.match(manifest.upstreamGitSha, /^[0-9a-f]{40}$/);
  assert.equal(exec('git', ['tag'], { cwd: repoRoot }), '');
});

test('release-ios rejects detached HEAD state', () => {
  const repoRoot = createFixture();
  exec('git', ['checkout', '--detach', 'HEAD'], { cwd: repoRoot });

  const result = runReleaseCheck(repoRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /detached HEAD is not allowed/);
});

test('release-ios rejects dirty working trees', () => {
  const repoRoot = createFixture();
  fs.writeFileSync(path.join(repoRoot, 'scratch.txt'), 'dirty\n');

  const result = runReleaseCheck(repoRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /working tree must be completely clean/);
});

test('release-ios rejects branches without an upstream', () => {
  const repoRoot = createFixture({ withUpstream: false });

  const result = runReleaseCheck(repoRoot);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no upstream tracking branch/);
});
