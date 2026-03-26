import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);

export const repoRoot = path.resolve(scriptDir, '..');

export const GOVERNED_MARKDOWN_FILES = [
  'AGENTS.md',
  'backend/AGENTS.md',
  'mobile/AGENTS.md',
  'backend/README.md',
  'WORKFLOW.md',
];

export const ACTIVE_DOCS = [
  ...GOVERNED_MARKDOWN_FILES,
  'docs/HARNESS.md',
  'docs/REPO_MAP.md',
  'docs/DEV_LOOP.md',
  'docs/ARCHITECTURE.md',
  'docs/STORYBOOK_WORKFLOW.md',
  'docs/FUNCTIONAL_MATRIX.md',
  'docs/APP_STORE_RELEASE.md',
  'docs/DEPLOY_LIGHTSAIL.md',
];

function walkMarkdownFiles(rootDir, relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = path.relative(rootDir, absolutePath);

    if (entry.isDirectory()) {
      results.push(...walkMarkdownFiles(rootDir, relativePath));
      continue;
    }

    if (entry.isFile() && entry.name.endsWith('.md')) {
      results.push(relativePath);
    }
  }

  return results;
}

export function listMarkdownFiles(rootDir = repoRoot) {
  const discovered = ['docs', '.github'].flatMap((dir) => walkMarkdownFiles(rootDir, dir));
  const portable = [...discovered, ...GOVERNED_MARKDOWN_FILES].filter((filePath) =>
    fs.existsSync(path.join(rootDir, filePath)),
  );
  return [...new Set(portable)].toSorted();
}

export function loadPackageScripts(rootDir = repoRoot) {
  const packageFiles = ['package.json', 'backend/package.json', 'mobile/package.json'];

  return packageFiles.reduce((accumulator, packageFile) => {
    const absolutePath = path.join(rootDir, packageFile);
    if (!fs.existsSync(absolutePath)) {
      return accumulator;
    }

    const manifest = JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
    accumulator[packageFile] = new Set(Object.keys(manifest.scripts ?? {}));
    return accumulator;
  }, {});
}
