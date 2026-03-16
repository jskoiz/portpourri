# BRDG Agent Guide

## Repo Layout

- `backend/`: NestJS API, Prisma schema, seed data, smoke helpers
- `mobile/`: Expo React Native client, preview surfaces, Jest app tests
- `docs/`: operating docs and release checklists
- `.agents/skills/`: BRDG-specific Codex skills

## Canonical Commands

Run these from the repo root unless a task explicitly needs package-local commands.

```bash
npm run check
npm run check:backend
npm run check:mobile
npm run smoke
npm run storybook
npm run test:backend
npm run test:mobile
npm run dev:backend
npm run dev:mobile
npm run dev:scenario -- ui-preview
npm run release:ios
npm run release:ios:check
```

## Done When

- Code changes include the relevant tests or a clear reason tests were not added.
- `npm run check` passes for any cross-stack change.
- Backend-only work passes `npm run check:backend`.
- Mobile-only work passes `npm run check:mobile`.
- Visual-only mobile changes add or update the relevant Storybook story, or clearly state why Storybook is not the right surface.
- Docs are updated when behavior, commands, or workflows change.

## Working Rules

- Use one Codex thread per task and one git worktree per active task.
- Prefer [`scripts/codex-worktree.sh`](/Users/jerry/Desktop/brdg/scripts/codex-worktree.sh) for new Codex worktrees.
- Treat [`CODEBASE_REVIEW.md`](/Users/jerry/Desktop/brdg/CODEBASE_REVIEW.md) and [`APP_ROADMAP.md`](/Users/jerry/Desktop/brdg/APP_ROADMAP.md) as historical snapshots, not current source of truth.
- For review requests, follow [`code_review.md`](/Users/jerry/Desktop/brdg/code_review.md).
- For mobile visual iteration, follow `docs/STORYBOOK_WORKFLOW.md`.
- Prefer Storybook over ad hoc preview routes or full app boot when backend, auth, and navigation state are not required.
- Use the seeded `ui-preview` app runtime only for integrated flow validation, not as the default visual workshop.

## Release Provenance

- Treat `main` as the source of truth for shippable mobile code unless the user explicitly designates a release branch.
- Never produce a TestFlight or App Store build from a dirty working tree, a detached `HEAD`, or an unpushed local-only commit.
- Require a clean `main` or `release/*` branch plus passing backend and mobile checks before recommending or cutting a release build.
- BRDG ships to TestFlight/App Store through local Xcode by default, even though the mobile app uses Expo and the repo contains `eas.json`.
- Prefer [`scripts/release-ios.sh`](/Users/jerry/Desktop/brdg/scripts/release-ios.sh) or `npm run release:ios` over ad hoc release commands, and assume `xcode` mode unless the user explicitly asks for `eas`.
- Do not treat missing Expo auth as a blocker for the normal BRDG release path.
- If local dev output and a shipped build disagree, inspect source and shipped artifacts before proposing fixes.
- Preserve current bug fixes and API contracts when reapplying older UI states. Restore deltas selectively instead of blanket cherry-picks.

## Review Priorities

- Preserve API contracts shared between `backend` and `mobile`.
- Check seeded-data assumptions before changing discovery, matches, chat, events, or notifications flows.
- Call out mock-vs-real regressions in mobile surfaces.
- Watch React Native performance risks such as polling, long lists, and avoidable rerenders.
- Flag docs drift when commands, env vars, release steps, or preview flows change.

## References

- Dev loop: [`docs/DEV_LOOP.md`](/Users/jerry/Desktop/brdg/docs/DEV_LOOP.md)
- Storybook workflow: `docs/STORYBOOK_WORKFLOW.md`
- Architecture map: [`docs/ARCHITECTURE.md`](/Users/jerry/Desktop/brdg/docs/ARCHITECTURE.md)
- Functional expectations: [`docs/FUNCTIONAL_MATRIX.md`](/Users/jerry/Desktop/brdg/docs/FUNCTIONAL_MATRIX.md)
- iOS release: [`docs/APP_STORE_RELEASE.md`](/Users/jerry/Desktop/brdg/docs/APP_STORE_RELEASE.md)
- App Store metadata: [`docs/APP_STORE_CONNECT_METADATA.md`](/Users/jerry/Desktop/brdg/docs/APP_STORE_CONNECT_METADATA.md)

## Skills

- Use `$gh-address-comments` for GitHub PR review comment cleanup.
- Use `$gh-fix-ci` for GitHub Actions failure triage.
- Use `$playwright` for browser-based validation and screenshots.
- Use `$figma-implement-design` when implementing Figma designs.
- Use `$brdg-ios-release` for TestFlight/App Store release prep.
- Use `$brdg-smoke-triage` for smoke and dev-loop failures.
- Use `$brdg-roadmap-sync` when checking product docs or roadmap drift against the codebase.
