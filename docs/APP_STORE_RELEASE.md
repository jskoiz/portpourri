# BRDG App Store release checklist

BRDG uses Expo for app development and native config, but the canonical internal TestFlight/App Store upload path is a local Xcode archive/upload driven by the repo wrapper script. Do not assume Expo login or EAS is required unless a release explicitly calls for the EAS path.

This document describes the current release workflow. Historical rollout notes are useful for context, but they are not the source of truth for the next build number or the currently attached TestFlight build.

## Engineering baseline

- Mobile app config is driven by [`mobile/app.config.ts`](../mobile/app.config.ts) instead of placeholder identifiers in `app.json`.
- Release builds require `EXPO_PUBLIC_API_URL`, which prevents shipping a binary that points at localhost.
- The app now exposes authenticated in-app account deletion, which is required by Apple when account creation is supported.
- `mobile/eas.json` includes `development`, `preview`, and `production` build profiles, but those profiles are not the default BRDG TestFlight path.

## Expo vs Xcode

- Expo is part of the app stack here: config, modules, and local native generation still come from the Expo-based mobile project.
- TestFlight/App Store delivery for BRDG currently goes through local Xcode via [`scripts/release-ios.sh`](../scripts/release-ios.sh).
- EAS is opt-in for this repo. Use it only when the release explicitly requires Expo-hosted builds or submission.
- If a machine is not logged into Expo, that is not a blocker for the normal BRDG TestFlight flow.

## Required environment values

Copy [`mobile/.env.production.release.example`](../mobile/.env.production.release.example) into your local env or release checkout and replace:

- `EXPO_PUBLIC_API_URL` with the production backend origin
- `IOS_BUNDLE_IDENTIFIER` with the App Store bundle ID reserved in Apple Developer
- `IOS_DEVELOPMENT_TEAM` only if the local Xcode release should override the Apple team id already stored in [`mobile/eas.json`](../mobile/eas.json)
- `ASC_API_KEY_ID` and `ASC_API_ISSUER_ID` when the local machine should authenticate to Apple using an App Store Connect API key instead of an interactive Xcode account
- `ASC_API_KEY_PATH` only if the App Store Connect private key is not already stored at one of Xcode/altool's default lookup paths such as `~/.appstoreconnect/private_keys/AuthKey_<key>.p8`
- `ASC_LIVE_BUILD_NUMBER` from the latest live App Store Connect state for `com.avmillabs.brdg` when you are using manual ASC verification instead of API-key automation
- `ASC_BUILD_NUMBER_VERIFIED_AT` with the UTC timestamp or operator note for when that live build-number check was performed when you are using manual ASC verification instead of API-key automation
- `ANDROID_PACKAGE` with the Play package name if Android release is also planned
- `EAS_PROJECT_ID` only if an EAS build is explicitly needed
- `SENTRY_ORG`, `SENTRY_PROJECT`, and `SENTRY_AUTH_TOKEN` only if you want sourcemap upload during the local Xcode release; otherwise the wrapper allows that step to fail without blocking TestFlight delivery

Current production values prepared in this workspace:

- `EXPO_PUBLIC_API_URL=https://api.brdg.social`
- `IOS_BUNDLE_IDENTIFIER=com.avmillabs.brdg`
- `ANDROID_PACKAGE=com.avmillabs.brdg`

For local release builds, start from `mobile/.env.example` and provide production values before running the release wrapper.

## Live preflight before choosing a build number

Do these checks before `npm run release:ios:prepare`:

1. If App Store Connect API-key auth is available, use `npm run release:ios:asc -- latest-build` or `npm run release:ios:asc -- next-build`.
2. If API-key auth is unavailable, verify the latest live App Store Connect build number for `com.avmillabs.brdg` manually and set `ASC_LIVE_BUILD_NUMBER` plus `ASC_BUILD_NUMBER_VERIFIED_AT`.
3. Choose an `IOS_BUILD_NUMBER` strictly higher than the latest uploaded build when you are not letting `release:ios:prepare` derive it automatically.
4. Do not trust historical rollout docs or local memory for this value.
5. If the machine or checkout state is uncertain, run `npm run harness:doctor` first and resolve any provenance warnings before continuing.

## Script-enforced preflight

`npm run release:ios:prepare`, `npm run release:ios:ship`, `npm run release:ios:check`, and `npm run release:ios` enforce these conditions before any archive/upload:

