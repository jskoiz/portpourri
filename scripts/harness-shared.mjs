import fs from 'node:fs';
import path from 'node:path';
import { execFileSync, spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { runWorkspaceChecks } from './check-workspaces-parallel.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);

export const repoRoot = path.resolve(scriptDir, '..');

export const FAILURE_CATEGORIES = {
  docsDrift: 'docs drift',
  policyViolation: 'policy violation',
  typecheck: 'typecheck',
  tests: 'tests',
  smokeBootstrap: 'smoke bootstrap',
  maintenanceAudit: 'maintenance audit',
  unknown: 'unknown',
};

export const HARNESS_COMMANDS = Object.freeze({
  check: 'npm run check',
  checkRoot: 'npm run check:root',
  checkBackend: 'npm run check:backend',
  checkMobile: 'npm run check:mobile',
  checkSymphony: 'npm run check:symphony',
  smoke: 'npm run smoke',
});

const executionStepCatalog = {
  [HARNESS_COMMANDS.check]: [
    [HARNESS_COMMANDS.checkRoot, FAILURE_CATEGORIES.docsDrift, 'Root harness checks'],
    [HARNESS_COMMANDS.checkBackend, FAILURE_CATEGORIES.typecheck, 'Backend validation'],
    [HARNESS_COMMANDS.checkMobile, FAILURE_CATEGORIES.typecheck, 'Mobile validation'],
    [HARNESS_COMMANDS.checkSymphony, FAILURE_CATEGORIES.typecheck, 'Symphony validation'],
  ],
  [HARNESS_COMMANDS.checkRoot]: [
    ['npm run docs:check', FAILURE_CATEGORIES.docsDrift, 'Docs drift check'],
    ['npm run policy:check', FAILURE_CATEGORIES.policyViolation, 'Repo policy check'],
    ['npm run test:root', FAILURE_CATEGORIES.tests, 'Root harness tests'],
  ],
  [HARNESS_COMMANDS.checkBackend]: [
    ['node ./scripts/check-prisma-migration-safety.mjs', FAILURE_CATEGORIES.policyViolation, 'Prisma migration safety'],
    ['npm --prefix backend run typecheck', FAILURE_CATEGORIES.typecheck, 'Backend typecheck'],
    ['npm --prefix backend run check:boundaries', FAILURE_CATEGORIES.policyViolation, 'Backend policy check'],
    ['npm --prefix backend run test', FAILURE_CATEGORIES.tests, 'Backend tests'],
  ],
  [HARNESS_COMMANDS.checkMobile]: [
    ['npm --prefix mobile run typecheck', FAILURE_CATEGORIES.typecheck, 'Mobile typecheck'],
    ['npm --prefix mobile run check:boundaries', FAILURE_CATEGORIES.policyViolation, 'Mobile policy check'],
    ['npm --prefix mobile run test', FAILURE_CATEGORIES.tests, 'Mobile tests'],
  ],
};

const smokeSensitivePatterns = [
  /^backend\/prisma\//,
  /^backend\/scripts\//,
  /^backend\/src\/config\//,
  /^backend\/src\/main\.ts$/,
  /^docker-compose\.yml$/,
  /^scripts\/smoke-e2e\.sh$/,
];

const harnessSensitivePatterns = [
  /^package\.json$/,
  /^scripts\/(?!harness-shared\.mjs$|__tests__\/).+\.mjs$/,
  /^\.github\/workflows\//,
];

export function normalizeList(items) {
  return [...new Set(items.map((value) => value.trim()).filter(Boolean))].toSorted();
}

export function dedupePreservingOrder(items) {
  const seen = new Set();
  const deduped = [];

  for (const value of items.map((item) => item.trim()).filter(Boolean)) {
    if (seen.has(value)) {
      continue;
    }

    seen.add(value);
    deduped.push(value);
  }

  return deduped;
}

export function ensureDir(absoluteDir) {
  fs.mkdirSync(absoluteDir, { recursive: true });
}

export function writeJsonFile(absolutePath, data) {
  ensureDir(path.dirname(absolutePath));
  fs.writeFileSync(absolutePath, `${JSON.stringify(data, null, 2)}\n`);
}

export function writeTextFile(absolutePath, content) {
  ensureDir(path.dirname(absolutePath));
  fs.writeFileSync(absolutePath, content);
}

export function readJsonFile(absolutePath) {
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

export function runGit(args, { trim = true } = {}) {
  const output = execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' });
  return trim ? output.trim() : output;
}

export function buildArtifactPaths(artifactsDir) {
  const absoluteDir = path.resolve(repoRoot, artifactsDir);
  return {
    dir: absoluteDir,
    plan: path.join(absoluteDir, 'harness-plan.json'),
    results: path.join(absoluteDir, 'harness-results.json'),
    failureSummary: path.join(absoluteDir, 'harness-failure-summary.json'),
    summary: path.join(absoluteDir, 'harness-summary.md'),
    historyEntry: path.join(absoluteDir, 'harness-history-entry.json'),
  };
}

export function includesMatch(files, patterns) {
  return files.some((filePath) => patterns.some((pattern) => pattern.test(filePath)));
}

export function requiresSmokeValidation(changedFiles) {
  return includesMatch(changedFiles, smokeSensitivePatterns);
}

export function hasHarnessSensitiveChanges(changedFiles) {
  return includesMatch(changedFiles, harnessSensitivePatterns);
}

export function selectValidationCommands({
  changedFiles,
  hasDocs,
  hasBackend,
  hasMobile,
  hasSymphony,
}) {
  if (changedFiles.length === 0) {
    return [HARNESS_COMMANDS.checkRoot];
  }

  if (
    hasHarnessSensitiveChanges(changedFiles) ||
    [hasBackend, hasMobile, hasSymphony].filter(Boolean).length > 1
  ) {
    return [HARNESS_COMMANDS.check];
  }

  const commands = [];

  if (hasDocs) {
    commands.push(HARNESS_COMMANDS.checkRoot);
  }
  if (hasBackend) {
    commands.push(HARNESS_COMMANDS.checkBackend);
  }
  if (hasMobile) {
    commands.push(HARNESS_COMMANDS.checkMobile);
  }
  if (hasSymphony) {
    commands.push(HARNESS_COMMANDS.checkSymphony);
  }
  if (!hasDocs && !hasBackend && !hasMobile && !hasSymphony) {
    commands.push(HARNESS_COMMANDS.checkRoot);
  }

  return commands;
}

export function expandSelectedCommand(command) {
  const configured = executionStepCatalog[command];
  if (!configured) {
    return [
      {
        command,
        label: command,
        category: inferFailureCategory(command),
      },
    ];
  }

  return configured.map(([stepCommand, category, label]) => ({
    command: stepCommand,
    label,
    category,
  }));
}

export function inferFailureCategory(command) {
  if (command.includes('docs:check')) return FAILURE_CATEGORIES.docsDrift;
  if (command.includes('check:boundaries') || command.includes('policy:check') || command.includes('check-repo-policies')) {
    return FAILURE_CATEGORIES.policyViolation;
  }
  if (command.includes('typecheck')) return FAILURE_CATEGORIES.typecheck;
  if (/(^|\s)test($|\s|:)/.test(command) || command.includes('jest')) return FAILURE_CATEGORIES.tests;
  if (
    command.includes('smoke') ||
    command.includes('db:up') ||
    command.includes('db:wait') ||
    command.includes('db:migrate') ||
    command.includes('db:seed') ||
    command.includes('dev:bootstrap')
  ) {
    return FAILURE_CATEGORIES.smokeBootstrap;
  }
  if (command.includes('maintenance')) return FAILURE_CATEGORIES.maintenanceAudit;
  return FAILURE_CATEGORIES.unknown;
}

export function remediationHintForCategory(category) {
  switch (category) {
    case FAILURE_CATEGORIES.docsDrift:
      return 'Update docs, markdown links, or referenced npm scripts until docs checks pass.';
    case FAILURE_CATEGORIES.policyViolation:
      return 'Fix the reported policy violation or update the repo index/docs so the harness rules are satisfied.';
    case FAILURE_CATEGORIES.typecheck:
      return 'Run the reported typecheck locally and fix the TypeScript errors before re-running the lane.';
    case FAILURE_CATEGORIES.tests:
      return 'Re-run the failing test command locally, fix the behavior or test assumptions, then re-run the lane.';
    case FAILURE_CATEGORIES.smokeBootstrap:
      return 'Re-run the smoke/bootstrap path locally and fix backend startup, database, or scenario reset failures.';
    case FAILURE_CATEGORIES.maintenanceAudit:
      return 'Review the maintenance report output and resolve the listed audit findings.';
    default:
      return 'Inspect the failing command output and re-run the same command locally for detail.';
  }
}

export async function runHarnessSteps({
  lane,
  selectedCommands,
  steps,
  changedFiles = [],
  artifactsDir,
  metadata = {},
  printPlan = true,
}) {
  const startedAt = new Date().toISOString();
  const executedSteps = [];
  let failureSummary = null;

  if (printPlan) {
    if (changedFiles.length > 0) {
      console.log(`Changed files (${changedFiles.length}):`);
      for (const filePath of changedFiles) {
        console.log(`- ${filePath}`);
      }
    }

    console.log('\nSelected validation commands:');
    for (const command of selectedCommands) {
      console.log(`- ${command}`);
    }
  }

  const flattenedSteps = steps.flatMap((step) =>
    Array.isArray(step) ? step : [step],
  );

  for (let index = 0; index < flattenedSteps.length; index += 1) {
    const step = flattenedSteps[index];
    const nextSteps = flattenedSteps.slice(index + 1, index + 4);
    const isFullRepoWorkspaceGroup =
      step.command === HARNESS_COMMANDS.checkRoot &&
      nextSteps.length === 3 &&
      nextSteps[0]?.command === HARNESS_COMMANDS.checkBackend &&
      nextSteps[1]?.command === HARNESS_COMMANDS.checkMobile &&
      nextSteps[2]?.command === HARNESS_COMMANDS.checkSymphony;

    if (isFullRepoWorkspaceGroup) {
      const rootStep = await runSingleStep({ lane, step });
      executedSteps.push(rootStep);

      if (rootStep.exitCode !== 0) {
        failureSummary = buildFailureSummary({ lane, step, exitCode: rootStep.exitCode });
        break;
      }

      const workspaceSteps = nextSteps;
      for (const workspaceStep of workspaceSteps) {
        console.log(`\n[${lane}] ${workspaceStep.label}`);
      }
      const workspaceResults = await runWorkspaceChecks({
        cwd: repoRoot,
        workspaces: workspaceSteps.map((workspaceStep) => ({
          name: workspaceStep.label,
          command: workspaceStep.command,
        })),
      });

      for (const result of workspaceResults) {
        executedSteps.push({
          label: result.name,
          command: result.command,
          category: workspaceSteps.find((workspaceStep) => workspaceStep.label === result.name)?.category ?? FAILURE_CATEGORIES.unknown,
          startedAt: result.startedAt,
          completedAt: result.completedAt,
          durationMs: result.durationMs,
          exitCode: result.exitCode,
          status: result.status,
        });
      }

      const failedWorkspace = workspaceResults.find((result) => result.exitCode !== 0);
      if (failedWorkspace) {
        const failedStep = workspaceSteps.find((workspaceStep) => workspaceStep.label === failedWorkspace.name);
        failureSummary = buildFailureSummary({
          lane,
          step: failedStep ?? {
            label: failedWorkspace.name,
            command: failedWorkspace.command,
            category: FAILURE_CATEGORIES.unknown,
          },
          exitCode: failedWorkspace.exitCode,
        });
        break;
      }

      index += 3;
      continue;
    }

    const result = await runSingleStep({ lane, step });
    executedSteps.push(result);

    if (result.exitCode !== 0) {
      failureSummary = buildFailureSummary({ lane, step, exitCode: result.exitCode });
      break;
    }
  }

  const completedAt = new Date().toISOString();
  const resultPayload = {
    schemaVersion: 1,
    lane,
    startedAt,
    completedAt,
    status: failureSummary ? 'failed' : 'passed',
    selectedCommands,
    changedFiles,
    metadata,
    executedSteps,
  };

  const planPayload = {
    schemaVersion: 1,
    lane,
    selectedCommands,
    changedFiles,
    metadata,
  };

  const failurePayload = failureSummary
    ? (({ exitCode, ...rest }) => rest)(failureSummary)
    : {
        lane,
        status: 'passed',
        failureCategory: null,
        failingStep: null,
        localCommand: null,
        remediationHint: null,
      };

  const historyEntry = {
    lane,
    status: resultPayload.status,
    failureCategory: failurePayload.failureCategory,
    failingStep: failurePayload.failingStep,
    selectedCommands,
    failedCommands: executedSteps
      .filter((step) => step.exitCode !== 0)
      .map((step) => step.command),
    policyFailures: executedSteps
      .filter((step) => step.category === FAILURE_CATEGORIES.policyViolation && step.exitCode !== 0)
      .map((step) => step.label),
    completedAt,
  };

  if (artifactsDir) {
    const paths = buildArtifactPaths(artifactsDir);
    writeJsonFile(paths.plan, planPayload);
    writeJsonFile(paths.results, resultPayload);
    writeJsonFile(paths.failureSummary, failurePayload);
    writeJsonFile(paths.historyEntry, historyEntry);
    writeTextFile(paths.summary, renderHarnessSummary({ planPayload, resultPayload, failurePayload }));
  }

  return {
    planPayload,
    resultPayload,
    failurePayload,
    exitCode: failureSummary ? failureSummary.exitCode ?? executedSteps.at(-1)?.exitCode ?? 1 : 0,
  };
}

function buildFailureSummary({ lane, step, exitCode }) {
  return {
    lane,
    status: 'failed',
    failureCategory: step.category,
    failingStep: step.label,
    localCommand: step.command,
    remediationHint: remediationHintForCategory(step.category),
    exitCode,
  };
}

async function runSingleStep({ lane, step }) {
  const stepStartedAt = new Date().toISOString();
  const stepStartTime = Date.now();
  console.log(`\n[${lane}] ${step.label}`);
  const result = spawnSync('bash', ['-lc', step.command], {
    cwd: repoRoot,
    stdio: 'inherit',
  });
  const exitCode = result.status ?? 1;

  return {
    label: step.label,
    command: step.command,
    category: step.category,
    startedAt: stepStartedAt,
    completedAt: new Date().toISOString(),
    durationMs: Date.now() - stepStartTime,
    exitCode,
    status: exitCode === 0 ? 'passed' : 'failed',
  };
}

export function renderHarnessSummary({ planPayload, resultPayload, failurePayload }) {
  const lines = [
    `# Harness summary: ${planPayload.lane}`,
    '',
    `- Status: ${resultPayload.status}`,
    `- Selected commands: ${planPayload.selectedCommands.join(', ') || 'none'}`,
    `- Changed files: ${planPayload.changedFiles.length}`,
    '',
    '## Executed steps',
  ];

  for (const step of resultPayload.executedSteps) {
    lines.push(`- ${step.label}: ${step.status} (${step.durationMs}ms)`);
  }

  lines.push('');
  lines.push('## Failure summary');
  lines.push(`- Category: ${failurePayload.failureCategory ?? 'none'}`);
  lines.push(`- Step: ${failurePayload.failingStep ?? 'none'}`);
  lines.push(`- Local command: ${failurePayload.localCommand ?? 'none'}`);
  lines.push(`- Hint: ${failurePayload.remediationHint ?? 'none'}`);
  lines.push('');

  return `${lines.join('\n')}\n`;
}
