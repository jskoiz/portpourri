import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildRepoIndex } from './generate-repo-index.mjs';
import { ACTIVE_DOCS } from './doc-policy.mjs';
import {
  classifyRepoLayer,
  describeLayer,
  getAllowedLayerImports,
  resolveLocalImportTarget,
} from './repo-layers.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');

const mobileScreenLimits = new Map([
  ['ChatScreen.tsx', 220],
  ['CreateScreen.tsx', 220],
  ['ExploreScreen.tsx', 220],
  ['HomeScreen.tsx', 220],
  ['ProfileScreen.tsx', 220],
]);

const allowedEnvFiles = new Set([
  'backend/src/config/app.config.ts',
  'backend/src/config/app.config.spec.ts',
  'mobile/src/config/env.ts',
]);

const bannedPreviewPatterns = [
  /open the preview (tab|screen)/i,
  /navigate to (the )?preview/i,
  /preview navigator/i,
  /preview stack/i,
];

const storybookRequiredPatterns = [
  /^mobile\/src\/components\/.+\.tsx$/,
  /^mobile\/src\/design\/.+\.tsx$/,
  /^mobile\/src\/features\/.+\/components\/.+\.tsx$/,
];

const storyCoverageAliases = {
  'mobile/src/components/ErrorBoundary.tsx': ['Feedback.stories.tsx'],
  'mobile/src/components/LoadingState.tsx': ['Feedback.stories.tsx'],
  'mobile/src/components/MatchAnimation.tsx': ['Feedback.stories.tsx'],
  'mobile/src/components/SwipeDeck.tsx': ['DiscoverySwipeDeck.stories.tsx'],
  'mobile/src/components/withBoundary.tsx': ['Feedback.stories.tsx'],
  'mobile/src/components/form/DateField.tsx': ['FormFields.stories.tsx'],
  'mobile/src/components/form/LocationField.tsx': ['FormFields.stories.tsx'],
  'mobile/src/components/form/SheetSelectField.tsx': ['FormFields.stories.tsx'],
  'mobile/src/components/form/StepperField.tsx': ['FormFields.stories.tsx'],
  'mobile/src/components/ui/AppBackdrop.tsx': ['AppUi.stories.tsx'],
  'mobile/src/components/ui/AppBackButton.tsx': ['AppUi.stories.tsx'],
  'mobile/src/components/ui/AppIcon.tsx': ['AppUi.stories.tsx'],
  'mobile/src/components/ui/AppNotificationButton.tsx': ['AppUi.stories.tsx'],
  'mobile/src/components/ui/AppSelect.tsx': ['AppUi.stories.tsx'],
  'mobile/src/components/ui/RetryableError.tsx': ['RetryableError.stories.tsx'],
  'mobile/src/components/ui/ToastOverlay.tsx': ['Toast.stories.tsx'],
  'mobile/src/design/primitives/index.tsx': [
    'Primitives.stories.tsx',
    'Button.stories.tsx',
    'Input.stories.tsx',
    'Card.stories.tsx',
    'StatePanel.stories.tsx',
    'Chip.stories.tsx',
  ],
  'mobile/src/design/sheets/AppBottomSheet.tsx': ['BottomSheet.stories.tsx'],
  'mobile/src/components/skeletons/ChatListSkeleton.tsx': ['Skeleton.stories.tsx'],
  'mobile/src/components/skeletons/DiscoverySkeleton.tsx': ['Skeleton.stories.tsx'],
  'mobile/src/components/skeletons/EventsSkeleton.tsx': ['Skeleton.stories.tsx'],
  'mobile/src/components/skeletons/ProfileDetailSkeleton.tsx': ['Skeleton.stories.tsx'],
  'mobile/src/features/discovery/components/DiscoveryNudgeCard.tsx': ['HomeScreenContent.stories.tsx'],
  'mobile/src/features/discovery/components/HomeHero.tsx': ['DiscoveryHero.stories.tsx'],
  'mobile/src/features/discovery/components/HomeQuickFilters.tsx': ['HomeScreenContent.stories.tsx'],
  'mobile/src/features/chat/components/ChatHeader.tsx': ['ChatThread.stories.tsx'],
  'mobile/src/features/chat/components/ChatMessageList.tsx': ['ChatThread.stories.tsx'],
  'mobile/src/features/events/explore/ExploreCards.tsx': ['ExploreEventCard.stories.tsx'],
  'mobile/src/features/onboarding/components/ActivitiesStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/EnvironmentStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/FrequencyStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/IntentStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/ReadyStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/ScheduleStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/SocialStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/SummaryStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/onboarding/components/WelcomeStep.tsx': ['OnboardingSteps.stories.tsx'],
  'mobile/src/features/profile/components/CompletenessBar.tsx': ['ProfileScreenContent.stories.tsx'],
};

