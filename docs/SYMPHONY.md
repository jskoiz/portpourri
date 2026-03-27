# BRDG Symphony

BRDG includes an in-repo TypeScript Symphony service under [`../symphony`](../symphony). It is an upstream-derived implementation: BRDG follows the core Symphony service model, documents its supported subset explicitly, and keeps a few repo-specific extensions and deviations for the harness-first workflow.

## What It Does

- loads and hot-reloads the repo-owned [`../WORKFLOW.md`](../WORKFLOW.md)
- polls Linear for issues in the configured active states
- creates one persistent workspace per issue under `.symphony/workspaces/`
- launches `codex app-server` inside each issue workspace
- auto-approves command and file-change prompts from Codex
- exposes a read-only `linear_graphql` tool plus service-reporting tools to Codex sessions
- owns all Linear writes for state moves, workpad comments, retry notes, and PR attachment sync
- fails fast if Codex requests interactive user input
- retries failed issue runs with exponential backoff
- cleans up workspaces for issues that have moved to terminal states

## Capability Snapshot

| Upstream capability | BRDG status | Notes | Reload behavior |
| --- | --- | --- | --- |
| `tracker.endpoint` | supported | Defaults to Linear GraphQL endpoint | reloads dynamically |
| `hooks.before_run` / `hooks.after_run` / `hooks.timeout_ms` | supported | BRDG runs hooks around each agent launch | reloads dynamically |
| `agent.max_concurrent_agents_by_state` | supported | Used as an additional dispatch cap by Linear state | reloads dynamically |
| `codex.turn_timeout_ms` / `read_timeout_ms` / `stall_timeout_ms` | supported | Implemented by the BRDG orchestrator around app-server I/O and turn lifecycle | reloads for future runs |
| strict upstream workflow/template behavior | intentionally not supported | BRDG keeps the current workflow file and renderer semantics from `item 1` | requires code change |
| workspace key sanitizer parity | intentionally not supported | BRDG preserves current workspace naming for backward compatibility | requires code change |

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

That setup allows spawned issue sessions to inherit your shell environment, use existing Git or `gh` auth, push branches, and create or update pull requests directly. Linear writes still go through the Symphony service, not directly from the agent.

## Operator Flow

1. Export `LINEAR_API_KEY`.
2. Start the long-lived worker with `npm run symphony`.
3. Move a Linear issue into `Todo`.
4. Symphony picks it up, moves it to `In Progress`, creates or updates the service-owned `## Codex Workpad` comment, and starts a Codex run in `.symphony/workspaces/<ISSUE>`.
5. The agent reports progress through `report_progress` and final routing details through `report_handoff`.
6. Symphony applies the resulting Linear writes: workpad updates, retry/failure notes, PR attachment sync, and the final state move toward review or merge.

## State Behavior

- Symphony polls only the configured active states from [`../WORKFLOW.md`](../WORKFLOW.md).
- Any issue left in an active state such as `Todo` or `In Progress` remains eligible for pickup on later polls.
- If you do not want an issue to keep getting picked up, move it out of the active set.
- Existing runs are not retrofitted when you change the workflow or runner; restart `npm run symphony` to guarantee new runs use the latest configuration.

## Workpad Expectations

- Symphony keeps a single `## Codex Workpad` comment per issue.
- The workpad should include `Plan`, `Acceptance Criteria`, `Validation`, and `Notes`.
- `Notes` include the `Symphony runtime revision`, current run status, blocker summary, and any retry or failure notes.

## PR Review Follow-up Issues

If you create a separate issue to address review comments on an already-open PR, include the original implementation issue identifier in the description.

The intended behavior is:

1. the follow-up issue handles the review-comment work
2. the original implementation issue remains the canonical lifecycle issue
3. when the PR is ready to merge, Symphony updates the original issue and moves that original issue toward `Merging`

This keeps review-cleanup work separate without losing the original implementation issue as the main tracker.

## Current Scope

This build covers the core Symphony runner/orchestrator contract, injects a read-only `linear_graphql` tool for tracker queries, and exposes reporting tools that let the service own Linear mutations deterministically.

## Notes

- If Codex trust is path-sensitive on your machine, trust the workspace root you intend Symphony to use.
- Per-workspace trust warnings are non-fatal today. They disable project-local `config.toml` loading for that workspace path, but skills and exec policies still load.
- The current default workflow assumes these Linear states exist: `Todo`, `In Progress`, `Human Review`, `Merging`, `Rework`, and `Done`.
- If your team uses different state names, update [`../WORKFLOW.md`](../WORKFLOW.md) accordingly.
- If you want a more restrictive runtime, override the `codex` block in [`../WORKFLOW.md`](../WORKFLOW.md) and accept that GitHub push/PR automation may stop working.
- BRDG intentionally preserves its current workspace key sanitizer and workflow renderer behavior for compatibility; those are documented deviations from the upstream spec, not accidental drift.
