import type { HandoffReport, Logger, ProgressReport } from '../types.js';

const LINEAR_GRAPHQL_TOOL = 'linear_graphql';
const REPORT_PROGRESS_TOOL = 'report_progress';
const REPORT_HANDOFF_TOOL = 'report_handoff';

export interface DynamicToolResult {
  success: boolean;
  output: string;
  contentItems: Array<{
    type: 'inputText';
    text: string;
  }>;
}

export interface DynamicToolContext {
  linearApiKey: string;
  linearEndpoint: string;
  logger: Logger;
  onProgress: (report: ProgressReport) => Promise<void>;
  onHandoff: (report: HandoffReport) => Promise<void>;
}

function encodePayload(payload: unknown): string {
  return JSON.stringify(payload, null, 2);
}

function asResult(success: boolean, payload: unknown): DynamicToolResult {
  const output = encodePayload(payload);
  return {
    success,
    output,
    contentItems: [
      {
        type: 'inputText',
        text: output,
      },
    ],
  };
}

function normalizeLinearGraphqlArguments(argumentsValue: unknown): {
  query: string;
  variables: Record<string, unknown>;
} {
  if (typeof argumentsValue === 'string') {
    const query = argumentsValue.trim();
    if (!query) {
      throw new Error('`linear_graphql` requires a non-empty `query` string.');
    }
    return { query, variables: {} };
  }

  if (!argumentsValue || typeof argumentsValue !== 'object' || Array.isArray(argumentsValue)) {
    throw new Error('`linear_graphql` expects either a GraphQL query string or an object with `query` and optional `variables`.');
  }

  const map = argumentsValue as Record<string, unknown>;
  const query = typeof map.query === 'string' ? map.query.trim() : '';
  if (!query) {
    throw new Error('`linear_graphql` requires a non-empty `query` string.');
  }

  const variablesValue = map.variables ?? {};
  if (!variablesValue || typeof variablesValue !== 'object' || Array.isArray(variablesValue)) {
    throw new Error('`linear_graphql.variables` must be a JSON object when provided.');
  }

  return {
    query,
    variables: variablesValue as Record<string, unknown>,
  };
}

