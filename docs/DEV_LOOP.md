# BRDG Daily Dev Loop + Troubleshooting

## Fast start (day-to-day)

From repo root:

```bash
# backend terminal
cd backend
npm run dev:bootstrap
npm run start:dev

# mobile terminal
cd mobile
npm run start
```

## Release-hardening smoke run

From repo root:

```bash
./scripts/smoke-e2e.sh
```

This verifies:
1. Backend deterministic bootstrap (`db up -> wait -> migrate -> seed`)
2. Backend starts and responds on `http://127.0.0.1:3000`
3. Mobile launch prerequisites (`expo-doctor` + `typecheck`)

## Validation commands used before ship

```bash
# backend
cd backend
npm run test
npm run build

# mobile
cd mobile
npx expo-doctor
npm run typecheck
```

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

- Backend now logs structured error context in:
  - `AuthService`
  - `ProfileService`
  - `DiscoveryService`
- Mobile logs request failure context via `logApiFailure(...)` in:
  - auth actions (`login`, `signup`, `me`)
  - profile actions (`getProfile`, `updateFitness`)
  - discovery actions (`feed`, `like`, `pass`)

### Mobile can't hit backend from device

Use the correct API URL for your target:
- iOS simulator: `http://localhost:3000`
- Android emulator: `http://10.0.2.2:3000`
- Physical device: `http://<your-mac-ip>:3000`
