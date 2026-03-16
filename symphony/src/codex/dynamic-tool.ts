import type { Logger } from '../types.js';

const LINEAR_GRAPHQL_TOOL = 'linear_graphql';

export interface DynamicToolResult {
  success: boolean;
  output: string;
  contentItems: Array<{
    type: 'inputText';
    text: string;
  }>;
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

export function dynamicToolSpecs(): Array<Record<string, unknown>> {
  return [
    {
      name: LINEAR_GRAPHQL_TOOL,
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
  ];
}

export async function executeDynamicTool(
  tool: string,
  argumentsValue: unknown,
  context: {
    linearApiKey: string;
    logger: Logger;
  },
): Promise<DynamicToolResult> {
  if (tool !== LINEAR_GRAPHQL_TOOL) {
    return asResult(false, {
      error: {
        message: `Unsupported dynamic tool: ${JSON.stringify(tool)}.`,
        supportedTools: [LINEAR_GRAPHQL_TOOL],
      },
    });
  }

  try {
    const { query, variables } = normalizeLinearGraphqlArguments(argumentsValue);
    const response = await fetch('https://api.linear.app/graphql', {
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
