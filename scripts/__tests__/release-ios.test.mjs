import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testDir = path.dirname(fileURLToPath(import.meta.url));
const releaseScriptPath = path.resolve(testDir, '../release-ios.sh');
const ascHelperPath = path.resolve(testDir, '../app-store-connect-build.mjs');
const fastPathScriptPath = path.resolve(testDir, '../release-ios-fast-path.mjs');
const notesScriptPath = path.resolve(testDir, '../release-testflight-notes.mjs');

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

function createFixture({ withUpstream = true, withReleaseTag = false } = {}) {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-release-ios-'));
  fs.mkdirSync(path.join(repoRoot, 'scripts', '__tests__'), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, 'mobile'), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, 'mobile', 'ios', 'BRDG', 'Supporting'), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, 'mobile', 'ios', 'BRDG.xcodeproj'), { recursive: true });
  fs.mkdirSync(path.join(repoRoot, 'bin'), { recursive: true });

  fs.copyFileSync(releaseScriptPath, path.join(repoRoot, 'scripts/release-ios.sh'));
  fs.copyFileSync(ascHelperPath, path.join(repoRoot, 'scripts/app-store-connect-build.mjs'));
  fs.copyFileSync(fastPathScriptPath, path.join(repoRoot, 'scripts/release-ios-fast-path.mjs'));
  fs.copyFileSync(notesScriptPath, path.join(repoRoot, 'scripts/release-testflight-notes.mjs'));
  fs.chmodSync(path.join(repoRoot, 'scripts/release-ios.sh'), 0o755);

  fs.writeFileSync(path.join(repoRoot, 'mobile/package.json'), JSON.stringify({
    name: 'mobile',
    version: '1.2.3',
  }, null, 2));
  fs.writeFileSync(path.join(repoRoot, '.gitignore'), 'mobile/build/\nnpm-check-count.txt\n');
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
  fs.writeFileSync(
    path.join(repoRoot, 'mobile', 'ios', 'BRDG', 'Supporting', 'Expo.plist'),
    [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">',
      '<plist version="1.0">',
      '<dict>',
      '  <key>EXUpdatesEnabled</key>',
      '  <true/>',
      '  <key>EXUpdatesURL</key>',
      '  <string>https://u.expo.dev/placeholder-project</string>',
      '</dict>',
      '</plist>',
      '',
    ].join('\n'),
  );
  fs.writeFileSync(path.join(repoRoot, 'mobile/src-screen.tsx'), 'export const screen = true;\n');

  writeExecutable(
    path.join(repoRoot, 'bin/npm'),
    `#!/usr/bin/env bash
set -euo pipefail
count_file="${path.join(repoRoot, 'npm-check-count.txt')}"
if [[ "$1" == "run" && "$2" == "check" ]]; then
  current=0
  if [[ -f "$count_file" ]]; then
    current="$(cat "$count_file")"
  fi
  printf '%s' "$((current + 1))" > "$count_file"
fi
exit 0
`,
  );

  writeExecutable(
    path.join(repoRoot, 'bin/npx'),
    `#!/usr/bin/env bash
set -euo pipefail
if [[ "$1" == "expo" && "$2" == "prebuild" ]]; then
  mkdir -p "${path.join(repoRoot, 'mobile/ios/BRDG.xcodeproj')}"
  mkdir -p "${path.join(repoRoot, 'mobile/ios/BRDG/Supporting')}"
  cat > "${path.join(repoRoot, 'mobile/ios/BRDG/Supporting/Expo.plist')}" <<'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>EXUpdatesEnabled</key>
  <true/>
</dict>
</plist>
EOF
  exit 0
fi
if [[ "$1" == "-y" && "$2" == "eas-cli" ]]; then
  exit 0
fi
exit 0
`,
  );

  writeExecutable(
    path.join(repoRoot, 'bin/xcodebuild'),
    `#!/usr/bin/env bash
set -euo pipefail
archive_path=""
export_path=""
for ((index=1; index<=$#; index++)); do
  current="\${!index}"
  next_index=$((index + 1))
  next_value="\${!next_index:-}"
  if [[ "$current" == "-archivePath" ]]; then
    archive_path="$next_value"
  fi
  if [[ "$current" == "-exportPath" ]]; then
    export_path="$next_value"
  fi
done
if [[ " $* " == *" archive "* ]]; then
  app_dir="$archive_path/Products/Applications/BRDG.app"
  mkdir -p "$app_dir"
  touch "$app_dir/main.jsbundle"
  exit 0
fi
if [[ " $* " == *" -exportArchive "* ]]; then
  mkdir -p "$export_path"
  exit 0
fi
exit 0
`,
  );

  exec('git', ['init', '--initial-branch=main'], { cwd: repoRoot });
  exec('git', ['config', 'user.name', 'Codex'], { cwd: repoRoot });
  exec('git', ['config', 'user.email', 'codex@example.test'], { cwd: repoRoot });
  exec('git', ['add', '.'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'initial'], { cwd: repoRoot });

  if (withReleaseTag) {
    exec('git', ['tag', 'v1.2.2+4'], { cwd: repoRoot });
    fs.mkdirSync(path.join(repoRoot, 'mobile', 'src'), { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'mobile', 'src', 'screen.tsx'), 'export const release = true;\n');
    exec('git', ['add', '.'], { cwd: repoRoot });
    exec('git', ['commit', '-m', 'screen change'], { cwd: repoRoot });
  }

  if (withUpstream) {
    const remoteRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-release-ios-remote-'));
    exec('git', ['init', '--bare', remoteRoot], { cwd: repoRoot });
    exec('git', ['remote', 'add', 'origin', remoteRoot], { cwd: repoRoot });
    exec('git', ['push', '-u', 'origin', 'main'], { cwd: repoRoot });
  }

  return repoRoot;
}

