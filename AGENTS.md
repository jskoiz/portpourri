# Portpourri Agent Guide

This file is the map, not the manual. Treat `docs/` as the source of truth.

## Start here

- Product intent: `docs/product.md`
- Architecture and module boundaries: `docs/architecture.md`
- UI behavior and interaction rules: `docs/ui.md`
- Validation harnesses and fixtures: `docs/dev-harness.md`
- Active planning docs: `docs/plans/`

## Repo rules

- Keep `PortpourriCore` free of `AppKit` and `SwiftUI`.
- Parse shell output once at the edge, then operate on typed models.
- Prefer small, legible types over clever abstractions.
- When changing architecture or workflows, update the matching doc in `docs/`.
- Do not add privileged or force-kill behavior without an explicit user request.

## Prompting checklist

When working in this repo, keep four things explicit:

- Goal: what behavior should change?
- Context: which doc, fixture, or source area is authoritative?
- Constraints: module boundaries, UI behavior, safety rules.
- Done when: which tests, commands, or manual checks prove the change?

## Done when

- `swift build` succeeds.
- `swift test` succeeds.
- `swift run portpourri snapshot --json` produces a valid snapshot.
- The menu bar app can launch in sample mode and in live mode.
