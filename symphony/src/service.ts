import fs from 'node:fs';
import path from 'node:path';
import type { HandoffReport, Issue, LoadedWorkflow, Logger, ProgressReport, RetryEntry } from './types.js';
import { WorkflowStore } from './workflow-store.js';
import { LinearTracker } from './tracker/linear.js';
import { WorkspaceManager } from './workspace.js';
import { AgentRunner } from './agent-runner.js';
import { ensureDir, runHook, sleep } from './utils.js';
import {
  createEmptyWorkpadSnapshot,
  extractOriginalIssueIdentifier,
  mergeHandoffReport,
  mergeProgressReport,
  parseWorkpadSnapshot,
  renderWorkpad,
  type WorkpadSnapshot,
} from './workpad.js';

interface RunningEntry {
  issue: Issue;
  attempt: number;
  abortController: AbortController;
}

interface CompletedRunEntry {
  issueId: string;
  identifier: string;
  fingerprint: string;
  completedAt: string;
}

interface CompletedRunsFile {
  completedRuns: Record<string, CompletedRunEntry>;
}

function computeRetryDelay(workflow: LoadedWorkflow, attempt: number): number {
  const raw = workflow.config.agent.retryBaseDelayMs * (2 ** Math.max(0, attempt - 1));
  return Math.min(raw, workflow.config.agent.retryMaxDelayMs);
}

export function buildIssueDispatchFingerprint(issue: Issue): string {
  return JSON.stringify({
    updatedAt: issue.updated_at ?? null,
    stateId: issue.tracker.state_id ?? null,
    stateName: issue.state,
    branchName: issue.branch_name ?? null,
    description: issue.description ?? null,
    labels: issue.labels,
    blockedBy: issue.blocked_by.map((blocker) => blocker.identifier ?? blocker.id ?? ''),
  });
}

export class SymphonyService {
  private stopped = false;
  private readonly running = new Map<string, RunningEntry>();
  private readonly retries = new Map<string, RetryEntry>();
  private readonly completedRuns = new Map<string, CompletedRunEntry>();
  private completedRunsPath: string | null = null;

  constructor(
    private readonly workflowStore: WorkflowStore,
    private readonly logger: Logger,
  ) {}

  stop(): void {
    this.stopped = true;
    for (const running of this.running.values()) {
      running.abortController.abort();
    }
  }

  private getCompletedRunsPath(workflow: LoadedWorkflow): string {
    return path.resolve(workflow.config.workspace.root, '..', 'run-state.json');
  }

