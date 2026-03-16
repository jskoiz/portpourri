# Mobile Agent Guide

- Follow [`../AGENTS.md`](../AGENTS.md) for cross-stack policy. This file narrows the rules for `mobile/`.

## Canonical Commands

```bash
npm run pre-submit
npm run check
npm run storybook:start
npm run feature:new -- --name "Example Feature"
```

## Working Rules

- Start visual work in Storybook. Use the seeded app runtime only when navigation, auth, persistence, or server data is part of the change.
- Screens should not import the raw API client directly. Server reads and mutations belong in feature hooks or service adapters.
- Keep the mobile dependency direction legible: `foundation -> data -> shared-ui -> feature -> screen -> app-shell`.
- Keep environment access centralized in [`src/config/env.ts`](src/config/env.ts).
- Reusable UI changes under `src/components`, `src/design`, or `src/features/**/components` should ship with a Storybook update in the same diff unless the PR explains why Storybook is the wrong surface.
- Add or update tests when component behavior changes, not just visual styling.

## References

- Harness workflow: [`../docs/HARNESS.md`](../docs/HARNESS.md)
- Repo map: [`../docs/REPO_MAP.md`](../docs/REPO_MAP.md)
- Storybook workflow: [`../docs/STORYBOOK_WORKFLOW.md`](../docs/STORYBOOK_WORKFLOW.md)
