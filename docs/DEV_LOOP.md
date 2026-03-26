# BRDG Daily Dev Loop + Troubleshooting

Use [`HARNESS.md`](./HARNESS.md) for the canonical validation lanes and [`REPO_MAP.md`](./REPO_MAP.md) when you need to orient quickly.

## Fast start (day-to-day)

If the local environment looks suspect, start with:

```bash
npm run harness:doctor
```

Interpret `harness:doctor` output in two buckets:

- failures: fix these before `npm run check`, `npm run smoke`, or any deploy/release preflight
- warnings: these do not block normal development, but they mean the checkout is not a trustworthy base for operator work until the provenance issue is resolved

From repo root:

```bash
# first terminal
npm run dev:backend

# second terminal
npm run dev:mobile
```

If local infra or schema state is missing, bootstrap once from `backend/`:

```bash
cd backend
npm run dev:bootstrap
```

`dev:bootstrap` reuses the canonical BRDG Docker project so Postgres/Redis can be shared across Codex worktrees instead of colliding on container names.

`npm run dev:backend` now loads `backend/.env` before starting Nest. Keep `backend/.env` present for local runtime work instead of relying on ad hoc shell exports.

## Release-hardening smoke run

From repo root:

```bash
npm run smoke
```

This verifies:
1. Backend deterministic bootstrap (`db up -> wait -> migrate -> seed`)
2. Backend starts and passes `GET /health` on the configured local API URL
3. The seeded `ui-preview` runtime resets cleanly against the running backend using one pinned `SMOKE_NOW_ISO` anchor for seed and scenario timing
4. Mobile launch prerequisites (`expo-doctor` + `typecheck`)

Use the smoke run any time you change backend auth, discovery, events, matches, notifications, or profile code, or the mobile chat/discovery/events/profile screens that depend on those flows.

`npm run smoke` expects to own the configured local backend port for the duration of the run. Stop any existing listener on the resolved `API_PORT` or `PORT` value first; if neither is set, smoke defaults to `3010`. The script writes bootstrap, backend, and scenario logs to `/tmp` and will fail fast if the port is already occupied.

## Validation commands used before ship

```bash
# repo root
npm run pre-submit
npm run check:changed
npm run check

# or package-local when narrowing failures
npm run check:root
npm run check:backend
npm run check:mobile
npm run docs:check
```

`npm run pre-submit` is the local handoff gate: it runs `docs:check`, `policy:check`, the TODO/FIXME/HACK guard, and then the diff-driven lane from `npm run check:changed`.

`npm run check:changed` is the narrow PR-scoped lane. It picks `check:root` for docs-only changes, backend/mobile/symphony lanes for single-stack changes, promotes mixed or harness-sensitive edits to `npm run check`, and appends `npm run smoke` when the diff touches smoke-sensitive paths.

`npm run check:root` is the root-only lane for docs, policy, and root test coverage. Use it when you are narrowing failures outside backend/mobile runtime changes.

The current shipped mobile surface is on `main`. New work should generally branch from clean `main` and stay narrow rather than continuing to accumulate broad cleanup in one branch.

## Component workshop

Use Storybook for isolated component work instead of ad hoc preview routes:

```bash
npm run storybook
```

This is the supported root-level component preview command for BRDG UI primitives, bottom-sheet interactions, and composed cards/modules.

Follow [`docs/STORYBOOK_WORKFLOW.md`](./STORYBOOK_WORKFLOW.md) for the canonical Storybook-first loop.

- Start in Storybook for visual-only mobile changes.
- Add or update the relevant story in the same task.
- Move to the seeded app runtime only when real navigation, auth, server data, persistence, or another app contract needs validation.

## Backend reset path for QA

When preview or QA flows need known live data, run this against a running backend:

```bash
npm run dev:scenario -- ui-preview
```

This recreates fixed preview users, a mutual match, chat history, notifications, and an event RSVP path.
Each reset deletes all `preview.*` users, recreates the same preview identities in the same order, and intentionally wipes prior mutations on those accounts. The fixture graph is deterministic in shape and credentials, but IDs and timestamps are regenerated unless you pin `SCENARIO_NOW_ISO`.
Current seeded credentials:

- `preview.lana@brdg.local` / `PreviewPass123!`
- `preview.mason@brdg.local` / `PreviewPass123!`
- `preview.niko@brdg.local` / `PreviewPass123!`

