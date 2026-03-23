import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');

const guardedTables = new Set([
  'users',
  'user_profile',
  'user_fitness_profile',
  'messages',
  'reports',
  'events',
  'matches',
  'notifications',
]);

const historicalAllowlist = new Set([
  '20260315171500_sync_schema_enums',
]);

const createEnumPattern = /CREATE TYPE "([^"]+)" AS ENUM/gu;
const alterTablePattern = /ALTER TABLE "([^"]+)"\s+([\s\S]*?);/gu;
const dropColumnPattern = /DROP COLUMN "([^"]+)"/gu;
const addColumnPattern =
  /ADD COLUMN\s+"([^"]+)"\s+(?:"([^"]+)"|([A-Za-z0-9_]+(?:\([^)]*\))?))/gu;

export function collectMigrationSafetyFindings({
  migrationsDir = path.join(repoRoot, 'backend/prisma/migrations'),
} = {}) {
  const findings = [];

  for (const entry of fs.readdirSync(migrationsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }

    const migrationName = entry.name;
    if (historicalAllowlist.has(migrationName)) {
      continue;
    }

    const migrationPath = path.join(migrationsDir, migrationName, 'migration.sql');
    if (!fs.existsSync(migrationPath)) {
      continue;
    }

    const sql = fs.readFileSync(migrationPath, 'utf8');
    const enumTypes = new Set(
      [...sql.matchAll(createEnumPattern)].map((match) => match[1]),
    );

    for (const match of sql.matchAll(alterTablePattern)) {
      const [, tableName, body] = match;
      const dropColumns = [...body.matchAll(dropColumnPattern)].map(
        (dropMatch) => dropMatch[1],
      );
      const addColumns = new Map(
        [...body.matchAll(addColumnPattern)].map((addMatch) => [
          addMatch[1],
          addMatch[2] ?? addMatch[3] ?? '',
        ]),
      );
      const replacedColumns = new Set();

      for (const columnName of dropColumns) {
        const nextType = addColumns.get(columnName);
        if (nextType) {
          replacedColumns.add(columnName);
          if (enumTypes.has(nextType)) {
            findings.push({
              migrationName,
              filePath: path.relative(repoRoot, migrationPath).replace(/\\/g, '/'),
              message:
                `replaces ${tableName}.${columnName} with enum ${nextType} via DROP COLUMN + ADD COLUMN; ` +
                'use expand/backfill/contract instead of destructive replacement',
            });
            continue;
          }

          findings.push({
            migrationName,
            filePath: path.relative(repoRoot, migrationPath).replace(/\\/g, '/'),
            message:
              `recreates ${tableName}.${columnName} via DROP COLUMN + ADD COLUMN ${nextType}; ` +
              'use an explicit backfill or ALTER COLUMN ... TYPE migration',
          });
        }
      }

      if (!guardedTables.has(tableName) || body.includes('migration-safety: allow-drop')) {
        continue;
      }

      for (const columnName of dropColumns) {
        if (replacedColumns.has(columnName)) {
          continue;
        }

        findings.push({
          migrationName,
          filePath: path.relative(repoRoot, migrationPath).replace(/\\/g, '/'),
          message:
            `drops guarded column ${tableName}.${columnName}; ` +
            'remove the drop or document a staged expand/contract plan before merging',
        });
      }
    }
  }

  return findings;
}

function main() {
  const findings = collectMigrationSafetyFindings();
  if (findings.length === 0) {
    return;
  }

  console.error('Prisma migration safety violations:');
  for (const finding of findings) {
    console.error(`- ${finding.filePath}: ${finding.message}`);
  }
  process.exit(1);
}

if (process.argv[1] === scriptPath) {
  main();
}
