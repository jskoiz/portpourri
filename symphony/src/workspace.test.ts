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
  state: 'Todo',
  branch_name: null,
  url: null,
  labels: [],
  created_at: null,
  updated_at: null,
  blocked_by: [],
  blocked_by_summary: 'none',
  tracker: {
    state_id: null,
    state_type: null,
    team_id: null,
    team_key: null,
    team_name: null,
  },
};

function config(root: string): WorkflowConfig {
  return {
    tracker: {
      kind: 'linear',
      endpoint: 'https://api.linear.app/graphql',
      apiKey: 'token',
      projectSlug: 'slug',
      activeStates: ['Todo'],
      terminalStates: ['Done'],
    },
    polling: { intervalMs: 5000 },
    workspace: { root },
    hooks: { afterCreate: null, beforeRun: null, afterRun: null, beforeRemove: null, timeoutMs: 60000 },
    agent: {
      maxConcurrentAgents: 1,
      maxConcurrentAgentsByState: {},
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
      turnTimeoutMs: 3600000,
      readTimeoutMs: 5000,
      stallTimeoutMs: 300000,
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
