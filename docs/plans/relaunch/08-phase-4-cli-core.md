# Phase 4 — CLI Core Product Depth

## Goal

Make Portpourri useful to terminal-first users without losing focus.

## Scope

This phase covers:
- read-only CLI depth
- stable machine-readable output
- better diagnostics and troubleshooting docs

This phase does **not** cover:
- destructive CLI commands
- plugin shipping
- broad non-Node ecosystem expansion

## Inputs / dependencies

- completed Phase 3
- current CLI commands
- current fixture-based tests
- docs and examples

## Decisions already made

- CLI remains read-only in this phase
- `snapshot --json` stays canonical
- compatibility should be preserved where practical during 0.x

## Task checklist

### New commands
- `portpourri why <port>`
- `portpourri list --watched`
- `portpourri list --all`
- `portpourri doctor`

### JSON contract
- add `schemaVersion`
- keep `snapshot --json` canonical
- preserve existing fields where practical
- document expected shapes
- add a release-line fixture test protecting the JSON shape

### Docs
- update README examples
- add troubleshooting examples
- document common failure cases and probe expectations

## Files allowed to change

- CLI target files
- core models if needed for stable CLI output
- README
- troubleshooting docs
- tests
- relaunch plan docs

## Files forbidden to change

- website layout/copy except README examples that depend on CLI usage
- app UI semantics
- destructive app actions

## Validation

- `swift build`
- `swift test`
- deterministic tests for `why` and `list`
- examples in docs run as written
- `snapshot --json` remains valid and documented

## Stop condition

The CLI is a real read-only companion with stable-enough machine output and useful human-readable diagnosis.

## Artifacts to update

- `README.md`
- troubleshooting docs
- tests
- `status.md`

## Decisions locked for this phase

- `doctor` is human-readable only in this phase
- schema compatibility gets an explicit fixture-style test

## Next phase handoff

The next phase may assume:
- the CLI is no longer a minimal sidecar
- docs and examples cover the most useful commands
- machine output has a named schema version

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 4 only.
Keep the wedge tight.
This is about read-only utility and contributor leverage, not turning Portpourri into a CLI process manager.
