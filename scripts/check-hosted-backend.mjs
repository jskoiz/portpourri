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
    ...GUARDED_ROUTE_CHECKS,
  ].map((check) => ({
    ...check,
    url: new URL(check.path, apiBaseUrl).toString(),
  }));
}

export async function checkHostedBackend({
  apiBaseUrl,
  fetchImpl = globalThis.fetch,
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
      error: null,
    });
  }

  return {
    ok: results.every((result) => result.ok),
    results,
  };
}

function parseArgs(argv) {
  const options = {
    apiBaseUrl: process.env.API_BASE_URL || 'https://api.brdg.social',
  };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--api-base-url') {
      options.apiBaseUrl = argv[index + 1] ?? options.apiBaseUrl;
      index += 1;
    }
  }

  return options;
}

async function main() {
  try {
    const { apiBaseUrl } = parseArgs(process.argv.slice(2));
    const result = await checkHostedBackend({ apiBaseUrl });

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
