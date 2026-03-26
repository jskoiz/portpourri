# NodeWatcher

NodeWatcher is a macOS menu bar app for answering one local-dev question quickly:

Which local ports are in use right now, which process owns them, and is that process part of my dev workflow or something blocking it?

It is built for the common case where multiple projects keep colliding on the same ports and the usual fallback is a pile of `lsof`, `ps`, and PID hunting.

## Purpose

NodeWatcher is intentionally narrow. It is not a general process manager and it is not trying to replace Activity Monitor.

Its job is to make port conflicts legible:

- show the watched ports you care about
- tell you whether a Node app owns the port or another process is blocking it
- map Node processes back to a project root
- give you the safest useful action for the current situation

## Methodology

The app builds a snapshot of local listening processes in a few steps:

1. Probe listening TCP sockets with `lsof`.
2. Enrich those listeners with process metadata from `ps`.
3. Resolve each process working directory and walk upward to the nearest project markers such as `package.json`, `.git`, `pnpm-workspace.yaml`, `turbo.json`, `nx.json`, and lockfiles.
4. Classify Node-family dev tools from the command and parent command so rows can say `vite`, `next`, `expo`, `storybook`, `nest`, and similar labels instead of only `node`.
5. Collapse duplicate IPv4 and IPv6 listeners into one logical port owner.
6. Mark watched ports as either:
   - owned by one of your Node apps
   - blocked by some other listener

This is why the app can answer a more useful question than “what PID is using 3000?” It can usually tell you “3000 is blocked by Docker” or “8081 is currently owned by the Expo app from `~/Desktop/brdg/mobile`.”

## Conflict Resolution Philosophy

NodeWatcher does not expose a fake universal “resolve conflict” button.

Different blockers need different actions:

- Node process on a watched port: offer `Free port`
- SSH tunnel: offer `Stop tunnel`
- User-owned blocker: offer `Stop blocker` when it is reasonably safe
- Docker-managed port: offer `Open Docker`
- System process: explain the blocker and suggest the next free port instead of trying to kill it

When the app cannot safely stop a blocker, it falls back to the next best action:

- suggest the next free port
- let you copy that port immediately
- expose the process metadata so you can decide what to do manually

## What It Ships

- Menu bar status item with a compact live summary
- Popover UI focused on watched ports first
- Context-aware conflict actions
- Settings for watched ports, grouping, refresh cadence, and listener visibility
- CLI commands for live snapshots and fixture output
- Fixture and integration tests so the same model can be validated outside the UI

## Repository Shape

- `AGENTS.md` is the top-level map for agents
- `docs/` is the system of record for product, UI, architecture, and harness guidance
- `Sources/NodeTrackerCore` owns probing, parsing, normalization, and project resolution
- `Sources/NodeTrackerApp` owns the menu bar app
- `Sources/NodeTrackerCLI` exposes snapshot and fixture commands

## Development

```bash
swift build
swift test
swift run nodetracker snapshot --json
swift run NodeTrackerApp --sample-data
```

To build a local app bundle:

```bash
./Scripts/package_app.sh
open .build/NodeWatcher.app
```

## Notes

- The app currently focuses on TCP listeners and common Node-related local development workflows.
- It is deliberately conservative about destructive actions.
- The menu bar UI is built on the same snapshot model exposed by the CLI so live behavior, fixtures, and tests stay aligned.
