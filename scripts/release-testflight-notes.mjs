import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

function fail(message) {
  throw new Error(message);
}

function runGit(cwd, args) {
  return execFileSync('git', args, {
    cwd,
    encoding: 'utf8',
  }).trim();
}

export function normalizeCommitSubject(subject) {
  return subject
    .replace(/\s+\(#\d+\)$/u, '')
    .replace(/^[a-z]+(?:\([^)]+\))?!?:\s*/iu, '')
    .trim();
}

export function isUserFacingSubject(subject) {
  const normalized = subject.trim();
  if (!normalized) {
    return false;
  }

  return !/^(ci|docs|chore|test)(\([^)]*\))?!?:/iu.test(normalized);
}

function sentenceCase(value) {
  if (!value) {
    return value;
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function findPreviousReleaseTag({ cwd, appVersion }) {
  const pickFirstTag = (args) => runGit(cwd, args).split('\n').filter(Boolean)[0] ?? '';

  if (appVersion) {
    const versionScoped = pickFirstTag([
      'tag',
      '--list',
      `v${appVersion}+*`,
      '--sort=-version:refname',
      '--merged', 'HEAD',
    ]);
    if (versionScoped) {
      return versionScoped;
    }
  }

  return pickFirstTag([
    'tag',
    '--list',
    'v*+*',
    '--sort=-version:refname',
    '--merged', 'HEAD',
  ]);
}

export function listCommitSubjects({ cwd, baseRef, headRef = 'HEAD' }) {
  if (!baseRef) {
    return [];
  }

  const output = runGit(cwd, [
    'log',
    '--no-merges',
    '--pretty=format:%s',
    `${baseRef}..${headRef}`,
  ]);

  return output.split('\n').map((entry) => entry.trim()).filter(Boolean);
}

export function summarizeUserFacingChanges(subjects, limit = 8) {
  const normalized = subjects
    .filter(isUserFacingSubject)
    .map(normalizeCommitSubject)
    .filter(Boolean)
    .map(sentenceCase);

  const seen = new Set();
  const unique = [];
  for (const entry of normalized) {
    const key = entry.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      unique.push(entry);
    }
  }
  return unique.slice(0, limit);
}

export function deriveTestingFocus(changes, limit = 4) {
  const focus = [];

  const matches = (pattern) => changes.some((entry) => pattern.test(entry));
  const add = (value) => {
    if (focus.length < limit && !focus.includes(value)) {
      focus.push(value);
    }
  };

  if (matches(/event|attendee|host|invite/iu)) {
    add('Event detail, attendee navigation, and host profile flows');
  }
  if (matches(/create|keyboard|cta|timing/iu)) {
    add('Event creation steps, especially timing/details with the keyboard open');
  }
  if (matches(/discover|discovery|card|intent/iu)) {
    add('Discovery cards, intent labels, and short-screen layout behavior');
  }
  if (matches(/profile|save|completion/iu)) {
    add('Profile editing and persistence after discovery preference changes');
  }
  if (matches(/moderation|block/iu)) {
    add('User block/report actions and any related moderation feedback');
  }

  if (focus.length === 0 && changes.length > 0) {
    add('Core flows touched by this build');
  }

  return focus.slice(0, limit);
}

export function renderTestflightNotes({
  appVersion,
  iosBuildNumber,
  baseRef,
  changes,
}) {
  const lines = [
    `Build ${iosBuildNumber} includes the latest BRDG fixes and polish for ${appVersion}.`,
  ];

  if (baseRef) {
    lines.push('', `Included since ${baseRef}:`);
  } else {
    lines.push('', 'Included in this build:');
  }

  if (changes.length === 0) {
    lines.push('- Release workflow and reliability updates.');
  } else {
    for (const change of changes) {
      lines.push(`- ${change}`);
    }
  }

  const focus = deriveTestingFocus(changes);
  if (focus.length > 0) {
    lines.push('', 'Testing focus:');
    for (const item of focus) {
      lines.push(`- ${item}`);
    }
  }

  return `${lines.join('\n')}\n`;
}

export function generateTestflightNotes({
  cwd,
  appVersion,
  iosBuildNumber,
  baseRef,
  headRef = 'HEAD',
}) {
  const resolvedBaseRef = baseRef || findPreviousReleaseTag({ cwd, appVersion });
  const subjects = listCommitSubjects({ cwd, baseRef: resolvedBaseRef, headRef });
  const changes = summarizeUserFacingChanges(subjects);
  const notes = renderTestflightNotes({
    appVersion,
    iosBuildNumber,
    baseRef: resolvedBaseRef,
    changes,
  });

  return {
    appVersion,
    iosBuildNumber: String(iosBuildNumber),
    baseRef: resolvedBaseRef || null,
    headRef,
    subjects,
    changes,
    notes,
  };
}

function parseArgs(argv) {
  const values = {
    cwd: process.cwd(),
    headRef: 'HEAD',
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--cwd':
        values.cwd = argv[index + 1];
        index += 1;
        break;
      case '--version':
        values.appVersion = argv[index + 1];
        index += 1;
        break;
      case '--build':
        values.iosBuildNumber = argv[index + 1];
        index += 1;
        break;
      case '--base-ref':
        values.baseRef = argv[index + 1];
        index += 1;
        break;
      case '--head-ref':
        values.headRef = argv[index + 1];
        index += 1;
        break;
      case '--output':
        values.output = argv[index + 1];
        index += 1;
        break;
      case '-h':
      case '--help':
        values.help = true;
        break;
      default:
        fail(`Unknown argument: ${arg}`);
    }
  }

  return values;
}

function printUsage() {
  process.stdout.write([
    'Usage: node ./scripts/release-testflight-notes.mjs [options]',
    '',
    'Options:',
    '  --cwd <path>        Git repo root. Defaults to the current working directory.',
    '  --version <value>   App version used to resolve the previous release tag.',
    '  --build <value>     Build number to include in the generated notes.',
    '  --base-ref <ref>    Override the commit range base ref.',
    '  --head-ref <ref>    Defaults to HEAD.',
    '  --output <path>     Optional output file path.',
    '',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    printUsage();
    return;
  }

  if (!args.appVersion) {
    fail('--version is required');
  }
  if (!args.iosBuildNumber) {
    fail('--build is required');
  }

  const payload = generateTestflightNotes({
    cwd: path.resolve(args.cwd),
    appVersion: args.appVersion,
    iosBuildNumber: args.iosBuildNumber,
    baseRef: args.baseRef,
    headRef: args.headRef,
  });

  if (args.output) {
    const outputPath = path.resolve(args.output);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.writeFileSync(outputPath, payload.notes, 'utf8');
    payload.outputPath = outputPath;
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`release-testflight-notes: ${error.message}\n`);
    process.exit(1);
  });
}
