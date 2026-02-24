# Contributing

## Local setup

### Backend

```bash
cd backend
npm ci
cp .env.example .env
npm run start:dev
```

### Mobile

```bash
cd mobile
npm ci
npm run start
```

## Quality gates

Run these before opening a PR:

```bash
# repo root one-shot smoke (bootstrap -> backend start -> mobile prereqs)
./scripts/smoke-e2e.sh
```

### Backend

```bash
cd backend
npm run check
```

This runs:
- `npm run typecheck`
- `npm run test`

Optional full gate:
- `npm run check:full` (includes lint)

### Mobile

```bash
cd mobile
npm run check
```

This runs:
- `npm run lint` (currently aliases to typecheck)
- `npm run test` (placeholder smoke output until unit tests are added)

## CI checks

GitHub Actions runs `.github/workflows/ci.yml` on pushes to `main` and all pull requests.

It executes:
- **Backend:** `typecheck`, `test`
- **Mobile:** `typecheck`, `test`

### Temporary skips

- **Backend lint is not yet in CI** because current ESLint rules fail on existing legacy `any` usage and unsafe access patterns. Lint remains available locally via `npm run lint` while technical debt is addressed incrementally.
- **Mobile unit tests are not implemented yet.** The `test` script is a temporary placeholder so the command contract exists and can be swapped to Jest once tests are introduced.
