import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';

import {
  deriveTestingFocus,
  generateTestflightNotes,
  isUserFacingSubject,
  normalizeCommitSubject,
  summarizeUserFacingChanges,
} from '../release-testflight-notes.mjs';

function exec(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: 'utf8',
    ...options,
  }).trim();
}

function createRepoFixture() {
  const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-release-notes-'));
  exec('git', ['init', '--initial-branch=main'], { cwd: repoRoot });
  exec('git', ['config', 'user.name', 'Codex'], { cwd: repoRoot });
  exec('git', ['config', 'user.email', 'codex@example.test'], { cwd: repoRoot });

  fs.writeFileSync(path.join(repoRoot, 'README.md'), '# fixture\n');
  exec('git', ['add', 'README.md'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'initial'], { cwd: repoRoot });
  exec('git', ['tag', 'v1.0.0+15'], { cwd: repoRoot });

  fs.writeFileSync(path.join(repoRoot, 'events.md'), 'events\n');
  exec('git', ['add', 'events.md'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'Add attendee profile drill-in on event detail (#252)'], { cwd: repoRoot });

  fs.writeFileSync(path.join(repoRoot, 'create.md'), 'create\n');
  exec('git', ['add', 'create.md'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'Fix create event keyboard and CTA overlap (#254)'], { cwd: repoRoot });

  fs.writeFileSync(path.join(repoRoot, 'profile.md'), 'profile\n');
  exec('git', ['add', 'profile.md'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'fix: restore profile saves when discovery preference is unchanged (#249)'], { cwd: repoRoot });

  fs.writeFileSync(path.join(repoRoot, 'ci.md'), 'ci\n');
  exec('git', ['add', 'ci.md'], { cwd: repoRoot });
  exec('git', ['commit', '-m', 'ci: streamline validation and deploy flow (#267)'], { cwd: repoRoot });

  return repoRoot;
}

test('normalizeCommitSubject strips prefixes and PR suffixes', () => {
  assert.equal(
    normalizeCommitSubject('fix(mobile): prevent discover cards from clipping on short screens (#250)'),
    'prevent discover cards from clipping on short screens',
  );
});

test('isUserFacingSubject filters operational-only commits', () => {
  assert.equal(isUserFacingSubject('ci: streamline validation and deploy flow'), false);
  assert.equal(isUserFacingSubject('chore(deps)!: bump dependencies'), false);
  assert.equal(isUserFacingSubject('Fix create event keyboard and CTA overlap'), true);
  // Plain sentences starting with a filtered prefix but without conventional-commit colon are kept
  assert.equal(isUserFacingSubject('test more event flows'), true);
  assert.equal(isUserFacingSubject('docs add screenshot'), true);
});

test('summarizeUserFacingChanges keeps user-facing entries and dedupes them', () => {
  assert.deepEqual(
    summarizeUserFacingChanges([
      'ci: streamline validation and deploy flow',
      'Fix create event keyboard and CTA overlap (#254)',
      'fix: restore profile saves when discovery preference is unchanged (#249)',
      'Fix create event keyboard and CTA overlap (#254)',
    ]),
    [
      'Fix create event keyboard and CTA overlap',
      'Restore profile saves when discovery preference is unchanged',
    ],
  );
});

test('summarizeUserFacingChanges dedupes case-insensitively', () => {
  assert.deepEqual(
    summarizeUserFacingChanges([
      'FIX keyboard overlap',
      'fix keyboard overlap',
    ]),
    [
      'FIX keyboard overlap',
    ],
  );
});

test('deriveTestingFocus turns change summaries into tester guidance', () => {
  assert.deepEqual(
    deriveTestingFocus([
      'Add attendee profile drill-in on event detail',
      'Fix create event keyboard and CTA overlap',
      'Restore profile saves when discovery preference is unchanged',
    ]),
    [
      'Event detail, attendee navigation, and host profile flows',
      'Event creation steps, especially timing/details with the keyboard open',
      'Discovery cards, intent labels, and short-screen layout behavior',
      'Profile editing and persistence after discovery preference changes',
    ],
  );
});

test('generateTestflightNotes uses the latest version tag as the default base ref', () => {
  const repoRoot = createRepoFixture();
  const result = generateTestflightNotes({
    cwd: repoRoot,
    appVersion: '1.0.0',
    iosBuildNumber: '16',
  });

  assert.equal(result.baseRef, 'v1.0.0+15');
  assert.match(result.notes, /Build 16 includes the latest BRDG fixes and polish for 1.0.0\./);
  assert.match(result.notes, /Included since v1.0.0\+15:/);
  assert.match(result.notes, /- Add attendee profile drill-in on event detail/);
  assert.match(result.notes, /- Fix create event keyboard and CTA overlap/);
  assert.doesNotMatch(result.notes, /ci: streamline validation and deploy flow/);
  assert.match(result.notes, /Testing focus:/);
});