function releaseEnv(repoRoot, extra = {}) {
  const env = {
    ...process.env,
  };
  for (const key of [
    'APP_VERSION',
    'IOS_BUILD_NUMBER',
    'IOS_BUNDLE_IDENTIFIER',
    'EXPO_PUBLIC_API_URL',
    'IOS_DEVELOPMENT_TEAM',
    'ASC_API_KEY_ID',
    'ASC_API_ISSUER_ID',
    'ASC_API_KEY_PATH',
    'ASC_LIVE_BUILD_NUMBER',
    'ASC_BUILD_NUMBER_VERIFIED_AT',
    'TESTFLIGHT_NOTES_PATH',
    'TESTFLIGHT_NOTES_BASE_REF',
    'TESTFLIGHT_NOTES_LOCALE',
    'TESTFLIGHT_NOTES_PUBLISH',
    'TESTFLIGHT_NOTES_PUBLISHED',
    'TESTFLIGHT_NOTES_PUBLISHED_AT',
    'BRDG_BUILD_DATE',
    'BRDG_RELEASE_MODE',
    'BRDG_RELEASE_PROFILE',
    'BRDG_RELEASE_PHASE',
    'BRDG_GIT_BRANCH',
    'BRDG_GIT_SHA',
  ]) {
    delete env[key];
  }

  return {
    ...env,
    PATH: `${path.join(repoRoot, 'bin')}:${process.env.PATH}`,
    ...extra,
  };
}

function runRelease(repoRoot, args, extraEnv = {}) {
  return run('bash', ['scripts/release-ios.sh', ...args], {
    cwd: repoRoot,
    env: releaseEnv(repoRoot, extraEnv),
  });
}

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readCheckCount(repoRoot) {
  const countPath = path.join(repoRoot, 'npm-check-count.txt');
  return fs.existsSync(countPath) ? fs.readFileSync(countPath, 'utf8') : '0';
}

test('prepare keeps explicit environment overrides instead of clobbering them from .env.production', () => {
  const repoRoot = createFixture();
  const result = runRelease(repoRoot, ['--phase', 'prepare', '--mode', 'xcode', '--native-mode', 'clean'], {
    IOS_BUILD_NUMBER: '13',
    ASC_LIVE_BUILD_NUMBER: '12',
    ASC_BUILD_NUMBER_VERIFIED_AT: '2026-03-26T12:23:48Z',
  });

  assert.equal(result.status, 0, result.stderr);

  const manifest = readJson(path.join(repoRoot, 'mobile/build/ios-release-manifest.json'));
  assert.equal(manifest.iosBuildNumber, '13');
  assert.equal(manifest.appStoreConnectLiveBuildNumber, '12');
  assert.equal(manifest.appStoreConnectBuildNumberVerifiedAt, '2026-03-26T12:23:48Z');
  assert.equal(manifest.envSources.iosBuildNumber, 'environment');
});

test('prepare writes manifest and release context without tagging', () => {
  const repoRoot = createFixture({ withReleaseTag: true });
  const result = runRelease(repoRoot, ['--phase', 'prepare', '--mode', 'xcode']);

  assert.equal(result.status, 0, result.stderr);

  const manifest = readJson(path.join(repoRoot, 'mobile/build/ios-release-manifest.json'));
  const context = readJson(path.join(repoRoot, 'mobile/build/ios-release-context.json'));
  assert.equal(manifest.preflightOnly, true);
  assert.equal(manifest.nativePrep, 'reuse-existing-ios');
  assert.equal(path.basename(manifest.testflightNotes.path), 'testflight-notes.md');
  assert.match(manifest.testflightNotes.path, /mobile\/build\/testflight-notes\.md$/);
  assert.equal(manifest.testflightNotes.baseRef, 'v1.2.2+4');
  assert.equal(fs.existsSync(path.join(repoRoot, 'mobile/build/testflight-notes.md')), true);
  assert.equal(context.nativePrep, 'reuse-existing-ios');
  assert.match(context.gitSha, /^[0-9a-f]{40}$/);
  assert.equal(exec('git', ['tag'], { cwd: repoRoot }), 'v1.2.2+4');
});

