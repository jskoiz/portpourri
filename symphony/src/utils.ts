import fs from 'node:fs';
import path from 'node:path';
import { spawn } from 'node:child_process';
import { execFileSync } from 'node:child_process';
import { setTimeout as sleepTimeout } from 'node:timers/promises';

export function sleep(ms: number): Promise<void> {
  return sleepTimeout(ms).then(() => undefined);
}

export function ensureDir(dirPath: string): void {
  fs.mkdirSync(dirPath, { recursive: true });
}

export function sanitizeWorkspaceKey(identifier: string): string {
  return identifier.replace(/[^A-Za-z0-9._-]+/g, '-');
}

export function resolveMaybeEnv(value: unknown, env: NodeJS.ProcessEnv): string | null {
  if (typeof value !== 'string' || value.length === 0) {
    return null;
  }
  if (value.startsWith('$')) {
    return env[value.slice(1)] ?? null;
  }
  return value;
}

export function resolvePathValue(value: unknown, baseDir: string, env: NodeJS.ProcessEnv): string | null {
  const resolved = resolveMaybeEnv(value, env);
  if (!resolved) {
    return null;
  }
  const expanded = resolved.startsWith('~/')
    ? path.join(env.HOME ?? '', resolved.slice(2))
    : resolved;
  return path.isAbsolute(expanded) ? expanded : path.resolve(baseDir, expanded);
}

export function coerceStringArray(value: unknown, fallback: string[]): string[] {
  if (!Array.isArray(value)) {
    return fallback;
  }
  return value.filter((entry): entry is string => typeof entry === 'string');
}

export async function runHook(
  script: string,
  cwd: string,
  env: NodeJS.ProcessEnv,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn(script, {
      cwd,
      env,
      shell: true,
      stdio: 'inherit',
    });
    child.once('error', reject);
    child.once('exit', (code, signal) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`Hook failed with code ${code ?? 'null'} signal ${signal ?? 'null'}`));
    });
  });
}

export function shallowEqualStringArrays(a: string[], b: string[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  return a.every((value, index) => value === b[index]);
}

export function resolveGitRevision(cwd: string): string | null {
  try {
    const value = execFileSync('git', ['-C', cwd, 'rev-parse', 'HEAD'], {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim();
    return value || null;
  } catch {
    return null;
  }
}
