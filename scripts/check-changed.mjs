import { fileURLToPath } from 'node:url';
import {
  buildArtifactPaths,
  expandSelectedCommand,
  dedupePreservingOrder,
  HARNESS_COMMANDS,
  normalizeList,
  requiresSmokeValidation,
  renderHarnessSummary,
  repoRoot,
  runGit,
  runHarnessSteps,
  selectValidationCommands,
  writeJsonFile,
  writeTextFile,
  FAILURE_CATEGORIES,
} from './harness-shared.mjs';
import { collectStorybookCoverageViolations } from './check-repo-policies.mjs';

const scriptPath = fileURLToPath(import.meta.url);


export function listStagedChangedFiles() {
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']).split('\n');
  return normalizeList(staged);
}

export function listLocalChangedFiles() {
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']).split('\n');
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']).split('\n');
  const untracked = runGit(['ls-files', '--others', '--exclude-standard']).split('\n');
  return normalizeList([...unstaged, ...staged, ...untracked]);
}

export function listRangeChangedFiles(base, head) {
  const diff = runGit(['diff', '--name-only', '--diff-filter=ACMR', `${base}...${head}`]);
  return normalizeList(diff.split('\n'));
}

export function buildValidationPlan(files) {
  const changedFiles = normalizeList(files);
  const requiresSmoke = requiresSmokeValidation(changedFiles);
  const storybookViolations = collectStorybookCoverageViolations(changedFiles);
  const commands = selectValidationCommands({
    changedFiles,
    hasDocs: changedFiles.some((filePath) =>
      filePath === 'AGENTS.md' ||
      filePath.endsWith('/AGENTS.md') ||
      filePath === 'code_review.md' ||
      filePath.startsWith('docs/') ||
      filePath.startsWith('.github/'),
    ),
    hasBackend: changedFiles.some((filePath) => filePath.startsWith('backend/')),
    hasMobile: changedFiles.some((filePath) => filePath.startsWith('mobile/')),
    hasSymphony: changedFiles.some((filePath) => filePath.startsWith('symphony/')),
  });

  if (requiresSmoke) {
    commands.push(HARNESS_COMMANDS.smoke);
  }

  return {
    changedFiles,
    commands: dedupePreservingOrder(commands),
    requiresSmoke,
    storybookViolations,
  };
}

function parseArgs(argv) {
  const options = {
    base: null,
    head: 'HEAD',
    files: [],
    printOnly: false,
    stagedOnly: false,
    artifactsDir: null,
    lane: 'check-changed',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--base') {
      options.base = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--head') {
      options.head = argv[index + 1] ?? 'HEAD';
      index += 1;
    } else if (argument === '--files') {
      options.files.push(argv[index + 1] ?? '');
      index += 1;
    } else if (argument === '--print') {
      options.printOnly = true;
    } else if (argument === '--staged') {
      options.stagedOnly = true;
    } else if (argument === '--artifacts-dir') {
      options.artifactsDir = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--lane') {
      options.lane = argv[index + 1] ?? 'check-changed';
      index += 1;
    }
  }

  return options;
}

function resolveChangedFiles(options) {
  if (options.files.length > 0) {
    return normalizeList(options.files);
  }

  if (options.base) {
    return listRangeChangedFiles(options.base, options.head);
  }

  if (options.stagedOnly) {
    return listStagedChangedFiles();
  }

  return listLocalChangedFiles();
}

function writeStorybookFailureArtifacts({ artifactsDir, lane, plan, options }) {
  if (!artifactsDir) {
    return;
  }

  const paths = buildArtifactPaths(artifactsDir);
  const planPayload = {
    schemaVersion: 1,
    lane,
    selectedCommands: plan.commands,
    changedFiles: plan.changedFiles,
    metadata: {
      requiresSmoke: plan.requiresSmoke,
      storybookViolations: plan.storybookViolations,
      base: options.base,
      head: options.head,
      stagedOnly: options.stagedOnly,
    },
  };
  const resultPayload = {
    schemaVersion: 1,
    lane,
    startedAt: new Date().toISOString(),
    completedAt: new Date().toISOString(),
    status: 'failed',
    selectedCommands: plan.commands,
    changedFiles: plan.changedFiles,
    metadata: planPayload.metadata,
    executedSteps: [],
  };
  const failurePayload = {
    lane,
    status: 'failed',
    failureCategory: FAILURE_CATEGORIES.policyViolation,
    failingStep: 'Storybook co-update check',
    localCommand: 'npm run check:changed',
    remediationHint: plan.storybookViolations.join(' '),
  };

  writeJsonFile(paths.plan, planPayload);
  writeJsonFile(paths.results, resultPayload);
  writeJsonFile(paths.failureSummary, failurePayload);
  writeJsonFile(paths.historyEntry, {
    lane,
    status: 'failed',
    failureCategory: failurePayload.failureCategory,
    failingStep: failurePayload.failingStep,
    selectedCommands: plan.commands,
    failedCommands: ['storybook-co-update'],
    policyFailures: plan.storybookViolations,
    completedAt: resultPayload.completedAt,
  });
  writeTextFile(paths.summary, renderHarnessSummary({ planPayload, resultPayload, failurePayload }));
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const changedFiles = resolveChangedFiles(options);
  const plan = buildValidationPlan(changedFiles);

  if (options.printOnly) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (plan.storybookViolations.length > 0) {
    writeStorybookFailureArtifacts({
      artifactsDir: options.artifactsDir,
      lane: options.lane,
      plan,
      options,
    });
    console.error('Changed-file validation blocked:\n');
    for (const violation of plan.storybookViolations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  const { exitCode } = runHarnessSteps({
    lane: options.lane,
    selectedCommands: plan.commands,
    changedFiles: plan.changedFiles,
    artifactsDir: options.artifactsDir,
    metadata: {
      requiresSmoke: plan.requiresSmoke,
      storybookViolations: plan.storybookViolations,
      base: options.base,
      head: options.head,
      stagedOnly: options.stagedOnly,
    },
    steps: plan.commands.map((command) => expandSelectedCommand(command)),
    printPlan: true,
  });

  process.exit(exitCode);
}

if (process.argv[1] === scriptPath) {
  main();
}
