import type { Issue, Logger } from '../types.js';
import { LinearError } from '../errors.js';

const DEFAULT_LINEAR_URL = 'https://api.linear.app/graphql';
const WORKPAD_HEADING = '## Codex Workpad';

interface GraphqlResponse<T> {
  data?: T;
  errors?: Array<{ message?: string }>;
}

interface RawIssue {
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
  team?: { id: string | null; key: string | null; name: string | null } | null;
  labels?: { nodes: Array<{ name: string }> } | null;
}

interface IssuesQueryPayload {
  issues: {
    pageInfo: {
      hasNextPage: boolean;
      endCursor: string | null;
    };
    nodes: RawIssue[];
  };
}

interface CommentsQueryPayload {
  comments: {
    nodes: Array<{
      id: string;
      body: string;
      createdAt: string | null;
      updatedAt: string | null;
    }>;
  };
}

interface IssueStatesPayload {
  issue: {
    id: string;
    team: {
      id: string | null;
      key: string | null;
      name: string | null;
      states: {
        nodes: Array<{
          id: string;
          name: string;
          type: string | null;
        }>;
      };
    } | null;
  } | null;
}

function normalizeIssue(raw: RawIssue): Issue {
  return {
    id: raw.id,
    identifier: raw.identifier,
    title: raw.title,
    description: raw.description,
    priority: raw.priority,
    state: raw.state.name,
    branch_name: raw.branchName,
    url: raw.url,
    labels: raw.labels?.nodes.map((label) => label.name.toLowerCase()) ?? [],
    created_at: raw.createdAt,
    updated_at: raw.updatedAt,
    blocked_by: [],
    blocked_by_summary: 'none',
    tracker: {
      state_id: raw.state.id,
      state_type: raw.state.type,
      team_id: raw.team?.id ?? null,
      team_key: raw.team?.key ?? null,
      team_name: raw.team?.name ?? null,
    },
  };
}

export class LinearTracker {
  constructor(
    private readonly apiKey: string,
    private readonly logger: Logger,
    private readonly endpoint = DEFAULT_LINEAR_URL,
  ) {}

