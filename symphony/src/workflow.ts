import fs from 'node:fs';
import YAML from 'yaml';
import type { Issue, LoadedWorkflow, WorkflowDocument } from './types.js';
import { WorkflowError } from './errors.js';

const FRONTMATTER = /^---\n([\s\S]*?)\n---\n?([\s\S]*)$/;

export function loadWorkflowDocument(filePath: string): WorkflowDocument {
  const source = fs.readFileSync(filePath, 'utf8');
  const match = source.match(FRONTMATTER);
  if (!match) {
    throw new WorkflowError(`WORKFLOW.md at ${filePath} must start with YAML front matter.`);
  }

  const [, yamlText, body] = match;
  const config = YAML.parse(yamlText) as Record<string, unknown> | null;
  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new WorkflowError(`WORKFLOW.md at ${filePath} has invalid YAML front matter.`);
  }

  return {
    config,
    promptTemplate: body.trim(),
    sourcePath: filePath,
  };
}

function lookupValue(expression: string, workflow: LoadedWorkflow, issue: Issue, attempt: number): unknown {
  if (expression === 'attempt') {
    return attempt > 0 ? attempt : null;
  }
  if (expression === 'workflow.runtime_revision') {
    return workflow.runtimeRevision;
  }
  if (expression === 'workflow.source_path') {
    return workflow.document.sourcePath;
  }
  if (!expression.startsWith('issue.')) {
    return null;
  }

  const parts = expression.slice('issue.'.length).split('.');
  let current: unknown = issue;
  for (const part of parts) {
    if (!current || typeof current !== 'object') {
      return null;
    }
    current = (current as Record<string, unknown>)[part];
  }
  return current;
}

function renderIfBlocks(template: string, issue: Issue, attempt: number): string {
  return template
    .replace(
      /\{% if attempt %\}([\s\S]*?)\{% endif %\}/g,
      (_, truthy: string) => (attempt > 0 ? truthy : ''),
    )
    .replace(
      /\{% if issue\.description %\}([\s\S]*?)\{% else %\}([\s\S]*?)\{% endif %\}/g,
      (_, truthy: string, falsy: string) => (issue.description ? truthy : falsy),
    );
}

export function renderPrompt(template: string, workflow: LoadedWorkflow, issue: Issue, attempt: number): string {
  const conditioned = renderIfBlocks(template, issue, attempt);
  return conditioned.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (_, expression: string) => {
    const value = lookupValue(expression.trim(), workflow, issue, attempt);
    if (value == null) {
      return '';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  }).trim();
}