- release branch is `main` or `release/*`
- branch is pushed, tracking `origin`, and neither ahead of nor behind upstream
- worktree is completely clean
- `EXPO_PUBLIC_API_URL` and `IOS_BUNDLE_IDENTIFIER` are set
- `IOS_BUILD_NUMBER` is set explicitly or derived automatically from live ASC state when API-key auth is available
- `IOS_BUILD_NUMBER` is strictly greater than `ASC_LIVE_BUILD_NUMBER`
- `ASC_BUILD_NUMBER_VERIFIED_AT` records when the live App Store Connect build number was checked
- `ASC_API_KEY_ID`, `ASC_API_ISSUER_ID`, and `ASC_API_KEY_PATH` are complete if using API-key auth, or Xcode account auth is available instead
- `prepare` runs repo validation; `ship` requires the prepared release context instead of rerunning `npm run check`

The release manifest at `mobile/build/ios-release-manifest.json` now records:

- branch and upstream ref
- full local git SHA and upstream git SHA
- app version and iOS build number
- API URL
- build date
- release mode/profile
- auth mode
- live App Store Connect build number evidence
- native prep mode and its classifier reason
- environment-value provenance for the release-critical inputs
- generated TestFlight notes metadata, including the notes file path, release-tag base ref, locale, and whether ASC publishing completed
- whether the run was preflight-only
- the script-enforced release-eligibility checks

`mobile/build/ios-release-context.json` records the exact prepared SHA/build/env/native-prep tuple that `npm run release:ios:ship` must use.

## Recommended release flow

From repo root:

```bash
npm run release:ios:prepare
npm run release:ios:ship
```

This is the normal BRDG TestFlight/App Store path. The root scripts pin `--mode xcode`, and [`scripts/release-ios.sh`](../scripts/release-ios.sh) enforces branch cleanliness, upstream sync, backend/mobile validation, writes a manifest to `mobile/build/ios-release-manifest.json`, writes a release context to `mobile/build/ios-release-context.json`, then archives and uploads through Xcode.

The release wrapper uses [`scripts/release-ios-fast-path.mjs`](../scripts/release-ios-fast-path.mjs) to classify whether the existing generated iOS project can be safely reused or whether the run must fall back to a clean Expo prebuild.

In `xcode` mode the wrapper uses a conservative native fast path. It only skips `npx expo prebuild --clean -p ios --npm` when the diff since the latest release tag is limited to known non-native-affecting paths such as `mobile/src/**`, tests, Storybook, docs, backend, and shared contracts. Changes to `mobile/app.config.ts`, `mobile/eas.json`, `mobile/package.json`, `mobile/package-lock.json`, `mobile/ios/**`, or release-critical icon/splash assets force a clean prebuild. If the classifier is uncertain, it falls back to a clean prebuild.

The native fast-path decision is implemented by [`scripts/release-ios-fast-path.mjs`](../scripts/release-ios-fast-path.mjs). Treat it as an internal release helper invoked by [`scripts/release-ios.sh`](../scripts/release-ios.sh), not as a standalone release entrypoint.

The wrapper still defaults Xcode signing to `submit.production.ios.appleTeamId` from [`mobile/eas.json`](../mobile/eas.json); set `IOS_DEVELOPMENT_TEAM` only when the local release should use a different Apple team.

If the local Xcode Accounts state is missing or broken, the same wrapper can authenticate with an App Store Connect API key by setting `ASC_API_KEY_ID` and `ASC_API_ISSUER_ID` before `npm run release:ios:prepare`. The wrapper will auto-discover `AuthKey_<key>.p8` from the standard private-key locations, or you can point it at a different file with `ASC_API_KEY_PATH`.

Use `npm run release:ios:check` as a compatibility alias for `npm run release:ios:prepare` when you want the preflight and manifest/context generation without starting the Xcode archive/upload.

`npm run release:ios:prepare` is the canonical release-readiness path. It writes the manifest and context, validates the checkout and config, and must not be treated as proof that a TestFlight/App Store artifact was uploaded or attached.

During `prepare` and `ship`, the wrapper now also generates `mobile/build/testflight-notes.md` from the user-facing commits since the latest matching release tag. Use `npm run release:ios:notes -- --version <version> --build <build>` if you need to regenerate or inspect the notes directly.

When App Store Connect API-key auth is available, `npm run release:ios:ship` now publishes that generated text to the TestFlight beta app description automatically. Without API-key auth, the script leaves the generated notes file in `mobile/build/` for manual paste and records that publish state in the release manifest.

