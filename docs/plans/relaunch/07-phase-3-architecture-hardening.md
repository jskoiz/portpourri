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
- Phase 3 is split across 2 PRs:
  - PR 1 = ownership/inventory split + refresh/notification correctness
  - PR 2 = app-layer decomposition

## Next phase handoff

The next phase may assume:
- PR 1 assumptions:
  - ownership and inventory snapshots are split internally
  - `AppSnapshot` still bridges the app and CLI surface
  - refresh/state correctness has focused tests
- PR 2 assumptions after merge:
  - the app layer can be decomposed without redefining snapshot ownership rules
  - refresh/state correctness no longer needs structural changes

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 3 only.
Do not broaden the feature set.
Prefer clearer seams and safer state handling over ambitious abstraction.

## PR 1 handoff update

Implemented in PR 1:
- introduced `PortOwnershipSnapshot` and `ProcessInventorySnapshot`
- kept `AppSnapshot` as the compatibility adapter
- split `SnapshotService` so ownership capture and inventory capture are explicit paths
- added `SnapshotRefreshCoordinator` to gate stale refresh application
- moved conflict notification dedupe behind explicit external-conflict state tracking
- added tests for snapshot composition and app refresh support helpers

Remaining for PR 2:
- break up the concentrated app layer (`Views.swift`, `Store.swift`, and adjacent helpers)
- preserve all Phase 2.5 user-facing behavior while moving logic into focused files/services

## PR 2 handoff update

Implemented in PR 2:
- split settings persistence and display-mode types into `AppSettings.swift`
- split destructive-action policy and confirmation logic into `ProcessActions.swift`
- isolated launch-at-login handling in `LaunchAtLoginManager.swift`
- moved shared popover and utility views into `ViewSupport.swift`
- moved settings UI into `SettingsViews.swift`
- reduced `Store.swift` and `Views.swift` to focused orchestration and section composition roles

Phase 3 completion state:
- `PortOwnershipSnapshot` and `ProcessInventorySnapshot` are separate internal domains
- `AppSnapshot` remains the adapter surface for the current release line
- refresh application is generation-gated
- external conflict notifications are state-deduped
- the app layer is decomposed into focused files instead of one dominant store/view pair

Validation completed for the full phase:
- `swift build`
- `swift test`
- `swift run portpourri snapshot --json`
- sample-data mode launch smoke test
- live mode launch smoke test

Phase 4 may assume:
- core ownership vs inventory boundaries are stable
- refresh/notification correctness no longer needs structural work
- app-layer seams are clear enough to extend CLI and adapter behavior without another giant-file refactor
