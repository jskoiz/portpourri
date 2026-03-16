import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const testFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(testFile), '..', '..');

test('mobile feature generator creates the expected scaffold files', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-mobile-scaffold-'));
  t.after(() => fs.rmSync(tempDir, { force: true, recursive: true }));

  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'mobile/scripts/scaffold-feature.mjs'), '--name', 'Plan Builder', '--root-dir', tempDir],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  for (const relativePath of [
    'src/features/plan-builder/README.md',
    'src/features/plan-builder/components/PlanBuilderPanel.tsx',
    'src/features/plan-builder/hooks/usePlanBuilder.ts',
    'src/features/plan-builder/__tests__/PlanBuilderPanel.test.tsx',
    'src/features/plan-builder/index.ts',
    'src/stories/PlanBuilderPanel.stories.tsx',
  ]) {
    assert.equal(fs.existsSync(path.join(tempDir, relativePath)), true, relativePath);
  }
});

test('backend module generator creates the expected scaffold files', (t) => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-backend-scaffold-'));
  t.after(() => fs.rmSync(tempDir, { force: true, recursive: true }));

  const result = spawnSync(
    process.execPath,
    [path.join(repoRoot, 'backend/scripts/scaffold-module.mjs'), '--name', 'trust signals', '--root-dir', tempDir],
    { encoding: 'utf8' },
  );

  assert.equal(result.status, 0, result.stderr);
  for (const relativePath of [
    'src/trust-signals/trust-signals.dto.ts',
    'src/trust-signals/trust-signals.service.ts',
    'src/trust-signals/trust-signals.service.spec.ts',
    'src/trust-signals/trust-signals.controller.ts',
    'src/trust-signals/trust-signals.controller.spec.ts',
    'src/trust-signals/trust-signals.module.ts',
  ]) {
    assert.equal(fs.existsSync(path.join(tempDir, relativePath)), true, relativePath);
  }
});
