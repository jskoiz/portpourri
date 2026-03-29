# Phase 2.5 — Safety Gate + Usability Check

## Goal

Bound destructive actions before relaunch pressure increases, and verify that the core user journey feels safe and obvious.

## Scope

This phase covers:
- destructive action boundaries
- manual scenario tests
- error / empty / onboarding states
- release-quality usability checks for the public surface

This phase does **not** cover:
- full app-layer decomposition
- broader feature work
- CLI depth

## Inputs / dependencies

- completed Phase 2
- current terminate / kill flows
- notification behavior
- onboarding and empty states

## Decisions already made

- no privileged behavior
- `SIGTERM` only
- destructive actions may only apply to explicit relevant owners
- no machine-wide unsafe cleanup affordances

## Task checklist

### Safety
- remove or disable any `Kill all` flow that can hit unrelated Node work
- constrain destructive actions to:
  - selected process
  - watched-port owner
  - explicit grouped owner tied to active listeners
- review notification actions to ensure they are bounded and clear
- use action-specific confirmation prompts

### Empty and failure states
- no watched ports configured
- no active listeners
- port free
- probe failure
- permission or notification denial
- AI scan in progress
- non-Node listeners hidden by settings

### Manual scenario tests
Verify these five scenarios end-to-end:
1. your project owns `3000`
2. Python, Docker, or another external process blocks `3000`
3. watched port is free
4. multiple listeners exist
5. no watched ports are configured

For each scenario verify:
- ordering
- copy
- action label
- safety
- notification behavior if relevant

## Files allowed to change

- UI/action files
- state handling files
- docs/ui.md
- relaunch plan docs
- screenshot/demo assets if they need updating after safety fixes

## Files forbidden to change

- broad architecture refactors
- CLI files
- site structure beyond screenshot/demo alignment caused by safety changes

## Validation

- `swift build`
- `swift test`
- explicit manual pass on the five scenarios
- verify no UI action can terminate unrelated non-listener Node work

## Stop condition

Publicly exposed actions are safely bounded, and the main user journey is clear in the five required scenarios.

## Artifacts to update

- `status.md`
- relevant UI docs
- manual test notes
- screenshots if behavior or labels changed

## Decisions locked for this phase

- grouped cleanup only survives for explicit groups tied to active listeners
- confirmation prompts differ by action type

## Next phase handoff

The next phase may assume:
- the public surface is safe enough to harden internally
- scenario behavior has been manually verified only after the required running-app safety check passes
- destructive actions are no longer ambiguous

## Handoff update

Implemented safety-gate behavior:
- removed the leftover bulk watched-port terminate path
- kept grouped cleanup only for active-listener Node groups inside an explicit project ownership boundary
- made confirmation prompts action-specific for Stop server, Free port, Stop tunnel, and Kill group
- kept AI tools read-only in the UI with no cleanup affordance
- aligned UI copy and docs to the bounded-action model

Manual closeout completed:
- verified in a real running app session that two simultaneous watched-port `node` projects sharing a tool label did not expose a shared Kill group action
- the ambiguous shared-label case remained non-destructive in the live UI, so `status.md` can move to `completed`

Not carried into this phase:
- Phase 3 app/core decomposition
- Phase 4 CLI expansion
- any broader machine-wide process-management affordance

## Agent instruction block

Use plan mode first, then implement.

Complete Phase 2.5 only.
You are closing safety and usability gaps, not broadening features.
If a feature cannot be made obviously safe in this phase, hide it rather than shipping a questionable version.
