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
npm run symphony
npm run dev:symphony -- ./WORKFLOW.md
npm run check:symphony
```

`npm run symphony` is the normal operator entrypoint. It wraps the repo-owned workflow and default BRDG Linear project slug.

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

The default Codex runtime is configured for full GitHub interactivity:

- `codex app-server -c shell_environment_policy.inherit=all`
- `thread_sandbox: danger-full-access`

That setup allows spawned issue sessions to inherit your shell environment, use existing Git or `gh` auth, push branches, and create or update pull requests directly.

## Operator Flow

1. Export `LINEAR_API_KEY`.
2. Start the long-lived worker with `npm run symphony`.
3. Move a Linear issue into `Todo`.
4. Symphony picks it up, moves it to `In Progress`, creates or updates the `## Codex Workpad` comment, and starts a Codex run in `.symphony/workspaces/<ISSUE>`.
5. When the run is healthy, expect the workpad to show a `Symphony runtime revision: ...` note, local validation, branch creation, push, PR attachment, and a state move toward review.

## State Behavior

- Symphony polls only the configured active states from [`../WORKFLOW.md`](../WORKFLOW.md).
- Any issue left in an active state such as `Todo` or `In Progress` remains eligible for pickup on later polls.
- If you do not want an issue to keep getting picked up, move it out of the active set.
- Existing runs are not retrofitted when you change the workflow or runner; restart `npm run symphony` to guarantee new runs use the latest configuration.

## Workpad Expectations

- The agent keeps a single `## Codex Workpad` comment per issue.
- The workpad should include `Plan`, `Acceptance Criteria`, `Validation`, and `Notes`.
- `Notes` should include the `Symphony runtime revision` so you can tell which orchestration build produced that run.

## Current Scope

This build covers the core Symphony runner/orchestrator contract and injects a client-side `linear_graphql` tool into Codex sessions for raw Linear GraphQL operations.

## Notes

- If Codex trust is path-sensitive on your machine, trust the workspace root you intend Symphony to use.
- Per-workspace trust warnings are non-fatal today. They disable project-local `config.toml` loading for that workspace path, but skills and exec policies still load.
- The current default workflow assumes these Linear states exist: `Todo`, `In Progress`, `Human Review`, `Merging`, `Rework`, and `Done`.
- If your team uses different state names, update [`../WORKFLOW.md`](../WORKFLOW.md) accordingly.
- If you want a more restrictive runtime, override the `codex` block in [`../WORKFLOW.md`](../WORKFLOW.md) and accept that GitHub push/PR automation may stop working.
