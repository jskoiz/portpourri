# BRDG Symphony Overview

This document is for humans deciding how to use Symphony in BRDG, why the repo was changed to support it, and how to get useful results out of it.

## What Symphony Is

Symphony is the repo-owned automation layer that connects:

1. Linear issue state
2. a per-issue BRDG workspace
3. a Codex agent run
4. GitHub branch and PR workflows

In BRDG, Symphony is not a hosted black box. The behavior is defined by the repo through [`../WORKFLOW.md`](../WORKFLOW.md), the in-repo service under [`../symphony`](../symphony), and the repo-local skills under [`../.codex/skills`](../.codex/skills).

## Why We Made These Changes

Before this setup, the workflow was mostly manual:

- choose an issue
- start a Codex session by hand
- explain the repo rules again
- remember validation commands
- remember PR conventions
- remember Linear status/comment updates
- manually stitch together GitHub and Linear

That works for one-off tasks, but it breaks down when you want repeatable issue execution with consistent state handling.

The Symphony changes were made so the repo can encode its own working rules once and reuse them across every agent run:

- harness-first validation
- BRDG-specific repo navigation
- Storybook expectations for reusable mobile UI
- Linear workpad structure
- branch / PR / landing flow
- issue state routing
- GitHub-capable runtime defaults

The result is that the operator no longer has to restate the same workflow every time, and tracker writes now flow through one deterministic service path instead of a mix of service behavior and ad hoc agent mutations.

## What Changed In Practice

The main changes were:

- a repo-owned Symphony service was added under [`../symphony`](../symphony)
- the orchestration contract was defined in [`../WORKFLOW.md`](../WORKFLOW.md)
- BRDG-specific agent skills were added under [`../.codex/skills`](../.codex/skills)
- the default runtime was configured for full GitHub interactivity so issue runs can push branches and create PRs
- Linear writes were centralized in the Symphony service so state moves, workpad updates, and PR attachment sync all go through one owner
- issue workpads now record a `Symphony runtime revision` so runs can be traced back to the exact orchestration build

These are large changes because they move operational knowledge out of a human operator's head and into repo-controlled automation.

## When Symphony Is Helpful

Symphony is most useful when:

- work starts from Linear
- issues are reasonably scoped
- you want repeatable validation and PR behavior
- multiple tasks may be running over time
- you want a durable workpad trail in Linear

Symphony is less useful when:

- the task is vague or exploratory
- the issue needs live product judgment at every step
- the work spans many unrelated decisions that should not be automated
- you want to pair interactively inside one manual Codex thread

## What “Good” Looks Like

A healthy Symphony run usually looks like this:

1. You start `npm run symphony`.
2. You move an issue to `Todo`.
3. Symphony moves it to `In Progress`.
4. Symphony creates or updates the service-owned `## Codex Workpad` comment in Linear.
5. The agent reproduces the problem before changing code and reports progress back to Symphony.
6. The agent runs BRDG validation.
7. The agent commits, pushes, and creates or updates a PR.
8. Symphony attaches the PR to the issue and moves the issue toward review or merge.

If that sequence is happening, Symphony is doing useful work.

## How To Get The Most Out Of It

Use Symphony for issues that have:

- a concrete title
- enough description to define the expected outcome
- a clear validation target such as `npm run check:backend`, `npm run check:mobile`, or `npm run pre-submit`

Write issue descriptions that tell the agent:

- what to change
- what not to change
- what validation is required
- whether Storybook, docs, or PR evidence are expected

Good Symphony issues are narrow, testable, and explicit about acceptance criteria.

For review-follow-up work on an already-open PR, the best pattern is:

- keep the original implementation issue as the canonical tracker
- create a separate issue only for the unresolved PR feedback
- include the original issue identifier in that follow-up issue
- let the follow-up run update the original issue when the PR becomes merge-ready

## Operator Guidance

The normal operator loop is:

```bash
export LINEAR_API_KEY='...'
npm run symphony
```

Then:

1. leave Symphony running
2. move an issue into `Todo`
3. watch the Linear workpad and terminal logs
4. only intervene when the issue is blocked, mis-scoped, or needs human review

Do not treat Symphony like a one-command fire-and-forget release robot. It is an operator-supervised worker loop.

## How To Read A Workpad

Each active issue should have one Symphony-managed `## Codex Workpad` comment with:

- `Plan`
- `Acceptance Criteria`
- `Validation`
- `Notes`

The most useful signals are:

- whether the bug was actually reproduced first
- what validation really ran
- whether a branch/PR was created
- whether the service recorded retries, blockers, or state-routing decisions
- the `Symphony runtime revision`

The runtime revision matters because it tells you which orchestration build produced the behavior you are looking at.

## Current Rough Edges

The current BRDG Symphony setup still has some practical limitations:

- per-workspace trust warnings are noisy, even though they are non-fatal
- issues left in active states can be picked up again on later polls
- broad or underspecified tickets still produce weaker results than narrow tickets
- BRDG still keeps a few intentional deviations from the upstream spec, such as the current workflow renderer and workspace key sanitizer

These are operational issues, not reasons to abandon the model.

## Recommended Human Reading Order

If you want the shortest useful path:

1. read this document
2. read [`SYMPHONY.md`](./SYMPHONY.md)
3. skim [`../WORKFLOW.md`](../WORKFLOW.md)
4. use [`REPO_MAP.md`](./REPO_MAP.md) and [`HARNESS.md`](./HARNESS.md) when evaluating what the agent is doing

## Bottom Line

Symphony is helpful when you want BRDG work to start from Linear, follow repo rules consistently, and end with a reviewable PR trail instead of an ad hoc chat session.

The large repo changes were justified because they turned repeated human coordination work into repo-defined automation that can be inspected, updated, versioned, and improved.
