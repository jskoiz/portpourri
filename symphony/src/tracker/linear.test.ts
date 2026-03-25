import test from 'node:test';
import assert from 'node:assert/strict';
import { LinearTracker } from './linear.js';
import { LinearError } from '../errors.js';
import type { Logger } from '../types.js';

const logger: Logger = {
  debug() {},
  info() {},
  warn() {},
  error() {},
};

function buildIssue(id: string, priority = 2) {
  return {
    id,
    identifier: `BRDG-${id}`,
    title: `Issue ${id}`,
    description: null,
    priority,
    branchName: null,
    url: null,
    createdAt: null,
    updatedAt: null,
    state: { id: 'todo', name: 'Todo', type: 'unstarted' },
    labels: { nodes: [{ name: 'Mobile' }] },
  };
}

test('listIssuesForStates paginates past the first 100 issues', async () => {
  const calls: Array<Record<string, unknown>> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async (_input, init) => {
    const body = JSON.parse(String(init?.body)) as { variables: Record<string, unknown> };
    calls.push(body.variables);

    const cursor = body.variables.cursor;
    if (cursor == null) {
      return new Response(JSON.stringify({
        data: {
          issues: {
            pageInfo: { hasNextPage: true, endCursor: 'cursor-1' },
            nodes: [buildIssue('1', 3)],
          },
        },
      }), { status: 200 });
    }

    return new Response(JSON.stringify({
      data: {
        issues: {
          pageInfo: { hasNextPage: false, endCursor: null },
          nodes: [buildIssue('2', 1)],
        },
      },
    }), { status: 200 });
  }) as typeof fetch;

  try {
    const tracker = new LinearTracker('token', logger);
    const issues = await tracker.listIssuesForStates('proj', ['Todo']);

    assert.equal(calls.length, 2);
    assert.equal(calls[0]?.cursor, null);
    assert.equal(calls[1]?.cursor, 'cursor-1');
    assert.deepEqual(
      issues.map((issue) => issue.id),
      ['1', '2'],
    );
    assert.deepEqual(issues[0]?.labels, ['mobile']);
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('listIssuesForStates stops pagination when Linear omits endCursor', async () => {
  const warnings: Array<{ message: string; fields?: Record<string, unknown> }> = [];
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    data: {
      issues: {
        pageInfo: { hasNextPage: true, endCursor: null },
        nodes: [buildIssue('1')],
      },
    },
  }), { status: 200 })) as typeof fetch;

  try {
    const tracker = new LinearTracker('token', {
      ...logger,
      warn(message, fields) {
        warnings.push({ message, fields });
      },
    });
    const issues = await tracker.listIssuesForStates('proj', ['Todo']);

    assert.deepEqual(issues.map((issue) => issue.id), ['1']);
    assert.equal(warnings.length, 1);
    assert.equal(warnings[0]?.message, 'linear.pagination_missing_cursor');
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('listIssuesForStates surfaces HTTP failures as LinearError', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response('nope', { status: 503 })) as typeof fetch;

  try {
    const tracker = new LinearTracker('token', logger);
    await assert.rejects(
      () => tracker.listIssuesForStates('proj', ['Todo']),
      (error: unknown) =>
        error instanceof LinearError &&
        /status 503/.test(error.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test('listIssuesForStates surfaces GraphQL errors as LinearError', async () => {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = (async () => new Response(JSON.stringify({
    errors: [{ message: 'bad query' }],
  }), { status: 200 })) as typeof fetch;

  try {
    const tracker = new LinearTracker('token', logger);
    await assert.rejects(
      () => tracker.listIssuesForStates('proj', ['Todo']),
      (error: unknown) =>
        error instanceof LinearError &&
        /bad query/.test(error.message),
    );
  } finally {
    globalThis.fetch = originalFetch;
  }
});
