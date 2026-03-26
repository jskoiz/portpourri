# Dev Harness

## Why

This repo is structured for agent-first execution. The harness exists so changes can be validated mechanically instead of by intuition.

## Harness pieces

- Fixture-backed parser tests using captured `lsof`, `ps`, and `cwd` outputs.
- `nodetracker snapshot --json` for live inspection.
- `nodetracker fixtures --name mixed --json` for deterministic sample output.
- `swift run NodeTrackerApp --sample-data` for UI validation without live processes.
- `Scripts/dev_harness.sh` to create a small set of known listeners locally.

## Standard checks

```bash
swift build
swift test
swift run nodetracker fixtures --name mixed --json
swift run nodetracker snapshot --json
```
