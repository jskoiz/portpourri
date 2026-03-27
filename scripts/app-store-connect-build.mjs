import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DEFAULT_API_BASE = 'https://api.appstoreconnect.apple.com/v1';
const DEFAULT_BUNDLE_ID = process.env.IOS_BUNDLE_IDENTIFIER || 'com.avmillabs.brdg';
const VALID_PROCESSING_STATES = new Set([
  'VALID',
  'READY_FOR_BETA_TESTING',
  'READY_FOR_BETA_SUBMISSION',
]);
const FAILED_PROCESSING_STATES = new Set([
  'FAILED',
  'INVALID',
  'PROCESSING_EXCEPTION',
]);

function fail(message) {
  throw new Error(message);
}

export function detectAppStoreConnectKeyPath(keyId, homeDir = process.env.HOME || '') {
  if (!keyId) {
    return '';
  }

  const candidates = [
    path.join(process.cwd(), 'private_keys', `AuthKey_${keyId}.p8`),
    path.join(homeDir, 'private_keys', `AuthKey_${keyId}.p8`),
    path.join(homeDir, '.private_keys', `AuthKey_${keyId}.p8`),
    path.join(homeDir, '.appstoreconnect', 'private_keys', `AuthKey_${keyId}.p8`),
  ];

  return candidates.find((candidate) => fs.existsSync(candidate)) || '';
}

function base64UrlEncode(value) {
  return Buffer.from(value)
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');
}

export function buildAscJwt({
  keyId,
  issuerId,
  privateKeyPem,
  now = new Date(),
}) {
  if (!keyId || !issuerId || !privateKeyPem) {
    fail('App Store Connect API key auth requires key id, issuer id, and private key contents');
  }

  const issuedAt = Math.floor(now.getTime() / 1000);
  const expiresAt = issuedAt + (19 * 60);
  const header = base64UrlEncode(JSON.stringify({
    alg: 'ES256',
    kid: keyId,
    typ: 'JWT',
  }));
  const payload = base64UrlEncode(JSON.stringify({
    iss: issuerId,
    aud: 'appstoreconnect-v1',
    iat: issuedAt,
    exp: expiresAt,
  }));
  const unsignedToken = `${header}.${payload}`;
  const signature = crypto
    .sign('sha256', Buffer.from(unsignedToken), crypto.createPrivateKey(privateKeyPem))
    .toString('base64')
    .replaceAll('+', '-')
    .replaceAll('/', '_')
    .replace(/=+$/u, '');

  return `${unsignedToken}.${signature}`;
}

export function extractBuildNumber(build) {
  const value = build?.attributes?.version ?? build?.attributes?.buildNumber ?? null;
  if (value === null || value === undefined || value === '') {
    return null;
  }
  return String(value);
}

export function summarizeBuild(build) {
  if (!build) {
    return null;
  }

  return {
    id: build.id ?? null,
    buildNumber: extractBuildNumber(build),
    processingState: build.attributes?.processingState ?? null,
    uploadedDate: build.attributes?.uploadedDate ?? null,
    appVersion: build.attributes?.appVersion ?? null,
    expirationDate: build.attributes?.expirationDate ?? null,
  };
}

async function fetchJson(url, { token, fetchImpl = fetch } = {}) {
  const response = await fetchImpl(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.errors?.map((error) => error.detail).filter(Boolean).join('; ');
    fail(`App Store Connect request failed (${response.status}): ${detail || response.statusText}`);
  }

  return payload;
}

async function requestJson(url, {
  token,
  method = 'GET',
  body,
  fetchImpl = fetch,
} = {}) {
  const response = await fetchImpl(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = payload?.errors?.map((error) => error.detail).filter(Boolean).join('; ');
    fail(`App Store Connect request failed (${response.status}): ${detail || response.statusText}`);
  }

  return payload;
}

function getRequiredCredentials() {
  const keyId = process.env.ASC_API_KEY_ID || '';
  const issuerId = process.env.ASC_API_ISSUER_ID || '';
  const keyPath = process.env.ASC_API_KEY_PATH || detectAppStoreConnectKeyPath(keyId);

  if (!keyId || !issuerId) {
    fail('ASC_API_KEY_ID and ASC_API_ISSUER_ID must be set for App Store Connect automation');
  }
  if (!keyPath) {
    fail(`Unable to locate AuthKey_${keyId}.p8; set ASC_API_KEY_PATH to the App Store Connect private key file`);
  }
  if (!fs.existsSync(keyPath)) {
    fail(`ASC_API_KEY_PATH does not exist: ${keyPath}`);
  }

  return {
    keyId,
    issuerId,
    keyPath,
  };
}

async function createAuthToken() {
  const credentials = getRequiredCredentials();
  const privateKeyPem = fs.readFileSync(credentials.keyPath, 'utf8');
  return {
    ...credentials,
    token: buildAscJwt({
      keyId: credentials.keyId,
      issuerId: credentials.issuerId,
      privateKeyPem,
    }),
  };
}