const testCoverageAliases = {
  'mobile/src/components/LoadingState.tsx': ['LoadingState.test.tsx'],
  'mobile/src/components/SwipeDeck.tsx': ['SwipeDeck.test.tsx'],
  'mobile/src/components/withBoundary.tsx': ['withBoundary.test.tsx'],
  'mobile/src/components/skeletons/ChatListSkeleton.tsx': ['skeletons.test.tsx'],
  'mobile/src/components/skeletons/DiscoverySkeleton.tsx': ['skeletons.test.tsx'],
  'mobile/src/components/skeletons/EventsSkeleton.tsx': ['skeletons.test.tsx'],
  'mobile/src/components/skeletons/ProfileDetailSkeleton.tsx': ['skeletons.test.tsx'],
  'mobile/src/components/ui/RetryableError.tsx': ['RetryableError.test.tsx'],
  'mobile/src/design/primitives/index.tsx': ['primitives.test.tsx'],
  'mobile/src/design/primitives/Input.tsx': ['primitives.test.tsx'],
  'mobile/src/design/primitives/Skeleton.tsx': ['skeletons.test.tsx'],
  'mobile/src/design/primitives/StatePanel.tsx': ['primitives.test.tsx'],
  'mobile/src/components/ui/ToastOverlay.tsx': ['ToastOverlay.test.tsx'],
  'mobile/src/features/chat/components/ChatComposer.tsx': ['ChatComposer.test.tsx'],
  'mobile/src/features/chat/components/ChatHeader.tsx': ['ChatHeader.test.tsx'],
  'mobile/src/features/chat/components/ChatMessageList.tsx': ['ChatMessageList.accessibility.test.tsx'],
  'mobile/src/features/moderation/components/ReportSheet.tsx': ['ReportSheet.test.tsx'],
  'mobile/src/features/onboarding/components/ActivitiesStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/EnvironmentStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/FrequencyStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/IntentStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/ReadyStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/ScheduleStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/SocialStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/SummaryStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/onboarding/components/WelcomeStep.tsx': ['OnboardingScreen.test.tsx'],
  'mobile/src/features/profile/components/CompletenessBar.tsx': ['CompletenessBar.test.tsx'],
};

const localImportPattern = /^import\s.+?\sfrom\s+['"]([^'"]+)['"]/gm;

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

    results.push(relativePath);
  }

  return results;
}

function shouldInspectFile(filePath) {
  return (
    /\.(md|ts|tsx|js|mjs|json|ya?ml)$/.test(filePath) &&
    !filePath.includes('/node_modules/') &&
    !filePath.includes('/coverage/') &&
    !filePath.includes('/build/')
  );
}

