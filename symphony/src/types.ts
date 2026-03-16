export interface WorkflowDocument {
  config: Record<string, unknown>;
  promptTemplate: string;
  sourcePath: string;
}

export interface IssueState {
  id: string | null;
  name: string;
  type: string | null;
}

export interface Issue {
  id: string;
  identifier: string;
  title: string;
  description: string | null;
  priority: number | null;
  state: IssueState;
  branchName: string | null;
  url: string | null;
  labels: string[];
  createdAt: string | null;
  updatedAt: string | null;
}

export interface WorkflowConfig {
  tracker: {
    kind: 'linear';
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
    beforeRemove: string | null;
  };
  agent: {
    maxConcurrentAgents: number;
    maxTurns: number;
    retryBaseDelayMs: number;
    retryMaxDelayMs: number;
  };
  codex: {
    command: string;
    model: string | null;
    approvalPolicy: 'untrusted' | 'on-failure' | 'on-request' | 'never';
    threadSandbox: 'read-only' | 'workspace-write' | 'danger-full-access';
    turnSandboxPolicy: Record<string, unknown> | null;
    personality: 'none' | 'friendly' | 'pragmatic' | null;
    config: Record<string, unknown> | null;
  };
}

export interface LoadedWorkflow {
  document: WorkflowDocument;
  config: WorkflowConfig;
  mtimeMs: number;
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
