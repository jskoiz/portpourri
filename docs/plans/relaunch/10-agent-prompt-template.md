# Generic Agent Prompt Template

Use this template when handing one phase to an LLM agent.

```text
Use Plan mode first, then implement.

You are working inside the Portpourri repo.
Treat these files as authoritative:
- docs/plans/relaunch/01-product-contract.md
- docs/plans/relaunch/status.md
- docs/plans/relaunch/<CURRENT_PHASE_FILE>.md
- docs/plans/relaunch/11-parallelization-map.md

Current phase:
<CURRENT_PHASE_NAME>

Goal:
<PASTE THE GOAL FROM THE CURRENT PHASE>

Constraints:
- Only one phase may be in progress.
- Only edit files listed in status.md under files_allowed_to_change.
- Do not edit files listed under files_forbidden_to_change.
- Do not touch external systems unless they are listed in external_systems_required.
- Keep PortpourriCore free of AppKit and SwiftUI.
- Do not add privileged behavior or force-kill behavior.
- Update durable docs when behavior or architecture changes.
- End by updating the phase doc handoff section and status.md.

Required output format:
# Plan
# Changes implemented
# Files changed
# Validation
# External systems touched
# Risks / follow-ups
# Handoff note

Do not start work from a later phase even if you see adjacent issues.
If a later-phase issue blocks this phase, record it in status.md as a blocker instead of silently expanding scope.
```
