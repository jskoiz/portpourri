#!/usr/bin/env node
/**
 * Runs workspace checks (backend, mobile, symphony) in parallel.
 * Streams output with workspace prefixes. Exits non-zero if any workspace fails.
 */
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';

export const workspaceChecks = Object.freeze([
  { name: 'backend', command: 'npm run check:backend' },
  { name: 'mobile', command: 'npm run check:mobile' },
  { name: 'symphony', command: 'npm run check:symphony' },
]);

const scriptPath = fileURLToPath(import.meta.url);

function prefixStream(stream, prefix) {
  let buffer = '';
  stream.on('data', (chunk) => {
    buffer += chunk.toString();
    const lines = buffer.split('\n');
    buffer = lines.pop();
    for (const line of lines) {
      process.stdout.write(`[${prefix}] ${line}\n`);
    }
  });
  stream.on('end', () => {
    if (buffer) process.stdout.write(`[${prefix}] ${buffer}\n`);
  });
}

export async function runWorkspaceChecks({
  workspaces = workspaceChecks,
  cwd = process.cwd(),
  prefixOutput = true,
} = {}) {
  const results = await Promise.all(
    workspaces.map(
      ({ name, command }) =>
        new Promise((resolve) => {
          const startedAt = new Date().toISOString();
          const startedMs = Date.now();
          const child = spawn('bash', ['-lc', command], {
            cwd,
            env: { ...process.env, FORCE_COLOR: '1' },
          });
          let resolved = false;
          const finish = (exitCode) => {
            if (resolved) {
              return;
            }
            resolved = true;
            resolve({
              name,
              command,
              startedAt,
              completedAt: new Date().toISOString(),
              durationMs: Date.now() - startedMs,
              exitCode,
              status: exitCode === 0 ? 'passed' : 'failed',
            });
          };

          if (prefixOutput) {
            prefixStream(child.stdout, name);
            prefixStream(child.stderr, name);
          } else {
            child.stdout.pipe(process.stdout);
            child.stderr.pipe(process.stderr);
          }

          child.on('error', () => finish(1));
          child.on('close', (code) => finish(code ?? 1));
        }),
    ),
  );

  return results;
}

async function main() {
  const results = await runWorkspaceChecks();
  const failed = results.filter((result) => result.exitCode !== 0);

  if (failed.length > 0) {
    console.error(
      `\n✗ ${failed.length} workspace(s) failed: ${failed
        .map((result) => `${result.name} failed with exit code ${result.exitCode}`)
        .join(', ')}`,
    );
    process.exit(1);
  }

  console.log('\n✓ All workspace checks passed');
}

if (process.argv[1] === scriptPath) {
  void main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
