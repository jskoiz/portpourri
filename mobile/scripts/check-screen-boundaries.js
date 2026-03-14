const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'src', 'screens');
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

if (violations.length > 0) {
  console.error('Screen boundary violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}
