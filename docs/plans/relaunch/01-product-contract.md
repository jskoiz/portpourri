# Phase 0 — Product Contract

This document exists to stop semantic drift before implementation starts.

## Goal

Lock the product story, primary objects, and menu bar semantics so the app, docs, and site all describe the same thing.

## Primary user

Mac developers who run local dev servers and repeatedly hit watched-port conflicts such as `3000`, `5173`, `8081`, `6006`, and similar ports.

## Primary job

**Tell me who owns my watched ports and what I should do next.**

## Core product story

Portpourri is not a general process monitor.
Portpourri is a menu bar app that makes local port ownership obvious and gives safe next actions.

## Primary objects

- watched port
- owner
- project
- blocker
- safe action

## Secondary objects

- process inventory
- grouped Node processes
- AI tools and worktrees
- memory totals
- diagnostics export

## Not the product

- full system process manager
- privileged inspector
- force-kill tool
- remote monitoring tool
- generic AI workspace dashboard

## Menu bar contract

### Default mode
`countAndMemory`

Reason:
It is more understandable for first-run users than Dot Matrix.

### Dot Matrix contract
The dot matrix is a **port-status glyph**, not a memory gauge.

- top row = active projects
- bottom row = watched-port occupancy / conflict in deterministic watched-port order
- badge = conflict count

Bottom-row slot states are fixed:

- free watched port = dim
- watched port owned by your project = green
- watched port busy but non-owned = amber
- watched port in explicit conflict state = red

Compact Dot Matrix mode represents the first `5` watched ports in deterministic watched-port order.
If more than `5` watched ports are configured:

- only the first `5` are rendered in compact mode
- the badge still represents total conflict count
- there is no separate overflow indicator in v1

Memory remains visible in:
- count/memory display modes
- popover summaries
- process groups

## Popover contract

The popover should answer three questions in this order:

1. Which watched ports matter right now?
2. Who owns or blocks them?
3. What safe action can I take?

Target section order:

1. Watched ports
2. Other listeners / blockers
3. Process groups
4. AI tools

## Settings contract

- `Ports` becomes its own settings tab in Phase 2
- `Notifications` merges into `General` in Phase 2
- Dot Matrix mode must include:
  - a live rendered preview
  - a short legend
  - tooltip language that matches the homepage explanation

## Action label contract

Use specific verbs based on ownership:

- your project owns port → `Stop server`
- external blocker occupies watched port → `Free port`
- tunnel case → `Stop tunnel`
- grouped explicit cleanup → `Kill group`

Avoid vague or misleading labels.

## Site contract

The homepage must lead with the same product story:

- literal value proposition
- conflict-first visual
- trust strip
- install path
- features after comprehension

Do not lead with metaphor or changelog.

## Success criteria

A new user should be able to:

1. install from the homepage in under two minutes
2. look at the menu bar or popover and understand who owns port `3000`
3. take one obviously safe next action

## Non-negotiable guardrails

- no privileged behavior
- no force-kill
- no destructive machine-wide kill flows
- no fake update controls
- no no-op public settings
- no re-expanding scope into general process management

## Execution defaults

- `release-manifest.json` is committed at the repo root and updated by the release flow
- site changelog highlights are curated in the manifest for now, not fully generated
- grouped cleanup may only survive if it is derived from active listeners
- destructive confirmation prompts should differ by action type
- `AppSnapshot` survives one release as an adapter while ownership and inventory split internally
- AI/worktree scanning gets a separate async lifecycle path
- `doctor` is human-readable only in Phase 4
- `snapshot --json` gains `schemaVersion`, and a release-line fixture test should protect the shape
- Homebrew remains off the homepage until the tap and install path are verified end to end
- launch messaging emphasizes the conflict-first story over general app polish

## Monorepo migration rule

When consolidating the site:

1. move the site into `site/` in the canonical app repo
2. switch the deploy target to the app repo
3. verify the live deploy
4. only then archive or freeze the old separate site repo as read-only

## External systems rule

Unless a phase doc explicitly says otherwise:

- GitHub Releases and repo-hosted metadata are in scope
- Vercel or equivalent site deploy config is in scope
- DNS changes are not in scope
- Homebrew publishing is not in scope
- social promotion is not in scope

## Agent instruction block

Use this contract as the source of truth for product semantics.
If code, docs, settings copy, site copy, or screenshots disagree with this file, update them to match this file unless a later explicit decision changes the contract.
