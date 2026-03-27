# BRDG Symphony Setup

This repo is ready to be driven by Symphony through the repo-owned [`../WORKFLOW.md`](../WORKFLOW.md) contract.

BRDG uses an upstream-derived Symphony implementation: it supports the runtime/config pieces listed in [`SYMPHONY.md`](./SYMPHONY.md), keeps the current BRDG workflow renderer from `item 1`, and centralizes all Linear writes in the service.

## What You Still Need To Fill In

1. Export `LINEAR_PROJECT_SLUG` before starting Symphony, or hardcode it in [`../WORKFLOW.md`](../WORKFLOW.md).
2. In Linear, ensure the team workflow includes these statuses if you want the default workflow unchanged:
   - `Todo`
   - `In Progress`
   - `Human Review`
   - `Merging`
   - `Rework`
   - `Done`
3. Export the required environment variables before starting Symphony:
   - `LINEAR_API_KEY`
   - `LINEAR_PROJECT_SLUG`
   - optional: `SOURCE_REPO_URL` if you do not want the default `https://github.com/jskoiz/brdg.git`
   - optional: `SYMPHONY_WORKSPACE_ROOT` if you point `workspace.root` at it in [`../WORKFLOW.md`](../WORKFLOW.md)

## Repo-Specific Bootstrap Behavior

When Symphony creates a new issue workspace, [`../WORKFLOW.md`](../WORKFLOW.md) tells it to:

1. clone the BRDG repo into the workspace
2. install backend dependencies
3. install mobile dependencies
4. refresh the machine-readable repo index

That bootstrap lives in [`../.codex/worktree_init.sh`](../.codex/worktree_init.sh).

## Running Symphony

Start the local TypeScript Symphony service from repo root:

```bash
npm run dev:symphony -- ./WORKFLOW.md
```

Use [`SYMPHONY.md`](./SYMPHONY.md) for the canonical local runtime instructions.

## BRDG Expectations Encoded In The Workflow

- Harness-first validation via [`HARNESS.md`](./HARNESS.md)
- repo navigation via [`REPO_MAP.md`](./REPO_MAP.md)
- Storybook co-updates for reusable mobile UI work
- PR creation and landing through repo-local Symphony skills under [`../.codex/skills`](../.codex/skills)
- read-only tracker queries from the agent, with service-owned workpad/state/PR-link writes

## Notes

- If Codex trust is path-sensitive in your local environment, make sure the workspace root you choose is trusted for Codex app-server runs.
- If your Linear team uses different status names, update the `active_states`, `terminal_states`, and state-routing language in [`../WORKFLOW.md`](../WORKFLOW.md) together.
- Use [`SYMPHONY.md`](./SYMPHONY.md) as the canonical source for which upstream features BRDG supports versus intentionally deviates from.
