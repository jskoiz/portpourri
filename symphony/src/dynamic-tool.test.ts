import test from 'node:test';
import assert from 'node:assert/strict';
import { dynamicToolSpecs, executeDynamicTool } from './codex/dynamic-tool.js';
import type { Logger } from './types.js';

const logger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

test('dynamic tool specs advertise linear_graphql', () => {
  assert.deepEqual(dynamicToolSpecs(), [
    {
      name: 'linear_graphql',
      description: 'Execute a raw GraphQL query or mutation against Linear using Symphony\'s configured auth.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'GraphQL query or mutation document to execute against Linear.',
          },
          variables: {
            type: ['object', 'null'],
            description: 'Optional GraphQL variables object.',
            additionalProperties: true,
          },
        },
      },
    },
  ]);
});

test('unsupported dynamic tools fail with supported list', async () => {
  const response = await executeDynamicTool('nope', {}, { linearApiKey: 'token', logger });
  assert.equal(response.success, false);
  const output = JSON.parse(response.output) as { error: { supportedTools: string[] } };
  assert.deepEqual(output.error.supportedTools, ['linear_graphql']);
});

test('linear_graphql validates required arguments before calling Linear', async () => {
  const response = await executeDynamicTool('linear_graphql', { variables: { id: '1' } }, { linearApiKey: 'token', logger });
  assert.equal(response.success, false);
  const output = JSON.parse(response.output) as { error: { message: string } };
  assert.match(output.error.message, /requires a non-empty `query` string/);
});
