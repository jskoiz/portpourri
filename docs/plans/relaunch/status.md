current_phase: phase-4-cli-core
phase_state: completed

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-29
completed_at: 2026-03-29

blockers: []

exact_next_task: >
  Start Phase 5 launch-readiness work: refresh screenshots/demo assets, verify
  release/install/docs consistency, and make the launch-facing surfaces match
  the current app and CLI.

files_allowed_to_change:
  - README.md
  - docs/dev-harness.md
  - docs/troubleshooting.md
  - docs/plans/relaunch/**
  - Sources/PortpourriCore/**
  - Sources/PortpourriCLI/**
  - Tests/**

files_forbidden_to_change:
  - site/**
  - Sources/PortpourriApp/**
  - destructive app actions
  - broad non-Node ecosystem expansion

external_systems_required: []

validation_required:
  - swift build
  - swift test
  - swift run portpourri snapshot --json
  - swift run portpourri fixtures --name mixed --json
  - swift run portpourri why 3000
  - swift run portpourri list --watched
  - swift run portpourri list --all
  - swift run portpourri doctor
  - snapshot --json includes schemaVersion and the snapshot envelope
  - deterministic tests cover why/list/doctor and the JSON contract

stop_condition: >
  The CLI is a real read-only companion with stable-enough machine output and
  useful human-readable diagnosis, without changing app UI semantics or adding
  destructive CLI commands.

validation_results:
  swift_build: pass (existing SwiftPM unhandled-resource warnings unchanged)
  swift_test: 23/23 pass (0 failures) — added explicit CLI coverage for why/list/doctor and a golden snapshot envelope fixture
  snapshot_json: pass — schemaVersion envelope wraps the existing AppSnapshot payload
  fixtures_json: pass — fixtures emit the same schemaVersion envelope as live snapshot export
  why_command: pass — human-readable explanation works for watched free, watched owned, watched blocked, and unwatched busy cases
  list_commands: pass — deterministic watched-port and all-listener listings are covered by fixture-backed tests
  doctor_command: pass — human-readable diagnostics include probe status headings and the exact probe commands
  sample_mode_launch: pass — app still builds and launches under PORTPOURRI_SAMPLE_DATA=1
  live_mode_launch: pass — app still builds and launches against live snapshot mode
  docs_alignment: pass — README, dev harness, troubleshooting, and relaunch docs all reflect the Phase 4 CLI surface

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
  phase4_pr_shape: "1 PR"
  snapshot_schema_version: "0.1"
  doctor_output_mode: "human-readable only"

handoff_notes: >
  Phase 4 is complete in one PR. The CLI now provides read-only `why`, `list`,
  and `doctor` commands on top of the Phase 3 adapter/core split, while
  `snapshot --json` remains canonical under a versioned schema envelope.
  Deterministic CLI tests now protect the JSON contract and the human-readable
  outputs for watched-port diagnosis. Phase 5 may assume the CLI is a real
  companion surface and focus only on launch-readiness, screenshots, and
  release/docs consistency.
