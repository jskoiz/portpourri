import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot, runGit } from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function main() {
  const hooksDir = path.join(repoRoot, '.githooks');
  const preCommitHook = path.join(hooksDir, 'pre-commit');

  if (!fs.existsSync(preCommitHook)) {
    console.error('Missing .githooks/pre-commit. Restore the repo-managed hook before installing.');
    process.exit(1);
  }

  fs.chmodSync(preCommitHook, 0o755);
  runGit(['config', 'core.hooksPath', '.githooks']);
  console.log('Installed repo-managed git hooks via .githooks/.');
}

if (process.argv[1] === scriptPath) {
  main();
}
