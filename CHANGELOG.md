# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.0] - 2026-03-30

### Added

- Read-only CLI depth with `portpourri why <port>`, `portpourri list --watched`, `portpourri list --all`, and `portpourri doctor`
- Versioned machine output for `snapshot --json` and `fixtures --json` via a top-level `schemaVersion` envelope
- Release provenance checks so the workflow verifies `VERSION` matches the release tag before publishing

### Changed

- Locked the product story around watched-port ownership, conflict-first diagnosis, and safe next actions across the app, CLI, and docs
- Updated release metadata and manifest highlights for the `0.4.0` launch
- Updated release preparation so GitHub Release notes are sourced directly from this changelog

### Fixed

- Generation-gated snapshot refresh so older refreshes cannot overwrite newer state
- State-based conflict notification dedupe
- Project-scoped grouped cleanup and action-specific destructive confirmations

## [0.3.2] - 2026-03-29

### Changed

- Renamed the app to Portpourri and shipped the new icon and website branding
- Added the Dot Matrix menu bar mode and watched-port-first summary surfaces
- Exposed AI worktree visibility as a secondary, read-only surface

## [0.3.0] - 2026-03-28

### Changed

- Reframed the app around watched-port ownership instead of generic process monitoring
- Added the dedicated Ports settings tab and reorganized General and Display
- Made action labels ownership-aware with `Stop server`, `Free port`, `Stop tunnel`, and `Kill group`

## [0.2.0] - 2026-03-26

### Changed

- Port suggestion button now copies a configurable command template (default: `PORT={port}`) instead of a bare port number
- Node process groups only display when 3+ instances exist, reducing clutter
- Popover no longer scrolls — node processes appear in a slide-up drawer
- Docker-owned ports (postgres, redis) shown as informational conflicts without action buttons
- Removed "Copy all fixes" button (copied unusable text)

### Fixed

- SSH tunnels running through Docker no longer show "Open Docker" — correctly show "Stop tunnel"

## [0.1.0] - 2025-03-26

### Added

- Menu bar status item with live port monitoring summary
- Popover UI showing watched ports, owners, and conflicts
- Node-family process classification (Vite, Next.js, Expo, Storybook, Nest, and more)
- Project root resolution via `package.json`, `.git`, lockfiles, and workspace markers
- Context-aware conflict actions (free port, stop tunnel, open Docker, suggest alternate)
- Settings window with 5 tabs: General, Ports, Display, Hotkeys, Advanced
- Configurable global hotkey to toggle popover
- Display mode options (compact, detailed, grouped)
- CLI with `snapshot` and `fixtures` commands
- IPv4/IPv6 listener deduplication
- Fixture-based test suite for parsers, resolvers, and integration
- Dev harness script for local testing with real listeners
- App bundle packaging script

[0.4.0]: https://github.com/jskoiz/portpourri/releases/tag/v0.4.0
[0.3.2]: https://github.com/jskoiz/portpourri/releases/tag/v0.3.2
[0.3.0]: https://github.com/jskoiz/portpourri/releases/tag/v0.3.0
[0.2.0]: https://github.com/jskoiz/portpourri/releases/tag/v0.2.0
[0.1.0]: https://github.com/jskoiz/portpourri/releases/tag/v0.1.0
