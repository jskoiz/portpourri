import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadWorkflowDocument, renderPrompt } from './workflow.js';
import { resolveWorkflowConfig } from './config.js';
import type { Issue, Logger } from './types.js';

function writeTempWorkflow(contents: string): string {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-symphony-workflow-'));
  const filePath = path.join(dir, 'WORKFLOW.md');
  fs.writeFileSync(filePath, contents);
  return filePath;
}

const issue: Issue = {
  id: '1',
  identifier: 'BRDG-1',
  title: 'Example',
  description: null,
  priority: 1,
  state: 'Todo',
  branch_name: null,
  url: 'https://example.com',
  labels: ['mobile'],
  created_at: null,
  updated_at: null,
  blocked_by: [],
  blocked_by_summary: 'none',
  tracker: {
    state_id: 'st',
    state_type: 'unstarted',
    team_id: 'team-1',
    team_key: 'BRDG',
    team_name: 'BRDG',
  },
};

const logger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

test('loads workflow front matter and resolves env-backed config', () => {
  const filePath = writeTempWorkflow(`---
tracker:
  kind: linear
  project_slug: $LINEAR_PROJECT_SLUG
workspace:
  root: .symphony/workspaces
---

Hello {{ issue.identifier }}
`);

  const document = loadWorkflowDocument(filePath);
  const loaded = resolveWorkflowConfig(document, {
    ...process.env,
    LINEAR_API_KEY: 'token',
    LINEAR_PROJECT_SLUG: 'project-slug',
  }, fs.statSync(filePath).mtimeMs, logger);

  assert.equal(loaded.config.tracker.projectSlug, 'project-slug');
  assert.ok(loaded.config.workspace.root.endsWith(path.join('.symphony', 'workspaces')));
});

test('resolves extended workflow fields and falls back on invalid values', () => {
  const filePath = writeTempWorkflow(`---
tracker:
  kind: linear
  endpoint: https://linear.example/graphql
  project_slug: $LINEAR_PROJECT_SLUG
hooks:
  before_run: echo before
  after_run: echo after
  timeout_ms: 1500
agent:
  max_concurrent_agents_by_state:
    Human Review: 2
    Todo: nope
codex:
  turn_timeout_ms: 1234
  read_timeout_ms: bad
  stall_timeout_ms: 4321
---

Hello
`);

  const document = loadWorkflowDocument(filePath);
  const loaded = resolveWorkflowConfig(document, {
    ...process.env,
    LINEAR_API_KEY: 'token',
    LINEAR_PROJECT_SLUG: 'project-slug',
  }, fs.statSync(filePath).mtimeMs, logger);

  assert.equal(loaded.config.tracker.endpoint, 'https://linear.example/graphql');
  assert.equal(loaded.config.hooks.beforeRun, 'echo before');
  assert.equal(loaded.config.hooks.afterRun, 'echo after');
  assert.equal(loaded.config.hooks.timeoutMs, 1500);
  assert.deepEqual(loaded.config.agent.maxConcurrentAgentsByState, { 'Human Review': 2 });
  assert.equal(loaded.config.codex.turnTimeoutMs, 1234);
  assert.equal(loaded.config.codex.readTimeoutMs, 5000);
  assert.equal(loaded.config.codex.stallTimeoutMs, 4321);
});

test('renders prompt conditionals and substitutions', () => {
  const filePath = writeTempWorkflow(`---
tracker:
  kind: linear
  project_slug: $LINEAR_PROJECT_SLUG
workspace:
  root: .symphony/workspaces
---

placeholder
`);
  const document = loadWorkflowDocument(filePath);
  const loaded = resolveWorkflowConfig(document, {
    ...process.env,
    LINEAR_API_KEY: 'token',
    LINEAR_PROJECT_SLUG: 'project-slug',
  }, fs.statSync(filePath).mtimeMs, logger);
  const template = `
{% if attempt %}
Attempt {{ attempt }}
{% endif %}
Issue {{ issue.identifier }}
Runtime {{ workflow.runtime_revision }}
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}
Labels: {{ issue.labels }}
`;

  const first = renderPrompt(template, loaded, issue, 0);
  assert.match(first, /Issue BRDG-1/);
  assert.match(first, /No description provided\./);
  assert.doesNotMatch(first, /Attempt/);
  assert.match(first, /Runtime /);

  const retried = renderPrompt(template, loaded, { ...issue, description: 'Needs work' }, 2);
  assert.match(retried, /Attempt 2/);
  assert.match(retried, /Needs work/);
  assert.match(retried, /Labels: mobile/);
});
