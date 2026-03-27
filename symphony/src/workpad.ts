import type { HandoffReport, Issue, ProgressReport } from './types.js';

export interface WorkpadSnapshot {
  plan: string | null;
  acceptanceCriteria: string | null;
  validation: string | null;
  notes: string | null;
  status: string | null;
  summary: string | null;
  branchName: string | null;
  prUrl: string | null;
  error: string | null;
}

const EMPTY_LABEL = '_Not reported yet._';

function trimSection(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function sectionValue(value: string | null | undefined): string {
  return trimSection(value) ?? EMPTY_LABEL;
}

function captureSection(body: string, heading: string): string | null {
  const pattern = new RegExp(`### ${heading}\\n([\\s\\S]*?)(?=\\n### |$)`);
  const match = body.match(pattern);
  return trimSection(match?.[1] ?? null);
}

export function parseWorkpadSnapshot(body: string): WorkpadSnapshot {
  return {
    plan: captureSection(body, 'Plan'),
    acceptanceCriteria: captureSection(body, 'Acceptance Criteria'),
    validation: captureSection(body, 'Validation'),
    notes: captureSection(body, 'Notes'),
    status: null,
    summary: null,
    branchName: null,
    prUrl: null,
    error: null,
  };
}

export function mergeProgressReport(snapshot: WorkpadSnapshot, report: ProgressReport): WorkpadSnapshot {
  return {
    ...snapshot,
    plan: trimSection(report.plan) ?? snapshot.plan,
    acceptanceCriteria: trimSection(report.acceptanceCriteria) ?? snapshot.acceptanceCriteria,
    validation: trimSection(report.validation) ?? snapshot.validation,
    notes: trimSection(report.notes) ?? snapshot.notes,
  };
}

export function mergeHandoffReport(snapshot: WorkpadSnapshot, report: HandoffReport): WorkpadSnapshot {
  return {
    ...snapshot,
    validation: trimSection(report.validation) ?? snapshot.validation,
    summary: trimSection(report.summary) ?? snapshot.summary,
    status: trimSection(report.status) ?? snapshot.status,
    branchName: trimSection(report.branchName) ?? snapshot.branchName,
    prUrl: trimSection(report.prUrl) ?? snapshot.prUrl,
  };
}

export function renderWorkpad(
  issue: Issue,
  snapshot: WorkpadSnapshot,
  context: {
    runtimeRevision: string | null;
    attempt: number;
    workspacePath: string;
  },
): string {
  const noteLines = [
    `- Symphony runtime revision: ${context.runtimeRevision ?? 'unknown'}`,
    `- Attempt: ${context.attempt + 1}`,
    `- Workspace: ${context.workspacePath}`,
    `- Current issue state: ${issue.state}`,
    `- Blocked by: ${issue.blocked_by_summary}`,
  ];

  if (snapshot.status) {
    noteLines.push(`- Run status: ${snapshot.status}`);
  }
  if (snapshot.branchName) {
    noteLines.push(`- Branch: ${snapshot.branchName}`);
  }
  if (snapshot.prUrl) {
    noteLines.push(`- PR: ${snapshot.prUrl}`);
  }
  if (snapshot.summary) {
    noteLines.push(`- Summary: ${snapshot.summary}`);
  }
  if (snapshot.error) {
    noteLines.push(`- Last error: ${snapshot.error}`);
  }
  if (snapshot.notes) {
    noteLines.push('', snapshot.notes);
  }

  return [
    '## Codex Workpad',
    '',
    '### Plan',
    sectionValue(snapshot.plan),
    '',
    '### Acceptance Criteria',
    sectionValue(snapshot.acceptanceCriteria),
    '',
    '### Validation',
    sectionValue(snapshot.validation),
    '',
    '### Notes',
    ...noteLines,
  ].join('\n').trim();
}

export function createEmptyWorkpadSnapshot(): WorkpadSnapshot {
  return {
    plan: null,
    acceptanceCriteria: null,
    validation: null,
    notes: null,
    status: 'running',
    summary: null,
    branchName: null,
    prUrl: null,
    error: null,
  };
}

export function extractOriginalIssueIdentifier(description: string | null): string | null {
  if (!description) {
    return null;
  }
  const match = description.match(/Original implementation issue\s*:\s*([A-Za-z]+-\d+)/i);
  return match?.[1] ?? null;
}