In CI, the `release-readiness` lane is manual-only and runs from `workflow_dispatch` on `main`. It is meant to validate the same release provenance without turning the CI release lane into a second full repo-validation pass.

`npm run release:ios:ship` must run from the same clean checkout after a successful prepare run. It does not rerun `npm run check`; instead it verifies the prepared context still matches the current branch, SHA, version, build number, API URL, mode, and profile before it archives and uploads.

The native fast-path classifier lives in `./scripts/release-ios-fast-path.mjs` and is invoked by `./scripts/release-ios.sh` during `--native-mode auto`.

### Quick release (CI already green on main)

When CI has already validated the main commit you want to release, skip re-running the full test suite locally:

```bash
git checkout main && git pull --ff-only
npm run release:ios:prepare:fast    # skips full npm run check
npm run release:ios:ship
```

This sets `RELEASE_SKIP_VALIDATION=1` and `SKIP_REPO_VALIDATION=1` so prepare only validates git state, env config, and release metadata — it does not re-run typecheck, lint, or Jest suites. Use this when CI is green and you want a fast local release without fighting test flakiness.

The standard `npm run release:ios:prepare` path (without `:fast`) still runs the full validation suite and is required for releases from branches where CI has not run.

Note: `release:ios:prepare` now auto-refreshes `artifacts/repo-index.json` if it detects staleness, so you no longer need to manually regenerate and push it before a release.

If you intentionally need the Expo/EAS path instead, call it explicitly:

```bash
./scripts/release-ios.sh --mode eas
```

## Release provenance guardrails

Before any production or TestFlight archive:

- Build only from `main` or an explicitly designated `release/*` branch.
- Do not build from a dirty working tree.
- Do not build from a detached `HEAD`.
- Do not build from local-only, unpushed commits.
- Verify the branch already exists on `origin` before starting the wrapper.
- Verify the next `IOS_BUILD_NUMBER` against live App Store Connect state, not historical docs.
- Prefer `./scripts/release-worktree.sh` to create or refresh a dedicated clean `main` release checkout before the prepare/ship pair.
- Record the exact branch, full git SHA, app version, iOS build number, API URL, and build date in the release notes or handoff.
- Keep the release notes tied to the exact attached TestFlight/App Store artifact; do not reuse notes from an older build after profile/photo changes land.

## Required live operator checks

The wrapper cannot confirm these from the local repo alone:

- the App Store Connect build number you observed before choosing `IOS_BUILD_NUMBER`
- the App Store Connect build/version currently attached to the submission
- screenshots still matching the shipped UX
- review notes still matching the current app behavior
- App Store Connect UI-only requirements such as `Content Rights` and `App Privacy`

Record those alongside the generated manifest instead of relying on memory or historical notes.

The script blocks release if any of these conditions fail:

- current branch is not `main` or `release/*`
- working tree is not fully clean, including untracked files
- branch is detached
- branch has no upstream
- branch is ahead of or behind its upstream
- repo validation fails

If the build is intended for App Store review, use the uploaded Xcode build in App Store Connect or submit the resulting `.ipa` through Transporter if a manual attach step is still required.

Successful uploads may still warn about missing vendored framework dSYMs for `React.framework`, `ReactNativeDependencies.framework`, and `hermes.framework`. Treat those as release-quality warnings to follow up on, but they do not necessarily block TestFlight delivery if App Store Connect accepts the package.

After a successful Xcode upload, App Store Connect may still take time to surface the build in its API and UI. When API-key auth is available, `npm run release:ios:ship` now polls ASC until the uploaded build appears and reaches a ready state. When API-key auth is unavailable, treat the Xcode upload success message as provisional until the build is visible in ASC.

## App Store Connect items still required

- App Store app record tied to the final iOS bundle identifier
- Privacy Policy URL
- Support URL
- App description, keywords, and age rating questionnaire
- iPhone screenshots for the final production build
- Test credentials and review notes for the reviewer

## Release validation before submission

- `npm run check` in [`mobile`](../mobile)
- `npm run check:full` in [`backend`](../backend)
- `npm run smoke` from repo root so the backend bootstrap, `ui-preview` scenario reset, and mobile launch prerequisites all pass together
- Confirm the wrapper manifest reports `mode: "xcode"` for the canonical BRDG TestFlight/App Store path unless the release intentionally used EAS
- Verify signup, login, onboarding, profile load, discovery feed, chat, event creation, RSVP, notifications, logout, and account deletion against the production API
- Verify the authenticated runtime surfaces for Discover, Explore, Create, Inbox, and You. Preview routes are useful, but they do not replace runtime verification.

