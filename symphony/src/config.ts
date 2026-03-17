import path from 'node:path';
import type { LoadedWorkflow, WorkflowConfig, WorkflowDocument } from './types.js';
import { WorkflowError } from './errors.js';
import { coerceStringArray, resolveGitRevision, resolveMaybeEnv, resolvePathValue } from './utils.js';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asNumber(value: unknown, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

function asString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

export function resolveWorkflowConfig(document: WorkflowDocument, env: NodeJS.ProcessEnv, mtimeMs: number): LoadedWorkflow {
  const root = asObject(document.config);
  const tracker = asObject(root.tracker);
  const polling = asObject(root.polling);
  const workspace = asObject(root.workspace);
  const hooks = asObject(root.hooks);
  const agent = asObject(root.agent);
  const codex = asObject(root.codex);
  const workflowDir = path.dirname(document.sourcePath);

  const trackerKind = asString(tracker.kind, 'linear');
  if (trackerKind !== 'linear') {
    throw new WorkflowError(`Unsupported tracker.kind: ${String(trackerKind)}`);
  }

  const apiKey = resolveMaybeEnv(tracker.api_key, env) ?? env.LINEAR_API_KEY ?? '';
  if (!apiKey) {
    throw new WorkflowError('Linear API key is required via tracker.api_key or LINEAR_API_KEY.');
  }

  const projectSlug = resolveMaybeEnv(tracker.project_slug, env) ?? env.LINEAR_PROJECT_SLUG ?? '';
  if (!projectSlug) {
    throw new WorkflowError('Linear project slug is required via tracker.project_slug or LINEAR_PROJECT_SLUG.');
  }

  const workspaceRoot =
    resolvePathValue(workspace.root, workflowDir, env) ??
    path.resolve(workflowDir, '.symphony', 'workspaces');

  const config: WorkflowConfig = {
    tracker: {
      kind: 'linear',
      apiKey,
      projectSlug,
      activeStates: coerceStringArray(tracker.active_states, ['Todo', 'In Progress', 'Rework', 'Human Review', 'Merging']),
      terminalStates: coerceStringArray(tracker.terminal_states, ['Done', 'Closed', 'Cancelled', 'Canceled', 'Duplicate']),
    },
    polling: {
      intervalMs: asNumber(polling.interval_ms, 5000),
    },
    workspace: {
      root: workspaceRoot,
    },
    hooks: {
      afterCreate: asString(hooks.after_create),
      beforeRemove: asString(hooks.before_remove),
    },
    agent: {
      maxConcurrentAgents: asNumber(agent.max_concurrent_agents, 2),
      maxTurns: asNumber(agent.max_turns, 20),
      retryBaseDelayMs: asNumber(agent.retry_base_delay_ms, 5000),
      retryMaxDelayMs: asNumber(agent.retry_max_delay_ms, 300000),
    },
    codex: {
      command: asString(codex.command, 'codex app-server') ?? 'codex app-server',
      model: asString(codex.model),
      approvalPolicy: (asString(codex.approval_policy, 'never') as WorkflowConfig['codex']['approvalPolicy']) ?? 'never',
      threadSandbox: (asString(codex.thread_sandbox, 'workspace-write') as WorkflowConfig['codex']['threadSandbox']) ?? 'workspace-write',
      turnSandboxPolicy: codex.turn_sandbox_policy && typeof codex.turn_sandbox_policy === 'object'
        ? (codex.turn_sandbox_policy as Record<string, unknown>)
        : null,
      personality: (asString(codex.personality, 'pragmatic') as WorkflowConfig['codex']['personality']) ?? 'pragmatic',
      config: codex.config && typeof codex.config === 'object' ? codex.config as Record<string, unknown> : null,
    },
  };

  return {
    document,
    config,
    mtimeMs,
    runtimeRevision: resolveGitRevision(workflowDir),
  };
}
