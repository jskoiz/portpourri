import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import {
  loadSchema,
  validateEnvOrThrow,
} from './validate-backend-env.mjs';

const scriptPath = fileURLToPath(import.meta.url);
const scriptDir = path.dirname(scriptPath);
const repoRoot = path.resolve(scriptDir, '..');

function parseArgs(argv) {
  const options = {
    schema: null,
    output: null,
    jsonInput: null,
    ssmPrefix: null,
    cloudflaredCredentialsOutput: null,
    cloudflaredConfigTemplate: null,
    cloudflaredConfigOutput: null,
    sets: [],
  };

  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (argument === '--schema') {
      options.schema = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--output') {
      options.output = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--json-input') {
      options.jsonInput = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--ssm-prefix') {
      options.ssmPrefix = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--cloudflared-credentials-output') {
      options.cloudflaredCredentialsOutput = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--cloudflared-config-template') {
      options.cloudflaredConfigTemplate = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--cloudflared-config-output') {
      options.cloudflaredConfigOutput = argv[index + 1] ?? null;
      index += 1;
    } else if (argument === '--set') {
      options.sets.push(argv[index + 1] ?? '');
      index += 1;
    }
  }

  if (!options.schema || !options.output) {
    throw new Error(
      'Usage: node ./scripts/render-backend-env.mjs --schema <schema-path> --output <env-file> [--ssm-prefix <prefix> | --json-input <file>] [--set KEY=VALUE] [--cloudflared-credentials-output <path> --cloudflared-config-template <path> --cloudflared-config-output <path>]',
    );
  }

  if (!options.ssmPrefix && !options.jsonInput) {
    throw new Error('Either --ssm-prefix or --json-input is required');
  }

  return options;
}

function fetchSsmParametersByPath(prefix) {
  const values = {};
  let nextToken = null;

  do {
    const args = [
      'ssm',
      'get-parameters-by-path',
      '--path',
      prefix,
      '--with-decryption',
      '--recursive',
      '--output',
      'json',
    ];
    if (nextToken) {
      args.push('--starting-token', nextToken);
    }

    const output = execFileSync('aws', args, {
      cwd: repoRoot,
      encoding: 'utf8',
    });
    const payload = JSON.parse(output);
    for (const parameter of payload.Parameters ?? []) {
      values[path.basename(parameter.Name)] = parameter.Value ?? '';
    }
    nextToken = payload.NextToken ?? null;
  } while (nextToken);

  return values;
}

function applyOverrides(values, overrides) {
  const next = { ...values };

  for (const override of overrides) {
    const separatorIndex = override.indexOf('=');
    if (separatorIndex === -1) {
      throw new Error(`Invalid --set override "${override}". Use KEY=VALUE.`);
    }

    const key = override.slice(0, separatorIndex).trim();
    const value = override.slice(separatorIndex + 1);
    next[key] = value;
  }

  return next;
}

function writeFile(absolutePath, content) {
  fs.mkdirSync(path.dirname(absolutePath), { recursive: true });
  fs.writeFileSync(absolutePath, content);
}

export function renderDotEnv(schema, values) {
  const orderedKeys = [
    ...new Set([
      ...(schema.required ?? []),
      ...Object.keys(schema.properties ?? {}).filter((key) => key in values),
    ]),
  ];

  return `${orderedKeys
    .filter((key) => key in values)
    .map((key) => `${key}=${values[key]}`)
    .join('\n')}\n`;
}

function renderCloudflaredFiles(options, values) {
  if (
    !options.cloudflaredCredentialsOutput &&
    !options.cloudflaredConfigOutput
  ) {
    return;
  }

  const rawCredentials = values.CLOUDFLARED_CREDENTIALS_JSON;
  if (!rawCredentials) {
    throw new Error(
      'CLOUDFLARED_CREDENTIALS_JSON is required when rendering cloudflared runtime files.',
    );
  }

  const credentials = JSON.parse(rawCredentials);
  const tunnelId = credentials.TunnelID;
  if (!tunnelId) {
    throw new Error(
      'CLOUDFLARED_CREDENTIALS_JSON must include TunnelID for config rendering.',
    );
  }

  if (options.cloudflaredCredentialsOutput) {
    writeFile(
      path.resolve(repoRoot, options.cloudflaredCredentialsOutput),
      `${JSON.stringify(credentials, null, 2)}\n`,
    );
  }

  if (options.cloudflaredConfigOutput) {
    if (!options.cloudflaredConfigTemplate) {
      throw new Error(
        '--cloudflared-config-template is required when --cloudflared-config-output is set',
      );
    }
    const template = fs.readFileSync(
      path.resolve(repoRoot, options.cloudflaredConfigTemplate),
      'utf8',
    );
    writeFile(
      path.resolve(repoRoot, options.cloudflaredConfigOutput),
      template.replaceAll('__CLOUDFLARED_TUNNEL_ID__', tunnelId),
    );
  }
}

function loadValues(options) {
  if (options.jsonInput) {
    return JSON.parse(
      fs.readFileSync(path.resolve(repoRoot, options.jsonInput), 'utf8'),
    );
  }
  return fetchSsmParametersByPath(options.ssmPrefix);
}

function main() {
  try {
    const options = parseArgs(process.argv.slice(2));
    const schema = loadSchema(options.schema);
    const values = applyOverrides(loadValues(options), options.sets);

    validateEnvOrThrow(schema, values);
    renderCloudflaredFiles(options, values);

    writeFile(
      path.resolve(repoRoot, options.output),
      renderDotEnv(schema, values),
    );
  } catch (error) {
    console.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

if (process.argv[1] === scriptPath) {
  main();
}