export function loadRepoPolicyContext(rootDir = repoRoot) {
  const fileList = [
    'package.json',
    ...walkFiles(rootDir, 'backend/src'),
    ...walkFiles(rootDir, 'mobile/src'),
    ...walkFiles(rootDir, 'docs'),
    ...walkFiles(rootDir, '.github'),
    ...walkFiles(rootDir, 'scripts'),
    ...walkFiles(rootDir, 'artifacts'),
    'AGENTS.md',
    'backend/AGENTS.md',
    'mobile/AGENTS.md',
    'backend/README.md',
  ].filter((filePath) => shouldInspectFile(filePath) && fs.existsSync(path.join(rootDir, filePath)));

  const files = {};
  for (const filePath of new Set(fileList)) {
    files[filePath] = fs.readFileSync(path.join(rootDir, filePath), 'utf8');
  }

  const rootPackage = JSON.parse(files['package.json'] ?? '{"scripts":{}}');
  return { files, rootPackage };
}

export function matchesStorybookRequiredPath(filePath) {
  if (filePath === 'mobile/src/design/theme.tsx') {
    return false;
  }

  if (filePath.includes('/__tests__/') || filePath.endsWith('.test.tsx') || filePath.endsWith('.test.ts')) {
    return false;
  }

  if (/\.(styles|helpers|data)\.ts$/.test(filePath)) {
    return false;
  }

  return storybookRequiredPatterns.some((pattern) => pattern.test(filePath));
}

export function collectStorybookCoverageViolations(changedFiles) {
  const requiredFiles = changedFiles.filter(matchesStorybookRequiredPath);
  const storyTouched = changedFiles.some((filePath) => filePath.startsWith('mobile/src/stories/') && filePath.endsWith('.stories.tsx'));

  if (requiredFiles.length > 0 && !storyTouched) {
    return [`Reusable mobile UI changed without a Storybook update: ${requiredFiles.join(', ')}`];
  }

  return [];
}

function collectEnvViolations(files, scope) {
  const violations = [];

  for (const [filePath, content] of Object.entries(files)) {
    if (!/^(backend\/src|mobile\/src)\/.*\.(ts|tsx)$/.test(filePath)) {
      continue;
    }

    if (scope === 'backend' && !filePath.startsWith('backend/')) {
      continue;
    }

    if (scope === 'mobile' && !filePath.startsWith('mobile/')) {
      continue;
    }

    if (content.includes('process.env') && !allowedEnvFiles.has(filePath)) {
      violations.push(`${filePath}: raw process.env access is only allowed in config layers`);
    }
  }

  return violations;
}

function collectMobileViolations(files) {
  const violations = [];

  for (const [filePath, content] of Object.entries(files)) {
    if (filePath.startsWith('mobile/src/screens/') && filePath.endsWith('.tsx')) {
      if (content.includes('../api/client') || content.includes('../../api/client') || content.includes("from 'axios'") || content.includes('from "axios"')) {
        violations.push(`${filePath}: screen imports raw API client`);
      }

      const fileName = path.basename(filePath);
      const lineLimit = mobileScreenLimits.get(fileName);
      if (lineLimit) {
        if (content.includes('StyleSheet.create(')) {
          violations.push(`${filePath}: target screens should not define route-local StyleSheet.create`);
        }

        const lineCount = content.split('\n').length;
        if (lineCount > lineLimit) {
          violations.push(`${filePath}: target screen exceeds ${lineLimit} lines (${lineCount})`);
        }
      }
    }

    if (filePath.startsWith('mobile/src/features/') && /\.(ts|tsx)$/.test(filePath)) {
      if (
        content.includes('components/ui/AppButton') ||
        content.includes('components/ui/AppInput') ||
        content.includes('components/ui/AppCard') ||
        content.includes('components/ui/AppState')
      ) {
        violations.push(`${filePath}: imports legacy UI wrapper instead of a design primitive`);
      }
    }
  }

  return violations;
}