export async function resolveAscAppId({
  bundleId = DEFAULT_BUNDLE_ID,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = fetch,
  token,
}) {
  const url = new URL('/apps', apiBase);
  url.searchParams.set('filter[bundleId]', bundleId);
  url.searchParams.set('limit', '1');
  const payload = await fetchJson(url, { token, fetchImpl });
  const app = payload?.data?.[0];
  if (!app?.id) {
    fail(`No App Store Connect app found for bundle id ${bundleId}`);
  }
  return {
    appId: app.id,
    bundleId,
  };
}

async function listBuilds({
  appId,
  bundleId = DEFAULT_BUNDLE_ID,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = fetch,
  token,
  buildNumber,
  limit = 1,
}) {
  const url = new URL('/builds', apiBase);
  url.searchParams.set('filter[app]', appId);
  url.searchParams.set('sort', '-uploadedDate');
  url.searchParams.set('limit', String(limit));
  url.searchParams.set('fields[builds]', 'version,appVersion,processingState,uploadedDate,expirationDate');
  if (buildNumber) {
    url.searchParams.set('filter[version]', String(buildNumber));
  }

  const payload = await fetchJson(url, { token, fetchImpl });
  return {
    bundleId,
    appId,
    builds: payload?.data ?? [],
  };
}

export async function fetchLatestBuild({
  bundleId = DEFAULT_BUNDLE_ID,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = fetch,
  authToken,
} = {}) {
  const token = authToken ?? (await createAuthToken()).token;
  const { appId } = await resolveAscAppId({ bundleId, apiBase, fetchImpl, token });
  const result = await listBuilds({ appId, bundleId, apiBase, fetchImpl, token, limit: 1 });
  return {
    bundleId,
    appId,
    latestBuild: summarizeBuild(result.builds[0] ?? null),
  };
}

export async function fetchBuildByNumber({
  bundleId = DEFAULT_BUNDLE_ID,
  buildNumber,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = fetch,
  authToken,
} = {}) {
  if (!buildNumber) {
    fail('buildNumber is required');
  }

  const token = authToken ?? (await createAuthToken()).token;
  const { appId } = await resolveAscAppId({ bundleId, apiBase, fetchImpl, token });
  const result = await listBuilds({
    appId,
    bundleId,
    apiBase,
    fetchImpl,
    token,
    buildNumber,
    limit: 1,
  });

  return {
    bundleId,
    appId,
    build: summarizeBuild(result.builds[0] ?? null),
  };
}

export async function fetchNextBuildNumber(options = {}) {
  const latest = await fetchLatestBuild(options);
  const latestBuildNumber = Number.parseInt(latest.latestBuild?.buildNumber ?? '0', 10);
  const nextBuildNumber = Number.isFinite(latestBuildNumber) ? latestBuildNumber + 1 : 1;
  return {
    ...latest,
    latestBuildNumber: latest.latestBuild?.buildNumber ?? null,
    nextBuildNumber: String(nextBuildNumber),
  };
}

/**
 * Sets the per-build "What to Test" notes for a specific build via the
 * buildBetaDetails resource.  This is the per-build field testers see —
 * NOT the app-level betaAppLocalizations description (which is a single
 * piece of copy shared across all builds).
 */
