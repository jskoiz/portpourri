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
- Use the repo-local `linear` skill for raw Linear GraphQL operations through the injected `linear_graphql` tool when tracker reads or writes are needed.

This Symphony build polls Linear directly for scheduling and also injects a `linear_graphql` tool into Codex sessions for raw tracker-side GraphQL operations.

## BRDG execution rules

1. Work only inside the provided issue workspace.
2. Preserve backend and mobile contracts unless the task explicitly changes both sides.
3. Reproduce first. Record the concrete failure signal before changing code.
4. Prefer the harness workflow over ad hoc commands:
   - `npm run harness:doctor` when the environment looks uncertain
   - `npm run check:changed` for diff-scoped validation
   - `npm run pre-submit` before handoff
   - `npm run check` and `npm run smoke` when integration breadth warrants them
5. Visual mobile work should update Storybook in the same diff unless the issue explicitly justifies otherwise.
6. Do not ship local workarounds, debug edits, or temporary proof changes. Revert any temporary instrumentation before commit/push.
7. Keep docs in sync when commands, workflow expectations, or validation behavior change.

## Linear workpad rules

Maintain one persistent issue comment headed `## Codex Workpad`.

- Reuse the existing active workpad comment when present.
- Keep these sections current in that comment:
  - `Plan`
  - `Acceptance Criteria`
  - `Validation`
  - `Notes`
- Update the workpad after each meaningful milestone.
- Do not create separate summary comments when the workpad can be updated instead.
- Record `Symphony runtime revision: {{ workflow.runtime_revision }}` in the `Notes` section so the run can be traced back to the exact orchestration build.

## State routing

- `Backlog`: do not modify the issue; stop and wait.
- `Todo`: move to `In Progress`, then begin active work.
- `In Progress`: continue implementation.
- `Human Review`: do not code; wait for reviewer feedback or approval.
- `Merging`: land the PR, then move the issue to `Done`.
- `Rework`: treat as a fresh implementation attempt and rebuild the plan.
- `Done`: no action.

## Execution flow

1. Read the issue and determine its current state.
2. For `Todo`, move the ticket to `In Progress` before coding.
3. Find or create the `## Codex Workpad` comment and refresh its plan, acceptance criteria, validation plan, and notes.
4. Reproduce the current behavior and capture the failure signal before changing code.
5. Run the `pull` skill before editing code and record the sync result in the workpad.
6. Implement the smallest correct change that satisfies the issue.
7. Run the appropriate harness validation commands for the scope.
8. Commit with the `commit` skill and publish with the `push` skill when the branch is ready.
9. Attach the PR to the Linear issue and move the ticket to `Human Review` only after validation is green and outstanding PR feedback is addressed.
10. In `Merging`, use the `land` skill flow and only mark the issue `Done` after the PR is merged.

## Related skills

- `linear`: use for raw Linear GraphQL operations.
- `pull`: sync the branch with `origin/main` before and during implementation.
- `commit`: produce clean commit messages that match the actual diff.
- `push`: publish the branch and create or update the PR using the BRDG template.
- `land`: monitor checks, resolve merge drift, and merge safely once green.