function collectRootViolations(files, rootPackage) {
  const violations = [];
  const scriptFiles = Object.keys(files)
    .filter((filePath) => filePath.startsWith('scripts/') && !filePath.startsWith('scripts/__tests__/'))
    .toSorted();
  const workflowText = Object.entries(files)
    .filter(([filePath]) => filePath.startsWith('.github/workflows/'))
    .map(([, content]) => content);
  const externallyReachableText = [
    ...ACTIVE_DOCS.map((filePath) => files[filePath] ?? ''),
    ...Object.values(rootPackage.scripts ?? {}),
    ...workflowText,
  ].join('\n');

  const referenceTokensForScript = (filePath) => [
    filePath,
    `./${filePath}`,
    `./${path.basename(filePath)}`,
  ];
  const textReferencesScript = (content, filePath) =>
    referenceTokensForScript(filePath).some((token) => content.includes(token));
  const reachableScripts = new Set(
    scriptFiles.filter((filePath) => textReferencesScript(externallyReachableText, filePath)),
  );

  let changed = true;
  while (changed) {
    changed = false;
    for (const filePath of scriptFiles) {
      if (reachableScripts.has(filePath)) {
        continue;
      }

      const isReferencedByReachableScript = [...reachableScripts].some((reachableScriptPath) =>
        textReferencesScript(files[reachableScriptPath] ?? '', filePath),
      );
      if (isReferencedByReachableScript) {
        reachableScripts.add(filePath);
        changed = true;
      }
    }
  }

  for (const filePath of scriptFiles) {
    if (!reachableScripts.has(filePath)) {
      violations.push(`${filePath}: top-level script is not reachable through a package script, workflow, or active docs`);
    }
  }

  for (const filePath of ACTIVE_DOCS) {
    const content = files[filePath];
    if (!content) {
      continue;
    }

    for (const pattern of bannedPreviewPatterns) {
      if (pattern.test(content)) {
        violations.push(`${filePath}: active doc references legacy preview-route workflow`);
      }
    }
  }

  return violations;
}

function resolveImportTarget(filePath, importPath, files) {
  const baseTarget = resolveLocalImportTarget(filePath, importPath);
  if (!baseTarget) {
    return null;
  }

  const candidates = [
    baseTarget,
    `${baseTarget}.ts`,
    `${baseTarget}.tsx`,
    `${baseTarget}.js`,
    `${baseTarget}.mjs`,
    `${baseTarget}.json`,
    `${baseTarget}/index.ts`,
    `${baseTarget}/index.tsx`,
    `${baseTarget}/index.js`,
    `${baseTarget}/index.mjs`,
  ];

  return candidates.find((candidate) => files[candidate] !== undefined || fs.existsSync(path.join(repoRoot, candidate))) ?? null;
}

function collectLayerViolations(files, scope) {
  const violations = [];

  for (const [filePath, content] of Object.entries(files)) {
    if (!/^(backend\/src|mobile\/src)\/.*\.(ts|tsx)$/.test(filePath)) {
      continue;
    }

    const source = classifyRepoLayer(filePath);
    if (!source.area || !source.layer) {
      continue;
    }

    if (scope === 'backend' && source.area !== 'backend') {
      continue;
    }

    if (scope === 'mobile' && source.area !== 'mobile') {
      continue;
    }

    for (const match of content.matchAll(localImportPattern)) {
      const importPath = match[1];
      const targetFilePath = resolveImportTarget(filePath, importPath, files);
      if (!targetFilePath) {
        continue;
      }

      const target = classifyRepoLayer(targetFilePath);
      if (target.area !== source.area || !target.layer) {
        continue;
      }

      const allowedLayers = getAllowedLayerImports(source.area, source.layer);
      if (allowedLayers.includes(target.layer)) {
        continue;
      }

      const sourceLayer = describeLayer(source.area, source.layer);
      const targetLayer = describeLayer(target.area, target.layer);
      violations.push(
        `${filePath}: ${sourceLayer?.label ?? source.layer} layer cannot import ${targetLayer?.label ?? target.layer} layer via ${importPath}. Allowed layers: ${allowedLayers.join(', ')}`,
      );
    }
  }

  return violations;
}

