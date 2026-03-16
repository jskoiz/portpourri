import { execFileSync, spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { collectStorybookCoverageViolations } from './check-repo-policies.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');

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
  /^backend\/package\.json$/,
  /^mobile\/package\.json$/,
  /^scripts\/.+\.mjs$/,
  /^\.github\/workflows\//,
];

function normalizeFiles(files) {
  return [...new Set(files.map((filePath) => filePath.trim()).filter(Boolean))].toSorted();
}

function runGit(args) {
  return execFileSync('git', args, { cwd: repoRoot, encoding: 'utf8' }).trim();
}

function listLocalChangedFiles() {
  const unstaged = runGit(['diff', '--name-only', '--diff-filter=ACMR', 'HEAD']).split('\n');
  const staged = runGit(['diff', '--cached', '--name-only', '--diff-filter=ACMR']).split('\n');
  const untracked = runGit(['ls-files', '--others', '--exclude-standard']).split('\n');
  return normalizeFiles([...unstaged, ...staged, ...untracked]);
}

function listRangeChangedFiles(base, head) {
  const diff = runGit(['diff', '--name-only', '--diff-filter=ACMR', `${base}...${head}`]);
  return normalizeFiles(diff.split('\n'));
}

function includesMatch(files, patterns) {
  return files.some((filePath) => patterns.some((pattern) => pattern.test(filePath)));
}

export function buildValidationPlan(files) {
  const changedFiles = normalizeFiles(files);
  const hasBackend = changedFiles.some((filePath) => filePath.startsWith('backend/'));
  const hasMobile = changedFiles.some((filePath) => filePath.startsWith('mobile/'));
  const hasHarness = includesMatch(changedFiles, harnessSensitivePatterns);
  const hasDocs = changedFiles.some((filePath) =>
    filePath === 'AGENTS.md' ||
    filePath.endsWith('/AGENTS.md') ||
    filePath === 'code_review.md' ||
    filePath.startsWith('docs/') ||
    filePath.startsWith('.github/'),
  );
  const requiresSmoke = includesMatch(changedFiles, smokeSensitivePatterns);
  const storybookViolations = collectStorybookCoverageViolations(changedFiles);

  const commands = [];

  if (changedFiles.length === 0) {
    commands.push('npm run check:root');
  } else if (hasHarness || (hasBackend && hasMobile)) {
    commands.push('npm run check');
  } else {
    if (hasDocs) {
      commands.push('npm run check:root');
    }
    if (hasBackend) {
      commands.push('npm run check:backend');
    }
    if (hasMobile) {
      commands.push('npm run check:mobile');
    }
    if (!hasDocs && !hasBackend && !hasMobile) {
      commands.push('npm run check:root');
    }
  }

  if (requiresSmoke) {
    commands.push('npm run smoke');
  }

  return {
    changedFiles,
    commands: normalizeFiles(commands),
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
    }
  }

  return options;
}

function runCommand(command) {
  const result = spawnSync('bash', ['-lc', command], {
    cwd: repoRoot,
    stdio: 'inherit',
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const changedFiles = options.files.length > 0
    ? normalizeFiles(options.files)
    : options.base
      ? listRangeChangedFiles(options.base, options.head)
      : listLocalChangedFiles();

  const plan = buildValidationPlan(changedFiles);

  if (plan.storybookViolations.length > 0) {
    console.error('Changed-file validation blocked:\n');
    for (const violation of plan.storybookViolations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  if (options.printOnly) {
    console.log(JSON.stringify(plan, null, 2));
    return;
  }

  if (plan.changedFiles.length === 0) {
    console.log('No changed files detected; defaulting to root harness checks.');
  } else {
    console.log(`Changed files (${plan.changedFiles.length}):`);
    for (const filePath of plan.changedFiles) {
      console.log(`- ${filePath}`);
    }
  }

  console.log('\nSelected validation commands:');
  for (const command of plan.commands) {
    console.log(`- ${command}`);
  }

  for (const command of plan.commands) {
    runCommand(command);
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
