import { fileURLToPath } from 'node:url';
import {
  collectHarnessHistory,
  downloadRunArtifacts,
  isGhAvailable,
  listHarnessRuns,
  loadHarnessArtifacts,
  resolveBranchFromPr,
  summarizeHarnessHistory,
} from './harness-github.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const options = {
    pr: null,
    branch: null,
    limit: 8,
    json: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--pr') {
      options.pr = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--branch') {
      options.branch = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--limit') {
      options.limit = Number.parseInt(argv[index + 1] ?? '8', 10);
      index += 1;
    } else if (argument === '--json') {
      options.json = true;
    }
  }

  return options;
}

function formatRun(run, artifacts) {
  const failure = artifacts.failureSummary;
  return {
    workflow: run.workflowName,
    status: run.status,
    conclusion: run.conclusion,
    url: run.url,
    selectedCommands: artifacts.plan?.selectedCommands ?? [],
    failureCategory: failure?.failureCategory ?? null,
    failingStep: failure?.failingStep ?? null,
    nextCommand: failure?.localCommand ?? null,
    remediationHint: failure?.remediationHint ?? null,
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!isGhAvailable()) {
    console.error('GitHub CLI is required for harness:ci-context.');
    process.exit(1);
  }

  const branch = options.branch ?? (options.pr ? resolveBranchFromPr(options.pr) : null);
  const runs = listHarnessRuns({ branch, limit: options.limit });
  const enrichedRuns = [];

  for (const run of runs) {
    const artifactDir = downloadRunArtifacts(run.databaseId);
    const artifacts = artifactDir ? loadHarnessArtifacts(artifactDir) : { plan: null, failureSummary: null };
    enrichedRuns.push(formatRun(run, artifacts));
  }

  const history = summarizeHarnessHistory(collectHarnessHistory({ branch, limit: options.limit }));
  const payload = {
    branch,
    runs: enrichedRuns,
    history,
  };

  if (options.json) {
    console.log(JSON.stringify(payload, null, 2));
    return;
  }

  console.log(`Harness CI context${branch ? ` for ${branch}` : ''}`);
  console.log('');
  for (const run of enrichedRuns) {
    console.log(`- ${run.workflow}: ${run.conclusion || run.status} (${run.url})`);
    if (run.selectedCommands.length > 0) {
      console.log(`  selected: ${run.selectedCommands.join(', ')}`);
    }
    if (run.failureCategory) {
      console.log(`  failure: ${run.failureCategory} at ${run.failingStep}`);
      console.log(`  next: ${run.nextCommand}`);
      console.log(`  hint: ${run.remediationHint}`);
    }
  }

  console.log('');
  console.log('Recent failure categories:');
  if (history.failureCategories.length === 0) {
    console.log('- none');
  } else {
    for (const item of history.failureCategories) {
      console.log(`- ${item.name}: ${item.count}`);
    }
  }

  console.log('');
  console.log('Recent failing commands:');
  if (history.failedCommands.length === 0) {
    console.log('- none');
  } else {
    for (const item of history.failedCommands) {
      console.log(`- ${item.name}: ${item.count}`);
    }
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
