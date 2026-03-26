# NodeWatcher

NodeWatcher is a macOS menu bar app for answering one local-dev question quickly: which ports are busy, which Node processes own them, and which project they belong to.

## What it does

- Shows busy watched ports in the menu bar.
- Groups Node-family listeners by project root.
- Surfaces non-Node listeners that may still block common dev ports.
- Offers safe quick actions: reveal folder, open terminal, copy PID, copy command, terminate with confirmation.
- Ships a CLI and fixtures so the same data model can be tested and inspected outside the UI.

## Repository shape

- `AGENTS.md` is the top-level map for agents.
- `docs/` is the system of record for product, UI, architecture, and harness guidance.
- `Sources/NodeTrackerCore` owns probing, parsing, normalization, and project resolution.
- `Sources/NodeTrackerApp` owns the menu bar app.
- `Sources/NodeTrackerCLI` exposes snapshot and fixture commands.

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