export async function setBuildWhatsNew({
  bundleId = DEFAULT_BUNDLE_ID,
  buildNumber,
  whatsNew,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = fetch,
  authToken,
} = {}) {
  if (!whatsNew || !whatsNew.trim()) {
    fail('whatsNew is required');
  }
  if (!buildNumber) {
    fail('buildNumber is required');
  }

  const token = authToken ?? (await createAuthToken()).token;
  const { appId } = await resolveAscAppId({ bundleId, apiBase, fetchImpl, token });

  // Resolve build id from build number
  const buildResult = await listBuilds({
    appId,
    bundleId,
    apiBase,
    fetchImpl,
    token,
    buildNumber,
    limit: 1,
  });
  const build = buildResult.builds[0];
  if (!build?.id) {
    fail(`No build found with number ${buildNumber} for bundle id ${bundleId}`);
  }

  // Fetch the buildBetaDetail linked to this build
  const detailUrl = new URL(`/builds/${build.id}/buildBetaDetail`, apiBase);
  detailUrl.searchParams.set('fields[buildBetaDetails]', 'whatsNew');
  const detailPayload = await fetchJson(detailUrl, { token, fetchImpl });
  const detail = detailPayload?.data;

  if (!detail?.id) {
    fail(`No buildBetaDetail found for build ${buildNumber}`);
  }

  // PATCH the whatsNew field on the existing buildBetaDetail
  const payload = await requestJson(new URL(`/buildBetaDetails/${detail.id}`, apiBase), {
    token,
    method: 'PATCH',
    body: {
      data: {
        type: 'buildBetaDetails',
        id: detail.id,
        attributes: {
          whatsNew,
        },
      },
    },
    fetchImpl,
  });

  return {
    bundleId,
    appId,
    buildNumber: String(buildNumber),
    buildId: build.id,
    action: 'updated',
    buildBetaDetail: payload?.data ?? null,
  };
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function waitForBuildProcessing({
  bundleId = DEFAULT_BUNDLE_ID,
  buildNumber,
  timeoutSeconds = 900,
  intervalSeconds = 15,
  apiBase = DEFAULT_API_BASE,
  fetchImpl = fetch,
  authToken,
} = {}) {
  if (!buildNumber) {
    fail('buildNumber is required');
  }

  const token = authToken ?? (await createAuthToken()).token;
  const startedAt = new Date().toISOString();
  const deadline = Date.now() + (timeoutSeconds * 1000);
  let attempts = 0;
  let lastBuild = null;

  while (Date.now() <= deadline) {
    attempts += 1;
    const result = await fetchBuildByNumber({
      bundleId,
      buildNumber,
      apiBase,
      fetchImpl,
      authToken: token,
    });

    lastBuild = result.build;
    if (lastBuild?.processingState && VALID_PROCESSING_STATES.has(lastBuild.processingState)) {
      return {
        bundleId,
        buildNumber: String(buildNumber),
        status: 'ready',
        attempts,
        startedAt,
        completedAt: new Date().toISOString(),
        build: lastBuild,
      };
    }
    if (lastBuild?.processingState && FAILED_PROCESSING_STATES.has(lastBuild.processingState)) {
      fail(`Build ${buildNumber} entered App Store Connect processing state ${lastBuild.processingState}`);
    }

    await sleep(intervalSeconds * 1000);
  }

  return {
    bundleId,
    buildNumber: String(buildNumber),
    status: 'timeout',
    attempts,
    startedAt,
    completedAt: new Date().toISOString(),
    build: lastBuild,
  };
}

function parseArgs(argv) {
  const values = {
    _: [],
    bundleId: DEFAULT_BUNDLE_ID,
    timeoutSeconds: 900,
    intervalSeconds: 15,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    switch (arg) {
      case '--bundle-id':
        values.bundleId = argv[index + 1];
        index += 1;
        break;
      case '--build':
        values.build = argv[index + 1];
        index += 1;
        break;
      case '--timeout-seconds':
        values.timeoutSeconds = Number.parseInt(argv[index + 1], 10);
        index += 1;
        break;
      case '--interval-seconds':
        values.intervalSeconds = Number.parseInt(argv[index + 1], 10);
        index += 1;
        break;
      case '--notes-file':
        values.notesFile = argv[index + 1];
        index += 1;
        break;
      case '--description':
        values.description = argv[index + 1];
        index += 1;
        break;
      case '-h':
      case '--help':
        values.help = true;
        break;
      default:
        values._.push(arg);
        break;
    }
  }

  return values;
}

function printUsage() {
  process.stdout.write([
    'Usage: node ./scripts/app-store-connect-build.mjs <command> [options]',
    '',
    'Commands:',
    '  latest-build             Print the latest App Store Connect build for the bundle id',
    '  next-build               Print the next build number for the bundle id',
    '  wait-processing          Poll until a specific build appears and reaches a ready state',
    '  publish-build-whats-new  Set per-build "What to Test" notes via buildBetaDetails',
    '',
    'Options:',
    '  --bundle-id <id>         Defaults to IOS_BUNDLE_IDENTIFIER or com.avmillabs.brdg',
    '  --build <number>         Required for wait-processing',
    '  --timeout-seconds <n>    Defaults to 900',
    '  --interval-seconds <n>   Defaults to 15',
    '  --notes-file <path>      Read the "What to Test" body from a file',
    '  --description <text>     Inline "What to Test" body',
    '',
  ].join('\n'));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help || args._.length === 0) {
    printUsage();
    process.exit(args.help ? 0 : 1);
  }

  const [command] = args._;
  let payload;

  if (command === 'latest-build') {
    payload = await fetchLatestBuild({ bundleId: args.bundleId });
  } else if (command === 'next-build') {
    payload = await fetchNextBuildNumber({ bundleId: args.bundleId });
  } else if (command === 'wait-processing') {
    payload = await waitForBuildProcessing({
      bundleId: args.bundleId,
      buildNumber: args.build,
      timeoutSeconds: args.timeoutSeconds,
      intervalSeconds: args.intervalSeconds,
    });
    if (payload.status !== 'ready') {
      process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
      process.exit(1);
    }
  } else if (command === 'publish-build-whats-new') {
    const whatsNew = args.notesFile
      ? fs.readFileSync(path.resolve(args.notesFile), 'utf8')
      : args.description;
    payload = await setBuildWhatsNew({
      bundleId: args.bundleId,
      buildNumber: args.build,
      whatsNew,
    });
  } else {
    fail(`Unknown command: ${command}`);
  }

  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    process.stderr.write(`app-store-connect-build: ${error.message}\n`);
    process.exit(1);
  });
}
