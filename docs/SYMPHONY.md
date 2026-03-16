# BRDG Symphony

BRDG includes an in-repo TypeScript Symphony service under [`../symphony`](../symphony). It follows the upstream Symphony service model from the official spec while staying aligned with the repo's harness-first workflow.

## What It Does

- loads and hot-reloads the repo-owned [`../WORKFLOW.md`](../WORKFLOW.md)
- polls Linear for issues in the configured active states
- creates one persistent workspace per issue under `.symphony/workspaces/`
- launches `codex app-server` inside each issue workspace
- auto-approves command and file-change prompts from Codex
- injects a client-side `linear_graphql` tool into Codex sessions
- fails fast if Codex requests interactive user input
- retries failed issue runs with exponential backoff
- cleans up workspaces for issues that have moved to terminal states

## Commands

From repo root:

```bash
npm run dev:symphony -- ./WORKFLOW.md
npm run check:symphony
```

## Required Environment

- `LINEAR_API_KEY`
- `LINEAR_PROJECT_SLUG`

Optional:

- `SOURCE_REPO_URL`
  - overrides the repo clone source used by [`../WORKFLOW.md`](../WORKFLOW.md)
- `SYMPHONY_WORKSPACE_ROOT`
  - if you prefer a different workspace root, point `workspace.root` in [`../WORKFLOW.md`](../WORKFLOW.md) at this env var

## Default Workspace Bootstrap

The default workflow clones BRDG into each issue workspace and then runs [`../.codex/worktree_init.sh`](../.codex/worktree_init.sh), which:

1. installs backend dependencies
2. installs mobile dependencies
3. refreshes the repo index used by harness tooling

## Current Scope

This build covers the core Symphony runner/orchestrator contract and injects a client-side `linear_graphql` tool into Codex sessions for raw Linear GraphQL operations.

## Notes

- If Codex trust is path-sensitive on your machine, trust the workspace root you intend Symphony to use.
- The current default workflow assumes these Linear states exist: `Todo`, `In Progress`, `Human Review`, `Merging`, `Rework`, and `Done`.
- If your team uses different state names, update [`../WORKFLOW.md`](../WORKFLOW.md) accordingly.
