import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { spawnSync } from 'node:child_process';
import { repoRoot } from './harness-shared.mjs';

function runGh(args, { allowFailure = false } = {}) {
  const result = spawnSync('gh', args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });

  if (result.status !== 0 && !allowFailure) {
    const detail = result.stderr.trim() || result.stdout.trim() || `gh ${args.join(' ')} failed`;
    throw new Error(detail);
  }

  return result;
}

export function isGhAvailable() {
  const result = spawnSync('gh', ['--version'], {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
  return result.status === 0;
}

export function resolveBranchFromPr(prNumber) {
  const result = runGh(['pr', 'view', String(prNumber), '--json', 'headRefName']);
  return JSON.parse(result.stdout).headRefName;
}

export function listHarnessRuns({ branch, limit = 10 } = {}) {
  const args = [
    'run',
    'list',
    '--limit',
    String(limit),
    '--json',
    'databaseId,workflowName,status,conclusion,headSha,event,displayTitle,createdAt,url,headBranch',
  ];
  if (branch) {
    args.splice(2, 0, '--branch', branch);
  }

  const result = runGh(args);
  return JSON.parse(result.stdout);
}

function walkFiles(rootDir) {
  if (!fs.existsSync(rootDir)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
    const absolutePath = path.join(rootDir, entry.name);
    if (entry.isDirectory()) {
      results.push(...walkFiles(absolutePath));
      continue;
    }

    results.push(absolutePath);
  }

  return results;
}

export function downloadRunArtifacts(runId) {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), `brdg-harness-${runId}-`));
  const result = runGh(['run', 'download', String(runId), '--dir', tempDir], { allowFailure: true });
  if (result.status !== 0) {
    return null;
  }

  return tempDir;
}

export function loadHarnessArtifacts(artifactsDir) {
  const artifacts = {
    plan: null,
    results: null,
    failureSummary: null,
    historyEntries: [],
  };
  const supportedFiles = new Set([
    'harness-plan.json',
    'harness-results.json',
    'harness-failure-summary.json',
    'harness-history-entry.json',
  ]);

  for (const absolutePath of walkFiles(artifactsDir)) {
    const fileName = path.basename(absolutePath);
    if (!supportedFiles.has(fileName)) {
      continue;
    }

    const content = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    if (fileName === 'harness-plan.json') {
      artifacts.plan = content;
    } else if (fileName === 'harness-results.json') {
      artifacts.results = content;
    } else if (fileName === 'harness-failure-summary.json') {
      artifacts.failureSummary = content;
    } else if (fileName === 'harness-history-entry.json') {
      artifacts.historyEntries.push(content);
    }
  }

  return artifacts;
}

export function collectHarnessHistory({ branch, limit = 10 } = {}) {
  const runs = listHarnessRuns({ branch, limit })
    .filter((run) => run.conclusion || run.status === 'completed');

  const entries = [];
  for (const run of runs) {
    const artifactDir = downloadRunArtifacts(run.databaseId);
    if (!artifactDir) {
      continue;
    }

    const artifacts = loadHarnessArtifacts(artifactDir);
    for (const entry of artifacts.historyEntries) {
      entries.push({
        ...entry,
        runId: run.databaseId,
        workflowName: run.workflowName,
        url: run.url,
      });
    }
  }

  return entries;
}

export function summarizeHarnessHistory(entries) {
  const failureCategories = new Map();
  const failedCommands = new Map();

  for (const entry of entries) {
    if (entry.failureCategory) {
      failureCategories.set(entry.failureCategory, (failureCategories.get(entry.failureCategory) ?? 0) + 1);
    }

    for (const command of entry.failedCommands ?? []) {
      failedCommands.set(command, (failedCommands.get(command) ?? 0) + 1);
    }
  }

  return {
    totalEntries: entries.length,
    failureCategories: [...failureCategories.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name)),
    failedCommands: [...failedCommands.entries()]
      .map(([name, count]) => ({ name, count }))
      .sort((left, right) => right.count - left.count || left.name.localeCompare(right.name)),
  };
}
