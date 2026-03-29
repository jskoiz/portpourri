# Phase 2 — Product Model + UI Semantics

## Goal

Make the app UI and the website explain the exact same product story.

## Scope

This phase covers:
- Dot Matrix semantics
- popover information hierarchy
- settings model and copy
- conflict-first site story
- screenshots, labels, legends, and tooltip semantics

This phase does **not** cover:
- major architecture refactors
- CLI expansion
- deep feature expansion

## Inputs / dependencies

- `01-product-contract.md`
- completed Phase 1
- current UI docs and screenshots
- current site content now living in `site/`

## Decisions already made

- Dot Matrix is a watched-port status glyph, not memory
- first-run default remains `countAndMemory`
- memory remains secondary in popover summaries and process groups
- Portpourri is a port-ownership tool, not a generic process monitor

## Task checklist

### Dot Matrix
- update Dot Matrix rendering to represent watched-port status
- define deterministic watched-port slot ordering
- use these fixed slot states:
  - free = dim
  - owned by your project = green
  - busy non-owned = amber
  - conflict = red
- render the first `5` watched ports in compact mode
- if more than `5` watched ports exist, do not add a separate overflow glyph in v1
- add tooltip text such as:
  `3 projects · 2 watched ports busy · 1 conflict`
- add settings legend for Dot Matrix mode
- add live rendered previews for all menu bar modes

### Popover
- make section order explicit:
  - Watched ports
  - Other listeners / blockers
  - Process groups
  - AI tools / workspace cleanup
- sort blockers and watched-port owners above irrelevant listeners
- make action labels ownership-aware
- keep the calm native visual style

### Settings
- flatten one container layer
- add a first-class `Ports` tab now
- merge `Notifications` into `General`
- prioritize docs/issues/release notes over social links in About

### Website
- rewrite hero headline and subhead to be literal
- replace healthy-state first impression with a conflict-first visual
- use the same product vocabulary as the app
- reorder the homepage:
  1. literal hero
  2. trust strip
  3. problem / solution
  4. primary demo
  5. install
  6. feature detail
  7. local-first / privacy / OSS trust
  8. changelog

## Files allowed to change

- `site/**`
- UI docs
- settings UI files
- status item / menu bar rendering files
- popover UI files
- screenshot assets

## Files forbidden to change

- core architecture files unless a tiny local change is required to express the agreed semantics
- CLI files
- release/version pipeline files unless a Phase 1 regression must be fixed

## Validation

### Product comprehension checks
A new user should be able to understand the menu bar icon from:
- settings preview
- tooltip
- homepage explanation

### Consistency checks
- docs, settings, tooltip, homepage, and screenshots all describe the same Dot Matrix semantics
- action labels correctly distinguish owned ports from blockers
- no screen positions Portpourri as a generic process monitor

### Build checks
- `swift build`
- `swift test`

## Stop condition

The menu bar glyph, popover hierarchy, settings copy, and website all reinforce the same watched-port ownership story.

## Artifacts to update

- `docs/ui.md`
- screenshots
- settings copy
- homepage copy
- `status.md`

## Decisions locked for this phase

- `Ports` becomes its own tab now
- Dot Matrix compact mode renders the first `5` watched ports only
- badge remains the only compact conflict-count indicator

## Next phase handoff

The next phase may assume:
- the semantic model is locked
- screenshots and copy reflect the new story
- the website no longer leads with metaphor-heavy messaging

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 2 only.
Your job is semantic alignment and product clarity.
Do not start architecture cleanup yet unless a tiny structural change is required to finish UI semantics safely.
