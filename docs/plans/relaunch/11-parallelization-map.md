# Parallelization Map

This file defines where subagents may safely work in parallel.

## Rule

Parallel work is allowed only when write ownership is disjoint.
If two tasks touch the same file, the same UI surface, or the same public copy block, they are not parallel-safe.

When in doubt:

- parallelize read-only exploration
- serialize writes

## Phase 1

Parallel-safe workstreams:

- Agent A: `site/**`
  - move site into monorepo
  - update hero/install/changelog/repo links
  - add `site/README.md`
- Agent B: `VERSION`, `release-manifest.json`, `Scripts/package_app.sh`
  - canonical versioning
  - release metadata plumbing
  - asset naming
- Agent C: `README.md`, `docs/distribution.md`, `docs/plans/relaunch/**`
  - docs and control-plane updates
- Agent D: `Sources/PortpourriApp/**`
  - remove fake updater UI
  - fix About links
  - remove no-op public settings

Single-owner zones:

- deploy config
- release workflow config
- live-site verification notes

## Phase 2

Recommended write owner count: one primary writer, plus read-only explorers.

Parallel-safe read-only exploration:

- screenshot and copy audit
- tooltip/current semantics audit
- homepage structure audit

Single-owner write zones:

- status item renderer and Dot Matrix semantics
- popover section ordering and action labels
- settings structure and previews
- homepage hero/demo/message hierarchy

Reason:
These surfaces all express the same product semantics and should be edited together.

## Phase 2.5

Recommended write owner count: one primary writer.

Parallel-safe read-only exploration:

- scenario walkthroughs
- safety audit
- empty/error-state audit

Single-owner write zones:

- destructive action boundaries
- confirmation prompts
- notification copy and behavior
- screenshots affected by safety changes

## Phase 3

Parallel-safe workstreams only after boundaries are assigned explicitly:

- Agent A: `Sources/PortpourriCore/**`
  - ownership vs inventory split
  - service/interface extraction
- Agent B: `Sources/PortpourriApp/**`
  - refresh coordination
  - app-layer decomposition
- Agent C: `Tests/**`, `docs/architecture.md`
  - tests and architecture-doc updates

Single-owner zones:

- shared snapshot/adaptation layer between core and app
- notification dedupe semantics

## Phase 4

Parallel-safe workstreams:

- Agent A: CLI implementation
- Agent B: docs/examples/troubleshooting
- Agent C: tests/fixtures

Single-owner zones:

- public CLI command interface
- `snapshot --json` schema changes

## Phase 5

Recommended write owner count: one primary writer, plus asset helpers.

Parallel-safe helper work:

- screenshot capture
- demo recording
- release-note drafting

Single-owner zones:

- homepage final copy
- README final copy
- public launch checklist

## Agent instruction block

Before spawning or using subagents:

1. read this file
2. identify whether the current phase allows parallel writes
3. assign each writing agent an exclusive file/surface ownership zone
4. do not run two writing agents against the same zone
