# Portpourri Relaunch Agent Pack

This pack breaks the relaunch into bounded Markdown files you can hand to an LLM agent one at a time.

## What changed from the original plan

This version keeps the core direction intact:

- Portpourri is positioned as the best native Mac app for understanding and resolving local port conflicts.
- The dot matrix becomes a watched-port status glyph, not a memory glyph.
- `countAndMemory` remains the safest first-run default.
- The app repo stays canonical.
- Execution is phase-gated with a single `status.md` source of truth.

This version also makes one deliberate simplification:

- **The website moves into the app repo**. No separate `portpourri-site` repo. The target structure uses a top-level `site/` directory inside `jskoiz/portpourri`.

That change removes cross-repo drift, reduces deploy confusion, and makes it easier to keep install links, versions, changelog highlights, and screenshots aligned.

## Recommended execution order

1. `01-product-contract.md`
2. `02-status-template.md`
3. `02-status-example.md`
4. `03-site-monorepo-target.md`
5. `04-phase-1-monorepo-trust.md`
6. `05-phase-2-product-ui.md`
7. `06-phase-2.5-safety-gate.md`
8. `07-phase-3-architecture-hardening.md`
9. `08-phase-4-cli-core.md`
10. `09-phase-5-launch.md`
11. `11-parallelization-map.md`

## How to use this with an LLM agent

- Pass **one file at a time**.
- Keep only one phase marked `in_progress` in your repo `status.md`.
- Do not let the agent start a later phase until the current phase stop condition is met.
- Require the agent to update the matching plan doc and `status.md` at the end of each phase.
- Require validation output, not just summaries.

## Suggested location in the repo

```text
docs/plans/relaunch/
  README.md
  status.md
  01-product-contract.md
  02-status-template.md
  02-status-example.md
  03-site-monorepo-target.md
  04-phase-1-monorepo-trust.md
  05-phase-2-product-ui.md
  06-phase-2.5-safety-gate.md
  07-phase-3-architecture-hardening.md
  08-phase-4-cli-core.md
  09-phase-5-launch.md
  10-agent-prompt-template.md
  11-parallelization-map.md
```

## Practical note

If you want the shortest possible starting prompt for the agent, hand it these three files first:

- `01-product-contract.md`
- `02-status-template.md`
- `11-parallelization-map.md`
- the current phase file

That is usually enough context without overwhelming the model.
