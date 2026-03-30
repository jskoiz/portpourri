current_phase: phase-3-architecture-hardening
phase_state: in_progress

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-28
completed_at:

blockers: []

exact_next_task: >
  Review and merge Phase 3 PR 1 (core model split + refresh correctness), then
  start PR 2 for app-layer decomposition. PR 2 may assume ownership and
  inventory snapshots are split, AppSnapshot remains the adapter surface, and
  refresh application is generation-gated.

files_allowed_to_change:
  - docs/architecture.md
  - docs/plans/relaunch/**
  - Sources/PortpourriCore/**
  - Sources/PortpourriApp/**
  - Tests/**

files_forbidden_to_change:
  - Sources/PortpourriCLI/**
  - site/**
  - broad feature expansion
  - release/version pipeline files

external_systems_required: []

validation_required:
  - swift build
  - swift test
  - swift run portpourri snapshot --json
  - sample-data mode launches
  - live mode launches
  - refresh generation tests prove stale results do not apply
  - notification dedupe tests prove new external conflict states notify once
  - AppSnapshot remains compatible adapter surface for app and CLI

stop_condition: >
  Phase 3 PR 1 lands the ownership/inventory split, generation-gated refresh
  application, and state-based notification dedupe without changing the public
  product story. Phase 3 remains in progress until PR 2 decomposes the app
  layer.

validation_results:
  swift_build: pass (existing SwiftPM unhandled-resource warnings unchanged)
  swift_test: 14/14 pass (0 failures) — added coverage for ownership+inventory composition and app refresh support helpers
  snapshot_json: valid output with source "live"
  sample_mode_launch: pass — app built and launched cleanly under PORTPOURRI_SAMPLE_DATA=1
  live_mode_launch: pass — app built and launched cleanly against live snapshot mode
  ownership_inventory_split: pass — SnapshotService now builds PortOwnershipSnapshot and ProcessInventorySnapshot separately, with AppSnapshot as adapter
  refresh_generation: pass — SnapshotRefreshCoordinator tests prove stale generations do not apply
  notification_state_dedupe: pass — ConflictNotificationTracker tests prove only new external conflict states notify
  docs_alignment: pass — architecture doc and relaunch control plane reflect PR 1 boundaries

noted_exceptions: []

canonical_decisions:
  version: "0.3.2"
  website_url: "https://www.portpourri.com"
  repo_url: "https://github.com/jskoiz/portpourri"
  asset_naming: "Portpourri-{version}-mac.zip"
  phase3_pr_shape: "2 PRs"
  app_snapshot_role: "temporary adapter for one release line"
  inventory_boundary: "machine-wide Node inventory is separate from ownership capture"
  refresh_boundary: "main snapshot refresh is generation-gated; AI/worktree refresh remains separate"

handoff_notes: >
  Phase 3 PR 1 is implemented on this branch. Core now separates
  PortOwnershipSnapshot from ProcessInventorySnapshot, while AppSnapshot stays
  alive as the compatibility adapter for the app and CLI. PortpourriStore now
  applies refresh results through a generation gate so stale refreshes cannot
  overwrite newer state, and watched-port conflict notifications are deduped by
  explicit external-conflict state instead of timer timing. PR 2 should assume
  those guarantees and focus only on decomposing the concentrated app layer.
