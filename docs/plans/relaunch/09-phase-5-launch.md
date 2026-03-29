# Phase 5 — Launch Preparation

## Goal

Ship a trustworthy, installable, sharply positioned release.

## Scope

This phase covers:
- launch assets
- final copy
- homepage and README alignment
- release checklist
- consistency sweep across public surfaces

This phase does **not** cover:
- additional feature work
- post-launch experiments
- deferred ecosystem expansion

## Inputs / dependencies

- completed Phases 1 through 4
- current screenshots and site assets
- canonical release/version metadata
- homepage and README copy

## Decisions already made

- GitHub Releases are canonical
- homepage leads with literal value proposition
- conflict-first visual is the hero
- AI/worktree functionality is secondary, not headline

## Task checklist

### Assets
- create one conflict-first hero screenshot
- create one short demo clip:
  - watched port blocked
  - owner resolved
  - safe next action shown
- create one social/README preview image

### Copy
- final one-line pitch is literal and search-friendly
- secondary copy explains project mapping, blocker detection, and safe actions
- trust strip reflects real traits only
- avoid metaphor-heavy section naming
- emphasize the conflict-first story over generic “app polish”

### Final consistency pass
- README and site say the same thing
- screenshots match current app
- install instructions are current
- no broken links
- no stale version strings
- release notes reflect the actual shipped product

## Files allowed to change

- `site/**`
- `README.md`
- image/video assets
- release metadata and notes
- relaunch plan docs

## Files forbidden to change

- core architecture files
- CLI behavior beyond docs/examples polish
- new end-user feature work

## Validation

### Core checks
- `swift build`
- `swift test`

### Public surface checks
- release asset exists and downloads correctly
- homepage version matches release
- GitHub link and download link are correct
- screenshots and demo match current UI
- no stale version strings remain

### Messaging checks
A new visitor should be able to answer:
- what Portpourri does
- why it is trustworthy
- how to install it
- what happens when a watched port is blocked

## Stop condition

Launch assets are ready and every public surface is current, consistent, and easy to trust.

## Artifacts to update

- release notes
- `README.md`
- homepage copy
- screenshots / demo clip
- `status.md`

## Decisions locked for this phase

- Homebrew stays off the homepage until it is verified end to end
- the launch emphasizes the conflict-first story more strongly than general app polish

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 5 only.
Do not add new features.
This phase is about release quality, trust, and message sharpness.
