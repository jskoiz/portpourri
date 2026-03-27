export interface WorkflowDocument {
  config: Record<string, unknown>;
  promptTemplate: string;
  sourcePath: string;
}

export interface BlockedIssueRef {
  id: string | null;
  identifier: string | null;
  state: string | null;
  created_at: string | null;
  updated_at: string | null;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number | null;
  state: string;
  branch_name: string | null;
  url: string | null;
  labels: string[];
  created_at: string | null;
  updated_at: string | null;
  blocked_by: BlockedIssueRef[];
  blocked_by_summary: string;
  tracker: {
    state_id: string | null;
    state_type: string | null;
    team_id: string | null;
    team_key: string | null;
    team_name: string | null;
  };
}

export interface WorkflowConfig {
  tracker: {
    kind: 'linear';
    endpoint: string;
    apiKey: string;
    projectSlug: string;
    activeStates: string[];
    terminalStates: string[];
  };
  polling: {
    intervalMs: number;
  };
  workspace: {
    root: string;
  };
  hooks: {
    afterCreate: string | null;
    beforeRun: string | null;
    afterRun: string | null;
    beforeRemove: string | null;
    timeoutMs: number;
  };
  agent: {
    maxConcurrentAgents: number;
    maxConcurrentAgentsByState: Record<string, number>;
    maxTurns: number;
    retryBaseDelayMs: number;
    retryMaxDelayMs: number;
  };
  codex: {
    command: string;
    model: string | null;
    approvalPolicy: string | Record<string, unknown> | null;
    threadSandbox: string | null;
    turnSandboxPolicy: Record<string, unknown> | null;
    personality: string | null;
    config: Record<string, unknown> | null;
    turnTimeoutMs: number;
    readTimeoutMs: number;
    stallTimeoutMs: number;
  };
}

export interface LoadedWorkflow {
  document: WorkflowDocument;
  config: WorkflowConfig;
  mtimeMs: number;
  runtimeRevision: string | null;
}

export interface Workspace {
  path: string;
  workspaceKey: string;
  createdNow: boolean;
}

export interface RunAttempt {
  issueId: string;
  issueIdentifier: string;
  attempt: number;
  workspacePath: string;
  startedAt: string;
  status: 'running' | 'completed' | 'failed' | 'interrupted';
  error?: string;
}

export interface RunResult {
  status: 'completed' | 'failed' | 'interrupted';
  threadId: string;
  turnId: string;
  finalMessage: string | null;
  error?: string;
}

export interface ProgressReport {
  plan?: string | null;
  acceptanceCriteria?: string | null;
  validation?: string | null;
  notes?: string | null;
}

export interface HandoffReport {
  summary: string;
  status?: string | null;
  desiredState?: string | null;
  branchName?: string | null;
  prUrl?: string | null;
  validation?: string | null;
  originalIssueIdentifier?: string | null;
}

export interface RetryEntry {
  issueId: string;
  identifier: string;
  attempt: number;
  dueAtMs: number;
  error: string | null;
}

export interface Logger {
  debug(message: string, fields?: Record<string, unknown>): void;
  info(message: string, fields?: Record<string, unknown>): void;
  warn(message: string, fields?: Record<string, unknown>): void;
  error(message: string, fields?: Record<string, unknown>): void;
}
