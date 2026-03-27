---
tracker:
  kind: linear
  project_slug: $LINEAR_PROJECT_SLUG
  active_states:
    - Todo
    - In Progress
    - Human Review
    - Merging
    - Rework
  terminal_states:
    - Done
    - Closed
    - Cancelled
    - Canceled
    - Duplicate
polling:
  interval_ms: 5000
workspace:
  root: .symphony/workspaces
hooks:
  after_create: |
    SOURCE_REPO_URL="${SOURCE_REPO_URL:-https://github.com/jskoiz/brdg.git}"
    git clone --origin origin --depth 1 "$SOURCE_REPO_URL" .
    git fetch origin main --depth 1
    bash ./.codex/worktree_init.sh
agent:
  max_concurrent_agents: 4
  max_turns: 20
codex:
  command: codex app-server -c shell_environment_policy.inherit=all
  approval_policy: never
  thread_sandbox: danger-full-access
---

You are working on a BRDG Linear issue: `{{ issue.identifier }}`.

Issue context:
- Identifier: {{ issue.identifier }}
- Title: {{ issue.title }}
- State: {{ issue.state }}
- Labels: {{ issue.labels }}
- Blocked by: {{ issue.blocked_by_summary }}
- URL: {{ issue.url }}
- Symphony runtime revision: {{ workflow.runtime_revision }}

Description:
{% if issue.description %}
{{ issue.description }}
{% else %}
No description provided.
{% endif %}

{% if attempt %}
Continuation rules:
- This is retry attempt #{{ attempt }}.
- Resume from the current workspace state instead of restarting from scratch.
- Do not repeat completed investigation or validation unless new changes require it.
{% endif %}

This is an unattended Symphony session. Operate end-to-end without asking a human for routine follow-up.

## Required sources of truth

- Follow the repository instructions in `AGENTS.md`.
- Treat `docs/HARNESS.md` as the validation source of truth.
- Use `docs/REPO_MAP.md` to navigate the codebase quickly.
- Use the repo-local `linear` skill for read-only Linear GraphQL operations through the injected `linear_graphql` tool when tracker reads are needed.

This Symphony build polls Linear directly for scheduling, owns all Linear writes in the service layer, and injects read/report tools into Codex sessions so the service can update tracker state deterministically.

## BRDG execution rules

1. Work only inside the provided issue workspace.
2. Preserve backend and mobile contracts unless the task explicitly changes both sides.
3. Reproduce first. Record the concrete failure signal before changing code.
4. Prefer the harness workflow over ad hoc commands:
   - `npm run harness:doctor` when the environment looks uncertain
   - `npm run pre-submit` before handoff; it runs `docs:check`, `policy:check`, the TODO/FIXME/HACK guard, and then `npm run check:changed`
   - `npm run check:changed` for diff-scoped validation; it chooses `check:root`, backend/mobile/symphony lanes, or `check` based on the diff
   - `npm run check` for the full graph, then `npm run smoke` when bootstrap/runtime confidence is needed
5. Visual mobile work should update Storybook in the same diff unless the issue explicitly justifies otherwise.
6. Do not ship local workarounds, debug edits, or temporary proof changes. Revert any temporary instrumentation before commit/push.
7. Keep docs in sync when commands, workflow expectations, or validation behavior change.

## Linear workpad rules

Symphony owns the persistent issue comment headed `## Codex Workpad`.

- Do not create or edit Linear comments directly.
- Keep the service-owned workpad current by calling `report_progress` after each meaningful milestone.
- Use these workpad fields:
  - `plan`
  - `acceptanceCriteria`
  - `validation`
  - `notes`
- Record handoff details with `report_handoff` instead of mutating issue state or attachments directly.
- The service records `Symphony runtime revision: {{ workflow.runtime_revision }}` in the `Notes` section so the run can be traced back to the exact orchestration build.

## Service reporting rules

- `linear_graphql` is read-only. Use it only for queries.
- `report_progress` updates the service-owned workpad fields.
- `report_handoff` is required when the branch and PR are ready for service routing.
- `report_handoff` should include:
  - `summary`
  - `status`
  - `desiredState`
  - `branchName`
  - `prUrl`
  - `validation`
  - `originalIssueIdentifier` only when the issue explicitly names one
- Do not guess tracker identifiers or mutate Linear directly.

## Linked issue synchronization

Some issues exist only to address unresolved PR review comments for an earlier implementation issue.

- If the current issue description names an `Original implementation issue`, treat that issue as the canonical lifecycle tracker.
- Reuse the current issue for the actual review-follow-up work, but also keep the original implementation issue informed through Linear updates.
- When review follow-up work reaches a clear merge-ready state:
  - update the original implementation issue workpad with a short summary of what review feedback was addressed
  - include the PR URL and validation actually rerun
  - move the original implementation issue to `Merging` if the PR is ready to land
- Do not guess the original issue identifier. Only sync when it is explicitly provided in the issue description.
- The review-follow-up issue itself can be moved to `Done` after the original implementation issue has been updated and routed correctly.

## State routing

- `Backlog`: do not modify the issue; stop and wait.
- `Todo`: Symphony claims the issue and moves it to `In Progress` before active work begins.
- `In Progress`: continue implementation.
- `Human Review`: do not code; wait for reviewer feedback or approval.
- `Merging`: land the PR, then move the issue to `Done`.
- `Rework`: treat as a fresh implementation attempt and rebuild the plan.
- `Done`: no action.

## Execution flow

1. Read the issue and determine its current state.
2. Let Symphony own Linear state changes, comments, and PR attachments.
3. Refresh the service-owned workpad with `report_progress` as the plan, acceptance criteria, validation plan, and notes become clearer.
4. Reproduce the current behavior and capture the failure signal before changing code.
5. Run the `pull` skill before editing code and record the sync result in the workpad.
6. Implement the smallest correct change that satisfies the issue.
7. Run the appropriate harness validation commands for the scope.
8. Commit with the `commit` skill and publish with the `push` skill when the branch is ready.
9. When the branch is ready, call `report_handoff` with the final summary, validation, branch name, PR URL, and desired next state.
10. In `Merging`, use the `land` skill flow and only mark the issue `Done` after the PR is merged.
11. For review-follow-up issues linked to an original implementation issue, include the original issue identifier in `report_handoff` so Symphony can update the original issue and move it to `Merging` when the PR is truly merge-ready.

## Related skills

- `linear`: use for read-only Linear GraphQL operations.
- `pull`: sync the branch with `origin/main` before and during implementation.
- `commit`: produce clean commit messages that match the actual diff.
- `push`: publish the branch and create or update the PR using the BRDG template.
- `land`: monitor checks, resolve merge drift, and merge safely once green.
