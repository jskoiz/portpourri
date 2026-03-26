import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);

export const GUARDED_ROUTE_CHECKS = [
  { method: 'PATCH', path: '/profile', expectedStatus: 401 },
  { method: 'PATCH', path: '/profile/fitness', expectedStatus: 401 },
  { method: 'POST', path: '/profile/photos', expectedStatus: 401 },
];

export function buildHostedChecks(apiBaseUrl) {
  return [
    { method: 'GET', path: '/', expectedStatus: 200 },
    { method: 'GET', path: '/health', expectedStatus: 200 },
    { method: 'GET', path: '/build-info', expectedStatus: 200 },
    ...GUARDED_ROUTE_CHECKS,
  ].map((check) => ({
    ...check,
    url: new URL(check.path, apiBaseUrl).toString(),
  }));
}

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function compareProvenance(actual, expected, surface) {
  return Object.entries(expected)
    .filter(([, expectedValue]) => expectedValue != null)
    .map(([field, expectedValue]) => {
      const actualValue = actual?.[field] ?? null;
      return {
        surface,
        field,
        expectedValue,
        actualValue,
        ok: actualValue === expectedValue,
      };
    });
}

export async function checkHostedBackend({
  apiBaseUrl,
  fetchImpl = globalThis.fetch,
  expectedBuild = {},
}) {
  const checks = buildHostedChecks(apiBaseUrl);
  const results = [];

  for (const check of checks) {
    let response;
    let body = '';
    try {
      response = await fetchImpl(check.url, {
        method: check.method,
        redirect: 'manual',
      });
      body = await response.text();
    } catch (error) {
      results.push({
        ...check,
        ok: false,
        actualStatus: null,
        bodySnippet: '',
        error: error instanceof Error ? error.message : String(error),
      });
      continue;
    }

    results.push({
      ...check,
      ok: response.status === check.expectedStatus,
      actualStatus: response.status,
      bodySnippet: body.slice(0, 200),
      json: parseJson(body),
      error: null,
    });
  }

  const healthPayload = results.find((result) => result.path === '/health')?.json;
  const buildInfoPayload = results.find((result) => result.path === '/build-info')?.json;
  const provenanceResults = [
    ...compareProvenance(healthPayload?.build ?? null, expectedBuild, '/health.build'),
    ...compareProvenance(buildInfoPayload ?? null, expectedBuild, '/build-info'),
  ];

  return {
    ok: results.every((result) => result.ok) && provenanceResults.every((result) => result.ok),
    results,
    provenanceResults,
  };
}

function parseArgs(argv) {
  const options = {
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.brdg.social',
    expectedBuild: {},
  };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--api-base-url') {
      options.apiBaseUrl = argv[index + 1] ?? options.apiBaseUrl;
      index += 1;
    } else if (argv[index] === '--expected-git-sha') {
      options.expectedBuild.gitSha = argv[index + 1] ?? null;
      index += 1;
    } else if (argv[index] === '--expected-image-tag') {
      options.expectedBuild.imageTag = argv[index + 1] ?? null;
      index += 1;
    } else if (argv[index] === '--expected-build-time') {
      options.expectedBuild.buildTime = argv[index + 1] ?? null;
      index += 1;
    } else if (argv[index] === '--expected-source') {
      options.expectedBuild.source = argv[index + 1] ?? null;
      index += 1;
    }
  }

  return options;
}

async function main() {
  try {
    const { apiBaseUrl, expectedBuild } = parseArgs(process.argv.slice(2));
    const result = await checkHostedBackend({ apiBaseUrl, expectedBuild });

    for (const check of result.results) {
      if (check.ok) {
        console.log(`${check.method} ${check.path} -> ${check.actualStatus}`);
        continue;
      }

      const detail = check.error
        ? `error=${check.error}`
        : `expected ${check.expectedStatus}, got ${check.actualStatus}, body=${JSON.stringify(check.bodySnippet)}`;
      console.error(`${check.method} ${check.path} -> ${detail}`);
    }

    for (const check of result.provenanceResults) {
      if (check.ok) {
        console.log(`${check.surface} ${check.field} -> ${check.actualValue}`);
        continue;
      }

      console.error(
        `${check.surface} ${check.field} -> expected ${JSON.stringify(check.expectedValue)}, got ${JSON.stringify(check.actualValue)}`,
      );
    }

    if (!result.ok) {
      process.exit(1);
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] === scriptPath) {
  void main();
}
