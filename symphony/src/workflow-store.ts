import fs from 'node:fs';
import { loadWorkflowDocument } from './workflow.js';
import { resolveWorkflowConfig } from './config.js';
import type { LoadedWorkflow, Logger } from './types.js';

export class WorkflowStore {
  private currentWorkflow: LoadedWorkflow | null = null;

  constructor(
    private readonly workflowPath: string,
    private readonly env: NodeJS.ProcessEnv,
    private readonly logger: Logger,
  ) {}

  load(): LoadedWorkflow {
    const stats = fs.statSync(this.workflowPath);
    const document = loadWorkflowDocument(this.workflowPath);
    const loaded = resolveWorkflowConfig(document, this.env, stats.mtimeMs, this.logger);
    this.currentWorkflow = loaded;
    return loaded;
  }

  get(): LoadedWorkflow {
    if (!this.currentWorkflow) {
      return this.load();
    }
    return this.currentWorkflow;
  }

  reloadIfChanged(): LoadedWorkflow {
    const stats = fs.statSync(this.workflowPath);
    const current = this.get();
    if (stats.mtimeMs === current.mtimeMs) {
      return current;
    }
    this.logger.info('workflow.reloaded', { workflowPath: this.workflowPath });
    try {
      return this.load();
    } catch (error) {
      this.logger.error('workflow.reload_failed', {
        workflowPath: this.workflowPath,
        error: error instanceof Error ? error.message : String(error),
      });
      return current;
    }
  }
}
