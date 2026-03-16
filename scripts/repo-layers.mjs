import path from 'node:path';

const backendLayerSpecs = [
  {
    id: 'base',
    label: 'config/base',
    description: 'Environment parsing, shared enums, and cross-cutting backend contracts.',
    allowedImports: ['base'],
    matches(filePath) {
      return (
        filePath.startsWith('backend/src/config/') ||
        filePath.startsWith('backend/src/common/') ||
        filePath.endsWith('/common/enums.ts')
      );
    },
  },
  {
    id: 'persistence',
    label: 'infra/persistence',
    description: 'Database client and persistence wiring.',
    allowedImports: ['base', 'persistence'],
    matches(filePath) {
      return filePath.startsWith('backend/src/prisma/');
    },
  },
  {
    id: 'contracts',
    label: 'transport/contracts',
    description: 'DTOs, typed request contracts, and backend module-local types.',
    allowedImports: ['base', 'contracts'],
    matches(filePath) {
      return (
        filePath.endsWith('.dto.ts') ||
        filePath.endsWith('.types.ts') ||
        filePath.endsWith('.interface.ts')
      );
    },
  },
  {
    id: 'domain',
    label: 'domain/service',
    description: 'Business logic, strategies, and module-local service helpers.',
    allowedImports: ['base', 'persistence', 'contracts', 'domain'],
    matches(filePath) {
      return (
        filePath.endsWith('.service.ts') ||
        filePath.endsWith('.strategy.ts') ||
        filePath.endsWith('.guard.ts') ||
        filePath.endsWith('match-classification.ts')
      );
    },
  },
  {
    id: 'transport',
    label: 'transport',
    description: 'Controllers, request/response filters, and route entrypoints.',
    allowedImports: ['base', 'contracts', 'domain', 'transport'],
    matches(filePath) {
      return filePath.endsWith('.controller.ts') || filePath.includes('/filters/');
    },
  },
  {
    id: 'app',
    label: 'app-shell',
    description: 'Nest modules and application bootstrap wiring.',
    allowedImports: ['base', 'persistence', 'contracts', 'domain', 'transport', 'app'],
    matches(filePath) {
      return (
        filePath.endsWith('.module.ts') ||
        filePath === 'backend/src/main.ts' ||
        filePath === 'backend/src/app.controller.ts' ||
        filePath === 'backend/src/app.service.ts' ||
        filePath === 'backend/src/app.module.ts'
      );
    },
  },
];

const mobileLayerSpecs = [
  {
    id: 'foundation',
    label: 'config/foundation',
    description: 'Runtime env, shared constants, theme tokens, and navigation type contracts.',
    allowedImports: ['foundation'],
    matches(filePath) {
      return (
        filePath.startsWith('mobile/src/config/') ||
        filePath.startsWith('mobile/src/constants/') ||
        filePath.startsWith('mobile/src/theme/') ||
        filePath.startsWith('mobile/src/types/') ||
        filePath === 'mobile/src/api/types.ts' ||
        filePath === 'mobile/src/core/navigation/types.ts'
      );
    },
  },
  {
    id: 'data',
    label: 'api/store',
    description: 'HTTP adapters, service wrappers, auth state, and query-key plumbing.',
    allowedImports: ['foundation', 'data'],
    matches(filePath) {
      return (
        filePath.startsWith('mobile/src/api/') ||
        filePath.startsWith('mobile/src/services/') ||
        filePath.startsWith('mobile/src/store/') ||
        filePath.startsWith('mobile/src/lib/query/')
      );
    },
  },
  {
    id: 'shared-ui',
    label: 'shared-ui',
    description: 'Reusable UI primitives, utility helpers, and shared interaction surfaces.',
    allowedImports: ['foundation', 'data', 'shared-ui'],
    matches(filePath) {
      return (
        filePath.startsWith('mobile/src/components/') ||
        filePath.startsWith('mobile/src/design/') ||
        (filePath.startsWith('mobile/src/lib/') &&
          !filePath.startsWith('mobile/src/lib/query/') &&
          !filePath.startsWith('mobile/src/lib/testing/')) ||
        filePath.startsWith('mobile/src/core/observability/')
      );
    },
  },
  {
    id: 'feature',
    label: 'feature',
    description: 'Feature-owned hooks, feature state, and presentational modules.',
    allowedImports: ['foundation', 'data', 'shared-ui', 'feature'],
    matches(filePath) {
      return filePath.startsWith('mobile/src/features/');
    },
  },
  {
    id: 'screen',
    label: 'screen',
    description: 'Route entry surfaces that compose features and shared UI.',
    allowedImports: ['foundation', 'data', 'shared-ui', 'feature', 'screen'],
    matches(filePath) {
      return filePath.startsWith('mobile/src/screens/');
    },
  },
  {
    id: 'app-shell',
    label: 'app-shell',
    description: 'Navigation containers and top-level provider wiring.',
    allowedImports: ['foundation', 'data', 'shared-ui', 'feature', 'screen', 'app-shell'],
    matches(filePath) {
      return (
        filePath.startsWith('mobile/src/navigation/') ||
        filePath.startsWith('mobile/src/core/providers/')
      );
    },
  },
];

function classifyPath(filePath, specs) {
  for (const spec of specs) {
    if (spec.matches(filePath)) {
      return spec.id;
    }
  }

  return null;
}

function localImportToPath(fromFilePath, importPath) {
  if (!importPath.startsWith('.')) {
    return null;
  }

  return path.normalize(path.join(path.dirname(fromFilePath), importPath)).replace(/\\/g, '/');
}

export const REPO_LAYER_MODEL = {
  backend: backendLayerSpecs.map(({ id, label, description, allowedImports }) => ({
    id,
    label,
    description,
    allowedImports,
  })),
  mobile: mobileLayerSpecs.map(({ id, label, description, allowedImports }) => ({
    id,
    label,
    description,
    allowedImports,
  })),
};

export function classifyBackendLayer(filePath) {
  return classifyPath(filePath, backendLayerSpecs);
}

export function classifyMobileLayer(filePath) {
  return classifyPath(filePath, mobileLayerSpecs);
}

export function classifyRepoLayer(filePath) {
  if (filePath.startsWith('backend/src/')) {
    return { area: 'backend', layer: classifyBackendLayer(filePath) };
  }

  if (filePath.startsWith('mobile/src/')) {
    return { area: 'mobile', layer: classifyMobileLayer(filePath) };
  }

  return { area: null, layer: null };
}

export function resolveLocalImportTarget(fromFilePath, importPath) {
  return localImportToPath(fromFilePath, importPath);
}

export function getAllowedLayerImports(area, layerId) {
  const specs = area === 'backend' ? backendLayerSpecs : area === 'mobile' ? mobileLayerSpecs : [];
  const layer = specs.find((spec) => spec.id === layerId);
  return layer?.allowedImports ?? [];
}

export function describeLayer(area, layerId) {
  const specs = area === 'backend' ? backendLayerSpecs : area === 'mobile' ? mobileLayerSpecs : [];
  return specs.find((spec) => spec.id === layerId) ?? null;
}
