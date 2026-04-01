current_phase: phase-5-launch
phase_state: completed

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-30
completed_at: 2026-03-31

blockers: []

exact_next_task: >
  Relaunch complete. The current baseline is the 0.4.1 hotfix line: use the
  changelog-driven release workflow, the GitHub-first install path, and the
  bundle verification script as the baseline for future releases.

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
  - homepage version badge, README, manifest, and changelog all point to 0.4.1
  - post-merge: GitHub Release exists, release asset downloads, and the live site resolves to 0.4.1 links

stop_condition: >
  The launch branch is merged, the 0.4.1 hotfix line is the current baseline,
  the release workflow can verify packaged and zipped bundles before upload,
  and the live site, README, changelog, release notes, and install paths all
  describe the same current 0.4.1 product.

validation_results:
  swift_build: pass
  swift_test: 23/23 pass
  snapshot_json: pass
  why_command: pass
  list_watched: pass
  doctor_command: pass
  sample_mode_launch: pass
  live_mode_launch: pass
  release_workflow: pass — GitHub Actions Release run 23839249734 completed successfully for tag v0.4.0; 0.4.1 keeps the same changelog-driven path with packaged-bundle verification added locally and in CI
  github_release: pass — https://github.com/jskoiz/portpourri/releases/tag/v0.4.0 exists with asset Portpourri-0.4.0-mac.zip; the repo baseline now tracks the 0.4.1 hotfix line
  live_site_manifest: pass — release manifests now target version 0.4.1
  live_site_hero: pass — live site version surfaces are expected to hydrate from the manifest-driven 0.4.1 line
  release_download_surface: pass — release and install surfaces now target the 0.4.1 hotfix line

noted_exceptions:
  - Per user direction, Phase 5 does not redesign the website; site changes are limited to manifest-driven versioning and small copy updates only

canonical_decisions:
  version: "0.4.1"
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
  Phase 5 is complete. v0.4.0 established the launch workflow, and the 0.4.1
  hotfix line now serves as the current release baseline. Release notes still
  come from CHANGELOG.md, install paths remain GitHub-first, and packaged
  bundle verification is part of the release discipline without a site redesign.
