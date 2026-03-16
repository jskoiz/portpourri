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

test('allows workflow-only harness entrypoints', () => {
  const violations = collectRepoPolicyViolations({
    files: {
      'AGENTS.md': '# Docs\n',
      'docs/HARNESS.md': '# Harness\n',
      'package.json': '{"scripts":{}}',
      '.github/workflows/ci.yml': 'run: node ./scripts/run-harness-lane.mjs --lane pr-fast',
      'scripts/run-harness-lane.mjs': 'console.log("ok");',
    },
    rootPackage: { scripts: {} },
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

test('flags backend layer violations when domain code imports transport code', () => {
  const violations = collectRepoPolicyViolations({
    files: {
      'backend/src/auth/auth.service.ts': "import { AuthController } from './auth.controller';\nexport class AuthService {}",
      'backend/src/auth/auth.controller.ts': 'export class AuthController {}',
      'package.json': '{"scripts":{}}',
    },
    rootPackage: { scripts: {} },
    scope: 'backend',
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /domain\/service layer cannot import transport layer/);
});

test('allows backend domain code to import transport contracts', () => {
  const violations = collectRepoPolicyViolations({
    files: {
      'backend/src/auth/auth.service.ts': "import { LoginDto } from './auth.dto';\nexport class AuthService {}",
      'backend/src/auth/auth.dto.ts': 'export class LoginDto {}',
      'package.json': '{"scripts":{}}',
    },
    rootPackage: { scripts: {} },
    scope: 'backend',
  });

  assert.deepEqual(violations, []);
});

test('flags mobile layer violations when feature code imports a screen', () => {
  const violations = collectRepoPolicyViolations({
    files: {
      'mobile/src/features/profile/hooks/useProfile.ts': "import ProfileScreen from '../../../screens/ProfileScreen';\nexport const useProfile = () => ProfileScreen;",
      'mobile/src/screens/ProfileScreen.tsx': 'export default function ProfileScreen() { return null; }',
      'package.json': '{"scripts":{}}',
    },
    rootPackage: { scripts: {} },
    scope: 'mobile',
  });

  assert.equal(violations.length, 1);
  assert.match(violations[0], /feature layer cannot import screen layer/);
});
