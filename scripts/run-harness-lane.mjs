import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  buildArtifactPaths,
  expandSelectedCommand,
  runHarnessSteps,
} from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function parseArgs(argv) {
  const options = {
    lane: 'full-main',
    base: null,
    head: 'HEAD',
    artifactsDir: 'artifacts/harness/ci',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--lane') {
      options.lane = argv[index + 1] ?? options.lane;
      index += 1;
    } else if (argument === '--base') {
      options.base = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--head') {
      options.head = argv[index + 1] ?? 'HEAD';
      index += 1;
    } else if (argument === '--artifacts-dir') {
      options.artifactsDir = argv[index + 1] ?? options.artifactsDir;
      index += 1;
    }
  }

  return options;
}

function writeStepSummary(artifactsDir) {
  if (!process.env.GITHUB_STEP_SUMMARY) {
    return;
  }

  const summaryPath = buildArtifactPaths(artifactsDir).summary;
  if (fs.existsSync(summaryPath)) {
    fs.writeFileSync(process.env.GITHUB_STEP_SUMMARY, fs.readFileSync(summaryPath, 'utf8'));
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));

  if (options.lane === 'pr-fast') {
    const result = spawnSync(
      process.execPath,
      [
        './scripts/check-changed.mjs',
        '--lane',
        'pr-fast',
        '--artifacts-dir',
        options.artifactsDir,
        '--base',
        options.base ?? 'origin/main',
        '--head',
        options.head,
      ],
      {
        cwd: process.cwd(),
        stdio: 'inherit',
      },
    );
    writeStepSummary(options.artifactsDir);
    process.exit(result.status ?? 1);
  }

  const selectedCommands =
    options.lane === 'full-main'
      ? ['npm run check', 'npm run smoke']
      : ['npm run check'];
  const { exitCode } = runHarnessSteps({
    lane: options.lane,
    selectedCommands,
    changedFiles: [],
    artifactsDir: options.artifactsDir,
    metadata: {},
    steps: selectedCommands.map((command) => expandSelectedCommand(command)),
    printPlan: true,
  });
  writeStepSummary(options.artifactsDir);
  process.exit(exitCode);
}

if (process.argv[1] === scriptPath) {
  main();
}