  private loadCompletedRuns(workflow: LoadedWorkflow): void {
    const nextPath = this.getCompletedRunsPath(workflow);
    if (this.completedRunsPath === nextPath) {
      return;
    }

    this.completedRuns.clear();
    this.completedRunsPath = nextPath;

    if (!fs.existsSync(nextPath)) {
      return;
    }

    try {
      const raw = fs.readFileSync(nextPath, 'utf8');
      const parsed = JSON.parse(raw) as CompletedRunsFile;
      for (const entry of Object.values(parsed.completedRuns ?? {})) {
        this.completedRuns.set(entry.issueId, entry);
      }
    } catch (error) {
      this.logger.warn('completed_runs.load_failed', {
        path: nextPath,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  private writeCompletedRuns(): void {
    if (!this.completedRunsPath) {
      return;
    }

    ensureDir(path.dirname(this.completedRunsPath));
    const payload: CompletedRunsFile = {
      completedRuns: Object.fromEntries(
        [...this.completedRuns.entries()].map(([issueId, entry]) => [issueId, entry]),
      ),
    };
    fs.writeFileSync(this.completedRunsPath, `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
  }

  private markIssueCompleted(issue: Issue): void {
    const entry: CompletedRunEntry = {
      issueId: issue.id,
      identifier: issue.identifier,
      fingerprint: buildIssueDispatchFingerprint(issue),
      completedAt: new Date().toISOString(),
    };
    this.completedRuns.set(issue.id, entry);
    this.writeCompletedRuns();
  }

  private clearCompletedIssue(issueId: string): void {
    if (!this.completedRuns.delete(issueId)) {
      return;
    }
    this.writeCompletedRuns();
  }

  private async cleanupTerminalWorkspaces(
    workflow: LoadedWorkflow,
    tracker: LinearTracker,
    workspaceManager: WorkspaceManager,
  ): Promise<void> {
    const terminalIssues = await tracker.listTerminalIssues(
      workflow.config.tracker.projectSlug,
      workflow.config.tracker.terminalStates,
    );

    for (const issue of terminalIssues) {
      await workspaceManager.removeWorkspace(issue.identifier);
      this.retries.delete(issue.id);
      this.clearCompletedIssue(issue.id);
    }
  }

  private scheduleRetry(workflow: LoadedWorkflow, issue: Issue, attempt: number, error: string | null): void {
    const delay = computeRetryDelay(workflow, attempt);
    this.retries.set(issue.id, {
      issueId: issue.id,
      identifier: issue.identifier,
      attempt,
      dueAtMs: Date.now() + delay,
      error,
    });
    this.logger.warn('issue.retry_scheduled', {
      issue: issue.identifier,
      attempt,
      delayMs: delay,
      error,
    });
  }

  private canDispatch(issue: Issue): { allowed: boolean; attempt: number } {
    if (this.running.has(issue.id)) {
      return { allowed: false, attempt: 0 };
    }

    const retry = this.retries.get(issue.id);
    if (!retry) {
      return { allowed: true, attempt: 0 };
    }

    if (retry.dueAtMs > Date.now()) {
      return { allowed: false, attempt: retry.attempt };
    }

    return { allowed: true, attempt: retry.attempt };
  }

  private async persistWorkpad(
    tracker: LinearTracker,
    issue: Issue,
    snapshot: WorkpadSnapshot,
    attempt: number,
    workspacePath: string,
    workflow: LoadedWorkflow,
  ): Promise<void> {
    const body = renderWorkpad(issue, snapshot, {
      runtimeRevision: workflow.runtimeRevision,
      attempt,
      workspacePath,
    });
    const comment = await tracker.upsertWorkpadComment(issue.id, body);
    this.logger.info('linear.workpad_upserted', {
      issue: issue.identifier,
      commentId: comment.id,
      status: snapshot.status,
    });
  }

  private async runLifecycleHook(
    hook: string | null,
    workflow: LoadedWorkflow,
    issue: Issue,
    workspacePath: string,
    extraEnv: Record<string, string>,
    logEvent: string,
  ): Promise<void> {
    if (!hook) {
      return;
    }

    this.logger.info(logEvent, { issue: issue.identifier, workspacePath });
    await runHook(hook, workspacePath, {
      ...process.env,
      ISSUE_ID: issue.id,
      ISSUE_IDENTIFIER: issue.identifier,
      ISSUE_TITLE: issue.title,
      ISSUE_URL: issue.url ?? '',
      ISSUE_STATE: issue.state,
      WORKSPACE_PATH: workspacePath,
      ...extraEnv,
    }, workflow.config.hooks.timeoutMs);
  }

  private async maybeMoveIssueToState(
    tracker: LinearTracker,
    issue: Issue,
    desiredState: string | null | undefined,
  ): Promise<Issue> {
    const normalized = desiredState?.trim();
    if (!normalized || normalized === issue.state) {
      return issue;
    }
    const updated = await tracker.moveIssueToState(issue, normalized);
    this.logger.info('linear.issue_state_target_applied', {
      issue: issue.identifier,
      from: issue.state,
      to: normalized,
    });
    return updated;
  }

  private async syncOriginalIssue(
    tracker: LinearTracker,
    currentIssue: Issue,
    handoff: HandoffReport,
    workflow: LoadedWorkflow,
    workspacePath: string,
    attempt: number,
    fallbackOriginalIssueIdentifier: string | null,
  ): Promise<void> {
    const originalIssueIdentifier = handoff.originalIssueIdentifier ?? fallbackOriginalIssueIdentifier;
    if (!originalIssueIdentifier || originalIssueIdentifier === currentIssue.identifier) {
      return;
    }

    const originalIssue = await tracker.getIssueByIdentifier(originalIssueIdentifier);
    if (!originalIssue) {
      this.logger.warn('linear.original_issue_missing', {
        issue: currentIssue.identifier,
        originalIssueIdentifier,
      });
      return;
    }

    const existing = await tracker.getWorkpadComment(originalIssue.id);
    const snapshot = existing ? parseWorkpadSnapshot(existing.body) : createEmptyWorkpadSnapshot();
    const detailLines = [
      `Review follow-up ${currentIssue.identifier} reached merge-ready state.`,
      handoff.summary,
    ];
    if (handoff.validation) {
      detailLines.push(`Validation rerun:\n${handoff.validation}`);
    }
    if (handoff.prUrl) {
      detailLines.push(`PR: ${handoff.prUrl}`);
    }
    snapshot.notes = [snapshot.notes, ...detailLines].filter(Boolean).join('\n\n').trim();
    snapshot.summary = handoff.summary;
    snapshot.status = handoff.status ?? 'ready for merging';
    snapshot.prUrl = handoff.prUrl ?? snapshot.prUrl;
    snapshot.validation = handoff.validation ?? snapshot.validation;
      await this.persistWorkpad(tracker, originalIssue, snapshot, attempt, workspacePath, workflow);

    if ((handoff.desiredState ?? '').trim() === 'Merging') {
      await this.maybeMoveIssueToState(tracker, originalIssue, 'Merging');
      this.logger.info('linear.original_issue_synced', {
        issue: currentIssue.identifier,
        originalIssue: originalIssue.identifier,
      });
    }
  }

  private async claimIssueIfNeeded(tracker: LinearTracker, issue: Issue): Promise<Issue> {
    if (issue.state !== 'Todo' && issue.state !== 'Rework') {
      return issue;
    }
    const claimed = await tracker.moveIssueToState(issue, 'In Progress');
    this.logger.info('linear.issue_claimed', {
      issue: issue.identifier,
      from: issue.state,
      to: claimed.state,
    });
    return claimed;
  }

  private async launchIssue(
    workflow: LoadedWorkflow,
    tracker: LinearTracker,
    workspaceManager: WorkspaceManager,
    issue: Issue,
    attempt: number,
  ): Promise<void> {
    const abortController = new AbortController();
    this.running.set(issue.id, { issue, attempt, abortController });
    this.retries.delete(issue.id);

    let activeIssue = issue;
    let workspacePath = '';
    let snapshot: WorkpadSnapshot = createEmptyWorkpadSnapshot();
    let handoff: HandoffReport | null = null;
    const originalIssueIdentifier = extractOriginalIssueIdentifier(issue.description);

    try {
      activeIssue = await this.claimIssueIfNeeded(tracker, issue);
      this.running.set(issue.id, { issue: activeIssue, attempt, abortController });

      const workspace = await workspaceManager.ensureWorkspace(activeIssue);
      workspacePath = workspace.path;
      const existingWorkpad = await tracker.getWorkpadComment(activeIssue.id);
      snapshot = existingWorkpad ? parseWorkpadSnapshot(existingWorkpad.body) : createEmptyWorkpadSnapshot();
      snapshot.status = 'running';
      snapshot.error = null;
      await this.persistWorkpad(tracker, activeIssue, snapshot, attempt, workspace.path, workflow);
      await this.runLifecycleHook(
        workflow.config.hooks.beforeRun,
        workflow,
        activeIssue,
        workspace.path,
        { RUN_ATTEMPT: String(attempt + 1) },
        'issue.before_run',
      );

      this.logger.info('issue.run_started', {
        issue: activeIssue.identifier,
        attempt,
        workspacePath: workspace.path,
        blockedBy: activeIssue.blocked_by_summary,
      });

      const runner = new AgentRunner(workflow, this.logger, {
        onProgress: async (report: ProgressReport) => {
          snapshot = mergeProgressReport(snapshot, report);
          await this.persistWorkpad(tracker, activeIssue, snapshot, attempt, workspace.path, workflow);
        },
        onHandoff: async (report: HandoffReport) => {
          handoff = report;
          snapshot = mergeHandoffReport(snapshot, report);
          await this.persistWorkpad(tracker, activeIssue, snapshot, attempt, workspace.path, workflow);
        },
      });

      const result = await runner.run(activeIssue, workspace, attempt, abortController.signal);
      const handoffReport = handoff as HandoffReport | null;
      snapshot.status = handoffReport?.status ?? result.status;
      if (result.error) {
        snapshot.error = result.error;
      }
      if (!handoffReport?.summary && result.finalMessage) {
        snapshot.summary = result.finalMessage;
      }

      if (handoffReport?.prUrl) {
        await tracker.attachGitHubPr(activeIssue.id, handoffReport.prUrl, handoffReport.summary);
        this.logger.info('linear.pr_attached', {
          issue: activeIssue.identifier,
          prUrl: handoffReport.prUrl,
        });
      }

      if (handoffReport) {
        const linkedOriginalIssueIdentifier = handoffReport.originalIssueIdentifier ?? originalIssueIdentifier;
        await this.syncOriginalIssue(
          tracker,
          activeIssue,
          handoffReport,
          workflow,
          workspace.path,
          attempt,
          originalIssueIdentifier,
        );
        if (linkedOriginalIssueIdentifier && linkedOriginalIssueIdentifier !== activeIssue.identifier && (handoffReport.desiredState ?? '').trim() === 'Merging') {
          activeIssue = await this.maybeMoveIssueToState(tracker, activeIssue, 'Done');
        } else {
          activeIssue = await this.maybeMoveIssueToState(tracker, activeIssue, handoffReport.desiredState);
        }
      }

      await this.persistWorkpad(tracker, activeIssue, snapshot, attempt, workspace.path, workflow);
      await this.runLifecycleHook(
        workflow.config.hooks.afterRun,
        workflow,
        activeIssue,
        workspace.path,
        {
          RUN_ATTEMPT: String(attempt + 1),
          RUN_STATUS: result.status,
          RUN_THREAD_ID: result.threadId,
          RUN_TURN_ID: result.turnId,
          RUN_ERROR: result.error ?? '',
        },
        'issue.after_run',
      );

      this.logger.info('issue.run_completed', {
        issue: activeIssue.identifier,
        attempt,
        status: result.status,
        threadId: result.threadId,
        turnId: result.turnId,
        error: result.error ?? null,
      });

      if (result.status !== 'completed') {
        this.scheduleRetry(workflow, activeIssue, attempt + 1, result.error ?? null);
      } else {
        this.markIssueCompleted(activeIssue);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      snapshot.status = 'failed';
      snapshot.error = message;
      if (workspacePath) {
        try {
          await this.persistWorkpad(tracker, activeIssue, snapshot, attempt, workspacePath, workflow);
        } catch (persistError) {
          this.logger.error('linear.workpad_persist_failed', {
            issue: activeIssue.identifier,
            error: persistError instanceof Error ? persistError.message : String(persistError),
          });
        }
      }
      this.logger.error('issue.run_failed', {
        issue: activeIssue.identifier,
        attempt,
        error: message,
      });
      this.scheduleRetry(workflow, activeIssue, attempt + 1, message);
    } finally {
      this.running.delete(issue.id);
    }
  }

  async start(): Promise<void> {
    while (!this.stopped) {
      const workflow = this.workflowStore.reloadIfChanged();
      this.loadCompletedRuns(workflow);
      const tracker = new LinearTracker(
        workflow.config.tracker.apiKey,
        this.logger,
        workflow.config.tracker.endpoint,
      );
      const workspaceManager = new WorkspaceManager(workflow.config, this.logger);

      try {
        await this.cleanupTerminalWorkspaces(workflow, tracker, workspaceManager);
        const issues = await tracker.listActiveIssues(
          workflow.config.tracker.projectSlug,
          workflow.config.tracker.activeStates,
        );

        const activeIssueIds = new Set(issues.map((issue) => issue.id));
        for (const [issueId, running] of this.running.entries()) {
          if (!activeIssueIds.has(issueId)) {
            this.logger.warn('issue.no_longer_active', { issue: running.issue.identifier });
            running.abortController.abort();
          }
        }

        const runningByState = new Map<string, number>();
        for (const running of this.running.values()) {
          runningByState.set(running.issue.state, (runningByState.get(running.issue.state) ?? 0) + 1);
        }

        let availableSlots = workflow.config.agent.maxConcurrentAgents - this.running.size;
        for (const issue of issues) {
          if (availableSlots <= 0) {
            break;
          }

          const stateLimit = workflow.config.agent.maxConcurrentAgentsByState[issue.state];
          const runningCountForState = runningByState.get(issue.state) ?? 0;
          if (stateLimit && runningCountForState >= stateLimit) {
            continue;
          }

          const completed = this.completedRuns.get(issue.id);
          const fingerprint = buildIssueDispatchFingerprint(issue);
          if (completed && completed.fingerprint === fingerprint) {
            continue;
          }
          if (completed && completed.fingerprint !== fingerprint) {
            this.clearCompletedIssue(issue.id);
          }

          const gate = this.canDispatch(issue);
          if (!gate.allowed) {
            continue;
          }

          availableSlots -= 1;
          runningByState.set(issue.state, runningCountForState + 1);
          void this.launchIssue(workflow, tracker, workspaceManager, issue, gate.attempt);
        }
      } catch (error) {
        this.logger.error('service.poll_failed', {
          error: error instanceof Error ? error.message : String(error),
        });
      }

      await sleep(this.workflowStore.get().config.polling.intervalMs);
    }
  }
}
