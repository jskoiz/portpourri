import path from 'node:path';
import { AppServerClient } from './codex/app-server.js';
import { dynamicToolSpecs, executeDynamicTool } from './codex/dynamic-tool.js';
import { buildCommandApprovalResponse, buildFileChangeApprovalResponse, buildPermissionsApprovalResponse, throwOnInteractiveRequest } from './policy.js';
import { renderPrompt } from './workflow.js';
import type { Issue, LoadedWorkflow, Logger, RunResult, Workspace } from './types.js';
import { AppServerError, UserInputRequiredError } from './errors.js';

interface ItemCompletedNotification {
  method: 'item/completed';
  params: {
    item: {
      type: string;
      text?: string;
      phase?: string | null;
    };
    threadId: string;
    turnId: string;
  };
}

interface TurnCompletedNotification {
  method: 'turn/completed';
  params: {
    threadId: string;
    turn: {
      id: string;
      status: 'completed' | 'failed' | 'interrupted' | 'inProgress';
      error: { message: string } | null;
    };
  };
}

export class AgentRunner {
  constructor(
    private readonly workflow: LoadedWorkflow,
    private readonly logger: Logger,
  ) {}

  async run(issue: Issue, workspace: Workspace, attempt: number, abortSignal?: AbortSignal): Promise<RunResult> {
    const prompt = renderPrompt(this.workflow.document.promptTemplate, issue, attempt);
    const turnSandboxPolicy = this.workflow.config.codex.turnSandboxPolicy
      ? {
          ...this.workflow.config.codex.turnSandboxPolicy,
          writableRoots: [
            workspace.path,
            path.resolve(workspace.path, '.git'),
          ],
        }
      : null;

    let threadId = '';
    let turnId = '';
    let finalMessage: string | null = null;
    let completedResolve!: (value: RunResult) => void;
    let completedReject!: (error: Error) => void;
    const completed = new Promise<RunResult>((resolve, reject) => {
      completedResolve = resolve;
      completedReject = reject;
    });

    const client = new AppServerClient(
      this.workflow.config.codex.command,
      workspace.path,
      this.logger,
      async (request) => {
        switch (request.method) {
          case 'item/commandExecution/requestApproval':
            return buildCommandApprovalResponse();
          case 'item/fileChange/requestApproval':
            return buildFileChangeApprovalResponse();
          case 'item/permissions/requestApproval':
            return buildPermissionsApprovalResponse();
          case 'item/tool/requestUserInput':
          case 'mcpServer/elicitation/request':
            throwOnInteractiveRequest(request.method, this.logger);
          case 'item/tool/call':
            return executeDynamicTool(
              String((request.params as { tool?: unknown } | undefined)?.tool ?? ''),
              (request.params as { arguments?: unknown } | undefined)?.arguments,
              {
                linearApiKey: this.workflow.config.tracker.apiKey,
                logger: this.logger,
              },
            );
          case 'account/chatgptAuthTokens/refresh':
            throw new AppServerError('ChatGPT token refresh is not supported by this Symphony build.');
          default:
            throw new AppServerError(`Unsupported app-server request method: ${request.method}`);
        }
      },
      (notification) => {
        if (notification.method === 'item/completed') {
          const payload = notification as ItemCompletedNotification;
          if (payload.params.item.type === 'agentMessage' && payload.params.item.phase === 'final_answer') {
            finalMessage = payload.params.item.text ?? finalMessage;
          }
          return;
        }
        if (notification.method === 'turn/completed') {
          const payload = notification as TurnCompletedNotification;
          turnId = payload.params.turn.id;
          threadId = payload.params.threadId;
          if (payload.params.turn.status === 'completed') {
            completedResolve({
              status: 'completed',
              threadId,
              turnId,
              finalMessage,
            });
            return;
          }
          if (payload.params.turn.status === 'interrupted') {
            completedResolve({
              status: 'interrupted',
              threadId,
              turnId,
              finalMessage,
              error: payload.params.turn.error?.message,
            });
            return;
          }
          completedResolve({
            status: 'failed',
            threadId,
            turnId,
            finalMessage,
            error: payload.params.turn.error?.message ?? 'Turn failed.',
          });
        }
      },
    );

    const abortHandler = () => {
      completedReject(new AppServerError(`Agent run for ${issue.identifier} was aborted.`));
    };
    abortSignal?.addEventListener('abort', abortHandler, { once: true });

    try {
      await client.request('initialize', {
        clientInfo: { name: 'brdg-symphony', version: '0.1.0' },
        capabilities: { experimentalApi: true },
      });
      client.notify('initialized');

      const threadStart = await client.request<{
        thread: { id: string };
      }>('thread/start', {
        cwd: workspace.path,
        approvalPolicy: this.workflow.config.codex.approvalPolicy,
        sandbox: this.workflow.config.codex.threadSandbox,
        personality: this.workflow.config.codex.personality,
        model: this.workflow.config.codex.model,
        config: this.workflow.config.codex.config,
        serviceName: 'brdg-symphony',
        dynamicTools: dynamicToolSpecs(),
        experimentalRawEvents: false,
        persistExtendedHistory: false,
      });

      threadId = threadStart.thread.id;
      const turnStart = await client.request<{ turn: { id: string } }>('turn/start', {
        threadId,
        sandboxPolicy: turnSandboxPolicy,
        input: [{ type: 'text', text: prompt }],
      });
      turnId = turnStart.turn.id;

      const result = await completed;
      return result;
    } catch (error) {
      if (error instanceof UserInputRequiredError) {
        return {
          status: 'failed',
          threadId,
          turnId,
          finalMessage,
          error: error.message,
        };
      }
      throw error;
    } finally {
      abortSignal?.removeEventListener('abort', abortHandler);
      await client.close();
    }
  }
}
