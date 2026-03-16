import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(result.stderr.trim() || result.stdout.trim() || `${command} ${args.join(' ')} failed`);
  }
  return result;
}

function parseArgs(argv) {
  const options = {
    reportJson: 'artifacts/harness/maintenance/harness-maintenance-report.json',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--report-json') {
      options.reportJson = argv[index + 1] ?? options.reportJson;
      index += 1;
    }
  }

  return options;
}

function timestampLabel() {
  return new Date().toISOString().replace(/[-:]/g, '').replace(/\..+/, '').replace('T', '-');
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const reportPath = path.resolve(repoRoot, options.reportJson);
  if (!fs.existsSync(reportPath)) {
    console.log('No maintenance report found; skipping auto-fix PR creation.');
    return;
  }

  const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
  const repoIndexFinding = report.auto_fixable.find((finding) => finding.id === 'repo_index_drift');
  if (!repoIndexFinding) {
    console.log('No auto-fixable maintenance findings; skipping PR creation.');
    return;
  }

  run('git', ['config', 'user.name', 'github-actions[bot]']);
  run('git', ['config', 'user.email', '41898282+github-actions[bot]@users.noreply.github.com']);
  run('bash', ['-lc', repoIndexFinding.fixCommand]);

  const status = run('git', ['status', '--porcelain'], { allowFailure: true });
  if (!status.stdout.includes('artifacts/repo-index.json')) {
    console.log('Auto-fix produced no repo index diff; skipping PR creation.');
    return;
  }

  const branchName = `automation/harness-repo-index-${timestampLabel()}`;
  run('git', ['checkout', '-b', branchName]);
  run('git', ['add', 'artifacts/repo-index.json']);
  run('git', ['commit', '-m', 'chore(harness): refresh repo index']);
  run('git', ['push', '--set-upstream', 'origin', branchName]);

  const body = [
    '## Summary',
    '- refresh the generated repo index after maintenance detected drift',
    '',
    '## Source',
    `- Generated from maintenance report on ${report.generatedAt}`,
    `- Harness score at detection time: ${report.score.grade} (${report.score.score})`,
  ].join('\n');

  run('gh', [
    'pr',
    'create',
    '--base',
    'main',
    '--head',
    branchName,
    '--title',
    'chore(harness): refresh repo index',
    '--body',
    body,
  ]);
}

if (process.argv[1] === scriptPath) {
  main();
}