  private async query<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const response = await fetch(this.endpoint, {
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
    const issues: Issue[] = [];
    let cursor: string | null = null;
    const issueQuery = `
      query SymphonyIssues($projectSlug: String!, $states: [String!], $cursor: String) {
        issues(
          first: 100
          after: $cursor
          filter: {
            project: { slugId: { eq: $projectSlug } }
            state: { name: { in: $states } }
          }
        ) {
          pageInfo {
            hasNextPage
            endCursor
          }
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
            team {
              id
              key
              name
            }
            labels {
              nodes {
                name
              }
            }
          }
        }
      }
    `;

    do {
      const data: IssuesQueryPayload = await this.query<IssuesQueryPayload>(issueQuery, {
        projectSlug,
        states,
        cursor,
      });

      issues.push(...data.issues.nodes.map(normalizeIssue));

      if (!data.issues.pageInfo.hasNextPage) {
        break;
      }
      cursor = data.issues.pageInfo.endCursor;
      if (!cursor) {
        this.logger.warn('linear.pagination_missing_cursor', {
          projectSlug,
          states,
          issueCount: issues.length,
        });
        break;
      }
    } while (true);

    return issues;
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
    const data = await this.query<{ issue: RawIssue | null }>(
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
            team {
              id
              key
              name
            }
            blockedByIssues {
              nodes {
                id
                identifier
                createdAt
                updatedAt
                state {
                  name
                }
              }
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

    return data.issue ? normalizeIssue(data.issue) : null;
  }

  async getIssueByIdentifier(identifier: string): Promise<Issue | null> {
    const data = await this.query<{ issues: { nodes: RawIssue[] } }>(
      `
        query SymphonyIssueByIdentifier($identifier: String!) {
          issues(first: 1, filter: { identifier: { eq: $identifier } }) {
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
              team {
                id
                key
                name
              }
              blockedByIssues {
                nodes {
                  id
                  identifier
                  createdAt
                  updatedAt
                  state {
                    name
                  }
                }
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
      { identifier },
    );

    return data.issues.nodes[0] ? normalizeIssue(data.issues.nodes[0]) : null;
  }

  async getWorkpadComment(issueId: string): Promise<{ id: string; body: string } | null> {
    const data = await this.query<CommentsQueryPayload>(
      `
        query SymphonyIssueComments($issueId: String!) {
          comments(first: 50, filter: { issue: { id: { eq: $issueId } } }) {
            nodes {
              id
              body
              createdAt
              updatedAt
            }
          }
        }
      `,
      { issueId },
    );

    const workpad = data.comments.nodes
      .filter((comment) => comment.body.trimStart().startsWith(WORKPAD_HEADING))
      .sort((left, right) => (right.updatedAt ?? right.createdAt ?? '').localeCompare(left.updatedAt ?? left.createdAt ?? ''))[0];

    return workpad ? { id: workpad.id, body: workpad.body } : null;
  }

  async upsertWorkpadComment(issueId: string, body: string): Promise<{ id: string }> {
    const existing = await this.getWorkpadComment(issueId);
    if (existing) {
      const data = await this.query<{ commentUpdate: { success: boolean; comment: { id: string } | null } }>(
        `
          mutation SymphonyWorkpadUpdate($id: String!, $body: String!) {
            commentUpdate(id: $id, input: { body: $body }) {
              success
              comment {
                id
              }
            }
          }
        `,
        { id: existing.id, body },
      );

      if (!data.commentUpdate.success || !data.commentUpdate.comment) {
        throw new LinearError(`Failed to update workpad comment for issue ${issueId}.`);
      }
      return { id: data.commentUpdate.comment.id };
    }

    const data = await this.query<{ commentCreate: { success: boolean; comment: { id: string } | null } }>(
      `
        mutation SymphonyWorkpadCreate($issueId: String!, $body: String!) {
          commentCreate(input: { issueId: $issueId, body: $body }) {
            success
            comment {
              id
            }
          }
        }
      `,
      { issueId, body },
    );

    if (!data.commentCreate.success || !data.commentCreate.comment) {
      throw new LinearError(`Failed to create workpad comment for issue ${issueId}.`);
    }
    return { id: data.commentCreate.comment.id };
  }

  private async getStateIdForIssue(issueId: string, stateName: string): Promise<string> {
    const data = await this.query<IssueStatesPayload>(
      `
        query SymphonyIssueTeamStates($id: String!) {
          issue(id: $id) {
            id
            team {
              id
              key
              name
              states {
                nodes {
                  id
                  name
                  type
                }
              }
            }
          }
        }
      `,
      { id: issueId },
    );

    const state = data.issue?.team?.states.nodes.find((entry) => entry.name === stateName);
    if (!state) {
      throw new LinearError(`Unable to find Linear state "${stateName}" for issue ${issueId}.`);
    }
    return state.id;
  }

  async moveIssueToState(issue: Issue, stateName: string): Promise<Issue> {
    const stateId = await this.getStateIdForIssue(issue.id, stateName);
    const data = await this.query<{ issueUpdate: { success: boolean; issue: RawIssue | null } }>(
      `
        mutation SymphonyMoveIssue($id: String!, $stateId: String!) {
          issueUpdate(id: $id, input: { stateId: $stateId }) {
            success
            issue {
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
              team {
                id
                key
                name
              }
              blockedByIssues {
                nodes {
                  id
                  identifier
                  createdAt
                  updatedAt
                  state {
                    name
                  }
                }
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
      { id: issue.id, stateId },
    );

    if (!data.issueUpdate.success || !data.issueUpdate.issue) {
      throw new LinearError(`Failed to move issue ${issue.identifier} to ${stateName}.`);
    }

    const updated = normalizeIssue(data.issueUpdate.issue);
    this.logger.info('linear.issue_state_moved', {
      issue: issue.identifier,
      from: issue.state,
      to: updated.state,
    });
    return updated;
  }

  async attachGitHubPr(issueId: string, url: string, title?: string | null): Promise<void> {
    const data = await this.query<{ attachmentLinkGitHubPR: { success: boolean } }>(
      `
        mutation SymphonyAttachGitHubPR($issueId: String!, $url: String!, $title: String) {
          attachmentLinkGitHubPR(issueId: $issueId, url: $url, title: $title, linkKind: links) {
            success
          }
        }
      `,
      { issueId, url, title: title ?? null },
    );

    if (!data.attachmentLinkGitHubPR.success) {
      throw new LinearError(`Failed to attach GitHub PR ${url} to issue ${issueId}.`);
    }
  }
}