function assertReadOnlyQuery(query: string): void {
  const normalized = query
    .replace(/^#[^\n]*\n/gm, '')
    .trimStart();

  if (/^(mutation|subscription)\b/i.test(normalized)) {
    throw new Error('`linear_graphql` is read-only in BRDG Symphony. Use only GraphQL queries.');
  }

  if (!/^(query\b|\{)/.test(normalized)) {
    throw new Error('`linear_graphql` only accepts read-only query documents.');
  }
}

function asOptionalText(value: unknown, field: string): string | null {
  if (value == null) {
    return null;
  }
  if (typeof value !== 'string') {
    throw new Error(`\`${field}\` must be a string when provided.`);
  }
  const normalized = value.trim();
  return normalized ? normalized : null;
}

function normalizeProgressArguments(argumentsValue: unknown): ProgressReport {
  if (!argumentsValue || typeof argumentsValue !== 'object' || Array.isArray(argumentsValue)) {
    throw new Error('`report_progress` expects an object payload.');
  }

  const payload = argumentsValue as Record<string, unknown>;
  const report: ProgressReport = {
    plan: asOptionalText(payload.plan, 'report_progress.plan'),
    acceptanceCriteria: asOptionalText(payload.acceptanceCriteria, 'report_progress.acceptanceCriteria'),
    validation: asOptionalText(payload.validation, 'report_progress.validation'),
    notes: asOptionalText(payload.notes, 'report_progress.notes'),
  };

  if (!report.plan && !report.acceptanceCriteria && !report.validation && !report.notes) {
    throw new Error('`report_progress` requires at least one non-empty field.');
  }

  return report;
}

function normalizeHandoffArguments(argumentsValue: unknown): HandoffReport {
  if (!argumentsValue || typeof argumentsValue !== 'object' || Array.isArray(argumentsValue)) {
    throw new Error('`report_handoff` expects an object payload.');
  }

  const payload = argumentsValue as Record<string, unknown>;
  const summary = asOptionalText(payload.summary, 'report_handoff.summary');
  if (!summary) {
    throw new Error('`report_handoff.summary` is required.');
  }

  return {
    summary,
    status: asOptionalText(payload.status, 'report_handoff.status'),
    desiredState: asOptionalText(payload.desiredState, 'report_handoff.desiredState'),
    branchName: asOptionalText(payload.branchName, 'report_handoff.branchName'),
    prUrl: asOptionalText(payload.prUrl, 'report_handoff.prUrl'),
    validation: asOptionalText(payload.validation, 'report_handoff.validation'),
    originalIssueIdentifier: asOptionalText(payload.originalIssueIdentifier, 'report_handoff.originalIssueIdentifier'),
  };
}

export function dynamicToolSpecs(): Array<Record<string, unknown>> {
  return [
    {
      name: LINEAR_GRAPHQL_TOOL,
      description: 'Execute a read-only GraphQL query against Linear using Symphony\'s configured auth.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['query'],
        properties: {
          query: {
            type: 'string',
            description: 'Read-only GraphQL query document to execute against Linear.',
          },
          variables: {
            type: ['object', 'null'],
            description: 'Optional GraphQL variables object.',
            additionalProperties: true,
          },
        },
      },
    },
    {
      name: REPORT_PROGRESS_TOOL,
      description: 'Report workpad section updates back to Symphony so the service can update Linear.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        properties: {
          plan: { type: ['string', 'null'] },
          acceptanceCriteria: { type: ['string', 'null'] },
          validation: { type: ['string', 'null'] },
          notes: { type: ['string', 'null'] },
        },
      },
    },
    {
      name: REPORT_HANDOFF_TOOL,
      description: 'Report final handoff details back to Symphony so the service can route the issue and attach the PR.',
      inputSchema: {
        type: 'object',
        additionalProperties: false,
        required: ['summary'],
        properties: {
          summary: { type: 'string' },
          status: { type: ['string', 'null'] },
          desiredState: { type: ['string', 'null'] },
          branchName: { type: ['string', 'null'] },
          prUrl: { type: ['string', 'null'] },
          validation: { type: ['string', 'null'] },
          originalIssueIdentifier: { type: ['string', 'null'] },
        },
      },
    },
  ];
}

export async function executeDynamicTool(
  tool: string,
  argumentsValue: unknown,
  context: DynamicToolContext,
): Promise<DynamicToolResult> {
  if (tool === LINEAR_GRAPHQL_TOOL) {
    try {
      const { query, variables } = normalizeLinearGraphqlArguments(argumentsValue);
      assertReadOnlyQuery(query);
      const response = await fetch(context.linearEndpoint, {
        method: 'POST',
        headers: {
          Authorization: context.linearApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query, variables }),
      });

      if (!response.ok) {
        return asResult(false, {
          error: {
            message: `Linear GraphQL request failed with HTTP ${response.status}.`,
            status: response.status,
          },
        });
      }

      const payload = await response.json() as Record<string, unknown>;
      const errors = payload.errors;
      const success = !(Array.isArray(errors) && errors.length > 0);
      return asResult(success, payload);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      context.logger.warn('dynamic_tool.linear_graphql_failed', { error: message });
      return asResult(false, {
        error: {
          message,
        },
      });
    }
  }

  if (tool === REPORT_PROGRESS_TOOL) {
    try {
      const report = normalizeProgressArguments(argumentsValue);
      await context.onProgress(report);
      return asResult(true, {
        ok: true,
        message: 'Progress recorded.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return asResult(false, {
        error: {
          message,
        },
      });
    }
  }

  if (tool === REPORT_HANDOFF_TOOL) {
    try {
      const report = normalizeHandoffArguments(argumentsValue);
      await context.onHandoff(report);
      return asResult(true, {
        ok: true,
        message: 'Handoff recorded.',
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return asResult(false, {
        error: {
          message,
        },
      });
    }
  }

  return asResult(false, {
    error: {
      message: `Unsupported dynamic tool: ${JSON.stringify(tool)}.`,
      supportedTools: [LINEAR_GRAPHQL_TOOL, REPORT_PROGRESS_TOOL, REPORT_HANDOFF_TOOL],
    },
  });
}
