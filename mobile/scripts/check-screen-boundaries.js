const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'src', 'screens');
const featuresRoot = path.resolve(__dirname, '..', 'src', 'features');
const files = fs
  .readdirSync(root)
  .filter((file) => file.endsWith('.tsx'))
  .map((file) => path.join(root, file));

const violations = [];
const targetScreens = new Set([
  'ChatScreen.tsx',
  'CreateScreen.tsx',
  'ExploreScreen.tsx',
  'HomeScreen.tsx',
  'ProfileScreen.tsx',
]);
const maxTargetScreenLines = 220;

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');
  const lineCount = content.split('\n').length;
  const fileName = path.basename(file);

  if (content.includes("../api/client") || content.includes('../api/client')) {
    violations.push(`${path.relative(path.resolve(__dirname, '..'), file)} imports raw api/client`);
  }

  if (targetScreens.has(fileName)) {
    if (content.includes('StyleSheet.create(')) {
      violations.push(`${path.relative(path.resolve(__dirname, '..'), file)} defines route-local StyleSheet.create`);
    }

    if (lineCount > maxTargetScreenLines) {
      violations.push(
        `${path.relative(path.resolve(__dirname, '..'), file)} exceeds ${maxTargetScreenLines} lines (${lineCount})`,
      );
    }
  }
}

const featureFiles = [];

function collectFeatureFiles(directory) {
  const entries = fs.readdirSync(directory, { withFileTypes: true });
  for (const entry of entries) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      collectFeatureFiles(entryPath);
      continue;
    }
    if (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx')) {
      featureFiles.push(entryPath);
    }
  }
}

collectFeatureFiles(featuresRoot);

for (const file of featureFiles) {
  const content = fs.readFileSync(file, 'utf8');
  if (
    content.includes("components/ui/AppButton") ||
    content.includes("components/ui/AppInput") ||
    content.includes("components/ui/AppCard") ||
    content.includes("components/ui/AppState")
  ) {
    violations.push(
      `${path.relative(path.resolve(__dirname, '..'), file)} imports legacy ui wrapper instead of design primitive`,
    );
  }
}

if (violations.length > 0) {
  console.error('Screen boundary violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}
