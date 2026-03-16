# BRDG Harness

This repo treats the harness as the source of truth for how work gets validated. The goal is to make easy things easy, hard things possible, and routine changes legible to both humans and agents.

## Canonical Commands

```bash
npm run harness:doctor
npm run pre-submit
npm run check:changed
npm run check
npm run smoke
npm run docs:check
npm run repo:index
npm run harness:ci-context -- --branch main
npm run hooks:install
npm run storybook
npm run scaffold:mobile-feature -- --name "Example Feature"
npm run scaffold:backend-module -- --name moderation
```

## Validation Lanes

- `npm run harness:doctor`
  - quick local sanity: git state, Node version, dependency install presence, env files, Docker availability
- `npm run pre-submit`
  - canonical local checklist: docs drift, repo policy, new marker guard (`TODO`/`FIXME`/`HACK`), then the same diff-driven validation lane used for PRs
- `npm run check:changed`
  - chooses the smallest reasonable validation set from git diff, enforces Storybook co-updates for changed reusable mobile UI surfaces, and can emit machine-readable harness artifacts
- `npm run check`
  - full root, backend, and mobile validation
- `npm run smoke`
  - deterministic bootstrap plus seeded `ui-preview` runtime plus mobile launch prerequisites
- `npm run repo:index`
  - regenerates [`../artifacts/repo-index.json`](../artifacts/repo-index.json), the machine-readable repo map used by agents and maintenance
- `npm run harness:ci-context -- --branch <name>`
  - summarizes recent CI and maintenance runs, selected commands, failure category, and the next local command to run

## Policy Rules

- New repo-level scripts in `scripts/` must be reachable through a package script or explicitly documented here.
- Backend and mobile runtime code should read environment through config layers, not raw `process.env` calls in feature modules.
- Mobile screens should not import the raw API client directly.
- Backend imports follow `config/base -> persistence -> contracts -> domain/service -> transport -> app-shell`.
- Mobile imports follow `foundation -> data -> shared-ui -> feature -> screen -> app-shell`.
- [`../artifacts/repo-index.json`](../artifacts/repo-index.json) must stay in sync with the source tree.
- Active docs should describe Storybook and the seeded `ui-preview` runtime as the supported preview surfaces, not legacy preview-route workflows.
- Reusable mobile UI changes should update Storybook in the same diff unless the PR template explains why not.

## Review Flow

- Local PR readiness: run `npm run pre-submit`
- PR lane: run `npm run check:changed`
- Protected branch or release prep: run `npm run check` and `npm run smoke`
- Visual mobile changes: link the relevant Storybook story or attach screenshots in the PR
- Release-oriented changes: keep build provenance aligned with [`APP_STORE_RELEASE.md`](APP_STORE_RELEASE.md)

## CI Shape

- Pull requests run the fast diff-driven lane.
- `main` and scheduled maintenance runs execute the full lane.
- Every lane uploads `harness-plan.json`, `harness-results.json`, and `harness-failure-summary.json` as CI artifacts.
- Scheduled maintenance also audits docs, tracked marker drift, dependency visibility, Storybook/test coverage signals, repo-index drift, and harness health.
- Maintenance publishes review-required findings in artifacts and can open a small automated PR for safe fixes such as repo-index refreshes.
