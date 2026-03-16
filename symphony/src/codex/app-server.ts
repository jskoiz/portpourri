import { spawn, type ChildProcessWithoutNullStreams } from 'node:child_process';
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline';
import type { Logger } from '../types.js';
import { AppServerError } from '../errors.js';

type JsonRpcId = string;

interface JsonRpcRequest {
  id: JsonRpcId;
  method: string;
  params?: unknown;
}

interface JsonRpcResponse {
  id: JsonRpcId;
  result?: unknown;
  error?: { message?: string };
}

interface JsonRpcNotification {
  method: string;
  params?: unknown;
}

type JsonRpcMessage = JsonRpcRequest | JsonRpcResponse | JsonRpcNotification;

function isResponse(message: JsonRpcMessage): message is JsonRpcResponse {
  return 'id' in message && ('result' in message || 'error' in message) && !('method' in message);
}

function isRequest(message: JsonRpcMessage): message is JsonRpcRequest {
  return 'id' in message && 'method' in message;
}

function isNotification(message: JsonRpcMessage): message is JsonRpcNotification {
  return 'method' in message && !('id' in message);
}

export class AppServerClient {
  private readonly child: ChildProcessWithoutNullStreams;
  private readonly pending = new Map<JsonRpcId, { resolve: (value: unknown) => void; reject: (error: Error) => void }>();
  private readonly closePromise: Promise<void>;
  private readonly closeResolve: () => void;

  constructor(
    command: string,
    cwd: string,
    private readonly logger: Logger,
    private readonly onRequest: (request: JsonRpcRequest) => Promise<unknown>,
    private readonly onNotification: (notification: JsonRpcNotification) => void,
  ) {
    this.child = spawn(command, {
      cwd,
      env: process.env,
      shell: true,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let resolveClose!: () => void;
    this.closePromise = new Promise<void>((resolve) => {
      resolveClose = resolve;
    });
    this.closeResolve = resolveClose;

    createInterface({ input: this.child.stdout }).on('line', (line) => {
      if (!line.trim()) {
        return;
      }
      this.handleMessage(line).catch((error) => {
        this.logger.error('app_server.message_error', { error: error instanceof Error ? error.message : String(error) });
      });
    });

    createInterface({ input: this.child.stderr }).on('line', (line) => {
      this.logger.warn('app_server.stderr', { line });
    });

    this.child.once('exit', (code, signal) => {
      const error = new AppServerError(`codex app-server exited with code ${code ?? 'null'} signal ${signal ?? 'null'}`);
      for (const pending of this.pending.values()) {
        pending.reject(error);
      }
      this.pending.clear();
      this.closeResolve();
    });
  }

  private async handleMessage(line: string): Promise<void> {
    const message = JSON.parse(line) as JsonRpcMessage;
    if (isResponse(message)) {
      const pending = this.pending.get(String(message.id));
      if (!pending) {
        return;
      }
      this.pending.delete(String(message.id));
      if (message.error) {
        pending.reject(new AppServerError(message.error.message ?? 'Unknown app-server error.'));
        return;
      }
      pending.resolve(message.result);
      return;
    }

    if (isRequest(message)) {
      const result = await this.onRequest(message);
      this.write({ id: message.id, result });
      return;
    }

    if (isNotification(message)) {
      this.onNotification(message);
    }
  }

  private write(payload: Record<string, unknown>): void {
    this.child.stdin.write(`${JSON.stringify(payload)}\n`);
  }

  async request<T>(method: string, params?: unknown): Promise<T> {
    const id = randomUUID();
    const resultPromise = new Promise<T>((resolve, reject) => {
      this.pending.set(id, { resolve: resolve as (value: unknown) => void, reject });
    });
    this.write({ id, method, params });
    return resultPromise;
  }

  notify(method: string, params?: unknown): void {
    if (params === undefined) {
      this.write({ method });
      return;
    }
    this.write({ method, params });
  }

  async close(): Promise<void> {
    if (!this.child.killed) {
      this.child.kill('SIGTERM');
    }
    await this.closePromise;
  }
}
