# Contributing to NodeWatcher

Thanks for your interest in contributing! This guide will help you get started.

## Getting Started

1. **Fork** the repository on GitHub
2. **Clone** your fork locally:
   ```bash
   git clone https://github.com/YOUR_USERNAME/node-watcher.git
   cd node-watcher
   ```
3. **Build and test** to make sure everything works:
   ```bash
   swift build
   swift test
   ```

## Development Setup

- **macOS 14+** and **Xcode 16+** (Swift 6.0 toolchain) are required
- No external dependencies — everything is built with Swift Package Manager

### Useful Commands

```bash
swift build                              # Build all targets
swift test                               # Run all tests
swift run nodetracker snapshot --json    # Live port snapshot
swift run NodeTrackerApp --sample-data   # Launch app with fixture data
./Scripts/dev_harness.sh                 # Spin up test listeners
```

## Project Structure

| Directory | Purpose |
|-----------|---------|
| `Sources/NodeTrackerCore/` | Models, parsers, classifier, snapshot service — **no UI imports** |
| `Sources/NodeTrackerApp/` | SwiftUI menu bar app |
| `Sources/NodeTrackerCLI/` | CLI commands |
| `Tests/NodeTrackerCoreTests/` | Fixture-based tests |
| `docs/` | Product spec, architecture, UI design, dev harness |

### Key Rules

- **Keep `NodeTrackerCore` free of AppKit/SwiftUI.** The core library must be testable without a GUI.
- **Parse shell output once at the edge, then operate on typed models.** Don't re-parse strings in business logic.
- **Prefer small, legible types over clever abstractions.**
- **No privileged or force-kill behavior** unless explicitly requested by the user through the UI.

## Making Changes

1. **Create a branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```
2. **Make your changes** — keep commits focused and atomic
3. **Run the checks** before pushing:
   ```bash
   swift build
   swift test
   swift run nodetracker snapshot --json  # Should produce valid output
   ```
4. **Update docs** if you changed architecture or module boundaries (see `docs/`)

## Pull Request Process

1. **Open a PR** against `main` with a clear title and description
2. **Describe what and why** — not just what you changed, but the motivation
3. **Ensure CI passes** — the GitHub Actions workflow runs `swift build` and `swift test`
4. **Keep PRs focused** — one feature or fix per PR. If a change is large, consider breaking it up.

### Commit Message Style

Use clear, imperative-mood commit messages:

```
Add port conflict detection for Docker containers
Fix IPv6 listener deduplication in snapshot service
Update classifier to recognize Storybook dev server
```

## Reporting Bugs

Open a [GitHub Issue](https://github.com/jskoiz/node-watcher/issues/new?template=bug_report.md) with:

- macOS version
- Steps to reproduce
- Expected vs actual behavior
- Relevant output from `swift run nodetracker snapshot --json` if applicable

## Suggesting Features

Open a [GitHub Issue](https://github.com/jskoiz/node-watcher/issues/new?template=feature_request.md) describing:

- The problem you're trying to solve
- Your proposed solution
- Any alternatives you've considered

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
