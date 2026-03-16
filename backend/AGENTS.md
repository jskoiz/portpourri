# Backend Agent Guide

- Follow [`../AGENTS.md`](../AGENTS.md) for cross-stack policy. This file narrows the rules for `backend/`.

## Canonical Commands

```bash
npm run pre-submit
npm run check
npm run check:full
npm run test:e2e
npm run dev:bootstrap
npm run dev:scenario -- ui-preview
```

## Working Rules

- Read runtime environment through [`src/config/app.config.ts`](src/config/app.config.ts); do not add new `process.env` reads in feature modules.
- Preserve response shapes and seed/runtime assumptions used by the mobile app.
- Keep domain boundaries explicit: `config/base -> persistence -> contracts -> domain/service -> transport -> app-shell`.
- If a change touches bootstrap, migrations, seed data, scenario reset logic, or request wiring, validate it with `npm run smoke` from repo root.
- Add or update controller/service specs when behavior changes.

## References

- Harness workflow: [`../docs/HARNESS.md`](../docs/HARNESS.md)
- Repo map: [`../docs/REPO_MAP.md`](../docs/REPO_MAP.md)
- Backend README: [`README.md`](README.md)
- Release flow: [`../docs/APP_STORE_RELEASE.md`](../docs/APP_STORE_RELEASE.md)
