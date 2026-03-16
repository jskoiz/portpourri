import test from 'node:test';
import assert from 'node:assert/strict';
import { buildCommandApprovalResponse, buildFileChangeApprovalResponse, buildPermissionsApprovalResponse, throwOnInteractiveRequest } from './policy.js';
import { UserInputRequiredError } from './errors.js';
import type { Logger } from './types.js';

const logger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

test('auto-approves command and file changes', () => {
  assert.deepEqual(buildCommandApprovalResponse(), { decision: 'accept' });
  assert.deepEqual(buildFileChangeApprovalResponse(), { decision: 'accept' });
});

test('returns empty permission grant profile for permission prompts', () => {
  assert.deepEqual(buildPermissionsApprovalResponse(), {
    permissions: {},
    scope: 'turn',
  });
});

test('fails fast on interactive requests', () => {
  assert.throws(
    () => throwOnInteractiveRequest('item/tool/requestUserInput', logger),
    UserInputRequiredError,
  );
});
