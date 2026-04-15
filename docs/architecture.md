# Architecture

## Summary

Portpourri follows a CodexBar-style split:

- `PortpourriCore`: probes, parsers, normalization, project resolution, fixtures, and JSON export.
- `PortpourriCLI`: diagnostics and fixture access over the same core models.
- `PortpourriApp`: menu bar host, popover UI, settings, and safe quick actions.

Phase 3 hardens the split inside the core and app without changing the product story:

- `PortOwnershipSnapshot` holds the watched-port ownership model the product is built around.
- `ProcessInventorySnapshot` holds machine-wide Node inventory used for secondary surfaces.
- `AppSnapshot` remains a temporary adapter that composes ownership + inventory for one release line.
- App refresh application is coordinated so stale results cannot overwrite newer state.
- `PortpourriApp` is decomposed into focused settings, process-action, refresh-support, launch-at-login, shared-view, and settings-view modules instead of one dominant store/view pair.

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
5. Build a `PortOwnershipSnapshot` from watched-port ownership.
6. Optionally build a `ProcessInventorySnapshot` from machine-wide Node inventory.
7. Compose an `AppSnapshot` adapter for the app and CLI.

## App refresh

- `PortpourriStore` requests refreshes through a generation-based coordinator.
- Older detached refresh work may finish, but stale generations are dropped instead of overwriting the latest state.
- A parallel diagnostics path captures the same listener / metadata / inventory probe health the CLI `doctor` command reports, so the app can surface permission or missing-binary failures with context.
- AI/worktree scanning remains on its own async path.
- Conflict notifications are deduped by explicit external-conflict state, not by timer cadence alone.

## App layer

- `Store.swift` now focuses on app orchestration and state ownership.
- `AppSettings.swift` holds menu bar display and persisted settings types.
- `UITokens.swift` centralizes the popover/settings layout constants so view files stop carrying one-off sizing numbers.
- `ProcessActions.swift` centralizes destructive-action policy, grouping eligibility, and confirmation copy.
- `RefreshSupport.swift` isolates generation gating and conflict-notification state tracking.
- `LaunchAtLoginManager.swift` isolates launch-at-login behavior.
- `Views.swift`, `PortOwnershipViews.swift`, `ProcessInventoryViews.swift`, `ViewSupport.swift`, and `SettingsViews.swift` split the popover shell, ownership rows, inventory rows, shared controls, and settings UI into focused files without changing the Phase 2.5 product surface.

## AI tool scan rules

- Claude worktrees are discovered from `~/.claude/projects/*/worktrees/*` plus per-project `.claude/worktrees/*` folders found under desktop project roots.
- Codex worktrees are discovered from `~/.codex/worktrees/*`.
- Worktrees are marked stale after 3 days without directory modification.

## Packaging

- SwiftPM is the source of truth.
- `Scripts/package_app.sh` wraps the executable in a simple `.app` bundle for local use.
