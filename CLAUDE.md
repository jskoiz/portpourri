# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

BRDG is a fitness-oriented social/dating mobile app. The repo is a monorepo with three independent workspaces: `backend/` (NestJS API), `mobile/` (Expo React Native), and `symphony/` (Linear issue → Codex agent orchestration service). Each has its own `package.json`, `tsconfig.json`, and test setup.

## Common Commands

### Validation (run from root)
```bash
npm run check              # Full validation: root + backend + mobile
npm run check:changed      # Diff-driven validation (PR lane)
npm run pre-submit         # Local checklist before PR (docs, policies, tests)
npm run smoke              # Bootstrap + seeded runtime validation
```

### Backend (`cd backend`)
```bash
npm run dev:bootstrap      # Docker up (Postgres+Redis), wait, migrate, seed
npm run start:dev          # NestJS watch mode (port 3010)
npm run typecheck          # tsc --noEmit
npm run check              # typecheck + boundaries + tests
npx jest path/to/file      # Run a single test file
npm run db:migrate         # Run Prisma migrations
npm run db:seed            # Seed database
```

### Mobile (`cd mobile`)
```bash
npm run start              # Expo dev server
npm run typecheck          # TypeScript check
npm run check              # typecheck + boundaries + tests
npx jest path/to/file      # Run a single test file
npm run storybook:start    # Launch on-device Storybook
npm run feature:new        # Scaffold a new feature module
```

### Symphony (`cd symphony`)
```bash
npm run dev                # Run CLI via tsx
npm run check              # build + test
```

## Architecture

### Backend (NestJS 11 + Prisma 5)
- **Domain modules**: `auth/`, `profile/`, `discovery/`, `matches/`, `events/`, `notifications/`, `moderation/`, `verification/`
- **Layer order**: config/base → persistence → contracts → domain/service → transport → app-shell
- **Database**: PostgreSQL 16 (port 5433 locally) via Prisma ORM; Redis 7 (port 6379) via docker-compose
- **Entry**: `src/main.ts` bootstraps NestFactory with CORS, ValidationPipe (whitelist+transform), Swagger at `/docs` (dev only), helmet middleware, 60 req/min throttle
- **Config**: Environment access via `config/app.config.ts` — modules must NOT use raw `process.env`

### Mobile (Expo 54 + React Native 0.81 + React 19)
- **Design system**: Tamagui 2.0 primitives in `src/design/`; light-mode default
- **State**: Zustand for client state (`store/authStore.ts`), React Query 5 for server state via feature hooks in `src/features/`
- **Forms**: react-hook-form + Zod 4 validation
- **Navigation**: React Navigation 7, typed via `src/core/navigation/types.ts`
- **API layer**: Axios client with auth interceptors in `src/services/api.ts`; feature-oriented adapters
- **Screens**: `src/screens/` — must NOT import raw axios client; use feature hooks
- **Storybook**: On-device via `.rnstorybook/` with Storybook 10; visual changes require Storybook updates in same diff

### Symphony (TypeScript issue orchestration)
- Polls Linear issues → creates git worktrees → runs Codex agents → routes status (Todo → In Progress → Human Review → Merging → Done)
- Maintains `## Codex Workpad` comments in Linear for traceability

## Key Conventions

- **Module boundaries enforced**: The harness (`scripts/check-repo-policies.mjs`) validates import policies. Screens/features must respect domain boundaries.
- **Environment variables**: Backend uses `config/app.config.ts`, mobile uses `src/config/env.ts` wrapping `EXPO_PUBLIC_*` vars. Never access `process.env` directly in feature code.
- **Storage keys**: Use `constants/STORAGE_KEYS` — never hardcode AsyncStorage keys in screens/services.
- **API contract stability**: Don't change API contracts unless the task explicitly modifies both backend and mobile.
- **Storybook coverage**: Visual mobile changes must update Storybook in the same diff.
- **Photo uploads**: Local `public/uploads/profile` in dev; cloud adapter seam exists but isn't wired yet.

## Local Infrastructure

```bash
docker compose up -d       # Starts Postgres 16 (5433) + Redis 7 (6379)
```

Seeded test users: `preview.lana@brdg.local`, `preview.mason@brdg.local`, `preview.niko@brdg.local` (password: `PreviewPass123!`). Reset scenario: `npm run dev:scenario -- ui-preview`.

## CI

GitHub Actions (`ci.yml`): PR lane runs diff-driven `check:changed`, main lane runs full `check`. Node 22, harness artifacts uploaded on failure. Harness orchestrated by `scripts/run-harness-lane.mjs`.

## Key Documentation

- `docs/ARCHITECTURE.md` — Module boundaries, layer conventions
- `docs/HARNESS.md` — Validation lanes, policy rules, CI shape
- `docs/DEV_LOOP.md` — Day-to-day startup and troubleshooting
- `docs/STORYBOOK_WORKFLOW.md` — Component review process
- `WORKFLOW.md` — Symphony orchestration contract
- `AGENTS.md` — Agent guide and canonical commands
