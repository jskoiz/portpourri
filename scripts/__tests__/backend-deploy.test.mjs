import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import test from 'node:test';
import assert from 'node:assert/strict';
import {
  parseDotEnv,
  validateEnv,
} from '../validate-backend-env.mjs';
import { renderDotEnv } from '../render-backend-env.mjs';
import { checkHostedBackend } from '../check-hosted-backend.mjs';
import { collectMigrationSafetyFindings } from '../check-prisma-migration-safety.mjs';

const schema = {
  required: [
    'NODE_ENV',
    'PORT',
    'POSTGRES_USER',
    'POSTGRES_PASSWORD',
    'POSTGRES_DB',
    'DATABASE_URL',
    'JWT_SECRET',
    'API_IMAGE',
    'BASE_URL',
    'API_BASE_URL',
    'ALLOWED_ORIGINS',
  ],
  properties: {
    NODE_ENV: { type: 'string', const: 'production' },
    PORT: { type: 'string', pattern: '^[0-9]{2,5}$' },
    POSTGRES_USER: { type: 'string', minLength: 1 },
    POSTGRES_PASSWORD: { type: 'string', minLength: 1 },
    POSTGRES_DB: { type: 'string', minLength: 1 },
    DATABASE_URL: { type: 'string', format: 'postgresql-url' },
    JWT_SECRET: { type: 'string', minLength: 32 },
    API_IMAGE: { type: 'string', format: 'image-reference' },
    BASE_URL: { type: 'string', format: 'https-url' },
    API_BASE_URL: { type: 'string', format: 'https-url' },
    ALLOWED_ORIGINS: { type: 'string', format: 'csv-https-urls' },
  },
};

const validEnv = {
  NODE_ENV: 'production',
  PORT: '3010',
  POSTGRES_USER: 'brdg',
  POSTGRES_PASSWORD: 'super-secret-password',
  POSTGRES_DB: 'brdg',
  DATABASE_URL: 'postgresql://brdg:super-secret-password@postgres:5432/brdg',
  JWT_SECRET: '12345678901234567890123456789012',
  API_IMAGE: 'ghcr.io/jskoiz/brdg-api:abcdef1234567890',
  BASE_URL: 'https://api.brdg.social',
  API_BASE_URL: 'https://api.brdg.social',
  ALLOWED_ORIGINS: 'https://brdg.social, https://admin.brdg.social',
};

test('parseDotEnv reads key/value pairs and ignores comments', () => {
  assert.deepEqual(
    parseDotEnv([
      '# comment',
      'NODE_ENV=production',
      'PORT=3010',
      '',
    ].join('\n')),
    {
      NODE_ENV: 'production',
      PORT: '3010',
    },
  );
});

test('validateEnv accepts a complete production backend env payload', () => {
  const result = validateEnv(schema, validEnv);
  assert.equal(result.valid, true);
  assert.deepEqual(result.errors, []);
});

test('validateEnv rejects malformed hosted backend env payloads', () => {
  const result = validateEnv(schema, {
    ...validEnv,
    ALLOWED_ORIGINS: 'http://localhost:3000',
    API_IMAGE: 'not-an-image-tag',
  });

  assert.equal(result.valid, false);
  assert.match(result.errors.join('\n'), /ALLOWED_ORIGINS/);
  assert.match(result.errors.join('\n'), /API_IMAGE/);
});

test('renderDotEnv preserves schema key ordering', () => {
  assert.deepEqual(
    renderDotEnv(schema, validEnv).trim().split('\n').slice(0, 3),
    [
      'NODE_ENV=production',
      'PORT=3010',
      'POSTGRES_USER=brdg',
    ],
  );
});

