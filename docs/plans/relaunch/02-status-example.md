# Example Status — Phase 1

This is a concrete example of a filled `status.md`.
Use it as a reference only. The actual control plane should live in the repo at `docs/plans/relaunch/status.md`.

```yaml
current_phase: phase-1-monorepo-trust
phase_state: in_progress

phase_owner:
  agent: codex
  human: jerry

started_at: 2026-03-29
completed_at:

blockers: []

exact_next_task: >
  Move the website into /site inside the app repo, switch the site deploy target
  to the app repo, and add canonical version/release manifest plumbing.

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
    verification: latest release page and asset URL resolve correctly
  - system: vercel
    required_state: deploy target points at the app repo and publishes from site/
    verification: live homepage reflects the new repo state

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

handoff_notes: >
  Fill this in at phase completion with what changed, what was validated,
  what remains, and what the next agent may assume.
```
