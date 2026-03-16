import { fileURLToPath } from 'node:url';
import { runGit } from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const TODO_PATTERN = /(?:\/\/|#|\/\*+|\*)\s*(TODO|FIXME|HACK)\b|^\s*(?:[-*]\s+)?(TODO|FIXME|HACK)\b/;

export function collectTodoIntroductions(diffText) {
  const findings = [];
  let currentFile = null;

  for (const line of diffText.split('\n')) {
    if (line.startsWith('+++ b/')) {
      currentFile = line.slice('+++ b/'.length);
      continue;
    }

    if (!line.startsWith('+') || line.startsWith('+++')) {
      continue;
    }

    const addedLine = line.slice(1);
    if (!currentFile || !TODO_PATTERN.test(addedLine)) {
      continue;
    }

    findings.push({
      filePath: currentFile,
      line: addedLine,
    });
  }

  return findings;
}

function parseArgs(argv) {
  const options = {
    base: null,
    head: 'HEAD',
    stagedOnly: false,
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
    }
  }

  return options;
}

function loadDiff(options) {
  if (options.base) {
    return runGit(['diff', '--diff-filter=ACMR', '--unified=0', '--no-color', `${options.base}...${options.head}`], { trim: false });
  }

  if (options.stagedOnly) {
    return runGit(['diff', '--cached', '--diff-filter=ACMR', '--unified=0', '--no-color'], { trim: false });
  }

  return runGit(['diff', '--diff-filter=ACMR', '--unified=0', '--no-color', 'HEAD'], { trim: false });
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const findings = collectTodoIntroductions(loadDiff(options));

  if (findings.length > 0) {
    console.error('New TODO/FIXME/HACK markers detected:\n');
    for (const finding of findings) {
      console.error(`- ${finding.filePath}: ${finding.line.trim()}`);
    }
    process.exit(1);
  }

  console.log('TODO introduction guard passed.');
}

if (process.argv[1] === scriptPath) {
  main();
}
