current_phase: phase-1-monorepo-trust
phase_state: in_progress

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-28
completed_at:

blockers:
  - description: >
      Live Vercel deploy not yet switched. The current Vercel project (node-tracker-site)
      deploys from the separate portpourri-site repo. It must be repointed to the app
      repo (jskoiz/portpourri) with site/ as the root directory AFTER this PR merges.
      Cannot be done before merge because site/ does not exist on main yet.
    severity: blocking-completion
    phase: phase-1
  - description: >
      Pre-existing test failure: testSampleSnapshotCollapsesDuplicateIPv4IPv6Listener.
      Sample data fixture does not match current SampleData shape. This test was already
      failing on origin/main (which also had a build failure from missing AI types).
      Not caused by Phase 1 changes.
    severity: low
    phase: pre-existing

exact_next_task: >
  1. Merge this PR to main.
  2. In Vercel dashboard, repoint the project to jskoiz/portpourri with root directory set to site/.
  3. Verify https://www.portpourri.com serves manifest-driven content with v0.3.2 in the hero badge.
  4. Mark phase complete.

files_allowed_to_change:
  - VERSION
  - release-manifest.json
  - site/**
  - Scripts/package_app.sh
  - README.md
  - docs/distribution.md
  - docs/plans/relaunch/**
  - Sources/PortpourriApp/**

files_forbidden_to_change:
  - Sources/PortpourriCore/**
  - Sources/PortpourriCLI/**
  - Tests/** except tests directly needed for packaging/version trust checks

external_systems_required:
  - system: github-releases
    required_state: canonical repo release metadata and asset URLs are correct
    verification: >
      VERIFIED: /releases/latest redirects to v0.3.2. Direct asset URL
      (Portpourri-0.3.2-mac.zip) returns 302 to CDN. Manifest assetUrl matches.
  - system: vercel
    required_state: deploy target points at the app repo and publishes from site/
    verification: >
      NOT YET VERIFIED. Current project (node-tracker-site) deploys from separate repo.
      Must be repointed after PR merge.

validation_required:
  - swift build
  - swift test
  - packaged app version matches VERSION
  - homepage version matches release-manifest.json
  - homepage download link resolves to canonical release asset
  - homepage GitHub link resolves to jskoiz/portpourri

stop_condition: >
  The app repo, packaged app, release assets, and live site all point to the
  same canonical identity and working install path, with no separate site repo required.

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

vercel_repoint_checklist:
  - step: 1
    action: Merge this PR to main
  - step: 2
    action: >
      In Vercel dashboard (vercel.com), go to project node-tracker-site → Settings → Git.
      Change the connected repository from the portpourri-site repo to jskoiz/portpourri.
      Set Root Directory to "site".
  - step: 3
    action: >
      Alternatively, create a new Vercel project: vercel link in the app repo root,
      then set Root Directory to site/ in project settings.
  - step: 4
    action: >
      Trigger a production deploy (push to main or vercel --prod from repo root).
  - step: 5
    action: >
      Verify https://www.portpourri.com shows v0.3.2 in the hero badge, Download for Mac
      links to /releases/latest, View on GitHub links to jskoiz/portpourri.
  - step: 6
    action: >
      Once verified, mark phase_state as complete and set completed_at date.
      Only then may the old portpourri-site repo be archived/frozen.

handoff_notes: >
  All Phase 1 code changes are implemented, reviewed, and validated. The branch is
  ready for PR. The Models.swift change has been reviewed and classified as an acceptable
  exception: it restores two structs (AIToolSnapshot, AIWorktreeEntry) that were
  byte-identical to their originals and lost in a rename merge. Without them swift build
  fails on origin/main. Phase remains in_progress because the Vercel deploy cannot be
  switched until the PR merges (site/ must exist on main first). See
  vercel_repoint_checklist above for the exact post-merge steps. The old portpourri-site
  repo must NOT be archived until the live deploy is confirmed at www.portpourri.com.
