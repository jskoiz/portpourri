import test from 'node:test';
import assert from 'node:assert/strict';
import { buildValidationPlan } from '../check-changed.mjs';

test('docs-only changes select root checks', () => {
  const plan = buildValidationPlan(['docs/HARNESS.md']);
  assert.deepEqual(plan.commands, ['npm run check:root']);
  assert.equal(plan.requiresSmoke, false);
});

test('backend-only changes select backend checks', () => {
  const plan = buildValidationPlan(['backend/src/profile/profile.service.ts']);
  assert.deepEqual(plan.commands, ['npm run check:backend']);
});

test('cross-stack changes select the full check lane', () => {
  const plan = buildValidationPlan([
    'backend/src/profile/profile.service.ts',
    'mobile/src/features/profile/hooks/useProfile.ts',
  ]);
  assert.deepEqual(plan.commands, ['npm run check']);
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
