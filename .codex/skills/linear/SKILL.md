---
name: linear
description: |
  Use Symphony's `linear_graphql` tool for raw Linear GraphQL reads, comment
  updates, state transitions, and attachment flows.
---

# Linear GraphQL

Use Symphony's `linear_graphql` tool for Linear operations during app-server sessions.

## Rules

- Send one GraphQL operation per tool call.
- Treat a top-level `errors` array as a failed operation.
- Query only the fields needed for the current step.
- Fetch the team's available states before changing issue state.

## Common operations

Query an issue by identifier:

```graphql
query IssueByIdentifier($identifier: String!) {
  issues(filter: { identifier: { eq: $identifier } }, first: 1) {
    nodes {
      id
      identifier
      title
      description
      url
      branchName
      state {
        id
        name
        type
      }
      attachments {
        nodes {
          id
          title
          url
          sourceType
        }
      }
    }
  }
}
```

Query team states:

```graphql
query IssueTeamStates($id: String!) {
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
```

Create a comment:

```graphql
mutation CreateComment($issueId: String!, $body: String!) {
  commentCreate(input: { issueId: $issueId, body: $body }) {
    success
    comment {
      id
      url
    }
  }
}
```

Update a comment:

```graphql
mutation UpdateComment($id: String!, $body: String!) {
  commentUpdate(id: $id, input: { body: $body }) {
    success
    comment {
      id
      body
    }
  }
}
```

Move an issue to a new state:

```graphql
mutation MoveIssueToState($id: String!, $stateId: String!) {
  issueUpdate(id: $id, input: { stateId: $stateId }) {
    success
    issue {
      id
      identifier
      state {
        id
        name
      }
    }
  }
}
```

Attach a GitHub PR:

```graphql
mutation AttachGitHubPR($issueId: String!, $url: String!, $title: String) {
  attachmentLinkGitHubPR(
    issueId: $issueId
    url: $url
    title: $title
    linkKind: links
  ) {
    success
    attachment {
      id
      title
      url
    }
  }
}
```