function collectRepoIndexViolations(rootDir) {
  const repoIndexPath = path.join(rootDir, 'artifacts', 'repo-index.json');
  const next = `${JSON.stringify(buildRepoIndex(rootDir), null, 2)}\n`;
  const current = fs.existsSync(repoIndexPath) ? fs.readFileSync(repoIndexPath, 'utf8') : null;
  if (current !== next) {
    return [`${path.relative(rootDir, repoIndexPath)}: generated repo index is out of sync; run "npm run repo:index"`];
  }

  return [];
}

function isStoryCovered(filePath, storyFiles) {
  const aliases = storyCoverageAliases[filePath] ?? [];
  const baseName = path.basename(filePath, path.extname(filePath));
  return storyFiles.some((storyPath) => storyPath.includes(`${baseName}.stories.tsx`) || aliases.some((alias) => storyPath.endsWith(alias)));
}

function isTestCovered(filePath, testFiles) {
  const aliases = testCoverageAliases[filePath] ?? [];
  const baseName = path.basename(filePath, path.extname(filePath));
  return testFiles.some((testPath) => testPath.includes(`${baseName}.test.tsx`) || testPath.includes(`${baseName}.test.ts`) || aliases.some((alias) => testPath.endsWith(alias)));
}

export function collectCoverageAudit(files) {
  const candidateFiles = Object.keys(files).filter(matchesStorybookRequiredPath);
  const storyFiles = Object.keys(files).filter((filePath) => filePath.startsWith('mobile/src/stories/') && filePath.endsWith('.stories.tsx'));
  const testFiles = Object.keys(files).filter((filePath) => filePath.includes('/__tests__/') || filePath.endsWith('.test.tsx') || filePath.endsWith('.test.ts'));

  return {
    storybookGaps: candidateFiles.filter((filePath) => !isStoryCovered(filePath, storyFiles)).toSorted(),
    testGaps: candidateFiles.filter((filePath) => !isTestCovered(filePath, testFiles)).toSorted(),
  };
}

export function collectRepoPolicyViolations({
  files,
  rootPackage,
  scope = 'all',
  rootDir = repoRoot,
  checkRepoIndexSync = false,
} = {}) {
  const violations = [...collectEnvViolations(files, scope)];

  if (scope === 'all' || scope === 'backend' || scope === 'mobile') {
    violations.push(...collectLayerViolations(files, scope));
  }

  if (scope === 'all' || scope === 'mobile') {
    violations.push(...collectMobileViolations(files));
  }

  if (scope === 'all') {
    violations.push(...collectRootViolations(files, rootPackage));
    if (checkRepoIndexSync) {
      violations.push(...collectRepoIndexViolations(rootDir));
    }
  }

  return violations;
}

function printCoverageAudit(files) {
  const { storybookGaps, testGaps } = collectCoverageAudit(files);
  console.log('Coverage audit');
  console.log(`- Storybook heuristic gaps: ${storybookGaps.length}`);
  for (const gap of storybookGaps) {
    console.log(`  - ${gap}`);
  }
  console.log(`- Test heuristic gaps: ${testGaps.length}`);
  for (const gap of testGaps) {
    console.log(`  - ${gap}`);
  }
}

function main() {
  const args = process.argv.slice(2);
  const scopeIndex = args.indexOf('--scope');
  const scope = scopeIndex >= 0 ? args[scopeIndex + 1] : 'all';
  const auditOnly = args.includes('--audit');
  const { files, rootPackage } = loadRepoPolicyContext();
  const violations = collectRepoPolicyViolations({
    files,
    rootPackage,
    scope,
    rootDir: repoRoot,
    checkRepoIndexSync: true,
  });

  if (violations.length > 0) {
    console.error('Repo policy violations detected:\n');
    for (const violation of violations) {
      console.error(`- ${violation}`);
    }
    process.exit(1);
  }

  if (auditOnly) {
    printCoverageAudit(files);
    return;
  }

  console.log(`Repo policy check passed for scope "${scope}".`);
}

if (process.argv[1] === scriptPath) {
  main();
}
