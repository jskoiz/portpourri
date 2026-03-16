import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { repoRoot, writeJsonFile } from './harness-shared.mjs';
import {
  classifyBackendLayer,
  classifyMobileLayer,
  getAllowedLayerImports,
  REPO_LAYER_MODEL,
} from './repo-layers.mjs';

const scriptPath = fileURLToPath(import.meta.url);
export const REPO_INDEX_PATH = path.join(repoRoot, 'artifacts', 'repo-index.json');

function walkFiles(rootDir, relativeDir) {
  const absoluteDir = path.join(rootDir, relativeDir);
  if (!fs.existsSync(absoluteDir)) {
    return [];
  }

  const results = [];
  for (const entry of fs.readdirSync(absoluteDir, { withFileTypes: true })) {
    const absolutePath = path.join(absoluteDir, entry.name);
    const relativePath = path.relative(rootDir, absolutePath).replace(/\\/g, '/');
    if (entry.isDirectory()) {
      results.push(...walkFiles(rootDir, relativePath));
      continue;
    }
    if (/\.(ts|tsx|js|mjs|json)$/.test(entry.name)) {
      results.push(relativePath);
    }
  }

  return results.toSorted();
}

function collectBackendIndex(rootDir) {
  const backendFiles = walkFiles(rootDir, 'backend/src');
  const backendSrcDir = path.join(rootDir, 'backend', 'src');
  const modules = fs.existsSync(backendSrcDir)
    ? fs
        .readdirSync(backendSrcDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .toSorted()
    : [];

  const filesByLayer = {};
  for (const filePath of backendFiles) {
    const layer = classifyBackendLayer(filePath) ?? 'unclassified';
    filesByLayer[layer] ??= [];
    filesByLayer[layer].push(filePath);
  }

  return {
    modules,
    layers: REPO_LAYER_MODEL.backend.map((layer) => ({
      ...layer,
      files: filesByLayer[layer.id] ?? [],
    })),
  };
}

function collectMobileIndex(rootDir) {
  const mobileFiles = walkFiles(rootDir, 'mobile/src');
  const featuresDir = path.join(rootDir, 'mobile', 'src', 'features');
  const featureRoots = fs.existsSync(featuresDir)
    ? fs
        .readdirSync(featuresDir, { withFileTypes: true })
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name)
        .toSorted()
    : [];
  const screenFiles = mobileFiles.filter((filePath) => filePath.startsWith('mobile/src/screens/') && filePath.endsWith('.tsx'));
  const storyFiles = mobileFiles.filter((filePath) => filePath.startsWith('mobile/src/stories/') && filePath.endsWith('.stories.tsx'));

  const filesByLayer = {};
  for (const filePath of mobileFiles) {
    const layer = classifyMobileLayer(filePath) ?? 'unclassified';
    filesByLayer[layer] ??= [];
    filesByLayer[layer].push(filePath);
  }

  return {
    featureRoots,
    screens: screenFiles,
    stories: storyFiles,
    layers: REPO_LAYER_MODEL.mobile.map((layer) => ({
      ...layer,
      files: filesByLayer[layer.id] ?? [],
    })),
  };
}

export function buildRepoIndex(rootDir = repoRoot) {
  return {
    schemaVersion: 1,
    rootScripts: Object.keys(JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8')).scripts ?? {}).toSorted(),
    layerModel: {
      backend: REPO_LAYER_MODEL.backend.map((layer) => ({
        id: layer.id,
        label: layer.label,
        description: layer.description,
        allowedImports: getAllowedLayerImports('backend', layer.id),
      })),
      mobile: REPO_LAYER_MODEL.mobile.map((layer) => ({
        id: layer.id,
        label: layer.label,
        description: layer.description,
        allowedImports: getAllowedLayerImports('mobile', layer.id),
      })),
    },
    backend: collectBackendIndex(rootDir),
    mobile: collectMobileIndex(rootDir),
  };
}

function parseArgs(argv) {
  return {
    checkOnly: argv.includes('--check'),
    printOnly: argv.includes('--print'),
  };
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  const index = buildRepoIndex();

  if (options.printOnly) {
    console.log(JSON.stringify(index, null, 2));
    return;
  }

  const next = `${JSON.stringify(index, null, 2)}\n`;
  const current = fs.existsSync(REPO_INDEX_PATH) ? fs.readFileSync(REPO_INDEX_PATH, 'utf8') : null;

  if (options.checkOnly) {
    if (current !== next) {
      console.error(`Repo index drift detected. Run "npm run repo:index" to refresh ${path.relative(repoRoot, REPO_INDEX_PATH)}.`);
      process.exit(1);
    }

    console.log(`Repo index is in sync at ${path.relative(repoRoot, REPO_INDEX_PATH)}.`);
    return;
  }

  writeJsonFile(REPO_INDEX_PATH, index);
  console.log(`Wrote ${path.relative(repoRoot, REPO_INDEX_PATH)}.`);
}

if (process.argv[1] === scriptPath) {
  main();
}
