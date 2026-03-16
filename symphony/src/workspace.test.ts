import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { WorkspaceManager } from './workspace.js';
import type { WorkflowConfig, Issue, Logger } from './types.js';

const logger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

const issue: Issue = {
  id: '1',
  identifier: 'BRDG-42',
  title: 'Example',
  description: null,
  priority: null,
  state: { id: null, name: 'Todo', type: null },
  branchName: null,
  url: null,
  labels: [],
  createdAt: null,
  updatedAt: null,
};

function config(root: string): WorkflowConfig {
  return {
    tracker: {
      kind: 'linear',
      apiKey: 'token',
      projectSlug: 'slug',
      activeStates: ['Todo'],
      terminalStates: ['Done'],
    },
    polling: { intervalMs: 5000 },
    workspace: { root },
    hooks: { afterCreate: null, beforeRemove: null },
    agent: {
      maxConcurrentAgents: 1,
      maxTurns: 20,
      retryBaseDelayMs: 1000,
      retryMaxDelayMs: 5000,
    },
    codex: {
      command: 'codex app-server',
      model: null,
      approvalPolicy: 'never',
      threadSandbox: 'workspace-write',
      turnSandboxPolicy: null,
      personality: 'pragmatic',
      config: null,
    },
  };
}

test('workspace manager creates and removes issue workspace', async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-symphony-workspace-'));
  const manager = new WorkspaceManager(config(root), logger);

  const workspace = await manager.ensureWorkspace(issue);
  assert.equal(workspace.createdNow, true);
  assert.ok(fs.existsSync(workspace.path));

  await manager.removeWorkspace(issue.identifier);
  assert.equal(fs.existsSync(workspace.path), false);
});
