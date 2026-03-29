current_phase: phase-3-architecture-hardening
phase_state: completed

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-28
completed_at: 2026-03-29

blockers: []

exact_next_task: >
  Review and merge Phase 3 PR 1 (core model split + refresh correctness) and
  Phase 3 PR 2 (app-layer decomposition) in order, then move the control plane
  to Phase 4 CLI core work.

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
  Phase 3 is complete when PR 1 lands the ownership/inventory split,
  generation-gated refresh application, and state-based notification dedupe,
  and PR 2 decomposes the concentrated app layer without changing the public
  product story.

validation_results:
  swift_build: pass (existing SwiftPM unhandled-resource warnings unchanged)
  swift_test: 14/14 pass (0 failures) — added coverage for ownership+inventory composition and app refresh support helpers
  snapshot_json: valid output with source "live"
  sample_mode_launch: pass — app built and launched cleanly under PORTPOURRI_SAMPLE_DATA=1
  live_mode_launch: pass — app built and launched cleanly against live snapshot mode
  ownership_inventory_split: pass — SnapshotService now builds PortOwnershipSnapshot and ProcessInventorySnapshot separately, with AppSnapshot as adapter
  refresh_generation: pass — SnapshotRefreshCoordinator tests prove stale generations do not apply
  notification_state_dedupe: pass — ConflictNotificationTracker tests prove only new external conflict states notify
  app_layer_decomposition: pass — Store.swift and Views.swift are no longer the dominant concentration points; focused app/service/view files now own settings, process actions, shared controls, and settings UI
  docs_alignment: pass — architecture doc and relaunch control plane reflect both PR 1 and PR 2 boundaries

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
  Phase 3 is complete across 2 PRs. PR 1 split ownership snapshots from
  machine-wide inventory, kept AppSnapshot as the compatibility adapter, and
  made refresh and notification application state-safe. PR 2 decomposed the
  concentrated app layer into focused settings, process-action, refresh-support,
  launch-at-login, shared-view, and settings-view files without changing the
  Phase 2.5 product surface. Phase 4 may assume the internal boundaries are
  hardened and can build CLI depth on top of the new adapter/core split.
