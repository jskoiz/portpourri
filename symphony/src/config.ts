import path from 'node:path';
import type { LoadedWorkflow, Logger, WorkflowConfig, WorkflowDocument } from './types.js';
import { WorkflowError } from './errors.js';
import { resolveGitRevision, resolveMaybeEnv, resolvePathValue } from './utils.js';

const DEFAULT_LINEAR_ENDPOINT = 'https://api.linear.app/graphql';

const SUPPORTED_WORKFLOW_FIELDS = new Set([
  'tracker.kind',
  'tracker.endpoint',
  'tracker.api_key',
  'tracker.project_slug',
  'tracker.active_states',
  'tracker.terminal_states',
  'polling.interval_ms',
  'workspace.root',
  'hooks.after_create',
  'hooks.before_run',
  'hooks.after_run',
  'hooks.before_remove',
  'hooks.timeout_ms',
  'agent.max_concurrent_agents',
  'agent.max_concurrent_agents_by_state',
  'agent.max_turns',
  'agent.retry_base_delay_ms',
  'agent.retry_max_delay_ms',
  'agent.max_retry_backoff_ms',
  'codex.command',
  'codex.model',
  'codex.approval_policy',
  'codex.thread_sandbox',
  'codex.turn_sandbox_policy',
  'codex.personality',
  'codex.config',
  'codex.turn_timeout_ms',
  'codex.read_timeout_ms',
  'codex.stall_timeout_ms',
]);

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  return value as Record<string, unknown>;
}

function asNumber(
  value: unknown,
  fallback: number,
  fieldPath: string,
  invalidPaths: string[],
  minimum = 0,
): number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < minimum) {
    if (value !== undefined) {
      invalidPaths.push(fieldPath);
    }
    return fallback;
  }
  return value;
}

function asString(value: unknown, fallback: string | null = null): string | null {
  return typeof value === 'string' && value.length > 0 ? value : fallback;
}

function resolvePassThroughValue(
  value: unknown,
  env: NodeJS.ProcessEnv,
): string | Record<string, unknown> | null {
  if (typeof value === 'string') {
    return resolveMaybeEnv(value, env) ?? value;
  }
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return null;
}

function collectLeafPaths(value: unknown, prefix = ''): string[] {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  const leafPaths: string[] = [];
  for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
    const nextPrefix = prefix ? `${prefix}.${key}` : key;
    if (child && typeof child === 'object' && !Array.isArray(child)) {
      leafPaths.push(...collectLeafPaths(child, nextPrefix));
      continue;
    }
    leafPaths.push(nextPrefix);
  }
  return leafPaths;
}

function coerceStringArray(
  value: unknown,
  fallback: string[],
  fieldPath: string,
  invalidPaths: string[],
): string[] {
  if (value === undefined) {
    return fallback;
  }
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    invalidPaths.push(fieldPath);
    return fallback;
  }
  return value;
}

