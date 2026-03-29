current_phase: phase-2.5-safety-gate
phase_state: completed

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-28
completed_at: 2026-03-28

blockers: []

exact_next_task: >
  Begin Phase 3 architecture-hardening from the current bounded-action model.
  The next branch may assume destructive UI actions are limited to explicit
  watched-port owners or active-listener groups inside a project boundary, and
  that ambiguous shared-label cases do not expose a Kill group affordance in
  the live app.

files_allowed_to_change:
  - docs/ui.md
  - docs/plans/relaunch/**
  - Sources/PortpourriApp/**
  - screenshot/demo assets if Phase 2.5 safety changes require them

files_forbidden_to_change:
  - Sources/PortpourriCore/** except tiny local changes strictly required to
    express already-locked UI semantics safely
  - Sources/PortpourriCLI/**
  - site/**
  - broad architecture refactors
  - release/version pipeline files unless a Phase 1 regression must be fixed

external_systems_required: []

validation_required:
  - swift build
  - swift test
  - swift run portpourri snapshot --json
  - confirm no UI action can terminate unrelated non-listener Node work
  - confirm grouped cleanup is limited to allowed active-listener scope
  - confirm confirmation prompts differ by action type
  - manual app-session safety scenario: shared tool label does not produce a cross-project Kill group
  - confirm docs and UI text match the implemented safety model

stop_condition: >
  Public destructive actions are bounded to explicit watched-port owners or
  active-listener groups, AI tools remain read-only, and the UI/docs describe
  the same safety model.

validation_results:
  swift_build: pass (existing SwiftPM unhandled-resource warnings unchanged)
  swift_test: 11/11 pass (0 failures)
  snapshot_json: valid output with source "live"
  bounded_actions: pass — removed the leftover bulk watched-port terminate path; watched-port actions target explicit owners only
  grouped_cleanup_scope: pass — process-group cleanup is derived from active listener processes inside a single `ProjectSnapshot` ownership boundary, not machine-wide `nodeProcessGroups` or cross-project tool labels
  confirmation_prompts: pass — Stop server, Free port, Stop tunnel, and Kill group each use distinct confirmation copy
  ai_tools_scope: pass — AI tools remain read-only; no cleanup action is exposed
  docs_alignment: pass — `docs/ui.md`, relaunch contract, and Phase 2.5 handoff reflect the implemented safety model
  manual_safety_scenario: pass — in a real running app session, two simultaneous watched-port `node` projects remained visible as separate watched-port owners and exposed no shared Kill group action, satisfying the ambiguous shared-label safety gate

noted_exceptions: []

canonical_decisions:
  version: "0.3.2"
  website_url: "https://www.portpourri.com"
  repo_url: "https://github.com/jskoiz/portpourri"
  asset_naming: "Portpourri-{version}-mac.zip"
  action_labels:
    node_owned: "Stop server"
    external_blocker: "Free port"
    ssh_tunnel: "Stop tunnel"
    generic: "Stop blocker"
    group: "Kill group"
  grouped_cleanup_scope: "only active-listener groups within an explicit project ownership boundary"
  ai_tools_scope: "read-only inventory only in Phase 2.5"
  confirmation_model: "action-specific prompts for Stop server, Free port, Stop tunnel, Kill group"
  settings_tabs: "General, Display, Ports, Advanced, About"
  popover_sections: "Watched Ports, Other Listeners, Process Groups, AI Tools"

handoff_notes: >
  Phase 2.5 safety logic has been corrected so Kill group is now bounded to an
  explicit project ownership boundary plus tool label, preventing unrelated
  active listener-backed projects from being swept together. Confirmation
  prompts remain action-specific and AI tools remain read-only. Manual
  verification passed in a live app session on 2026-03-28: two simultaneous
  watched-port `node` projects did not expose a shared Kill group affordance,
  so the ambiguous shared-label case remained non-destructive. Phase 3 may now
  assume the public safety model is enforced in both code and UI.
