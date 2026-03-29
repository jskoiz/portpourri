<p align="center">
  <h1 align="center">Portpourri</h1>
  <p align="center">
    A macOS menu bar app that shows which local ports are in use, who owns them, and whether it's your dev server or something blocking it.
  </p>
  <p align="center">
    <a href="https://github.com/jskoiz/portpourri/actions/workflows/ci.yml"><img src="https://github.com/jskoiz/portpourri/actions/workflows/ci.yml/badge.svg" alt="CI"></a>
    <a href="https://github.com/jskoiz/portpourri/releases/latest"><img src="https://img.shields.io/github/v/release/jskoiz/portpourri?label=release&color=green" alt="Latest Release"></a>
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License: MIT"></a>
    <a href="https://www.apple.com/macos/"><img src="https://img.shields.io/badge/macOS-14%2B-black.svg" alt="macOS 14+"></a>
    <a href="https://swift.org"><img src="https://img.shields.io/badge/Swift-6.0-orange.svg" alt="Swift 6.0"></a>
  </p>
</p>

---

If you've ever had multiple projects fighting over ports 3000, 5173, or 8081 and resorted to a pile of `lsof` and `ps` commands — Portpourri replaces all of that with a single glance at your menu bar.

<p align="center">
  <img src=".github/images/popover-detail.png" width="520" alt="Portpourri popover showing watched ports, project names, and conflict resolution">
</p>

## Features

- **Live port monitoring** — compact menu bar summary with dot matrix or numeric display modes
- **Project-aware** — maps Node processes back to their project root (`package.json`, `.git`, lockfiles)
- **Smart classification** — identifies Vite, Next.js, Expo, Storybook, Nest, and other Node-family tools by name
- **Conflict detection** — distinguishes "your app owns this port" from "Docker is blocking it" or "an SSH tunnel is occupying it"
- **AI tool tracking** — shows Claude Code and Codex worktrees, session counts, and disk usage with cleanup actions
- **Dark mode** — follows system appearance automatically
- **Safe actions** — context-aware resolution (free port, stop tunnel, kill process groups) with confirmation
- **Configurable** — watched ports, refresh cadence, display modes, hotkeys, and grouping
- **CLI included** — `portpourri snapshot --json` for scripting and CI

## Install

### Download (recommended)

Grab the latest signed and notarized `.app` from [**Releases**](https://github.com/jskoiz/portpourri/releases/latest), unzip, and drag to Applications.

Requires macOS 14 (Sonoma) or later.

### Homebrew

```bash
brew tap jskoiz/portpourri
brew install --cask portpourri
```

### Build from source

Requires Swift 6.0+ (Xcode 16+):

```bash
git clone https://github.com/jskoiz/portpourri.git
cd portpourri
./Scripts/package_app.sh
open .build/Portpourri.app
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

## CLI

```bash
# Live snapshot of all listening processes
portpourri snapshot --json

# Pretty-print with port filtering
portpourri snapshot --json | jq '.projects'

# Dump test fixtures
portpourri fixtures --name mixed --json
```

## Architecture

```
Sources/
  PortpourriCore/    # Models, parsers, classifier, snapshot service (no UI)
  PortpourriApp/     # SwiftUI menu bar app
  PortpourriCLI/     # CLI commands (snapshot, fixtures)
Tests/
  PortpourriCoreTests/   # Fixture-based parser, resolver, and integration tests
Scripts/
  package_app.sh      # Build and wrap into .app bundle
  dev_harness.sh      # Spin up local test listeners for manual testing
```

The core library (`PortpourriCore`) is deliberately free of AppKit/SwiftUI so it can be tested independently and reused by both the GUI and CLI.

## Roadmap

### Next up

- [ ] **Cached AI tool sizes** — persist worktree sizes to disk, only rescan on change (currently ~90s for large Codex dirs)
- [ ] **Session cleanup** — expose Codex archived sessions and log files for deletion (currently 656MB+ unmanaged)
- [ ] **Memory alerts** — notify when Node processes exceed a configurable memory threshold

### Planned

- [ ] **Port history** — show which project last used a port and when
- [ ] **Quick-switch ports** — one-click to restart a dev server on a suggested alternate port
- [ ] **Monorepo awareness** — better grouping for Turborepo/Nx/pnpm workspace projects
- [ ] **Process tree view** — visualize parent-child relationships (e.g., which `node` spawned which)

### Considering

- [ ] **Profiles** — save port configurations per project or workspace
- [ ] **Export/share** — copy a snapshot as Markdown or JSON for bug reports
- [ ] **Plugin system** — user-defined classifiers for non-Node dev servers (Python, Go, Ruby)

### Shipped (recent)

- [x] **AI tool tracking** — Claude Code and Codex worktree/session visibility with cleanup actions
- [x] **Dot matrix menu bar** — visual project dots + memory gauge blocks
- [x] **Dark mode** — follows system appearance
- [x] **Brand icons** — Claude and Codex logos via SVG assets
- [x] **Expandable process groups** — click to reveal Kill all + Copy PIDs
- [x] **Hover highlights** — interactive rows highlight on hover
- [x] **Idle state** — calm display when no processes are running

### Not planned

- General process manager features (use Activity Monitor)
- Remote server monitoring (this is a local-only tool)
- Windows/Linux support (macOS-native by design)

Have an idea? [Open a feature request](https://github.com/jskoiz/portpourri/issues/new?template=feature_request.md).

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

See [`docs/dev-harness.md`](docs/dev-harness.md) for the full testing strategy and [`docs/architecture.md`](docs/architecture.md) for module boundaries.

## Contributing

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request.

## License

[MIT](LICENSE)
