---
name: linear
description: |
  Use Symphony's `linear_graphql` tool for raw read-only Linear GraphQL
  queries during Symphony app-server sessions.
---

# Linear GraphQL

Use Symphony's `linear_graphql` tool for read-only Linear queries during app-server sessions.

## Rules

- Send one GraphQL operation per tool call.
- Treat a top-level `errors` array as a failed operation.
- Query only the fields needed for the current step.
- Do not mutate Linear from the agent. Symphony owns comments, state transitions, and PR attachment writes.
- Use `report_progress` and `report_handoff` for service-owned tracker updates instead of GraphQL mutations.

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

Query existing attachments:

```graphql
query IssueAttachments($identifier: String!) {
  issues(filter: { identifier: { eq: $identifier } }, first: 1) {
    nodes {
      id
      identifier
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
