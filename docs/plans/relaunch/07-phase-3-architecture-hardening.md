# Phase 3 — Architecture Hardening

## Goal

Improve internal clarity and correctness without changing the product story.

## Scope

This phase covers:
- domain model split
- refresh coordination
- app-layer decomposition
- notification dedupe correctness
- safer ownership boundaries in code

This phase does **not** cover:
- ecosystem expansion
- plugin shipping
- major new end-user features

## Inputs / dependencies

- completed Phase 2.5
- current `AppSnapshot`-centric flow
- current refresh behavior
- current concentrated app-layer files

## Decisions already made

- keep `PortpourriCore` UI-free
- prefer small, legible types
- avoid abstraction for its own sake
- architecture cleanup must not become a rewrite

## Task checklist

### Domain model
- split port ownership from global process inventory
- introduce `PortOwnershipSnapshot`
- move machine-wide Node inventory and memory grouping into `ProcessInventoryService`
- keep `AppSnapshot` as an adapter layer during transition

### Services / interfaces
- define focused interfaces for:
  - `ToolDetector`
  - `ProjectResolver`
  - `ActionAdvisor`
- keep initial behavior Node-focused

### Refresh correctness
- put refresh behind a coordinator or actor
- enforce single-flight refresh
- prevent stale refreshes from overwriting newer state
- dedupe notifications by state/generation, not time alone

### App-layer decomposition
Split concentrated app/UI files into focused pieces:
- popover shell
- watched ports
- listeners / blockers
- process groups
- AI tools
- settings tabs
- shared components

Split store/services into:
- settings persistence
- snapshot coordination
- notifications
- process actions
- launch-at-login

## Files forbidden to change

- site copy or site layout except where architecture changes force screenshot refreshes later
- CLI public behavior except where adapter changes require compatibility fixes

## Files allowed to change

- `Sources/PortpourriCore/**`
- `Sources/PortpourriApp/**`
- tests
- architecture docs
- relaunch plan docs

## Validation

- `swift build`
- `swift test`
- explicit tests for refresh ordering
- explicit tests for safety boundaries
- sample-data mode still launches cleanly
- live snapshot still works

## Stop condition

Refresh behavior is serialized, destructive ownership boundaries are explicit in the code, and the concentrated app layer is broken into understandable units.

## Artifacts to update

- `docs/architecture.md`
- tests
- `status.md`

## Decisions locked for this phase

- `AppSnapshot` survives for one release as an adapter
- AI/worktree scanning gets a clearer separate async boundary

## Next phase handoff

The next phase may assume:
- internals are stable enough for CLI depth
- refresh/state correctness has tests
- the app layer is no longer a single large concentration point

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 3 only.
Do not broaden the feature set.
Prefer clearer seams and safer state handling over ambitious abstraction.
