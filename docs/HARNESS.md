# BRDG Harness

This repo treats the harness as the source of truth for how work gets validated. The goal is to make easy things easy, hard things possible, and routine changes legible to both humans and agents.

## Canonical Commands

```bash
npm run check:root
npm run harness:doctor
npm run pre-submit
npm run check:changed
npm run check
npm run smoke
npm run docs:check
npm run repo:index
npm run harness:ci-context -- --branch main
npm run release:ios:fast-path -- --base-ref <ref>
npm run hooks:install
npm run storybook
npm run dev:backend
npm run ios:install
npm run qa:ios
npm run qa:ios:reset
npm run scaffold:mobile-feature -- --name "Example Feature"
npm run scaffold:backend-module -- --name moderation
```

## Validation Lanes

- `npm run harness:doctor`
  - quick local sanity: git/provenance status, Node version, dependency install presence, env files, repo-index visibility, release-adjacent tool availability, and Docker availability
- `npm run check:root`
  - root validation lane: `docs:check`, `policy:check`, then `test:root`
- `npm run pre-submit`
  - canonical local checklist: docs drift, repo policy, new marker guard (`TODO`/`FIXME`/`HACK`), then the same diff-driven validation lane used for PRs; contract-shape changes should be checked against shared schemas plus backend controller-boundary specs/shared guardrails and the mobile dev validator
- `npm run check:changed`
  - chooses the smallest reasonable validation set from git diff, promotes mixed or harness-sensitive changes to `check`, appends `smoke` for smoke-sensitive paths, enforces Storybook co-updates for changed reusable mobile UI surfaces, and can emit machine-readable harness artifacts
- `npm run check`
  - full graph: `check:root`, then the workspace checks for `backend`, `mobile`, and `symphony`
- `npm run release:ios:prepare`
  - canonical iOS release-readiness lane: provenance gate, live ASC build-number verification or resolution, release manifest write, release context write, and native fast-path classification without uploading
- `npm run release:ios:fast-path -- --base-ref <ref>`
  - inspects the diff against a release base and classifies whether the generated iOS project can be safely reused or a clean prebuild is required
- `npm run release:ios:ship`
  - canonical iOS upload lane: reuse the prepared release context, archive/upload through Xcode, and wait for ASC processing when API-key auth is available
- `npm run smoke`
  - deterministic bootstrap plus seeded `ui-preview` runtime plus mobile launch prerequisites
  - smoke owns the backend port for the run, loads backend env defaults, pins one `SMOKE_NOW_ISO` anchor for seed/scenario timing, probes `/health`, and writes bootstrap/backend/scenario logs to `/tmp`
- `npm run repo:index`
  - regenerates [`../artifacts/repo-index.json`](../artifacts/repo-index.json), the machine-readable repo map used by agents and maintenance
- `npm run harness:ci-context -- --branch <name>`
  - summarizes recent CI and maintenance runs, selected commands, failure category, and the next local command to run
- `npm run ios:install`
  - builds and installs the current iOS dev client on the selected simulator with local Sentry auto-upload disabled by default
- `npm run qa:ios`
  - boots the iOS simulator, opens the installed dev client, and starts Metro on localhost for fast repeat QA
- `npm run qa:ios:reset`
  - reruns the deterministic `ui-preview` reset before starting the same fast iOS simulator loop
  - requires `backend/.env` and a reachable local backend before it can reset preview fixtures

## Policy Rules

- New repo-level scripts in `scripts/` must be reachable through a package script or explicitly documented here.
- Backend and mobile runtime code should read environment through config layers, not raw `process.env` calls in feature modules.
- Mobile screens should not import the raw API client directly.
- Shared payload shape lives in `shared/contracts/`; backend controller-boundary specs plus `backend/src/contracts/response-shapes.spec.ts` guardrails and the mobile dev validator are the enforcement points for drift.
- Backend imports follow `config/base -> persistence -> contracts -> domain/service -> transport -> app-shell`.
- Mobile imports follow `foundation -> data -> shared-ui -> feature -> screen -> app-shell`.
- [`../artifacts/repo-index.json`](../artifacts/repo-index.json) must stay in sync with the source tree.
- Active docs should describe Storybook and the seeded `ui-preview` runtime as the supported preview surfaces, not legacy preview-route workflows.
- Reusable mobile UI changes should update Storybook in the same diff unless the PR template explains why not.

## Review Flow

- Local PR readiness: run `npm run pre-submit`
- If the local machine or checkout looks suspect, run `npm run harness:doctor` first. Fix failures before deeper validation, and treat provenance warnings as a sign that the checkout is not a trustworthy base for release or deploy prep.
- PR lane: run `npm run check:changed`
- Docs/policy-only edits: run `npm run check:root`
- Protected branch or release prep: run `npm run check`; for actual iOS release readiness, run `npm run release:ios:prepare` and add `npm run smoke` when you need bootstrap/runtime confidence
- The diff-driven lane also appends `npm run smoke` automatically for smoke-sensitive backend/bootstrap/scenario changes.
- Visual mobile changes: link the relevant Storybook story or attach screenshots in the PR
- Release-oriented changes: keep build provenance aligned with [`APP_STORE_RELEASE.md`](APP_STORE_RELEASE.md)

## CI Shape

- CI now runs automatically on pull requests and pushes to `main`; local harness commands remain the primary debugging path.
- CI runs the fast diff-driven lane, the backend migration rehearsal lane, the full `main-check` lane, and a release-readiness lane that runs after `main-check` on `push` to `main` and `workflow_dispatch`. The release-readiness lane validates release provenance with `repo:index:check` and `release:ios:prepare` without re-running the full repo graph, and manual dispatch remains available for reruns against an existing main SHA.
- The dedicated iOS simulator workflow still runs only for native-impacting mobile changes such as Expo config, native plugin/dependency changes, generated iOS project changes, or workflow edits.
- Use `npm run smoke` locally when you need deeper bootstrap/runtime validation, especially after backend auth/discovery/events/matches/notifications/profile changes or matching mobile chat/discovery/events/profile screen changes.
- Every lane uploads `harness-plan.json`, `harness-results.json`, and `harness-failure-summary.json` as CI artifacts.
- Scheduled maintenance audits docs, tracked marker drift, dependency visibility, Storybook/test coverage signals, repo-index drift, and harness health without rerunning the full smoke bootstrap.
- Maintenance publishes review-required findings in artifacts and can open a small automated PR for safe fixes such as repo-index refreshes.
