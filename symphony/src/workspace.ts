import fs from 'node:fs';
import path from 'node:path';
import type { Issue, Logger, WorkflowConfig, Workspace } from './types.js';
import { ensureDir, runHook, sanitizeWorkspaceKey } from './utils.js';

export class WorkspaceManager {
  constructor(
    private readonly config: WorkflowConfig,
    private readonly logger: Logger,
  ) {}

  getWorkspacePath(identifier: string): string {
    return path.join(this.config.workspace.root, sanitizeWorkspaceKey(identifier));
  }

  async ensureWorkspace(issue: Issue): Promise<Workspace> {
    ensureDir(this.config.workspace.root);
    const workspacePath = this.getWorkspacePath(issue.identifier);
    const createdNow = !fs.existsSync(workspacePath);
    ensureDir(workspacePath);

    if (createdNow && this.config.hooks.afterCreate) {
      this.logger.info('workspace.after_create', { issue: issue.identifier, workspacePath });
      await runHook(this.config.hooks.afterCreate, workspacePath, {
        ...process.env,
        ISSUE_ID: issue.id,
        ISSUE_IDENTIFIER: issue.identifier,
        ISSUE_TITLE: issue.title,
        ISSUE_URL: issue.url ?? '',
        WORKSPACE_PATH: workspacePath,
      }, this.config.hooks.timeoutMs);
    }

    return {
      path: workspacePath,
      workspaceKey: sanitizeWorkspaceKey(issue.identifier),
      createdNow,
    };
  }

  async removeWorkspace(identifier: string): Promise<void> {
    const workspacePath = this.getWorkspacePath(identifier);
    if (!fs.existsSync(workspacePath)) {
      return;
    }

    if (this.config.hooks.beforeRemove) {
      this.logger.info('workspace.before_remove', { issue: identifier, workspacePath });
      await runHook(this.config.hooks.beforeRemove, workspacePath, {
        ...process.env,
        ISSUE_IDENTIFIER: identifier,
        WORKSPACE_PATH: workspacePath,
      }, this.config.hooks.timeoutMs);
    }

    fs.rmSync(workspacePath, { recursive: true, force: true });
  }
}
