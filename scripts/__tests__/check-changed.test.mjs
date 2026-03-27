import test from 'node:test';
import assert from 'node:assert/strict';
import { buildValidationPlan } from '../check-changed.mjs';

test('docs-only changes select root checks', () => {
  const plan = buildValidationPlan(['docs/HARNESS.md']);
  assert.deepEqual(plan.commands, ['npm run check:root']);
  assert.equal(plan.requiresSmoke, false);
});

test('empty change sets still select root checks', () => {
  const plan = buildValidationPlan([]);
  assert.deepEqual(plan.commands, ['npm run check:root']);
});

test('backend-only changes select backend checks', () => {
  const plan = buildValidationPlan(['backend/src/profile/profile.service.ts']);
  assert.deepEqual(plan.commands, ['npm run check:backend']);
});

test('docs-plus-backend changes keep root checks ahead of backend checks', () => {
  const plan = buildValidationPlan([
    'docs/HARNESS.md',
    'backend/src/profile/profile.service.ts',
  ]);
  assert.deepEqual(plan.commands, ['npm run check:root', 'npm run check:backend']);
});

test('cross-stack changes select the full check lane', () => {
  const plan = buildValidationPlan([
    'backend/src/profile/profile.service.ts',
    'mobile/src/features/profile/hooks/useProfile.ts',
  ]);
  assert.deepEqual(plan.commands, ['npm run check']);
});

test('harness-sensitive script entrypoint changes select the full check lane', () => {
  const plan = buildValidationPlan(['scripts/check-changed.mjs']);
  assert.deepEqual(plan.commands, ['npm run check']);
});

test('shared harness helper changes stay scoped to root checks', () => {
  const plan = buildValidationPlan(['scripts/harness-shared.mjs']);
  assert.deepEqual(plan.commands, ['npm run check:root']);
});

test('workspace package manifest changes stay scoped to their workspace', () => {
  const plan = buildValidationPlan([
    'symphony/package.json',
    'symphony/src/workflow.ts',
  ]);
  assert.deepEqual(plan.commands, ['npm run check:symphony']);
});

test('symphony-only changes select symphony checks', () => {
  const plan = buildValidationPlan(['symphony/src/workflow.ts']);
  assert.deepEqual(plan.commands, ['npm run check:symphony']);
});

test('cross-stack changes including symphony still select the full check lane', () => {
  const plan = buildValidationPlan([
    'mobile/src/features/profile/hooks/useProfile.ts',
    'symphony/src/workflow.ts',
  ]);
  assert.deepEqual(plan.commands, ['npm run check']);
});

test('smoke-sensitive changes append smoke validation', () => {
  const plan = buildValidationPlan(['backend/prisma/schema.prisma']);
  assert.deepEqual(plan.commands, ['npm run check:backend', 'npm run smoke']);
  assert.equal(plan.requiresSmoke, true);
});

test('scenario reset changes append smoke validation to backend checks', () => {
  const plan = buildValidationPlan(['backend/scripts/reset-dev-scenario.js']);
  assert.deepEqual(plan.commands, ['npm run check:backend', 'npm run smoke']);
  assert.equal(plan.requiresSmoke, true);
});

test('integrated backend flow changes append smoke validation', () => {
  const plan = buildValidationPlan(['backend/src/auth/auth.service.ts']);
  assert.deepEqual(plan.commands, ['npm run check:backend']);
  assert.equal(plan.requiresSmoke, false);
});

test('smoke runner changes append smoke validation to root checks', () => {
  const plan = buildValidationPlan(['scripts/smoke-e2e.sh']);
  assert.deepEqual(plan.commands, ['npm run check:root', 'npm run smoke']);
  assert.equal(plan.requiresSmoke, true);
});

test('integrated mobile flow changes append smoke validation', () => {
  const plan = buildValidationPlan(['mobile/src/screens/ProfileScreen.tsx']);
  assert.deepEqual(plan.commands, ['npm run check:mobile']);
  assert.equal(plan.requiresSmoke, false);
});

test('reusable mobile UI changes require a Storybook update in the diff', () => {
  const plan = buildValidationPlan(['mobile/src/components/form/DateField.tsx']);
  assert.equal(plan.storybookViolations.length, 1);
});

test('story update clears reusable mobile UI coverage violation', () => {
  const plan = buildValidationPlan([
    'mobile/src/components/form/DateField.tsx',
    'mobile/src/stories/FormFields.stories.tsx',
  ]);
  assert.equal(plan.storybookViolations.length, 0);
});