test('prepare can skip repo validation in GitHub Actions dry-run mode', () => {
  const repoRoot = createFixture({ withReleaseTag: true });
  const result = runRelease(
    repoRoot,
    ['--phase', 'prepare', '--mode', 'xcode', '--dry-run-build-number', '--skip-repo-validation'],
    {
      GITHUB_ACTIONS: 'true',
    },
  );

  assert.equal(result.status, 0, result.stderr);
  assert.equal(readCheckCount(repoRoot), '0');

  const manifest = readJson(path.join(repoRoot, 'mobile/build/ios-release-manifest.json'));
  assert.equal(manifest.preflightOnly, true);
});

test('prepare rejects skip-repo-validation outside GitHub Actions', () => {
  const repoRoot = createFixture();
  const result = runRelease(repoRoot, ['--phase', 'prepare', '--mode', 'xcode', '--skip-repo-validation']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /only allowed for GitHub Actions prepare dry-runs/);
});

test('ship uses prepared context and skips npm run check', () => {
  const repoRoot = createFixture({ withReleaseTag: true });
  const prepareResult = runRelease(repoRoot, ['--phase', 'prepare', '--mode', 'xcode']);
  assert.equal(prepareResult.status, 0, prepareResult.stderr);
  assert.equal(fs.readFileSync(path.join(repoRoot, 'npm-check-count.txt'), 'utf8'), '1');

  const shipResult = runRelease(repoRoot, ['--phase', 'ship', '--mode', 'xcode']);
  assert.equal(shipResult.status, 0, shipResult.stderr);
  assert.equal(fs.readFileSync(path.join(repoRoot, 'npm-check-count.txt'), 'utf8'), '1');

  const manifest = readJson(path.join(repoRoot, 'mobile/build/ios-release-manifest.json'));
  assert.equal(manifest.preflightOnly, false);
  assert.equal(manifest.testflightNotes.publishMode, 'auto');
  assert.equal(manifest.testflightNotes.published, false);
  assert.equal(exec('git', ['tag', '--list', 'v1.2.3+5'], { cwd: repoRoot }), 'v1.2.3+5');
});

test('full mode runs validation then ships and tags the release', () => {
  const repoRoot = createFixture({ withReleaseTag: true });
  const result = runRelease(repoRoot, ['--phase', 'full', '--mode', 'xcode']);

  assert.equal(result.status, 0, result.stderr);
  assert.equal(fs.readFileSync(path.join(repoRoot, 'npm-check-count.txt'), 'utf8'), '1');
  assert.equal(exec('git', ['tag', '--list', 'v1.2.3+5'], { cwd: repoRoot }), 'v1.2.3+5');
});

test('prepare rejects detached HEAD state', () => {
  const repoRoot = createFixture();
  exec('git', ['checkout', '--detach', 'HEAD'], { cwd: repoRoot });

  const result = runRelease(repoRoot, ['--phase', 'prepare', '--mode', 'xcode']);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /detached HEAD is not allowed/);
});

test('prepare allows detached HEAD during GitHub Actions dry-run validation', () => {
  const repoRoot = createFixture();
  exec('git', ['checkout', '--detach', 'HEAD'], { cwd: repoRoot });

  const result = runRelease(
    repoRoot,
    ['--phase', 'prepare', '--mode', 'xcode', '--dry-run-build-number'],
    {
      GITHUB_ACTIONS: 'true',
      GITHUB_HEAD_REF: 'codex/self-hosted-runner-vps',
    },
  );

  assert.equal(result.status, 0, result.stderr);

  const manifest = readJson(path.join(repoRoot, 'mobile/build/ios-release-manifest.json'));
  assert.equal(manifest.branch, 'codex/self-hosted-runner-vps');
});

test('ship rejects missing release context', () => {
  const repoRoot = createFixture();
  const result = runRelease(repoRoot, ['--phase', 'ship', '--mode', 'xcode']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /ship phase requires .*ios-release-context.json/);
});

test('prepare rejects branches without an upstream', () => {
  const repoRoot = createFixture({ withUpstream: false });
  const result = runRelease(repoRoot, ['--phase', 'prepare', '--mode', 'xcode']);

  assert.equal(result.status, 1);
  assert.match(result.stderr, /has no upstream tracking branch/);
});
