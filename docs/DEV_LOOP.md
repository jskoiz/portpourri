# BRDG Daily Dev Loop + Troubleshooting

## Fast start (day-to-day)

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

## Release-hardening smoke run

From repo root:

```bash
npm run smoke
```

This verifies:
1. Backend deterministic bootstrap (`db up -> wait -> migrate -> seed`)
2. Backend starts and responds on the configured local API URL
3. Mobile launch prerequisites (`expo-doctor` + `typecheck`)

## Validation commands used before ship

```bash
# repo root
npm run check

# or package-local when narrowing failures
npm run check:backend
npm run check:mobile
```

## Component workshop

Use Storybook for isolated component work instead of ad hoc preview routes:

```bash
cd mobile
npm run storybook
```

This is the supported component-level preview surface for BRDG UI primitives and composed cards/modules.

## Backend reset path for QA

When preview or QA flows need known live data, run this against a running backend:

```bash
npm run dev:scenario -- ui-preview
```

This recreates fixed preview users, a mutual match, chat history, notifications, and an event RSVP path.

Use this seeded runtime path for integrated QA inside the real app navigation.

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

### Mobile can't hit backend from device

Use the correct API URL for your target:
- iOS simulator: `http://localhost:3010`
- Android emulator: `http://10.0.2.2:3010`
- Physical device: `http://<your-mac-ip>:3010`
