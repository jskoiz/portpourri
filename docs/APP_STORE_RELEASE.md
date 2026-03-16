# BRDG App Store release checklist

This repo is now wired for EAS build profiles and production-safe mobile configuration, but App Store submission still requires a few values and assets that cannot be inferred from source code.

## Engineering baseline

- Mobile app config is driven by [`mobile/app.config.ts`](/Users/jerry/Desktop/brdg/mobile/app.config.ts) instead of placeholder identifiers in `app.json`.
- Release builds require `EXPO_PUBLIC_API_URL`, which prevents shipping a binary that points at localhost.
- The app now exposes authenticated in-app account deletion, which is required by Apple when account creation is supported.
- `mobile/eas.json` includes `development`, `preview`, and `production` build profiles.

## Required environment values

Copy [`mobile/.env.example`](/Users/jerry/Desktop/brdg/mobile/.env.example) into your local env or EAS secrets and replace:

- `EXPO_PUBLIC_API_URL` with the production backend origin
- `IOS_BUNDLE_IDENTIFIER` with the App Store bundle ID reserved in Apple Developer
- `ANDROID_PACKAGE` with the Play package name if Android release is also planned
- `EAS_PROJECT_ID` once the Expo project is linked

Current production values prepared in this workspace:

- `EXPO_PUBLIC_API_URL=https://api.brdg.social`
- `IOS_BUNDLE_IDENTIFIER=com.avmillabs.brdg`
- `ANDROID_PACKAGE=com.avmillabs.brdg`

For local release builds, [`mobile/.env.production`](/Users/jerry/Desktop/brdg/mobile/.env.production) is ready to use.

## Recommended release flow

From repo root:

```bash
npm run release:ios:check
npm run release:ios
```

This is the normal release path. [`scripts/release-ios.sh`](/Users/jerry/Desktop/brdg/scripts/release-ios.sh) enforces branch cleanliness, upstream sync, backend/mobile validation, and writes a manifest to [`mobile/build/ios-release-manifest.json`](/Users/jerry/Desktop/brdg/mobile/build/ios-release-manifest.json) before starting the build.

Use `npm run release:ios:check` when you want the preflight and manifest generation without starting EAS.

## Release provenance guardrails

Before any production or TestFlight archive:

- Build only from `main` or an explicitly designated `release/*` branch.
- Do not build from a dirty working tree.
- Do not build from a detached `HEAD`.
- Do not build from local-only, unpushed commits.
- Record the exact branch, full git SHA, app version, iOS build number, API URL, and build date in the release notes or handoff.
- Keep the release notes tied to the exact attached TestFlight/App Store artifact; do not reuse notes from an older build after Phase 3 profile/photo changes land.

The script blocks release if any of these conditions fail:

- current branch is not `main` or `release/*`
- working tree is not fully clean, including untracked files
- branch is detached
- branch has no upstream
- branch is ahead of or behind its upstream
- repo validation fails

If the build is intended for App Store review, submit the resulting `.ipa` through Transporter or `eas submit` after App Store Connect is configured.

If building locally with Xcode instead of EAS, treat it as a fallback path only and use the same wrapper:

```bash
./scripts/release-ios.sh --mode xcode
```

## App Store Connect items still required

- App Store app record tied to the final iOS bundle identifier
- Privacy Policy URL
- Support URL
- App description, keywords, and age rating questionnaire
- iPhone screenshots for the final production build
- Test credentials and review notes for the reviewer

## Release validation before submission

- `npm run check` in [`mobile`](/Users/jerry/Desktop/brdg/mobile)
- `npm run check:full` in [`backend`](/Users/jerry/Desktop/brdg/backend)
- `npm run smoke` from repo root so the backend bootstrap, `ui-preview` scenario reset, and mobile launch prerequisites all pass together
- Verify signup, login, onboarding, profile load, discovery feed, chat, event creation, RSVP, notifications, logout, and account deletion against the production API
- Verify the authenticated runtime surfaces for Discover, Explore, Create, Inbox, and You. Preview routes are useful, but they do not replace runtime verification.
- Open the in-app build provenance panel in the You/Profile screen and confirm branch, git SHA, version/build number, API URL, and build date match both the release manifest and the build being attached in App Store Connect/TestFlight.

## Phase 3 release QA focus

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
5. Validate every shared bottom-sheet interaction changed in Phase 3:
   - discovery filters
   - explore quick actions
   - create activity/timing substeps
   - chat quick-action suggestions
6. Re-open the build provenance panel before handoff and confirm the metadata still matches the release manifest after the final build command.