Use this seeded runtime path for integrated QA inside the real app navigation.
The current reset also creates a discovery candidate, a mutual match with message history, a future event invite, an RSVP, and verified notification payloads for the deep-link paths the app uses today.

The current seeded QA path is especially useful for validating:
- discovery filters and quick filters
- explore quick actions
- create flow substeps
- chat quick-action suggestions
- profile editing and photo management

Recommended local QA loop for the current shipped mobile surface:
1. Start the backend with `npm run dev:backend`.
2. Start the app with `npm run dev:mobile`.
3. Reset the seeded runtime with `npm run dev:scenario -- ui-preview`.
4. Sign in as `preview.lana@brdg.local`.
5. Validate the You/Profile screen end to end:
   - enter edit mode, update city/bio/intents, save, and confirm the refreshed values persist
   - upload a new photo
   - move a photo left/right
   - set a different primary photo
   - remove a non-primary photo
6. Validate the sheet-driven flows in the current shipped surface:
   - discovery filters
   - explore quick actions
   - create activity/timing substeps
   - chat quick-action suggestions
7. Pull to refresh or revisit downstream screens and confirm the updated primary photo and profile fields are reflected outside the Profile tab.

Use this seeded app loop after Storybook review, not instead of Storybook review, when a task is primarily visual.

## Fast iOS simulator loop

For repeated QA on the iOS simulator, split the native install step from the day-to-day validation loop.

One-time install for the current native graph:

```bash
npm run ios:install
```

This boots the latest available iPhone simulator (or `IOS_SIMULATOR_NAME` if you set it), builds the current dev client without leaving Metro attached, installs it, and disables Sentry auto-upload for the local debug build.

Fast repeat loop after the app is already installed:

```bash
# terminal 1
npm run dev:backend

# terminal 2
npm run qa:ios
```

If you need to reset deterministic preview data before opening the app:

```bash
npm run qa:ios:reset
```

`npm run qa:ios:reset` is not a standalone bootstrap. It expects `backend/.env` plus a reachable local backend, then reruns the same destructive `ui-preview` reset before opening the simulator loop.

Recommended usage:

1. Run `npm run ios:install` only when native dependencies, Expo config, or iOS-native files changed.
2. Reuse the installed dev client with `npm run qa:ios` for normal screen and flow testing.
3. Use `npm run qa:ios:reset` when login state, preview users, or seeded data drift.
4. Set `IOS_SIMULATOR_NAME="Your Simulator Name"` if you want a different device target.

If you are planning follow-on work, the current recommended next track is event conversion and re-engagement:
- improve event invite/share flows
- improve chat-to-event planning paths
- improve notification relevance and deep links

## No-fragmentation release rule

- Do not cut TestFlight or App Store builds from feature branches, dirty trees, detached `HEAD`, or local-only commits.
- Ship only from a clean `main` or explicit `release/*` branch.
- If release readiness is the goal, use `npm run release:ios:check` after `npm run harness:doctor`; the doctor is an operator sanity check, not the release gate itself.
- If local dev and TestFlight differ, inspect the shipped bundle and identify the exact source snapshot before changing UI code.

## Troubleshooting quick reference

### Backend won't come up

- Check Docker is running.
- Re-run bootstrap:
  ```bash
  cd backend
  npm run dev:bootstrap
  ```
- If smoke run fails, inspect backend logs:
  ```bash
  tail -n 120 /tmp/brdg-backend-smoke.log
  ```
- For bootstrap or scenario-reset failures, also inspect:
  ```bash
  tail -n 120 /tmp/brdg-bootstrap-smoke.log
  tail -n 120 /tmp/brdg-ui-preview-smoke.json
  ```

### Auth/profile/discovery requests failing

- Backend logs structured error context in:
  - `AuthService`
  - `ProfileService`
  - `DiscoveryService`
- Mobile routes should not call the raw axios client directly.
- Server reads/mutations should flow through React Query-backed feature hooks and the service layer.
- Profile photo uploads now flow through backend-managed local storage in dev via the `profile` API; if uploads fail, inspect backend logs first.
- If the seeded preview login or deterministic QA state is missing, rerun `npm run dev:scenario -- ui-preview` before debugging screen code.

### Mobile can't hit backend from device

Use the correct API URL for your target:
- iOS simulator: `http://localhost:3010`
- Android emulator: `http://10.0.2.2:3010`
- Physical device: `http://<your-mac-ip>:3010`
