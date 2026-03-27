# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2026-03-27

### Changed

- Make watched ports app-configurable presets instead of implicitly tracking every legacy default port
- Add first-run watched-port onboarding so users can opt into common local dev ports

## [0.2.4] - 2026-03-26

### Changed

- Simplify multi-owner conflict detail lines so mixed blockers fit cleanly in the compact popover UI

## [0.2.3] - 2026-03-26

### Fixed

- Keep multi-owner conflict cards internally consistent by using the same primary blocker for the headline, detail text, and action button

## [0.2.2] - 2026-03-26

### Fixed

- Restore the intended popover UX updates on the main release line while retaining the launch crash fix from `0.2.1`

## [0.2.1] - 2026-03-26

### Fixed

- Prevent a launch-time crash in the packaged menu bar app when requesting notification permission on macOS

## [0.2.0] - 2026-03-26

### Changed

- Port suggestion button now copies a configurable command template (default: `PORT={port}`) instead of a bare port number
- Node process groups only display when 3+ instances exist, reducing clutter
- Popover no longer scrolls — node processes appear in a slide-up drawer
- Docker-owned ports (postgres, redis) shown as informational conflicts without action buttons
- Removed "Copy all fixes" button (copied unusable text)

### Fixed

- SSH tunnels running through Docker no longer show "Open Docker" — correctly show "Stop tunnel"

## [0.1.1] - 2026-03-26

### Added

- Automated release pipeline with code signing and Apple notarization
- Homebrew cask distribution (`brew install --cask jskoiz/nodewatcher/nodewatcher`)
- GitHub Actions CI workflow (build, test, release build, CLI validation)
- Open-source hygiene: LICENSE (MIT), CONTRIBUTING.md, CODE_OF_CONDUCT.md, SECURITY.md
- Issue templates and PR template
- Developer ID and App Store entitlements
- Distribution guide (`docs/distribution.md`)

### Fixed

- Remove redundant `StrictConcurrency` Swift setting (error on Swift 6.0 toolchains)

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

[0.1.1]: https://github.com/jskoiz/node-watcher/releases/tag/v0.1.1
[0.2.0]: https://github.com/jskoiz/node-watcher/releases/tag/v0.2.0
[0.1.0]: https://github.com/jskoiz/node-watcher/releases/tag/v0.1.0
[0.2.1]: https://github.com/jskoiz/node-watcher/releases/tag/v0.2.1
[0.2.2]: https://github.com/jskoiz/node-watcher/releases/tag/v0.2.2
[0.2.3]: https://github.com/jskoiz/node-watcher/releases/tag/v0.2.3
[0.2.4]: https://github.com/jskoiz/node-watcher/releases/tag/v0.2.4
[0.2.5]: https://github.com/jskoiz/node-watcher/releases/tag/v0.2.5
