import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot } from './harness-shared.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const TODO_PATTERN = /(?:\/\/|#|\/\*+|\*)\s*(TODO|FIXME|HACK)\b|^\s*(?:[-*]\s+)?(TODO|FIXME|HACK)\b/;
const SEARCH_ROOTS = ['AGENTS.md', 'backend', 'mobile', 'docs', 'scripts', '.github'];
const IGNORED_SEGMENTS = ['/node_modules/', '/coverage/', '/build/', '/dist/', '/artifacts/harness/'];

function walk(rootDir, relativePath) {
  const absolutePath = path.join(rootDir, relativePath);
  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const entry = fs.statSync(absolutePath);
  if (!entry.isDirectory()) {
    return [relativePath];
  }

  const results = [];
  for (const child of fs.readdirSync(absolutePath, { withFileTypes: true })) {
    const childRelativePath = path.join(relativePath, child.name).replace(/\\/g, '/');
    if (child.isDirectory()) {
      results.push(...walk(rootDir, childRelativePath));
      continue;
    }
    results.push(childRelativePath);
  }

  return results;
}

function shouldInspectFile(filePath) {
  return (
    /\.(md|ts|tsx|js|mjs|json|ya?ml)$/.test(filePath) &&
    !IGNORED_SEGMENTS.some((segment) => filePath.includes(segment)) &&
    !filePath.startsWith('scripts/__tests__/')
  );
}

export function scanTodoMarkers(rootDir = repoRoot) {
  const findings = [];
  const files = SEARCH_ROOTS.flatMap((relativePath) => walk(rootDir, relativePath))
    .filter(shouldInspectFile)
    .toSorted();

  for (const filePath of files) {
    const absolutePath = path.join(rootDir, filePath);
    const content = fs.readFileSync(absolutePath, 'utf8');
    const lines = content.split('\n');

    lines.forEach((line, index) => {
      if (!TODO_PATTERN.test(line)) {
        return;
      }

      findings.push({
        filePath,
        lineNumber: index + 1,
        line: line.trim(),
      });
    });
  }

  return findings;
}

function main() {
  const findings = scanTodoMarkers();
  if (findings.length === 0) {
    console.log('No TODO/FIXME/HACK markers found.');
    return;
  }

  for (const finding of findings) {
    console.log(`${finding.filePath}:${finding.lineNumber}: ${finding.line}`);
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
