import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');

const formatValidators = {
  'https-url': (value) => {
    const url = new URL(value);
    if (url.protocol !== 'https:') {
      throw new Error('must use https');
    }
  },
  'postgresql-url': (value) => {
    const url = new URL(value);
    if (!['postgres:', 'postgresql:'].includes(url.protocol)) {
      throw new Error('must use postgres:// or postgresql://');
    }
  },
  'csv-https-urls': (value) => {
    const origins = value
      .split(',')
      .map((origin) => origin.trim())
      .filter(Boolean);

    if (origins.length === 0) {
      throw new Error('must include at least one origin');
    }

    for (const origin of origins) {
      formatValidators['https-url'](origin);
    }
  },
  'image-reference': (value) => {
    if (!/^[a-z0-9._/-]+:[A-Za-z0-9._-]+$/.test(value)) {
      throw new Error('must look like ghcr.io/org/image:tag');
    }
  },
};

export function loadSchema(schemaPath) {
  const absolutePath = path.resolve(repoRoot, schemaPath);
  return JSON.parse(fs.readFileSync(absolutePath, 'utf8'));
}

export function parseDotEnv(content) {
  const env = {};

  for (const rawLine of content.split(/\r?\n/u)) {
    if (!rawLine.trim() || rawLine.trimStart().startsWith('#')) {
      continue;
    }

    const separatorIndex = rawLine.indexOf('=');
    if (separatorIndex === -1) {
      continue;
    }

    const key = rawLine.slice(0, separatorIndex).trim();
    let value = rawLine.slice(separatorIndex + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith('\'') && value.endsWith('\''))
    ) {
      value = value.slice(1, -1);
    }
    env[key] = value;
  }

  return env;
}

export function validateEnv(schema, env) {
  const errors = [];
  const requiredKeys = schema.required ?? [];
  const properties = schema.properties ?? {};

  for (const key of requiredKeys) {
    if (!(key in env) || env[key] === '') {
      errors.push(`${key}: missing required value`);
    }
  }

  for (const [key, descriptor] of Object.entries(properties)) {
    if (!(key in env)) {
      continue;
    }

    const value = env[key];
    if (descriptor.type && descriptor.type !== 'string') {
      errors.push(`${key}: unsupported schema type "${descriptor.type}"`);
      continue;
    }

    if (typeof value !== 'string') {
      errors.push(`${key}: expected a string value`);
      continue;
    }

    if (typeof descriptor.minLength === 'number' && value.length < descriptor.minLength) {
      errors.push(`${key}: must be at least ${descriptor.minLength} characters`);
    }

    if (typeof descriptor.const === 'string' && value !== descriptor.const) {
      errors.push(`${key}: must equal "${descriptor.const}"`);
    }

    if (Array.isArray(descriptor.enum) && !descriptor.enum.includes(value)) {
      errors.push(`${key}: must be one of ${descriptor.enum.join(', ')}`);
    }

    if (typeof descriptor.pattern === 'string') {
      const pattern = new RegExp(descriptor.pattern, 'u');
      if (!pattern.test(value)) {
        errors.push(`${key}: does not match required pattern`);
      }
    }

    if (typeof descriptor.format === 'string') {
      const validator = formatValidators[descriptor.format];
      if (!validator) {
        errors.push(`${key}: unsupported schema format "${descriptor.format}"`);
        continue;
      }

      try {
        validator(value);
      } catch (error) {
        errors.push(
          `${key}: ${error instanceof Error ? error.message : 'invalid value'}`,
        );
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export function validateEnvOrThrow(schema, env) {
  const result = validateEnv(schema, env);
  if (!result.valid) {
    throw new Error(`Backend env validation failed:\n- ${result.errors.join('\n- ')}`);
  }
  return result;
}

function parseArgs(argv) {
  const options = {
    schema: null,
    input: null,
    jsonInput: null,
    print: false,
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--schema') {
      options.schema = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--input') {
      options.input = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--json-input') {
      options.jsonInput = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--print') {
      options.print = true;
    }
  }

  if (!options.schema) {
    throw new Error('Usage: node ./scripts/validate-backend-env.mjs --schema <schema-path> [--input <env-file> | --json-input <json-file>] [--print]');
  }

  return options;
}

function loadInput(options) {
  if (options.input) {
    return parseDotEnv(
      fs.readFileSync(path.resolve(repoRoot, options.input), 'utf8'),
    );
  }

  if (options.jsonInput) {
    return JSON.parse(
      fs.readFileSync(path.resolve(repoRoot, options.jsonInput), 'utf8'),
    );
  }

  return process.env;
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const schema = loadSchema(options.schema);
    const env = loadInput(options);
    validateEnvOrThrow(schema, env);

    if (options.print) {
      console.log(
        `Validated ${schema.required?.length ?? 0} required backend env keys.`,
      );
    }
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