test('checkHostedBackend passes when health and guarded routes return expected statuses', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        build: {
          gitSha: 'abcdef1234567890',
          imageTag: 'ghcr.io/jskoiz/brdg-api:abcdef1234567890',
          buildTime: '2026-03-25T20:00:00Z',
          source: 'https://github.com/example/repo/actions/runs/1',
        },
      }));
      return;
    }

    if (req.url === '/build-info') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        gitSha: 'abcdef1234567890',
        imageTag: 'ghcr.io/jskoiz/brdg-api:abcdef1234567890',
        buildTime: '2026-03-25T20:00:00Z',
        source: 'https://github.com/example/repo/actions/runs/1',
      }));
      return;
    }

    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (
      (req.method === 'PATCH' && req.url === '/profile') ||
      (req.method === 'PATCH' && req.url === '/profile/fitness') ||
      (req.method === 'POST' && req.url === '/profile/photos')
    ) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'Unauthorized' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const apiBaseUrl =
    typeof address === 'object' && address
      ? `http://127.0.0.1:${address.port}`
      : 'http://127.0.0.1:0';

  try {
    const result = await checkHostedBackend({
      apiBaseUrl,
      expectedBuild: {
        gitSha: 'abcdef1234567890',
        imageTag: 'ghcr.io/jskoiz/brdg-api:abcdef1234567890',
        buildTime: '2026-03-25T20:00:00Z',
        source: 'https://github.com/example/repo/actions/runs/1',
      },
    });
    assert.equal(result.ok, true);
    assert.equal(
      result.results.every((entry) => entry.ok),
      true,
    );
    assert.equal(result.provenanceResults.every((entry) => entry.ok), true);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('checkHostedBackend reports mismatched hosted statuses', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/build-info') {
      res.writeHead(502, { 'content-type': 'text/plain' });
      res.end('bad gateway');
      return;
    }

    res.writeHead(502, { 'content-type': 'text/plain' });
    res.end('bad gateway');
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const apiBaseUrl =
    typeof address === 'object' && address
      ? `http://127.0.0.1:${address.port}`
      : 'http://127.0.0.1:0';

  try {
    const result = await checkHostedBackend({ apiBaseUrl });
    assert.equal(result.ok, false);
    assert.match(
      result.results.find((entry) => entry.path === '/health').bodySnippet,
      /bad gateway/,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('checkHostedBackend fails when hosted build provenance does not match the expected manifest', async () => {
  const server = http.createServer((req, res) => {
    if (req.url === '/health') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        status: 'ok',
        build: {
          gitSha: 'stale1234567',
          imageTag: 'ghcr.io/jskoiz/brdg-api:stale1234567',
          buildTime: '2026-03-24T20:00:00Z',
          source: 'https://github.com/example/repo/actions/runs/old',
        },
      }));
      return;
    }

    if (req.url === '/build-info') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({
        gitSha: 'stale1234567',
        imageTag: 'ghcr.io/jskoiz/brdg-api:stale1234567',
        buildTime: '2026-03-24T20:00:00Z',
        source: 'https://github.com/example/repo/actions/runs/old',
      }));
      return;
    }

    if (req.url === '/') {
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (
      (req.method === 'PATCH' && req.url === '/profile') ||
      (req.method === 'PATCH' && req.url === '/profile/fitness') ||
      (req.method === 'POST' && req.url === '/profile/photos')
    ) {
      res.writeHead(401, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ message: 'Unauthorized' }));
      return;
    }

    res.writeHead(404);
    res.end();
  });

  await new Promise((resolve) => server.listen(0, resolve));
  const address = server.address();
  const apiBaseUrl =
    typeof address === 'object' && address
      ? `http://127.0.0.1:${address.port}`
      : 'http://127.0.0.1:0';

  try {
    const result = await checkHostedBackend({
      apiBaseUrl,
      expectedBuild: {
        gitSha: 'abcdef1234567890',
        imageTag: 'ghcr.io/jskoiz/brdg-api:abcdef1234567890',
      },
    });

    assert.equal(result.ok, false);
    assert.equal(
      result.provenanceResults.some((entry) => entry.field === 'gitSha' && entry.ok === false),
      true,
    );
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});

test('collectMigrationSafetyFindings flags enum replacement and guarded column drops', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-migration-safety-'));
  const migrationDir = path.join(
    fixtureRoot,
    '20270101000000_bad_enum_swap',
  );
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.writeFileSync(
    path.join(migrationDir, 'migration.sql'),
    [
      'CREATE TYPE "Gender" AS ENUM (\'MALE\', \'FEMALE\');',
      'ALTER TABLE "users" DROP COLUMN "gender",',
      'ADD COLUMN "gender" "Gender" NOT NULL;',
      'ALTER TABLE "events" DROP COLUMN "image_url";',
    ].join('\n'),
  );

  const findings = collectMigrationSafetyFindings({ migrationsDir: fixtureRoot });
  assert.equal(findings.length, 2);
  assert.match(findings[0].message, /expand\/backfill\/contract/);
  assert.match(findings[1].message, /drops guarded column/);
});

test('collectMigrationSafetyFindings allows safe alter-column enum conversions', () => {
  const fixtureRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'brdg-migration-safe-'));
  const migrationDir = path.join(
    fixtureRoot,
    '20270102000000_safe_alter',
  );
  fs.mkdirSync(migrationDir, { recursive: true });
  fs.writeFileSync(
    path.join(migrationDir, 'migration.sql'),
    [
      'CREATE TYPE "Gender" AS ENUM (\'MALE\', \'FEMALE\');',
      'ALTER TABLE "users"',
      '  ALTER COLUMN "gender" TYPE "Gender"',
      '  USING (CASE lower(trim("gender")) WHEN \'male\' THEN \'MALE\'::"Gender" ELSE \'FEMALE\'::"Gender" END);',
    ].join('\n'),
  );

  const findings = collectMigrationSafetyFindings({ migrationsDir: fixtureRoot });
  assert.deepEqual(findings, []);
});
