import { fileURLToPath } from 'node:url';
import { buildValidationPlan, listLocalChangedFiles, listRangeChangedFiles, listStagedChangedFiles } from './check-changed.mjs';
import {
  buildArtifactPaths,
  expandSelectedCommand,
  FAILURE_CATEGORIES,
  renderHarnessSummary,
  runHarnessSteps,
  writeJsonFile,
  writeTextFile,
} from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);

export function buildPreSubmitSteps(plan, options) {
  const todoArgs = [];
  if (options.base) {
    todoArgs.push('--base', options.base, '--head', options.head);
  } else if (options.stagedOnly) {
    todoArgs.push('--staged');
  }

  return [
    {
      command: 'npm run docs:check',
      label: 'Docs drift check',
      category: 'docs drift',
    },
    {
      command: 'npm run policy:check',
      label: 'Repo policy check',
      category: 'policy violation',
    },
    {
      command: `node ./scripts/check-todo-introductions.mjs ${todoArgs.join(' ')}`.trim(),
      label: 'TODO introduction guard',
      category: 'policy violation',
    },
    ...plan.commands.flatMap((command) => expandSelectedCommand(command)),
  ].filter((step, index, steps) => steps.findIndex((candidate) => candidate.command === step.command) === index);
}

function parseArgs(argv) {
  const options = {
    base: null,
    head: 'HEAD',
    stagedOnly: false,
    artifactsDir: 'artifacts/harness/local-pre-submit',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--base') {
      options.base = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--head') {
      options.head = argv[index + 1] ?? 'HEAD';
      index += 1;
    } else if (argument === '--staged') {
      options.stagedOnly = true;
    } else if (argument === '--artifacts-dir') {
      options.artifactsDir = argv[index + 1] ?? options.artifactsDir;
      index += 1;
    }
  }

  return options;
}

function resolveChangedFiles(options) {
  if (options.base) {
    return listRangeChangedFiles(options.base, options.head);
  }

  if (options.stagedOnly) {
    return listStagedChangedFiles();
  }

  return listLocalChangedFiles();
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const changedFiles = resolveChangedFiles(options);
  const plan = buildValidationPlan(changedFiles);

  if (plan.storybookViolations.length > 0) {
    const paths = buildArtifactPaths(options.artifactsDir);
    const planPayload = {
      schemaVersion: 1,
      lane: 'pre-submit',
      selectedCommands: plan.commands,
      changedFiles: plan.changedFiles,
      metadata: {
        base: options.base,
        head: options.head,
        stagedOnly: options.stagedOnly,
        requiresSmoke: plan.requiresSmoke,
        storybookViolations: plan.storybookViolations,
      },
    };
    const resultPayload = {
      schemaVersion: 1,
      lane: 'pre-submit',
      startedAt: new Date().toISOString(),
      completedAt: new Date().toISOString(),
      status: 'failed',
      selectedCommands: plan.commands,
      changedFiles: plan.changedFiles,
      metadata: planPayload.metadata,
      executedSteps: [],
    };
    const failurePayload = {
      lane: 'pre-submit',
      status: 'failed',
      failureCategory: FAILURE_CATEGORIES.policyViolation,
      failingStep: 'Storybook co-update check',
      localCommand: 'npm run pre-submit',
      remediationHint: plan.storybookViolations.join(' '),
    };
    writeJsonFile(paths.plan, planPayload);
    writeJsonFile(paths.results, resultPayload);
    writeJsonFile(paths.failureSummary, failurePayload);
    writeTextFile(paths.summary, renderHarnessSummary({ planPayload, resultPayload, failurePayload }));
    console.error('Pre-submit blocked:\n');
    for (const violation of plan.storybookViolations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  const { exitCode } = runHarnessSteps({
    lane: 'pre-submit',
    selectedCommands: plan.commands,
    changedFiles: plan.changedFiles,
    artifactsDir: options.artifactsDir,
    metadata: {
      base: options.base,
      head: options.head,
      stagedOnly: options.stagedOnly,
      requiresSmoke: plan.requiresSmoke,
      storybookViolations: plan.storybookViolations,
      guardSteps: ['npm run docs:check', 'npm run policy:check', 'check-todo-introductions'],
    },
    steps: buildPreSubmitSteps(plan, options),
    printPlan: true,
  });

  process.exit(exitCode);
}

if (process.argv[1] === scriptPath) {
  main();
}
