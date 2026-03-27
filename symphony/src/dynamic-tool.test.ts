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

function buildContext() {
  return {
    linearApiKey: 'token',
    linearEndpoint: 'https://api.linear.app/graphql',
    logger,
    onProgress: async () => {},
    onHandoff: async () => {},
  };
}

test('dynamic tool specs advertise read and reporting tools', () => {
  assert.deepEqual(
    dynamicToolSpecs().map((tool) => tool.name),
    ['linear_graphql', 'report_progress', 'report_handoff'],
  );
});

test('unsupported dynamic tools fail with supported list', async () => {
  const response = await executeDynamicTool('nope', {}, buildContext());
  assert.equal(response.success, false);
  const output = JSON.parse(response.output) as { error: { supportedTools: string[] } };
  assert.deepEqual(output.error.supportedTools, ['linear_graphql', 'report_progress', 'report_handoff']);
});

test('linear_graphql validates required arguments before calling Linear', async () => {
  const response = await executeDynamicTool('linear_graphql', { variables: { id: '1' } }, buildContext());
  assert.equal(response.success, false);
  const output = JSON.parse(response.output) as { error: { message: string } };
  assert.match(output.error.message, /requires a non-empty `query` string/);
});

test('linear_graphql rejects mutations because the tool is read-only', async () => {
  const response = await executeDynamicTool(
    'linear_graphql',
    { query: 'mutation Nope { issueUpdate(id: "1", input: { title: "x" }) { success } }' },
    buildContext(),
  );
  assert.equal(response.success, false);
  const output = JSON.parse(response.output) as { error: { message: string } };
  assert.match(output.error.message, /read-only/);
});

test('report_progress forwards payloads to the service callback', async () => {
  let reportedPlan = '';
  const response = await executeDynamicTool('report_progress', { plan: 'Do the thing' }, {
    ...buildContext(),
    onProgress: async (report) => {
      reportedPlan = report.plan ?? '';
    },
  });
  assert.equal(response.success, true);
  assert.equal(reportedPlan, 'Do the thing');
});

test('report_handoff requires a summary and forwards payloads to the service callback', async () => {
  let desiredState = '';
  const response = await executeDynamicTool('report_handoff', {
    summary: 'Ready for review',
    desiredState: 'Human Review',
  }, {
    ...buildContext(),
    onHandoff: async (report) => {
      desiredState = report.desiredState ?? '';
    },
  });
  assert.equal(response.success, true);
  assert.equal(desiredState, 'Human Review');
});
