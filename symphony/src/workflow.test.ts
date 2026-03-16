import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { loadWorkflowDocument, renderPrompt } from './workflow.js';
import { resolveWorkflowConfig } from './config.js';
import type { Issue } from './types.js';

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
  state: { id: 'st', name: 'Todo', type: 'unstarted' },
  branchName: null,
  url: 'https://example.com',
  labels: ['mobile'],
  createdAt: null,
  updatedAt: null,
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
  }, fs.statSync(filePath).mtimeMs);

  assert.equal(loaded.config.tracker.projectSlug, 'project-slug');
  assert.ok(loaded.config.workspace.root.endsWith(path.join('.symphony', 'workspaces')));
});

test('renders prompt conditionals and substitutions', () => {
  const template = `
{% if attempt %}
Attempt {{ attempt }}
{% endif %}
Issue {{ issue.identifier }}
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}
Labels: {{ issue.labels }}
`;

  const first = renderPrompt(template, issue, 0);
  assert.match(first, /Issue BRDG-1/);
  assert.match(first, /No description provided\./);
  assert.doesNotMatch(first, /Attempt/);

  const retried = renderPrompt(template, { ...issue, description: 'Needs work' }, 2);
  assert.match(retried, /Attempt 2/);
  assert.match(retried, /Needs work/);
  assert.match(retried, /Labels: mobile/);
});
