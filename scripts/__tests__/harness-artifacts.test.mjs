import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  FAILURE_CATEGORIES,
  readJsonFile,
  runHarnessSteps,
} from '../harness-shared.mjs';
import { loadHarnessArtifacts } from '../harness-github.mjs';

function makeTempArtifactsDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-harness-artifacts-'));
}

test('runHarnessSteps writes passing harness artifacts with selected commands and metadata', () => {
  const artifactsDir = makeTempArtifactsDir();

  const result = runHarnessSteps({
    lane: 'test-pass',
    selectedCommands: ['npm run check:root'],
    changedFiles: ['docs/HARNESS.md'],
    artifactsDir,
    metadata: { source: 'unit-test' },
    steps: [
      {
        command: 'node -e "process.exit(0)"',
        label: 'Synthetic passing step',
        category: FAILURE_CATEGORIES.tests,
      },
    ],
    printPlan: false,
  });

  assert.equal(result.exitCode, 0);

  const plan = readJsonFile(path.join(artifactsDir, 'harness-plan.json'));
  const results = readJsonFile(path.join(artifactsDir, 'harness-results.json'));
  const failureSummary = readJsonFile(path.join(artifactsDir, 'harness-failure-summary.json'));
  const historyEntry = readJsonFile(path.join(artifactsDir, 'harness-history-entry.json'));

  assert.deepEqual(plan.selectedCommands, ['npm run check:root']);
  assert.deepEqual(plan.changedFiles, ['docs/HARNESS.md']);
  assert.deepEqual(plan.metadata, { source: 'unit-test' });

  assert.equal(results.status, 'passed');
  assert.equal(results.executedSteps.length, 1);
  assert.equal(results.executedSteps[0].label, 'Synthetic passing step');
  assert.equal(results.executedSteps[0].status, 'passed');

  assert.equal(failureSummary.status, 'passed');
  assert.equal(failureSummary.failureCategory, null);
  assert.equal(failureSummary.failingStep, null);

  assert.equal(historyEntry.status, 'passed');
  assert.deepEqual(historyEntry.selectedCommands, ['npm run check:root']);
  assert.deepEqual(historyEntry.failedCommands, []);
});

test('runHarnessSteps writes failing harness artifacts with normalized failure context', () => {
  const artifactsDir = makeTempArtifactsDir();
  const failingCommand = 'node -e "process.exit(1)"';

  const result = runHarnessSteps({
    lane: 'test-fail',
    selectedCommands: ['npm run test:root'],
    changedFiles: ['scripts/harness-shared.mjs'],
    artifactsDir,
    metadata: { source: 'unit-test' },
    steps: [
      {
        command: 'node -e "process.exit(0)"',
        label: 'Synthetic passing step',
        category: FAILURE_CATEGORIES.tests,
      },
      {
        command: failingCommand,
        label: 'Synthetic failing step',
        category: FAILURE_CATEGORIES.policyViolation,
      },
    ],
    printPlan: false,
  });

  assert.equal(result.exitCode, 1);

  const results = readJsonFile(path.join(artifactsDir, 'harness-results.json'));
  const failureSummary = readJsonFile(path.join(artifactsDir, 'harness-failure-summary.json'));
  const historyEntry = readJsonFile(path.join(artifactsDir, 'harness-history-entry.json'));

  assert.equal(results.status, 'failed');
  assert.equal(results.executedSteps.length, 2);
  assert.equal(results.executedSteps[1].status, 'failed');

  assert.equal(failureSummary.failureCategory, FAILURE_CATEGORIES.policyViolation);
  assert.equal(failureSummary.failingStep, 'Synthetic failing step');
  assert.equal(failureSummary.localCommand, failingCommand);
  assert.match(failureSummary.remediationHint, /policy violation/i);

  assert.equal(historyEntry.status, 'failed');
  assert.equal(historyEntry.failureCategory, FAILURE_CATEGORIES.policyViolation);
  assert.deepEqual(historyEntry.failedCommands, [failingCommand]);
});

test('loadHarnessArtifacts ignores non-JSON workflow summary files', () => {
  const artifactsDir = makeTempArtifactsDir();
  fs.writeFileSync(
    path.join(artifactsDir, 'harness-plan.json'),
    `${JSON.stringify({ selectedCommands: ['npm run check'] }, null, 2)}\n`,
  );
  fs.writeFileSync(path.join(artifactsDir, 'harness-summary.md'), '# Harness summary\n');

  const artifacts = loadHarnessArtifacts(artifactsDir);

  assert.deepEqual(artifacts.plan?.selectedCommands, ['npm run check']);
  assert.equal(artifacts.results, null);
  assert.equal(artifacts.failureSummary, null);
});
