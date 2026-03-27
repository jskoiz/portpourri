# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

[0.1.0]: https://github.com/jskoiz/node-watcher/releases/tag/v0.1.0
