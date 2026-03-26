import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { listMarkdownFiles, loadPackageScripts, repoRoot } from './doc-policy.mjs';

const scriptPath = fileURLToPath(import.meta.url);

function hasKnownScript(scriptName, packageScripts) {
  return Object.values(packageScripts).some((scripts) => scripts.has(scriptName));
}

function collectLinkViolations(rootDir, filePath, content) {
  const violations = [];
  const linkPattern = /\[[^\]]+\]\(([^)]+)\)/g;

  for (const match of content.matchAll(linkPattern)) {
    const [, rawTarget] = match;
    if (!rawTarget || rawTarget.startsWith('#') || /^https?:\/\//.test(rawTarget) || rawTarget.startsWith('mailto:')) {
      continue;
    }

    const [target] = rawTarget.split('#');
    if (!target) {
      continue;
    }

    if (target.startsWith('/')) {
      violations.push(`${filePath}: absolute local link is not portable -> ${target}`);
      continue;
    }

    const resolvedPath = path.resolve(path.dirname(path.join(rootDir, filePath)), target);
    if (!fs.existsSync(resolvedPath)) {
      violations.push(`${filePath}: missing markdown link target -> ${target}`);
    }
  }

  return violations;
}

function collectCommandViolations(packageScripts, filePath, content) {
  const violations = [];
  const npmRunPattern = /npm run ([A-Za-z0-9:_-]+)/g;

  for (const match of content.matchAll(npmRunPattern)) {
    const [, scriptName] = match;
    if (!hasKnownScript(scriptName, packageScripts)) {
      violations.push(`${filePath}: references unknown npm script -> ${scriptName}`);
    }
  }

  const shellScriptPattern = /(?:^|[\s`(])(\.\/scripts\/[A-Za-z0-9._/-]+)/gm;
  for (const match of content.matchAll(shellScriptPattern)) {
    const scriptTarget = match[1].replace(/^[(`\s]+|[`)\s]+$/g, '');
    if (!fs.existsSync(path.join(repoRoot, scriptTarget.replace(/^\.\//, '')))) {
      violations.push(`${filePath}: references missing script path -> ${scriptTarget}`);
    }
  }

  return violations;
}

export function collectDocViolations({
  rootDir = repoRoot,
  markdownFiles = listMarkdownFiles(rootDir),
  packageScripts = loadPackageScripts(rootDir),
} = {}) {
  const violations = [];

  for (const filePath of markdownFiles) {
    const absolutePath = path.join(rootDir, filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    violations.push(...collectLinkViolations(rootDir, filePath, content));
    violations.push(...collectCommandViolations(packageScripts, filePath, content));
  }

  return violations;
}

function main() {
  const violations = collectDocViolations();
  if (violations.length > 0) {
    console.error('Documentation drift detected:\n');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  console.log(`Docs check passed across ${listMarkdownFiles().length} markdown files.`);
}

if (process.argv[1] === scriptPath) {
  main();
}
