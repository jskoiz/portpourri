# BRDG Agent Guide

## Start Here

- Use the closest `AGENTS.md` first. This root file covers cross-stack policy; [`backend/AGENTS.md`](backend/AGENTS.md) and [`mobile/AGENTS.md`](mobile/AGENTS.md) refine local workflow.
- Treat [`docs/REPO_MAP.md`](docs/REPO_MAP.md) as the fastest repo navigation guide and [`docs/HARNESS.md`](docs/HARNESS.md) as the canonical validation/playbook document.
- Treat `CODEBASE_REVIEW.md`, `APP_ROADMAP.md`, and one-off rollout/reset notes as historical context, not the current source of truth.

## Canonical Commands

Run these from repo root unless a task is package-local.

```bash
npm run pre-submit
npm run check
npm run check:changed
npm run check:backend
npm run check:mobile
npm run smoke
npm run docs:check
npm run symphony
npm run harness:doctor
npm run harness:ci-context -- --branch main
npm run repo:index
npm run hooks:install
npm run storybook
npm run dev:backend
npm run dev:mobile
npm run dev:scenario -- ui-preview
npm run release:ios
npm run release:ios:check
```

## Cross-Stack Rules

- Keep product-facing backend and mobile contracts stable unless the task explicitly changes both sides.
- Update docs when commands, workflows, environment expectations, or validation paths change.
- Run `npm run pre-submit` before opening a PR. Use `npm run hooks:install` if you want the repo-managed pre-commit hook to enforce the same checklist on staged changes.
- Visual-only mobile work should ship with a Storybook update in the same diff unless the PR explains why Storybook is the wrong surface.
- Prefer Storybook for isolated UI work. Use the seeded `ui-preview` runtime only for integrated validation.
- Use one Codex thread per task and one git worktree per active task. Prefer [`scripts/codex-worktree.sh`](scripts/codex-worktree.sh) for new worktrees.
- Use `npm run symphony` from repo root for the repo-owned Linear orchestration flow. Keep it running as a long-lived operator process rather than starting a fresh manual Codex session per issue.

## Release Provenance

- Treat `main` as the source of truth for shippable mobile code unless the user explicitly designates a release branch.
- Never produce a TestFlight or App Store build from a dirty working tree, a detached `HEAD`, or an unpushed local-only commit.
- Require a clean `main` or `release/*` branch plus passing backend and mobile checks before recommending or cutting a release build.
- BRDG ships to TestFlight/App Store through local Xcode by default, even though the mobile app uses Expo and the repo contains `eas.json`.
- Prefer [`scripts/release-ios.sh`](scripts/release-ios.sh) or `npm run release:ios` over ad hoc release commands, and assume `xcode` mode unless the user explicitly asks for `eas`.
- Do not treat missing Expo auth as a blocker for the normal BRDG release path.
- If local dev output and a shipped build disagree, inspect source and shipped artifacts before proposing fixes.
- Preserve current bug fixes and API contracts when reapplying older UI states. Restore deltas selectively instead of blanket cherry-picks.

## Review Priorities

- Preserve shared API contracts between `backend` and `mobile`.
- Check seeded-data assumptions before changing discovery, matches, chat, events, notifications, or profile/photo flows.
- Call out mock-vs-real regressions, React Native rerender risks, and docs drift.
- For review requests, follow [`code_review.md`](code_review.md).

## References

- Repo map: [`docs/REPO_MAP.md`](docs/REPO_MAP.md)
- Harness workflow: [`docs/HARNESS.md`](docs/HARNESS.md)
- Dev loop: [`docs/DEV_LOOP.md`](docs/DEV_LOOP.md)
- Storybook workflow: [`docs/STORYBOOK_WORKFLOW.md`](docs/STORYBOOK_WORKFLOW.md)
- Architecture map: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
- Functional expectations: [`docs/FUNCTIONAL_MATRIX.md`](docs/FUNCTIONAL_MATRIX.md)
- iOS release: [`docs/APP_STORE_RELEASE.md`](docs/APP_STORE_RELEASE.md)
- App Store metadata: [`docs/APP_STORE_CONNECT_METADATA.md`](docs/APP_STORE_CONNECT_METADATA.md)

## Skills

- Use `$gh-address-comments` for GitHub PR review comment cleanup.
- Use `$gh-fix-ci` for GitHub Actions failure triage.
- Use `$playwright` for browser-based validation and screenshots.
- Use `$figma-implement-design` when implementing Figma designs.
- Use `$brdg-ios-release` for TestFlight/App Store release prep.
- Use `$brdg-smoke-triage` for smoke and dev-loop failures.
- Use `$brdg-roadmap-sync` when checking docs or roadmap drift against the codebase.
