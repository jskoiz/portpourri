# BRDG Repo Map

Use this file when you need to orient quickly and decide where a change belongs.

## Top Level

- `backend/`: NestJS API, Prisma schema, seed/scenario helpers, smoke dependencies
- `mobile/`: Expo React Native app, Storybook, app tests, reusable UI
- `docs/`: operating docs, release steps, functional expectations
- `scripts/`: repo-level harness scripts and release/smoke entrypoints
- `artifacts/`: generated agent-facing repo index and ignored local/CI harness outputs
- `.github/`: CI, scheduled maintenance, review instructions, PR template
- `.agents/skills/`: BRDG-specific Codex skills

## Backend Map

- `backend/src/config/`: runtime config and env parsing
- `backend/src/*/`: domain modules grouped by product surface
- `backend/prisma/`: schema, migrations, seed data
- `backend/scripts/`: bootstrap and scenario helpers
- Layer defaults: `config/base -> persistence -> contracts -> domain/service -> transport -> app-shell`

Change backend when the task touches API contracts, persistence, seed data, or release/runtime setup.

## Mobile Map

- `mobile/src/screens/`: route containers and navigation entry surfaces
- `mobile/src/features/`: feature-owned hooks and presentational modules
- `mobile/src/components/`: shared UI building blocks
- `mobile/src/design/`: design primitives and shared bottom-sheet shell
- `mobile/src/stories/`: Storybook coverage for reusable UI and screen-shell review
- `mobile/scripts/`: mobile-local harness helpers
- Layer defaults: `foundation -> data -> shared-ui -> feature -> screen -> app-shell`

Change mobile when the task touches app UX, feature modules, Storybook coverage, or client runtime wiring.

## Harness Surfaces

- [`HARNESS.md`](HARNESS.md): command selection, validation lanes, policy rules
- [`../WORKFLOW.md`](../WORKFLOW.md): repo-owned Symphony orchestration contract
- [`SYMPHONY.md`](SYMPHONY.md): BRDG Symphony service usage and runtime notes
- [`SYMPHONY_SETUP.md`](SYMPHONY_SETUP.md): BRDG-specific Symphony setup notes
- [`DEV_LOOP.md`](DEV_LOOP.md): day-to-day startup and troubleshooting
- [`STORYBOOK_WORKFLOW.md`](STORYBOOK_WORKFLOW.md): isolated mobile visual workflow
- [`APP_STORE_RELEASE.md`](APP_STORE_RELEASE.md): mobile release provenance and submission checklist
- [`../artifacts/repo-index.json`](../artifacts/repo-index.json): machine-readable repo map and layer index

## Safe Defaults

- Start with `npm run harness:doctor` if the environment is uncertain.
- Run `npm run pre-submit` before opening a PR or install the repo-managed pre-commit hook with `npm run hooks:install`.
- Use `npm run check:changed` for a fast diff-driven validation pass.
- Use `npm run check` for full non-smoke validation.
- Use `npm run smoke` when backend bootstrap, seed/scenario wiring, or integrated app assumptions changed.
