---
tracker:
  kind: linear
  endpoint: https://api.linear.app/graphql
  api_key: $LINEAR_API_KEY
  project_slug: "ad63883d9075"
  active_states:
    - Todo
    - In Progress
  terminal_states:
    - Done
    - Canceled
    - Duplicate
polling:
  interval_ms: 30000
workspace:
  root: ~/code/portpourri-symphony-workspaces
hooks:
  after_create: |
    set -euo pipefail
    git clone git@github.com:jskoiz/portpourri.git .
    git config user.name jskoiz
    git config user.email 117332383+jskoiz@users.noreply.github.com
  before_run: |
    set -euo pipefail
    pwd
    git rev-parse --show-toplevel
    git branch --show-current
    git status -sb
  after_run: |
    git status -sb || true
agent:
  max_concurrent_agents: 1
  max_turns: 8
codex:
  command: codex app-server
  approval_policy: never
  thread_sandbox: workspace-write
server:
  port: 4003
---
# Portpourri Symphony Workflow

You are working on Linear issue `{{ issue.identifier }}` for Portpourri.

Title: {{ issue.title }}

Description:
{{ issue.description }}

## Operating Contract

Start by verifying the workspace you are actually editing:

```bash
pwd
git rev-parse --show-toplevel
git branch --show-current
git status -sb
```

Read `AGENTS.md` first, then treat `docs/` as the source of truth:

- Product intent: `docs/product.md`
- Architecture and module boundaries: `docs/architecture.md`
- UI behavior and interaction rules: `docs/ui.md`
- Validation harnesses and fixtures: `docs/dev-harness.md`
- Active planning docs: `docs/plans/`

## Linear Workflow

- Symphony watches the Linear project by configured `slugId` `ad63883d9075`.
- Moving a scoped issue to `Todo` makes it eligible for Symphony work; the agent should then move it to `In Progress` before implementation.
- Maintain exactly one persistent `## Codex Workpad` comment on the issue and update it in place.
- Keep changes scoped to the issue and do not move an issue to `Done` automatically.
- Move an issue to review only after implementation, validation, PR publication, and feedback sweep are complete.

## Portpourri Rules

- Keep `PortpourriCore` free of `AppKit` and `SwiftUI`.
- Parse shell output once at the edge, then operate on typed models.
- Prefer small, legible types over clever abstractions.
- When changing architecture or workflows, update the matching doc in `docs/`.
- Do not add privileged or force-kill behavior without an explicit user request.

## Validation

Run the smallest useful validation for the change. Baseline checks are:

```bash
swift build
swift test
swift run portpourri fixtures --name mixed --json
swift run portpourri snapshot --json
```

For Symphony setup docs, also verify the local API and workflow front matter:

```bash
curl http://127.0.0.1:4003/api/v1/state
ruby -e 's=File.read("WORKFLOW.md"); y=s[/\A---\n(.*?)\n---\n/m,1]; require "yaml"; YAML.safe_load(y); puts "workflow front matter OK"'
```
