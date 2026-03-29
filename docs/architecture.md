# Architecture

## Summary

Portpourri follows a CodexBar-style split:

- `PortpourriCore`: probes, parsers, normalization, project resolution, fixtures, and JSON export.
- `PortpourriCLI`: diagnostics and fixture access over the same core models.
- `PortpourriApp`: menu bar host, popover UI, settings, and safe quick actions.

## Boundaries

- `PortpourriCore` must stay UI-free.
- Shell commands run only in the probe layer.
- App state is derived from typed snapshots emitted by the core.
- Tests validate parsers with deterministic fixtures before live-process integration.

## Main flow

1. Collect listening sockets from `lsof`.
2. Enrich PIDs with `ps` metadata and `cwd`.
3. Resolve project roots from `cwd`.
4. Classify Node-family tools from command and parent command.
5. Build an `AppSnapshot` for the app and CLI.

## Packaging

- SwiftPM is the source of truth.
- `Scripts/package_app.sh` wraps the executable in a simple `.app` bundle for local use.
