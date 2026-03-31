# Portpourri

[![CI](https://github.com/jskoiz/portpourri/actions/workflows/ci.yml/badge.svg)](https://github.com/jskoiz/portpourri/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![macOS 14+](https://img.shields.io/badge/macOS-14%2B-black.svg)](https://www.apple.com/macos/)
[![Swift 6.0](https://img.shields.io/badge/Swift-6.0-orange.svg)](https://swift.org)

A macOS menu bar app that answers one question instantly: **which local ports are in use, who owns them, and is it my dev server or something blocking it?**

If you've ever had multiple projects fighting over ports 3000, 5173, or 8081 and resorted to a pile of `lsof` and `ps` commands, Portpourri replaces that with a single glance.

## Features

- **Live port monitoring** in the menu bar with a compact summary
- **Project-aware** — maps Node processes back to their project root (`package.json`, `.git`, lockfiles)
- **Smart classification** — identifies Vite, Next.js, Expo, Storybook, Nest, and other Node-family tools by name
- **Conflict detection** — distinguishes "your app owns this port" from "Docker is blocking it" or "an SSH tunnel is occupying it"
- **Safe actions** — context-aware resolution (free port, stop tunnel, configurable port command template) with no destructive force-kill
- **Configurable** — settings for watched ports, refresh cadence, display modes, hotkeys, port command template, and grouping
- **CLI included** — `snapshot`, `why`, `list`, and `doctor` for scripting, CI, and terminal-first diagnosis

## Requirements

- macOS 14 (Sonoma) or later
- Swift 6.0+ toolchain (Xcode 16+)

## Install

### Download

Grab the latest signed release from [GitHub Releases](https://github.com/jskoiz/portpourri/releases/latest). Unzip, drag to Applications, and launch — the app appears in the menu bar.

### Build from source

```bash
git clone https://github.com/jskoiz/portpourri.git
cd portpourri
./Scripts/package_app.sh
open .build/Portpourri.app
```

### Run the app

```bash
# As a menu bar app
./Scripts/package_app.sh
open .build/Portpourri.app

# Or directly (development mode)
swift run PortpourriApp

# With sample data (no real processes needed)
swift run PortpourriApp --sample-data
```

### CLI

```bash
# Live snapshot of all listening processes (schemaVersion + snapshot envelope)
swift run portpourri snapshot --json

# Explain one port
swift run portpourri why 3000

# Show watched-port status
swift run portpourri list --watched

# Show all current listeners
swift run portpourri list --all

# Run a human-readable diagnostics pass
swift run portpourri doctor

# Dump test fixtures with the same JSON envelope
swift run portpourri fixtures --name mixed --json
```

## How It Works

Portpourri builds a snapshot of local listening processes in a pipeline:

1. **Probe** — scans TCP sockets via `lsof`
2. **Enrich** — adds process metadata from `ps`
3. **Resolve** — walks up from the process working directory to find the project root
4. **Classify** — identifies Node-family dev tools (vite, next, expo, etc.) from the command line
5. **Collapse** — deduplicates IPv4/IPv6 listeners into one logical port owner
6. **Assess** — marks watched ports as owned by your app or blocked by something else

This is why Portpourri says "3000 is blocked by Docker" or "8081 is owned by the Expo app in `~/projects/mobile`" instead of just "PID 12345 is using port 3000."

## Architecture

```
Sources/
  PortpourriCore/    # Models, parsers, classifier, snapshot service (no UI)
  PortpourriApp/     # SwiftUI menu bar app
  PortpourriCLI/     # CLI commands (snapshot, why, list, doctor, fixtures)
Tests/
  PortpourriCoreTests/   # Fixture-based parser, resolver, and integration tests
  PortpourriCLITests/    # Fixture-backed CLI output and JSON contract tests
Scripts/
  package_app.sh      # Build and wrap into .app bundle
  dev_harness.sh      # Spin up local test listeners for manual testing
  extract_release_notes.py  # Build GitHub Release notes from CHANGELOG.md
site/
  index.html          # Marketing homepage
  css/                # Styles
  js/                 # Interactive demo and animations
  data/               # Release manifest (version, download URL)
  assets/             # Logos and marketing assets
docs/
  product.md          # Product spec and design philosophy
  architecture.md     # Module boundaries and data flow
  ui.md               # Menu bar and popover layout
  dev-harness.md      # Testing strategy and validation commands
```

The core library (`PortpourriCore`) is deliberately free of AppKit/SwiftUI so it can be tested independently and reused by both the GUI and CLI.

## Development

```bash
# Build
swift build

# Test
swift test

# Run with sample data
swift run PortpourriApp --sample-data

# Run the dev harness (creates real test listeners)
./Scripts/dev_harness.sh
```

See [`docs/dev-harness.md`](docs/dev-harness.md) for the full testing strategy.
See [`docs/troubleshooting.md`](docs/troubleshooting.md) for common failure cases and the probe commands Portpourri uses under the hood.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE)
