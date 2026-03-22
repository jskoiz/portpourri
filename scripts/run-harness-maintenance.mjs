import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { collectHarnessHistory, isGhAvailable, summarizeHarnessHistory } from './harness-github.mjs';
import { ensureDir, repoRoot, writeJsonFile, writeTextFile } from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const options = {
    artifactsDir: 'artifacts/harness/maintenance',
    reportJson: 'artifacts/harness/maintenance/harness-maintenance-report.json',
    reportMarkdown: 'artifacts/harness/maintenance/harness-maintenance-report.md',
    historyLimit: 10,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--artifacts-dir') {
      options.artifactsDir = argv[index + 1] ?? options.artifactsDir;
      index += 1;
    } else if (argument === '--report-json') {
      options.reportJson = argv[index + 1] ?? options.reportJson;
      index += 1;
    } else if (argument === '--report-markdown') {
      options.reportMarkdown = argv[index + 1] ?? options.reportMarkdown;
      index += 1;
    } else if (argument === '--history-limit') {
      options.historyLimit = Number.parseInt(argv[index + 1] ?? '10', 10);
      index += 1;
    }
  }

  return options;
}

function runCommand(command, { required, title, category }) {
  const startedAt = new Date().toISOString();
  const startTime = Date.now();
  const result = spawnSync('bash', ['-lc', command], {
    cwd: repoRoot,
    encoding: 'utf8',
  });
  const durationMs = Date.now() - startTime;
  return {
    title,
    command,
    category,
    required,
    startedAt,
    completedAt: new Date().toISOString(),
    durationMs,
    exitCode: result.status ?? 1,
    status: result.status === 0 ? 'passed' : 'failed',
    output: `${result.stdout ?? ''}${result.stderr ?? ''}`.trim(),
  };
}

function classifyFindings(results) {
  const autoFixable = [];
  const reviewRequired = [];

  for (const result of results) {
    if (result.title === 'Repo index sync' && result.status === 'failed') {
      autoFixable.push({
        id: 'repo_index_drift',
        label: 'Generated repo index drift',
        fixCommand: 'npm run repo:index',
      });
      continue;
    }

    if (result.required && result.status === 'failed') {
      reviewRequired.push({
        id: result.title.toLowerCase().replace(/\s+/g, '_'),
        label: result.title,
        detail: result.output || 'Command failed without output.',
      });
      continue;
    }

    if (!result.required && result.output) {
      reviewRequired.push({
        id: result.title.toLowerCase().replace(/\s+/g, '_'),
        label: result.title,
        detail: result.output,
      });
    }
  }

  return { autoFixable, reviewRequired };
}

function buildHarnessScore(results, reviewRequired) {
  let score = 100;

  for (const result of results) {
    if (result.status !== 'failed') {
      continue;
    }

    if (result.title === 'Full check') {
      score -= 35;
    } else if (result.title === 'Smoke') {
      score -= 35;
    } else if (result.title === 'Docs check') {
      score -= 10;
    } else if (result.title === 'Policy audit') {
      score -= 10;
    } else if (result.title === 'Repo index sync') {
      score -= 5;
    }
  }

  score -= Math.min(15, reviewRequired.length * 3);
  score = Math.max(0, score);

  const grade = score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F';
  return { score, grade };
}

function renderMarkdownReport(report) {
  const lines = [
    '# Harness maintenance report',
    '',
    `- Generated: ${report.generatedAt}`,
    `- Ref: ${report.ref}`,
    `- Harness score: ${report.score.grade} (${report.score.score})`,
    '',
    '## Required checks',
  ];

  for (const result of report.results.filter((item) => item.required)) {
    lines.push(`- ${result.title}: ${result.status} (${result.durationMs}ms)`);
  }

  lines.push('');
  lines.push('## Auto-fixable findings');
  if (report.auto_fixable.length === 0) {
    lines.push('- none');
  } else {
    for (const finding of report.auto_fixable) {
      lines.push(`- ${finding.label}: ${finding.fixCommand}`);
    }
  }

  lines.push('');
  lines.push('## Review-required findings');
  if (report.review_required.length === 0) {
    lines.push('- none');
  } else {
    for (const finding of report.review_required) {
      lines.push(`- ${finding.label}`);
    }
  }

  lines.push('');
  lines.push('## Recent harness history');
  lines.push(`- Entries: ${report.history.totalEntries}`);
  for (const item of report.history.failureCategories.slice(0, 5)) {
    lines.push(`- ${item.name}: ${item.count}`);
  }

  lines.push('');
  return `${lines.join('\n')}\n`;
}

function writeSummary(reportMarkdownPath) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  fs.writeFileSync(process.env.GITHUB_STEP_SUMMARY, fs.readFileSync(reportMarkdownPath, 'utf8'));
}

function loadHarnessHistory(limit) {
  if (!isGhAvailable()) {
    return summarizeHarnessHistory([]);
  }

  try {
    return summarizeHarnessHistory(collectHarnessHistory({ branch: 'main', limit }));
  } catch (error) {
    console.warn(`Skipping remote harness history: ${error.message}`);
    return summarizeHarnessHistory([]);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const absoluteArtifactsDir = path.resolve(repoRoot, options.artifactsDir);
  ensureDir(absoluteArtifactsDir);

  const results = [
    runCommand('npm run check', { required: true, title: 'Full check', category: 'maintenance audit' }),
    runCommand('npm run docs:check', { required: true, title: 'Docs check', category: 'docs drift' }),
    runCommand('node ./scripts/check-repo-policies.mjs --audit', { required: true, title: 'Policy audit', category: 'maintenance audit' }),
    runCommand('npm run repo:index:check', { required: true, title: 'Repo index sync', category: 'maintenance audit' }),
    runCommand('node ./scripts/scan-todo-markers.mjs', {
      required: false,
      title: 'TODO scan',
      category: 'maintenance audit',
    }),
    runCommand('npm --prefix backend outdated || true', {
      required: false,
      title: 'Backend outdated',
      category: 'maintenance audit',
    }),
    runCommand('npm --prefix mobile outdated || true', {
      required: false,
      title: 'Mobile outdated',
      category: 'maintenance audit',
    }),
  ];

  const history = loadHarnessHistory(options.historyLimit);
  const findings = classifyFindings(results);
  const score = buildHarnessScore(results, findings.reviewRequired);

  const report = {
    schemaVersion: 1,
    generatedAt: new Date().toISOString(),
    ref: process.env.GITHUB_SHA ?? 'local',
    results,
    auto_fixable: findings.autoFixable,
    review_required: findings.reviewRequired,
    history,
    score,
  };

  const scorePath = path.join(absoluteArtifactsDir, 'harness-score.json');
  const historyPath = path.join(absoluteArtifactsDir, 'harness-history.json');
  const reportJsonPath = path.resolve(repoRoot, options.reportJson);
  const reportMarkdownPath = path.resolve(repoRoot, options.reportMarkdown);

  writeJsonFile(reportJsonPath, report);
  writeJsonFile(scorePath, score);
  writeJsonFile(historyPath, history);
  writeTextFile(reportMarkdownPath, renderMarkdownReport(report));
  writeSummary(reportMarkdownPath);

  const hasRequiredFailures = results.some((result) => result.required && result.status === 'failed');
  process.exit(hasRequiredFailures ? 1 : 0);
}

if (process.argv[1] === scriptPath) {
  main();
}
