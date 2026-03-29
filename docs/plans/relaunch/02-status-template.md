# Relaunch Status Template

This file is the control plane for LLM execution.

Only one phase may be `in_progress` at a time.

## Template

```yaml
current_phase: <phase-id>
phase_state: <not_started|in_progress|blocked|done>

phase_owner:
  agent: <agent-name>
  human: <human-owner>

started_at: <YYYY-MM-DD>
completed_at: <YYYY-MM-DD or blank>

blockers:
  - <blocking issue or leave empty>

exact_next_task: >
  <one exact next task only>

files_allowed_to_change:
  - <path or glob>

files_forbidden_to_change:
  - <path or glob>

external_systems_required:
  - system: <github-releases|vercel|homebrew|dns|none>
    required_state: <what must be true in this phase>
    verification: <how to verify>

validation_required:
  - <command or manual check>

stop_condition: >
  <copy the current phase stop condition here>

handoff_notes: >
  <what changed, what was validated, what remains, what the next agent may assume>
```

## Required fields

- `current_phase`
- `phase_state`
- `phase_owner`
- `started_at`
- `completed_at`
- `blockers`
- `exact_next_task`
- `files_allowed_to_change`
- `files_forbidden_to_change`
- `external_systems_required`
- `validation_required`
- `stop_condition`
- `handoff_notes`

## Allowed phase states

- `not_started`
- `in_progress`
- `blocked`
- `done`

## Rules

### Rule 1
Only one phase can be `in_progress`.

### Rule 2
A later phase cannot start until the current phase stop condition is satisfied and recorded.

### Rule 3
The agent may only edit files listed under `files_allowed_to_change`.

### Rule 3a
The agent must not edit anything listed under `files_forbidden_to_change`.

### Rule 4
Every phase completion must update:
- the current phase doc
- `status.md`
- any affected durable product docs

### Rule 5
Validation must include command output or explicit manual checks, not only narrative summaries.

## Suggested repo location

`docs/plans/relaunch/status.md`

## Agent instruction block

Before making changes:
1. read `status.md`
2. confirm the current phase
3. confirm allowed files
4. confirm forbidden files
5. confirm required external systems
6. restate the exact next task
7. refuse to start a later phase if the current one is still open
