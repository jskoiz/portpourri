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

- Start visual or accessibility-sensitive UI work in Storybook. Use the seeded app runtime only when navigation, auth, persistence, or server data is part of the change.
- For iOS simulator validation, prefer the installed dev-client loop (`npm run qa:ios` / `npm run qa:ios:reset`) and rebuild with `npm run ios:install` only when native code or app config changed. The scripts choose the latest available iPhone simulator unless `IOS_SIMULATOR_NAME` is set.
- Screens should not import the raw API client directly. Server reads and mutations belong in feature hooks or service adapters.
- Keep the mobile dependency direction legible: `foundation -> data -> shared-ui -> feature -> screen -> app-shell`.
- Keep environment access centralized in [`src/config/env.ts`](src/config/env.ts).
- Reusable UI changes under `src/components`, `src/design`, or `src/features/**/components` should ship with a Storybook update in the same diff unless the PR explains why Storybook is the wrong surface.
- Add or update tests when component behavior or accessibility semantics change, not just visual styling.

## References

- Harness workflow: [`../docs/HARNESS.md`](../docs/HARNESS.md)
- Repo map: [`../docs/REPO_MAP.md`](../docs/REPO_MAP.md)
- Storybook workflow: [`../docs/STORYBOOK_WORKFLOW.md`](../docs/STORYBOOK_WORKFLOW.md)
