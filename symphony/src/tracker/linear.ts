import type { Issue, Logger } from '../types.js';
import { LinearError } from '../errors.js';

const LINEAR_URL = 'https://api.linear.app/graphql';

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

interface IssuesQueryPayload {
  issues: {
    nodes: Array<{
      id: string;
      identifier: string;
      title: string;
      description: string | null;
      priority: number | null;
      branchName: string | null;
      url: string | null;
      createdAt: string | null;
      updatedAt: string | null;
      state: { id: string | null; name: string; type: string | null };
      labels?: { nodes: Array<{ name: string }> } | null;
    }>;
  };
}

export class LinearTracker {
  constructor(
    private readonly apiKey: string,
    private readonly logger: Logger,
  ) {}

  private async query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(LINEAR_URL, {
      method: 'POST',
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query, variables }),
    });

    if (!response.ok) {
      throw new LinearError(`Linear request failed with status ${response.status}.`);
    }

    const payload = await response.json() as GraphqlResponse<T>;
    if (payload.errors?.length) {
      throw new LinearError(payload.errors.map((entry) => entry.message ?? 'unknown').join('; '));
    }
    if (!payload.data) {
      throw new LinearError('Linear response was missing data.');
    }
    return payload.data;
  }

  async listIssuesForStates(projectSlug: string, states: string[]): Promise<Issue[]> {
    const data = await this.query<IssuesQueryPayload>(
      `
        query SymphonyIssues($projectSlug: String!, $states: [String!]) {
          issues(
            first: 100
            filter: {
              project: { slugId: { eq: $projectSlug } }
              state: { name: { in: $states } }
            }
          ) {
            nodes {
              id
              identifier
              title
              description
              priority
              branchName
              url
              createdAt
              updatedAt
              state {
                id
                name
                type
              }
              labels {
                nodes {
                  name
                }
              }
            }
          }
        }
      `,
      {
        projectSlug,
        states,
      },
    );

    return data.issues.nodes.map((issue) => ({
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      branchName: issue.branchName,
      url: issue.url,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      state: issue.state,
      labels: issue.labels?.nodes.map((label) => label.name.toLowerCase()) ?? [],
    }));
  }

  async listActiveIssues(projectSlug: string, activeStates: string[]): Promise<Issue[]> {
    const issues = await this.listIssuesForStates(projectSlug, activeStates);
    return issues.sort((left, right) => {
      const lp = left.priority ?? Number.MAX_SAFE_INTEGER;
      const rp = right.priority ?? Number.MAX_SAFE_INTEGER;
      if (lp !== rp) {
        return lp - rp;
      }
      return left.identifier.localeCompare(right.identifier);
    });
  }

  async listTerminalIssues(projectSlug: string, terminalStates: string[]): Promise<Issue[]> {
    return this.listIssuesForStates(projectSlug, terminalStates);
  }

  async getIssueById(issueId: string): Promise<Issue | null> {
    const data = await this.query<{ issue: IssuesQueryPayload['issues']['nodes'][number] | null }>(
      `
        query SymphonyIssue($id: String!) {
          issue(id: $id) {
            id
            identifier
            title
            description
            priority
            branchName
            url
            createdAt
            updatedAt
            state {
              id
              name
              type
            }
            labels {
              nodes {
                name
              }
            }
          }
        }
      `,
      { id: issueId },
    );

    if (!data.issue) {
      return null;
    }

    const issue = data.issue;
    return {
      id: issue.id,
      identifier: issue.identifier,
      title: issue.title,
      description: issue.description,
      priority: issue.priority,
      branchName: issue.branchName,
      url: issue.url,
      createdAt: issue.createdAt,
      updatedAt: issue.updatedAt,
      state: issue.state,
      labels: issue.labels?.nodes.map((label) => label.name.toLowerCase()) ?? [],
    };
  }
}
