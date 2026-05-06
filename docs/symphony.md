# Symphony Setup

## Configured Session

- Linear project `slugId`: `ad63883d9075`
- Dashboard/API: `http://127.0.0.1:4003/`
- tmux session: `portpourri-symphony`
- Workflow file: `WORKFLOW.md`
- Workspace root: `~/code/portpourri-symphony-workspaces`
- Symphony checkout: `/Users/jk/code/symphony/elixir`

Symphony queries Linear by `project.slugId`, so use `ad63883d9075` instead of the human-facing project URL slug.

## Start

Start Portpourri Symphony from the Symphony checkout and keep the repo workflow path explicit. Set `PORTPOURRI_WORKFLOW` to the `WORKFLOW.md` path in the Portpourri checkout you want Symphony to use:

```bash
PORTPOURRI_WORKFLOW=/path/to/portpourri/WORKFLOW.md
tmux new-session -s portpourri-symphony \
  "cd /Users/jk/code/symphony/elixir && mise exec -- ./bin/symphony \"$PORTPOURRI_WORKFLOW\" --port 4003"
```

If the session already exists, attach instead:

```bash
tmux attach -t portpourri-symphony
```

## Verify

Use the local API for a lightweight health check:

```bash
curl http://127.0.0.1:4003/api/v1/state
```

The dashboard is available at `http://127.0.0.1:4003/`. Because adjacent Symphony sessions may use nearby ports, treat the API check as a Portpourri verification only when the tmux session is `portpourri-symphony` or the listener command points at this repo's `WORKFLOW.md`:

```bash
tmux list-sessions | rg '^portpourri-symphony:'
lsof -nP -iTCP:4003 -sTCP:LISTEN
```

## Dispatch

Moving a scoped Portpourri Linear issue to `Todo` starts Symphony work. The agent should claim it by moving it to `In Progress`, update the single `## Codex Workpad` comment, implement the requested change, run targeted validation, then publish a PR before moving the issue to review.

`Backlog` issues are not ready for Symphony execution. Terminal states such as `Done`, `Canceled`, and `Duplicate` should not dispatch.

## Stop

Stop only the Portpourri session:

```bash
tmux kill-session -t portpourri-symphony
```

Do not stop adjacent Symphony sessions for other projects. If port `4003` appears busy, check ownership before changing the configured port:

```bash
lsof -nP -iTCP:4003 -sTCP:LISTEN
```
