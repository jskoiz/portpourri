import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildValidationPlan } from '../check-changed.mjs';
import { buildPreSubmitSteps } from '../pre-submit.mjs';
import { collectTodoIntroductions } from '../check-todo-introductions.mjs';
import { buildRepoIndex } from '../generate-repo-index.mjs';
import { scanTodoMarkers } from '../scan-todo-markers.mjs';

test('pre-submit prepends docs, policy, and TODO guard before selected validation commands', () => {
  const plan = buildValidationPlan(['docs/HARNESS.md']);
  const steps = buildPreSubmitSteps(plan, { base: null, head: 'HEAD', stagedOnly: true });

  assert.equal(steps[0].command, 'npm run docs:check');
  assert.equal(steps[1].command, 'npm run policy:check');
  assert.match(steps[2].command, /check-todo-introductions\.mjs --staged/);
  assert.equal(steps[3].command, 'npm run test:root');
  assert.equal(steps.length, 4);
});

test('TODO introduction guard only flags newly added TODO-style markers', () => {
  const diff = [
    'diff --git a/docs/HARNESS.md b/docs/HARNESS.md',
    '+++ b/docs/HARNESS.md',
    '+TODO: tighten this',
    '+Normal added line',
    'diff --git a/docs/REPO_MAP.md b/docs/REPO_MAP.md',
    '+++ b/docs/REPO_MAP.md',
    '+HACK: temp wording',
  ].join('\n');

  assert.deepEqual(collectTodoIntroductions(diff), [
    { filePath: 'docs/HARNESS.md', line: 'TODO: tighten this' },
    { filePath: 'docs/REPO_MAP.md', line: 'HACK: temp wording' },
  ]);
});

test('TODO introduction guard ignores prose mentions of TODO-like words', () => {
  const diff = [
    'diff --git a/docs/HARNESS.md b/docs/HARNESS.md',
    '+++ b/docs/HARNESS.md',
    '+- canonical checklist: docs drift, TODO-introduction guard, and diff-based validation',
    '+Scheduled maintenance also audits docs, TODO/FIXME drift, and repo-index health.',
  ].join('\n');

  assert.deepEqual(collectTodoIntroductions(diff), []);
});

test('repo index generation is stable for a fixture repo shape', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-repo-index-'));
  const write = (relativePath, content) => {
    const absolutePath = path.join(fixtureRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  };

  write('package.json', JSON.stringify({ scripts: { 'pre-submit': 'node scripts/pre-submit.mjs', 'repo:index': 'node scripts/generate-repo-index.mjs' } }));
  write('backend/src/config/app.config.ts', 'export const appConfig = {};');
  write('backend/src/prisma/prisma.service.ts', 'export class PrismaService {}');
  write('backend/src/auth/auth.dto.ts', 'export class LoginDto {}');
  write('backend/src/auth/auth.service.ts', 'export class AuthService {}');
  write('backend/src/auth/auth.controller.ts', 'export class AuthController {}');
  write('backend/src/auth/auth.module.ts', 'export class AuthModule {}');
  write('mobile/src/config/env.ts', 'export const env = {};');
  write('mobile/src/api/client.ts', 'export default {};');
  write('mobile/src/design/primitives/index.tsx', 'export const Button = null;');
  write('mobile/src/features/profile/hooks/useProfile.ts', 'export const useProfile = () => null;');
  write('mobile/src/screens/ProfileScreen.tsx', 'export default function ProfileScreen() { return null; }');
  write('mobile/src/navigation/index.tsx', 'export default function AppNavigator() { return null; }');
  write('mobile/src/stories/Profile.stories.tsx', 'export default {};');

  const index = buildRepoIndex(fixtureRoot);
  assert.deepEqual(index, {
    schemaVersion: 1,
    rootScripts: ['pre-submit', 'repo:index'],
    layerModel: index.layerModel,
    backend: {
      modules: ['auth', 'config', 'prisma'],
      layers: index.backend.layers,
    },
    mobile: {
      featureRoots: ['profile'],
      screens: ['mobile/src/screens/ProfileScreen.tsx'],
      stories: ['mobile/src/stories/Profile.stories.tsx'],
      layers: index.mobile.layers,
    },
  });
  assert.ok(index.backend.layers.some((layer) => layer.id === 'domain' && layer.files.includes('backend/src/auth/auth.service.ts')));
  assert.ok(index.mobile.layers.some((layer) => layer.id === 'feature' && layer.files.includes('mobile/src/features/profile/hooks/useProfile.ts')));
});

test('TODO marker scan ignores prose mentions and keeps actual markers', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-todo-scan-'));
  const write = (relativePath, content) => {
    const absolutePath = path.join(fixtureRoot, relativePath);
    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, content);
  };

  write('AGENTS.md', '# Repo\n');
  write('docs/HARNESS.md', '- Scheduled maintenance audits docs, TODO/FIXME drift, and repo-index health.\n');
  write('mobile/src/components/ErrorBoundary.tsx', 'export function ErrorBoundary() {\n  // TODO: send to Sentry\n  return null;\n}\n');
  write('scripts/sample.mjs', 'console.log("ready");\n');

  assert.deepEqual(scanTodoMarkers(fixtureRoot), [
    {
      filePath: 'mobile/src/components/ErrorBoundary.tsx',
      lineNumber: 2,
      line: '// TODO: send to Sentry',
    },
  ]);
});
