const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', 'src', 'screens');
const files = fs
  .readdirSync(root)
  .filter((file) => file.endsWith('.tsx'))
  .map((file) => path.join(root, file));

const violations = [];

for (const file of files) {
  const content = fs.readFileSync(file, 'utf8');

  if (content.includes("../api/client") || content.includes('../api/client')) {
    violations.push(`${path.relative(path.resolve(__dirname, '..'), file)} imports raw api/client`);
  }
}

if (violations.length > 0) {
  console.error('Screen boundary violations found:\n');
  for (const violation of violations) {
    console.error(`- ${violation}`);
  }
  process.exit(1);
}
