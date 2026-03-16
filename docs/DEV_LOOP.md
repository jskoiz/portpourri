# BRDG Daily Dev Loop + Troubleshooting

Use [`HARNESS.md`](./HARNESS.md) for the canonical validation lanes and [`REPO_MAP.md`](./REPO_MAP.md) when you need to orient quickly.

## Fast start (day-to-day)

If the local environment looks suspect, start with:

```bash
npm run harness:doctor
```

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

## Release-hardening smoke run

From repo root:

```bash
npm run smoke
```

This verifies:
1. Backend deterministic bootstrap (`db up -> wait -> migrate -> seed`)
2. Backend starts and responds on the configured local API URL
3. The seeded `ui-preview` runtime resets cleanly against the running backend
4. Mobile launch prerequisites (`expo-doctor` + `typecheck`)

## Validation commands used before ship

```bash
# repo root
npm run check:changed
npm run check

# or package-local when narrowing failures
npm run check:backend
npm run check:mobile
npm run docs:check
```

Phase 3 is complete on `main`. New work should generally branch from clean `main` and target the next product phase rather than continuing to accumulate broad "Phase 3 cleanup" work in one branch.

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
Current seeded credentials:

- `preview.lana@brdg.local` / `PreviewPass123!`
- `preview.mason@brdg.local` / `PreviewPass123!`
- `preview.niko@brdg.local` / `PreviewPass123!`

Use this seeded runtime path for integrated QA inside the real app navigation.

The current seeded QA path is especially useful for validating:
- discovery filters and quick filters
- explore quick actions
- create flow substeps
- chat quick-action suggestions
- profile editing and photo management

Recommended local QA loop for the current Phase 3 surface:
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
6. Validate the sheet-driven flows changed in Phase 3:
   - discovery filters
   - explore quick actions
   - create activity/timing substeps
   - chat quick-action suggestions
7. Pull to refresh or revisit downstream screens and confirm the updated primary photo and profile fields are reflected outside the Profile tab.

Use this seeded app loop after Storybook review, not instead of Storybook review, when a task is primarily visual.

If you are planning post-Phase-3 work, the current recommended next track is event conversion and re-engagement:
- improve event invite/share flows
- improve chat-to-event planning paths
- improve notification relevance and deep links

## No-fragmentation release rule

- Do not cut TestFlight or App Store builds from feature branches, dirty trees, detached `HEAD`, or local-only commits.
- Ship only from a clean `main` or explicit `release/*` branch.
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
