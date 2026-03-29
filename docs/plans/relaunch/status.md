current_phase: phase-2-product-ui
phase_state: in_progress

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-28
completed_at:

blockers:
  - description: >
      Pre-existing test failure: testSampleSnapshotCollapsesDuplicateIPv4IPv6Listener.
      Sample data fixture does not match current SampleData shape. This issue
      predates the Phase 1 work and should not be treated as a regression.
    severity: low
    phase: pre-existing

exact_next_task: >
  Align the app UI and website around the watched-port ownership story:
  Dot Matrix semantics, popover hierarchy, settings structure, and a
  conflict-first homepage.

files_allowed_to_change:
  - site/**
  - docs/ui.md
  - docs/plans/relaunch/**
  - Sources/PortpourriApp/**
  - screenshot assets

files_forbidden_to_change:
  - Sources/PortpourriCore/** except tiny local changes strictly required to
    express already-locked UI semantics safely
  - Sources/PortpourriCLI/**
  - release/version pipeline files unless a Phase 1 regression must be fixed

external_systems_required:
  - system: live-site
    required_state: homepage reflects the new literal watched-port story
    verification: live homepage copy, demo, and links match Phase 2 semantics

validation_required:
  - swift build
  - swift test
  - swift run portpourri snapshot --json
  - sample-mode app launch
  - live-mode app launch
  - docs, settings, tooltip, homepage, and screenshots describe the same Dot Matrix semantics

stop_condition: >
  The menu bar glyph, popover hierarchy, settings copy, screenshots, and
  website all reinforce the same watched-port ownership story.

validation_results:
  swift_build: pass
  swift_test: 10/11 pass (1 pre-existing failure in testSampleSnapshotCollapsesDuplicateIPv4IPv6Listener)
  package_app_version: 0.3.2 matches VERSION
  homepage_version: 0.3.2 in hero badge fallback and release-manifest.json
  download_link: https://github.com/jskoiz/portpourri/releases/latest (302 → v0.3.2)
  asset_url: https://github.com/jskoiz/portpourri/releases/download/v0.3.2/Portpourri-0.3.2-mac.zip (302 → CDN)
  github_link: https://github.com/jskoiz/portpourri (verified in site/index.html lines 281, 299, 410)
  stale_string_scan: zero hits for nicktoonz, NODETRACKER, NodeWatcher, NodeTracker in source files

noted_exceptions:
  - file: Sources/PortpourriCore/Models.swift
    classification: acceptable exception required to restore build health
    reason: >
      Restored AIToolSnapshot and AIWorktreeEntry structs that were lost in a rename
      merge (commit b9a3055). Byte-identical to originals from commit 46faa7e. Without
      these types, swift build fails on origin/main — they are required by AIToolProbe.swift
      which references them. This is not new code; it is recovery of existing code that
      was accidentally dropped.

canonical_decisions:
  version: "0.3.2"
  website_url: "https://www.portpourri.com"
  repo_url: "https://github.com/jskoiz/portpourri"
  asset_naming: "Portpourri-{version}-mac.zip"

handoff_notes: >
  Phase 1 completed on 2026-03-28. The website now lives under site/ in the
  canonical app repo, root VERSION and release-manifest.json drive packaging
  and site metadata, the fake updater UI is removed, About links point to the
  canonical jskoiz surfaces, and the live Vercel deployment is serving the
  merged main branch at https://www.portpourri.com with the manifest-driven
  v0.3.2 hero and canonical GitHub/download links. Phase 2 is now active and
  should focus only on semantic/UI alignment around watched-port ownership.
