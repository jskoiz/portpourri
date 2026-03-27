import test from 'node:test';
import assert from 'node:assert/strict';
import type { Issue } from './types.js';
import { buildIssueDispatchFingerprint } from './service.js';

const baseIssue: Issue = {
  id: 'issue-1',
  identifier: 'BRG-1',
  title: 'Example',
  description: 'Initial description',
  priority: 1,
  state: 'Todo',
  branch_name: null,
  url: 'https://example.com',
  labels: ['mobile'],
  created_at: '2026-03-16T10:00:00.000Z',
  updated_at: '2026-03-16T10:00:00.000Z',
  blocked_by: [],
  blocked_by_summary: 'none',
  tracker: {
    state_id: 'todo',
    state_type: 'unstarted',
    team_id: 'team-1',
    team_key: 'BRDG',
    team_name: 'BRDG',
  },
};

test('issue dispatch fingerprint stays stable for unchanged issues', () => {
  const left = buildIssueDispatchFingerprint(baseIssue);
  const right = buildIssueDispatchFingerprint({ ...baseIssue });
  assert.equal(left, right);
});

test('issue dispatch fingerprint changes when issue state changes', () => {
  const original = buildIssueDispatchFingerprint(baseIssue);
  const changed = buildIssueDispatchFingerprint({
    ...baseIssue,
    state: 'Human Review',
    updated_at: '2026-03-16T10:05:00.000Z',
    tracker: {
      ...baseIssue.tracker,
      state_id: 'review',
      state_type: 'started',
    },
  });
  assert.notEqual(original, changed);
});

test('issue dispatch fingerprint changes when labels or description change', () => {
  const original = buildIssueDispatchFingerprint(baseIssue);
  const relabeled = buildIssueDispatchFingerprint({
    ...baseIssue,
    labels: ['mobile', 'urgent'],
  });
  const redesc = buildIssueDispatchFingerprint({
    ...baseIssue,
    description: 'Updated description',
    updated_at: '2026-03-16T10:02:00.000Z',
  });
  assert.notEqual(original, relabeled);
  assert.notEqual(original, redesc);
});

test('issue dispatch fingerprint changes when blockers change', () => {
  const original = buildIssueDispatchFingerprint(baseIssue);
  const blocked = buildIssueDispatchFingerprint({
    ...baseIssue,
    blocked_by: [{
      id: 'issue-2',
      identifier: 'BRG-2',
      state: 'Todo',
      created_at: null,
      updated_at: null,
    }],
    blocked_by_summary: 'BRG-2',
  });
  assert.notEqual(original, blocked);
});