function coercePositiveNumberMap(
  value: unknown,
  fallback: Record<string, number>,
  fieldPath: string,
  invalidPaths: string[],
): Record<string, number> {
  if (value === undefined) {
    return fallback;
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalidPaths.push(fieldPath);
    return fallback;
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const normalized: Record<string, number> = {};
  for (const [key, raw] of entries) {
    if (typeof raw !== 'number' || !Number.isFinite(raw) || raw < 1) {
      invalidPaths.push(`${fieldPath}.${key}`);
      continue;
    }
    normalized[key] = raw;
  }

  return normalized;
}

function logWorkflowConfigDiagnostics(
  configRoot: Record<string, unknown>,
  invalidPaths: string[],
  logger: Logger,
): void {
  const presentLeafPaths = collectLeafPaths(configRoot);
  const supported = presentLeafPaths.filter((fieldPath) => SUPPORTED_WORKFLOW_FIELDS.has(fieldPath));
  const ignored = presentLeafPaths.filter((fieldPath) => !SUPPORTED_WORKFLOW_FIELDS.has(fieldPath));

  logger.info('workflow.config_diagnostics', {
    supported,
    ignored,
    invalid: invalidPaths,
  });
}

export function resolveWorkflowConfig(
  document: WorkflowDocument,
  env: NodeJS.ProcessEnv,
  mtimeMs: number,
  logger: Logger,
): LoadedWorkflow {
  const root = asObject(document.config);
  const tracker = asObject(root.tracker);
  const polling = asObject(root.polling);
  const workspace = asObject(root.workspace);
  const hooks = asObject(root.hooks);
  const agent = asObject(root.agent);
  const codex = asObject(root.codex);
  const workflowDir = path.dirname(document.sourcePath);
  const invalidPaths: string[] = [];

  const trackerKind = asString(tracker.kind, 'linear');
  if (trackerKind !== 'linear') {
    throw new WorkflowError(`Unsupported tracker.kind: ${String(trackerKind)}`);
  }

  const endpoint = resolveMaybeEnv(tracker.endpoint, env) ?? DEFAULT_LINEAR_ENDPOINT;
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

  const retryMaxDelayMs = asNumber(
    agent.max_retry_backoff_ms ?? agent.retry_max_delay_ms,
    300000,
    agent.max_retry_backoff_ms !== undefined ? 'agent.max_retry_backoff_ms' : 'agent.retry_max_delay_ms',
    invalidPaths,
    1,
  );

  const config: WorkflowConfig = {
    tracker: {
      kind: 'linear',
      endpoint,
      apiKey,
      projectSlug,
      activeStates: coerceStringArray(
        tracker.active_states,
        ['Todo', 'In Progress', 'Rework', 'Human Review', 'Merging'],
        'tracker.active_states',
        invalidPaths,
      ),
      terminalStates: coerceStringArray(
        tracker.terminal_states,
        ['Done', 'Closed', 'Cancelled', 'Canceled', 'Duplicate'],
        'tracker.terminal_states',
        invalidPaths,
      ),
    },
    polling: {
      intervalMs: asNumber(polling.interval_ms, 5000, 'polling.interval_ms', invalidPaths, 1),
    },
    workspace: {
      root: workspaceRoot,
    },
    hooks: {
      afterCreate: asString(hooks.after_create),
      beforeRun: asString(hooks.before_run),
      afterRun: asString(hooks.after_run),
      beforeRemove: asString(hooks.before_remove),
      timeoutMs: asNumber(hooks.timeout_ms, 60000, 'hooks.timeout_ms', invalidPaths, 1),
    },
    agent: {
      maxConcurrentAgents: asNumber(agent.max_concurrent_agents, 2, 'agent.max_concurrent_agents', invalidPaths, 1),
      maxConcurrentAgentsByState: coercePositiveNumberMap(
        agent.max_concurrent_agents_by_state,
        {},
        'agent.max_concurrent_agents_by_state',
        invalidPaths,
      ),
      maxTurns: asNumber(agent.max_turns, 20, 'agent.max_turns', invalidPaths, 1),
      retryBaseDelayMs: asNumber(agent.retry_base_delay_ms, 5000, 'agent.retry_base_delay_ms', invalidPaths, 1),
      retryMaxDelayMs,
    },
    codex: {
      command: asString(codex.command, 'codex app-server') ?? 'codex app-server',
      model: asString(codex.model),
      approvalPolicy: resolvePassThroughValue(codex.approval_policy, env) ?? 'never',
      threadSandbox: asString(codex.thread_sandbox, 'workspace-write'),
      turnSandboxPolicy: codex.turn_sandbox_policy && typeof codex.turn_sandbox_policy === 'object'
        ? (codex.turn_sandbox_policy as Record<string, unknown>)
        : null,
      personality: asString(codex.personality, 'pragmatic'),
      config: codex.config && typeof codex.config === 'object' ? codex.config as Record<string, unknown> : null,
      turnTimeoutMs: asNumber(codex.turn_timeout_ms, 3600000, 'codex.turn_timeout_ms', invalidPaths, 1),
      readTimeoutMs: asNumber(codex.read_timeout_ms, 5000, 'codex.read_timeout_ms', invalidPaths, 1),
      stallTimeoutMs: asNumber(codex.stall_timeout_ms, 300000, 'codex.stall_timeout_ms', invalidPaths, 1),
    },
  };

  logWorkflowConfigDiagnostics(root, invalidPaths, logger);

  return {
    document,
    config,
    mtimeMs,
    runtimeRevision: resolveGitRevision(workflowDir),
  };
}
