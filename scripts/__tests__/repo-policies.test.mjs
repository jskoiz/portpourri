import test from 'node:test';
import assert from 'node:assert/strict';
import {
  collectRepoPolicyViolations,
  collectStorybookCoverageViolations,
} from '../check-repo-policies.mjs';

test('flags raw env access outside config layers', () => {
  const violations = collectRepoPolicyViolations({
    files: {
      'backend/src/main.ts': 'const value = process.env.JWT_SECRET;',
      'backend/src/config/app.config.ts': 'const safe = process.env.JWT_SECRET;',
      'package.json': '{"scripts":{}}',
    },
    rootPackage: { scripts: {} },
    scope: 'backend',
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /raw process\.env access/);
});

test('flags undocumented top-level scripts in repo-wide policy mode', () => {
  const violations = collectRepoPolicyViolations({
    files: {
      'AGENTS.md': '# Docs\n',
      'docs/HARNESS.md': '# Harness\n',
      'package.json': '{"scripts":{}}',
      'scripts/new-tool.mjs': 'console.log("hi");',
    },
    rootPackage: { scripts: {} },
    scope: 'all',
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /top-level script is not reachable/);
});

test('allows documented top-level scripts', () => {
  const rootPackage = {
    scripts: {
      'docs:check': 'node ./scripts/check-docs.mjs',
    },
  };
  const violations = collectRepoPolicyViolations({
    files: {
      'AGENTS.md': '# Docs\n',
      'docs/HARNESS.md': '# Harness\nUse `npm run docs:check`.\n',
      'package.json': JSON.stringify(rootPackage),
      'scripts/check-docs.mjs': 'console.log("ok");',
    },
    rootPackage,
    scope: 'all',
  });

  assert.deepEqual(violations, []);
});

test('storybook coverage rule only blocks reusable mobile UI changes without story updates', () => {
  const violations = collectStorybookCoverageViolations([
    'mobile/src/components/ui/AppBackButton.tsx',
  ]);
  assert.equal(violations.length, 1);
});
