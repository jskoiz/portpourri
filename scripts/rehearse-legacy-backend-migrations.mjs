import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');
const backendDir = path.join(repoRoot, 'backend');

const legacyMigrations = [
  '20251201092709_add_pass_model',
  '20260222184000_add_events',
];
const enumMigration = '20260315171500_sync_schema_enums';
const fixturePath = path.join(
  backendDir,
  'prisma/manual-repairs/legacy-pre-enum-fixture.sql',
);
const repairPath = path.join(
  backendDir,
  'prisma/manual-repairs/20260315171500_legacy_enum_upgrade.sql',
);

function parseArgs(argv) {
  const options = {
    databaseUrl: process.env.DATABASE_URL ?? null,
  };

  for (let index = 0; index < argv.length; index += 1) {
    if (argv[index] === '--database-url') {
      options.databaseUrl = argv[index + 1] ?? null;
      index += 1;
    }
  }

  if (!options.databaseUrl) {
    throw new Error(
      'DATABASE_URL is required. Pass --database-url or set DATABASE_URL in the environment.',
    );
  }

  return options;
}

function run(command, args, { cwd = repoRoot, env = process.env, encoding } = {}) {
  return execFileSync(command, args, {
    cwd,
    env,
    encoding,
    stdio: encoding ? ['ignore', 'pipe', 'pipe'] : 'inherit',
  });
}

function runPsql(databaseUrl, args, options = {}) {
  return run(
    'psql',
    [databaseUrl, '-v', 'ON_ERROR_STOP=1', ...args],
    options,
  );
}

function runPrisma(databaseUrl, args) {
  return run(
    'npx',
    ['prisma', ...args],
    {
      cwd: backendDir,
      env: { ...process.env, DATABASE_URL: databaseUrl },
    },
  );
}

function assertQuery(databaseUrl, query, expectedEntries) {
  const output = runPsql(
    databaseUrl,
    ['-At', '-c', query],
    { encoding: 'utf8' },
  ).trim();

  for (const expectedEntry of expectedEntries) {
    if (!output.includes(expectedEntry)) {
      throw new Error(
        `Legacy migration rehearsal assertion failed. Missing "${expectedEntry}" in query output:\n${output}`,
      );
    }
  }
}

function main() {
  const { databaseUrl } = parseArgs(process.argv.slice(2));

  runPsql(databaseUrl, [
    '-c',
    'DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public; CREATE EXTENSION IF NOT EXISTS pgcrypto;',
  ]);

  for (const migrationName of legacyMigrations) {
    runPsql(databaseUrl, [
      '-f',
      path.join(
        backendDir,
        'prisma/migrations',
        migrationName,
        'migration.sql',
      ),
    ]);
  }

  runPsql(databaseUrl, ['-f', fixturePath]);

  for (const migrationName of legacyMigrations) {
    runPrisma(databaseUrl, ['migrate', 'resolve', '--applied', migrationName]);
  }

  runPsql(databaseUrl, ['-f', repairPath]);
  runPrisma(databaseUrl, ['migrate', 'resolve', '--applied', enumMigration]);
  runPrisma(databaseUrl, ['migrate', 'deploy']);

  assertQuery(
    databaseUrl,
    [
      'SELECT string_agg(DISTINCT auth_provider::text, \',\' ORDER BY auth_provider::text) FROM users;',
      'SELECT string_agg(DISTINCT gender::text, \',\' ORDER BY gender::text) FROM users;',
      'SELECT string_agg(DISTINCT intensity_level::text, \',\' ORDER BY intensity_level::text) FROM user_fitness_profile;',
      'SELECT string_agg(DISTINCT category::text, \',\' ORDER BY category::text) FROM events;',
      'SELECT string_agg(DISTINCT type::text, \',\' ORDER BY type::text) FROM messages;',
      'SELECT string_agg(DISTINCT status::text, \',\' ORDER BY status::text) FROM reports;',
      'SELECT to_regclass(\'public.notifications\');',
      'SELECT to_regclass(\'public.notification_preferences\');',
    ].join(' '),
    [
      'EMAIL',
      'FEMALE',
      'MALE',
      'NON_BINARY',
      'BEGINNER',
      'INTERMEDIATE',
      'ADVANCED',
      'FITNESS',
      'HIKING',
      'TEXT',
      'PENDING',
      'notifications',
      'notification_preferences',
    ],
  );

  console.log('Legacy backend migration rehearsal passed.');
}

if (process.argv[1] === scriptPath) {
  try {
    main();
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