## Post-build provenance verification

After a build is produced, compare three things before handoff:

1. `mobile/build/ios-release-manifest.json`
2. the in-app build provenance panel in the You/Profile screen
3. the build/version attached in App Store Connect/TestFlight

The manifest and in-app panel should agree on branch, full git SHA, version, iOS build number, API URL, build date, release path, and release profile. App Store Connect should attach the build that matches those values.

Also confirm the TestFlight notes attached in App Store Connect still match `mobile/build/testflight-notes.md` if the upload used manual metadata paste instead of API-key automation.

## Release QA focus

Run this against a clean release candidate after the automated checks pass:

1. Seed a known-good local runtime with `npm run dev:scenario -- ui-preview` when validating against local services, or use the intended production/staging account path when validating a release candidate against a hosted backend.
2. Sign in and validate the full You/Profile editing path:
   - enter edit mode
   - change city, bio, and intent toggles
   - save
   - force a refresh or re-open the screen and confirm the saved values persist
3. Validate profile photo management:
   - upload a new photo
   - set a new primary photo
   - reorder photos left/right
   - delete a non-primary photo
   - confirm the final photo order and primary image survive refresh
4. Confirm downstream propagation after profile edits:
   - updated primary photo appears in profile, matches/chat surfaces, and discovery/detail cards where applicable
   - updated city/bio values appear anywhere the app renders the signed-in user summary
5. Validate every shared bottom-sheet interaction changed in this release:
   - discovery filters
   - explore quick actions
   - create activity/timing substeps
   - chat quick-action suggestions
6. Re-open the build provenance panel before handoff and confirm the metadata still matches the release manifest after the final build command.

## Release troubleshooting

Common blockers encountered during past releases and how to resolve them:

### `expo prebuild` fails: Cannot find module

If `xcodebuild archive` fails with errors like `Cannot find module '@expo/cli/build/src/export/embed/exportEmbedAsync'`, a native dependency is mismatched with the installed Expo SDK version. Run:

```bash
cd mobile && npx expo install --check
```

This shows which packages are out of range. Fix with `npx expo install <package>`, commit the updated `package.json` + `package-lock.json`, push to main, and re-run prepare + ship.

**Root cause**: PRs that add Expo native packages (like `expo-updates`, `expo-apple-authentication`) sometimes install the wrong major version. Always verify with `npx expo install --check` after adding native deps.

### CocoaPods fails: Unicode Normalization error

If `pod install` fails with `Encoding::CompatibilityError` (ASCII-8BIT), set the locale before running ship:

```bash
export LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8
```

This is a Ruby 4.0 + CocoaPods compatibility issue. The release script handles this automatically on retry.

### Build number collision

If ship fails because the build number already exists in App Store Connect, update `mobile/.env.production`:

```
IOS_BUILD_NUMBER=<next number>
ASC_LIVE_BUILD_NUMBER=<current highest in ASC>
ASC_BUILD_NUMBER_VERIFIED_AT=<current ISO timestamp>
```

When ASC API-key auth is available, the release script now auto-verifies the live build number and warns if `.env.production` is stale.

### TestFlight notes not published automatically

Without ASC API-key auth (xcode-account mode), the script generates notes at `mobile/build/testflight-notes.md` but cannot publish them. Copy the contents and paste into App Store Connect > TestFlight > Build > Test Details > What to Test.

### `npm run release:ios:prepare` is slow or flaky

Use the fast path when CI has already validated the commit:

```bash
npm run release:ios:prepare:fast
```

This skips the full `npm run check` suite. Only use from a green main.

### Stale `artifacts/repo-index.json`

The release script now auto-refreshes this during prepare. If it still fails, manually run:

```bash
npm run repo:index
git add artifacts/repo-index.json
git commit -m "chore: refresh repo index"
git push origin main
```

### Quick reference: full release from green main

```bash
git checkout main && git pull --ff-only
# Update mobile/.env.production with correct build numbers if needed
set -a && source mobile/.env.production && set +a
npm run release:ios:prepare:fast
npm run release:ios:ship
# Paste mobile/build/testflight-notes.md into ASC if not using API-key auth
```
