# Phase 1 — Monorepo Consolidation + Trust Surface

## Goal

Make the app repo the single source of truth for app, site, versioning, release assets, and install paths.

## Scope

This phase includes:
- moving the website into the app repo under `site/`
- canonical versioning
- canonical release manifest
- install/download link correctness
- removal of fake or misleading public UI
- release/install/provenance cleanup

This phase does **not** include:
- deep UI redesign
- architecture decomposition
- CLI expansion

## Inputs / dependencies

- `01-product-contract.md`
- `03-site-monorepo-target.md`
- current repo docs and packaging scripts
- current site HTML/CSS/JS

## Decisions already made

- app repo is canonical
- site moves into app repo
- GitHub Releases are the primary distribution path
- Homebrew stays de-emphasized until verified end-to-end
- fake update controls should be removed or hidden for now

## Task checklist

### Repo consolidation
- create `site/` in the app repo
- move current site files into `site/`
- add `site/README.md` with local preview and deploy notes
- update hosting config to point to the app repo and `site/` publish root
- remove references that assume a separate `portpourri-site` repo
- do not archive or freeze the old separate site repo until the app-repo deploy is verified live

### Canonical versioning
- add root `VERSION`
- add root `release-manifest.json`
- commit `release-manifest.json` in the repo
- make `Scripts/package_app.sh` derive bundle version/build metadata from canonical inputs
- standardize release asset naming on `Portpourri-{version}-mac.zip`

### Public trust cleanup
- fix homepage GitHub CTA
- fix homepage download CTA
- fix stale version badge/changelog highlights
- remove stale `NodeWatcher` and `0.1.0` metadata
- fix About links to canonical support surfaces
- hide or remove fake update UI
- hide or remove no-op public settings

### Docs cleanup
- update README install instructions if needed
- update distribution docs to match the simplified repo/deploy reality
- document the site-in-repo structure

## Files allowed to change

- `site/**`
- `VERSION`
- `release-manifest.json`
- `Scripts/package_app.sh`
- `README.md`
- `docs/distribution.md`
- `docs/plans/relaunch/**`
- app files required for removing fake update UI or bad links

## Files forbidden to change

- `Sources/PortpourriCore/**`
- CLI target files except if required for packaging metadata references
- architecture docs unrelated to repo/site/distribution trust cleanup

## External systems in scope

- GitHub Releases metadata and repo-hosted release assets
- hosting/deploy config for the site

Not in scope:

- DNS changes
- Homebrew publishing
- launch/social announcement work

## Validation

### Build and repo checks
- `swift build`
- `swift test`

### Packaging checks
- packaged app version matches `VERSION`
- About screen version/build is derived, not stale

### Site checks
- homepage version matches canonical manifest
- `Download for Mac` resolves to a real release asset
- `View on GitHub` resolves to `jskoiz/portpourri`
- no homepage text or CTA points at the old separate site repo

### Manual checks
- local site preview works from `site/`
- deploy target uses the app repo
- no visible fake updater controls remain

## Stop condition

The app repo, packaged app, release assets, and live site all point to the same canonical identity and working install path, with no separate site repo required.

## Artifacts to update

- `status.md`
- `README.md`
- `docs/distribution.md`
- `site/README.md`
- any deploy config
- release/version metadata

## Decisions locked for this phase

- `release-manifest.json` is committed at the repo root
- site changelog highlights are curated in the manifest for now
- the old separate site repo is only frozen after the app-repo deploy is verified live

## Next phase handoff

The next phase may assume:
- the site lives in `site/`
- all public links point to the canonical app repo (`jskoiz/portpourri`)
- canonical website URL is `https://www.portpourri.com`
- version and asset metadata come from `VERSION` and `release-manifest.json`
- `package_app.sh` reads version from `VERSION` file
- site reads version/download info from `site/data/release-manifest.json`
- fake update UI and `checkForUpdatesAutomatically` setting are removed
- About window links to website, GitHub, and X (all canonical)
- `NODETRACKER_SAMPLE_DATA` env var renamed to `PORTPOURRI_SAMPLE_DATA`
- `AIToolSnapshot` and `AIWorktreeEntry` types restored in `Models.swift` as a
  reviewed recovery exception
- the live Vercel deployment is serving `main` from `site/`
- `https://www.portpourri.com` reflects the manifest-driven `v0.3.2` release
- the old separate site repo should remain untouched until you explicitly
  choose to archive or freeze it outside this phase

### Models.swift exception review
The prior agent restored `AIToolSnapshot` and `AIWorktreeEntry` in `Sources/PortpourriCore/Models.swift`.
This file is normally forbidden in Phase 1. Review classification:

- **Classification**: acceptable exception required to restore build health
- **Evidence**: The two structs are byte-identical to their originals in commit `46faa7e` (pre-rename path `Sources/NodeTrackerCore/Models.swift`). They were lost when commit `b9a3055` renamed the module. Without them, `AIToolProbe.swift` fails to compile and `swift build` cannot pass on `origin/main`.
- **Scope**: No new logic, no behavioral change, no API surface change. Pure recovery of dropped code.

### Pre-existing issues (not Phase 1 scope)
- `testSampleSnapshotCollapsesDuplicateIPv4IPv6Listener` fails due to sample data shape mismatch
- `CHANGELOG.md` only documents up to 0.2.0 while public releases go to 0.3.2

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 1 only.
Do not redesign the app or broaden scope.
Primary target is trust: monorepo consolidation, canonical versioning, real install paths, and removal of misleading public surfaces.
