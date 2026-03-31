current_phase: phase-5-launch
phase_state: in_progress

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-30
completed_at:

blockers:
  - merge Phase 5 PR
  - tag v0.4.0 from clean main
  - verify GitHub Release workflow publishes Portpourri-0.4.0-mac.zip
  - verify https://www.portpourri.com serves the 0.4.0 launch surfaces

exact_next_task: >
  Finish the Phase 5 launch sweep on this branch: bump release metadata to
  0.4.0, align changelog, manifest, README, and distribution docs, and leave
  the branch ready for the final launch PR.

files_allowed_to_change:
  - README.md
  - docs/dev-harness.md
  - docs/troubleshooting.md
  - docs/distribution.md
  - docs/plans/relaunch/**
  - site/**
  - VERSION
  - CHANGELOG.md
  - release-manifest.json
  - Scripts/extract_release_notes.py
  - .github/workflows/release.yml

files_forbidden_to_change:
  - Sources/PortpourriCore/**
  - Sources/PortpourriCLI/**
  - Sources/PortpourriApp/**
  - Tests/**
  - new end-user feature work

external_systems_required:
  - github-releases
  - vercel

validation_required:
  - swift build
  - swift test
  - swift run portpourri why 3000
  - swift run portpourri list --watched
  - swift run portpourri doctor
  - swift run portpourri snapshot --json
  - no stale 0.3.2 references remain outside changelog history and intentional release references
  - homepage version badge, README, manifest, and changelog all point to 0.4.0
  - post-merge: GitHub Release exists, release asset downloads, and the live site resolves to 0.4.0 links

stop_condition: >
  The launch branch is merged, tag v0.4.0 has been cut from clean main, the
  release workflow publishes Portpourri-0.4.0-mac.zip successfully, and the
  live site, README, changelog, release notes, and download/install paths all
  describe the same current 0.4.0 product.

validation_results: {}

noted_exceptions:
  - Per user direction, Phase 5 does not redesign the website; site changes are limited to manifest-driven versioning and small copy updates only

canonical_decisions:
  version: "0.4.0"
  website_url: "https://www.portpourri.com"
  repo_url: "https://github.com/jskoiz/portpourri"
  asset_naming: "Portpourri-{version}-mac.zip"
  phase3_pr_shape: "2 PRs"
  app_snapshot_role: "temporary adapter for one release line"
  inventory_boundary: "machine-wide Node inventory is separate from ownership capture"
  refresh_boundary: "main snapshot refresh is generation-gated; AI/worktree refresh remains separate"
  phase4_pr_shape: "1 PR"
  phase5_pr_shape: "1 PR plus immediate release tag"
  snapshot_schema_version: "0.1"
  doctor_output_mode: "human-readable only"
  homepage_install_surface: "GitHub Releases and build-from-source only"
  release_notes_source: "CHANGELOG.md"

handoff_notes: >
  Phase 5 is now the active release-prep pass. The branch should end with
  0.4.0 metadata, a release workflow that uses CHANGELOG.md as the GitHub
  Release body, and public docs that match the shipped CLI and install path.
  Do not mark the phase complete until the PR is merged, tag v0.4.0 is cut,
  the release asset exists, and https://www.portpourri.com reflects the
  manifest-driven launch state.
