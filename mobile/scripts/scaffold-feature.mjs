import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const defaultRootDir = path.resolve(scriptDir, '..');

function toWords(name) {
  return name
    .trim()
    .replace(/[_/]+/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[\s-]+/)
    .filter(Boolean);
}

function toParamCase(name) {
  return toWords(name).join('-').toLowerCase();
}

function toPascalCase(name) {
  return toWords(name)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join('');
}

function titleCase(name) {
  return toWords(name)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function buildFeatureScaffold(name) {
  const featureSlug = toParamCase(name);
  const featureName = toPascalCase(name);
  const featureTitle = titleCase(name);
  const componentName = `${featureName}Panel`;

  const featureDir = `src/features/${featureSlug}`;

  return [
    {
      path: `${featureDir}/README.md`,
      content: `# ${featureTitle}

- \`components/${componentName}.tsx\`: reusable feature surface
- \`hooks/use${featureName}.ts\`: local state and orchestration seam
- \`__tests__/${componentName}.test.tsx\`: focused component behavior test
- \`../../stories/${componentName}.stories.tsx\`: Storybook coverage for visual review
`,
    },
    {
      path: `${featureDir}/components/${componentName}.tsx`,
      content: `import React from 'react';
import { Text } from 'react-native';
import { Card } from '../../../design/primitives';
import { useTheme } from '../../../theme/useTheme';

export function ${componentName}({
  body = 'Describe the primary state here.',
  title = '${featureTitle}',
}: {
  body?: string;
  title?: string;
}) {
  const theme = useTheme();

  return (
    <Card>
      <Text style={{ color: theme.textPrimary, fontSize: 18, fontWeight: '700' }}>{title}</Text>
      <Text style={{ color: theme.textMuted, marginTop: 8 }}>{body}</Text>
    </Card>
  );
}
`,
    },
    {
      path: `${featureDir}/hooks/use${featureName}.ts`,
      content: `import { useState } from 'react';

export function use${featureName}(initialValue = '') {
  const [value, setValue] = useState(initialValue);

  return {
    value,
    setValue,
  };
}
`,
    },
    {
      path: `${featureDir}/__tests__/${componentName}.test.tsx`,
      content: `import React from 'react';
import { renderWithProviders } from '../../../lib/testing/renderWithProviders';
import { ${componentName} } from '../components/${componentName}';

describe('${componentName}', () => {
  it('renders the provided copy', () => {
    const { getByText } = renderWithProviders(
      <${componentName} title="${featureTitle}" body="Ready for Storybook review." />,
    );

    expect(getByText('${featureTitle}')).toBeTruthy();
    expect(getByText('Ready for Storybook review.')).toBeTruthy();
  });
});
`,
    },
    {
      path: `${featureDir}/index.ts`,
      content: `export * from './components/${componentName}';
export * from './hooks/use${featureName}';
`,
    },
    {
      path: `src/stories/${componentName}.stories.tsx`,
      content: `import type { Meta, StoryObj } from '@storybook/react-native';
import React from 'react';
import { ${componentName} } from '../features/${featureSlug}/components/${componentName}';
import { withStorySurface } from './support';

const meta = {
  title: 'Features/${featureTitle}/${componentName}',
  component: ${componentName},
  decorators: [withStorySurface()],
  args: {
    body: 'Use this story to tune spacing, hierarchy, and state copy.',
    title: '${featureTitle}',
  },
} satisfies Meta<typeof ${componentName}>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
`,
    },
  ];
}

function writeFiles(rootDir, files, force = false) {
  for (const file of files) {
    const absolutePath = path.join(rootDir, file.path);
    if (!force && fs.existsSync(absolutePath)) {
      throw new Error(`Refusing to overwrite existing file: ${file.path}`);
    }

    fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
    fs.writeFileSync(absolutePath, file.content);
  }
}

function parseArgs(argv) {
  const options = {
    force: false,
    dryRun: false,
    name: '',
    rootDir: defaultRootDir,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--name') {
      options.name = argv[index + 1] ?? '';
      index += 1;
    } else if (argument === '--root-dir') {
      options.rootDir = path.resolve(argv[index + 1] ?? defaultRootDir);
      index += 1;
    } else if (argument === '--force') {
      options.force = true;
    } else if (argument === '--dry-run') {
      options.dryRun = true;
    }
  }

  return options;
}

function main() {
  const options = parseArgs(process.argv.slice(2));
  if (!options.name.trim()) {
    throw new Error('Usage: npm run feature:new -- --name "Example Feature"');
  }

  const files = buildFeatureScaffold(options.name);
  if (options.dryRun) {
    for (const file of files) {
      console.log(file.path);
    }
    return;
  }

  writeFiles(options.rootDir, files, options.force);
  console.log(`Created mobile feature scaffold for "${options.name}" (${files.length} files).`);
}

if (process.argv[1] === scriptPath) {
  main();
}
