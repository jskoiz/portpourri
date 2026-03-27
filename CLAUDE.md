# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Overview

BRDG is a fitness-oriented social/dating mobile app. The repo is a monorepo with three independent workspaces: `backend/` (NestJS API), `mobile/` (Expo React Native), and `symphony/` (Linear issue → Codex agent orchestration service). A fourth cross-cutting directory, `shared/contracts/`, holds Zod-based API contract schemas consumed by both backend and mobile. Each workspace has its own `package.json`, `tsconfig.json`, and test setup.

## Common Commands

### Validation (run from root)
```bash
npm run check              # Full validation: root + backend + mobile + symphony
npm run check:changed      # Diff-driven validation (PR lane)
npm run pre-submit         # Local checklist before PR (docs, policies, tests)
npm run smoke              # Bootstrap + seeded runtime validation
npm run docs:check         # Verify doc cross-references are intact
npm run policy:check       # Run import-boundary and repo-policy checks
npm run harness:doctor     # Diagnose harness configuration issues
npm run repo:index         # Regenerate artifacts/repo-index.json
```

### Backend (`cd backend`)
```bash
npm run dev:bootstrap      # Docker up (Postgres+Redis), wait, migrate, seed
npm run start:dev          # NestJS watch mode (backend/.env.example uses PORT=3010; appConfig falls back to 3000 if PORT is unset)
npm run typecheck          # tsc --noEmit
npm run check              # typecheck + boundaries + tests
npx jest path/to/file      # Run a single test file
npm run db:migrate         # Run Prisma migrations (prisma migrate deploy)
npm run db:seed            # Seed database (prisma db seed via ts-node prisma/seed.ts)
npm run module:new         # Scaffold a new backend module
npm run lint               # ESLint (eslint 9 + typescript-eslint)
npm run format             # Prettier formatting
```

### Mobile (`cd mobile`)
```bash
npm run start              # Expo dev server
npm run typecheck          # TypeScript check
npm run check              # typecheck + boundaries + tests
npx jest path/to/file      # Run a single test file
npm run storybook:start    # Launch on-device Storybook (sets EXPO_PUBLIC_STORYBOOK_ENABLED=true)
npm run storybook:web      # Launch web Storybook on port 6006
npm run feature:new        # Scaffold a new feature module
```

### Symphony (`cd symphony`)
```bash
npm run dev                # Run CLI via tsx
npm run check              # build + test
npm run build              # tsc -p tsconfig.json
```

### Root convenience scripts
```bash
npm run dev:backend        # Preferred: loads backend/.env then starts Nest
npm run dev:mobile         # Starts Expo dev server
npm run dev:tunnel         # Dev tunnel for remote mobile testing
npm run dev:scenario -- ui-preview  # Reset to seeded UI preview scenario
npm run storybook          # Shorthand for mobile storybook:start
npm run qa:ios             # iOS simulator QA (uses latest available iPhone simulator)
npm run qa:ios:reset       # QA with full reset
npm run ios:install        # Install iOS dev client (rebuild only when native deps change)
npm run release:ios        # TestFlight/App Store release (local Xcode mode)
npm run hooks:install      # Install repo-managed pre-commit hooks
npm run screenshots        # Full screenshot suite via Maestro
```

## Architecture

### Backend (NestJS 11 + Prisma 5 + TypeScript ~5.9)
- **Domain modules**: `auth/`, `profile/`, `discovery/`, `matches/`, `events/`, `notifications/`, `moderation/`, `verification/`
- **Support modules**: `prisma/` (Prisma ORM service), `common/` (filters, enums, pagination, auth-request interface, logger), `config/` (centralized env config), `contracts/` (response shape tests), `dev-preview/` (seeded UI preview scenario), `test-support/` (mocks for expo-server-sdk etc.)
- **Layer order**: config/base → persistence → contracts → domain/service → transport → app-shell
- **Database**: PostgreSQL 16 (port 5433 locally) via Prisma ORM; Redis 7 (port 6379) via docker-compose (used via ioredis)
- **Entry**: `src/main.ts` bootstraps NestFactory with CORS, ValidationPipe (whitelist+forbidNonWhitelisted+transform), AllExceptionsFilter, static assets for profile photos, Swagger at `/docs` (non-production), helmet middleware, 60 req/min throttle via `@nestjs/throttler`
- **Config**: All environment access via `config/app.config.ts` — modules must NOT use raw `process.env`
- **Logging**: Structured JSON via `nestjs-pino` with pino-pretty in dev; X-Trace-Id header per request
- **Auth**: JWT-based via `@nestjs/passport` + `passport-jwt`; bcrypt for password hashing
- **Real-time**: WebSocket chat gateway via `@nestjs/websockets` + `socket.io`
- **Push notifications**: Expo push service via `expo-server-sdk`
- **Testing**: Jest 29 + ts-jest; test files use `.spec.ts` suffix; rootDir is `src/`; module aliases for `@contracts/*` mapped to `shared/contracts/`

### Mobile (Expo 54 + React Native 0.81 + React 19 + TypeScript ~5.9)
- **Design system**: Tamagui primitives in `src/design/` (primitives, sheets, theme); glass effects and tokens in `src/theme/`
- **State**: Zustand 5 for client state (`store/authStore.ts`, `store/toastStore.ts`), React Query 5 (`@tanstack/react-query`) for server state via feature hooks in `src/features/`
- **Forms**: react-hook-form 7 + `@hookform/resolvers` + Zod 4 validation
- **Navigation**: React Navigation 7 (native-stack + bottom-tabs), typed via `src/core/navigation/types.ts`; navigator components in `src/navigation/` (AppNavigator, MainTabNavigator, TabBarVisibilityContext)
- **API layer**: Axios client with auth interceptors in `src/api/client.ts`; feature-oriented adapters in `src/services/api.ts`; contract validation via `src/api/contractValidator.ts`; error normalization in `src/api/errors.ts`; token storage in `src/api/tokenStorage.ts`
- **Screens**: `src/screens/` — Home, Login, Signup, Onboarding, Profile, ProfileDetail, Explore, Matches, Chat, Events (Create, EventDetail, MyEvents), Notifications
- **Components**: `src/components/` — ErrorBoundary, LoadingState, MatchAnimation, SwipeDeck, form components, skeleton loaders, UI primitives, withBoundary HOC
- **Features**: `src/features/` — auth, chat, discovery, events, locations, matches, moderation, notifications, onboarding, profile (each owns React Query hooks for its domain)
- **Lib utilities**: `src/lib/` — date helpers, deep links, fonts, haptic interaction, location, moderation, profile helpers/photos, push notifications, query client/cache keys, secure storage, socket.io client, testing utilities
- **Core providers**: `src/core/providers/` — app shell providers (Tamagui, React Query, Safe Area, Bottom Sheet, Sentry)
- **Storybook**: On-device via `.rnstorybook/` with Storybook 10; web Storybook also available; visual changes require Storybook updates in same diff
- **Testing**: Jest 29 via jest-expo; test files in `__tests__/` directories
- **Key dependencies**: expo-image, expo-haptics, expo-notifications, expo-location, expo-secure-store, expo-image-picker, @gorhom/bottom-sheet, @shopify/flash-list, react-native-reanimated, react-native-gesture-handler, lottie-react-native, @sentry/react-native, socket.io-client

### Symphony (TypeScript issue orchestration, ESM)
- Polls Linear issues → creates git worktrees → runs Codex agents → routes status (Todo → In Progress → Human Review → Merging → Done)
- Maintains `## Codex Workpad` comments in Linear for traceability
- Key files: `cli.ts` (entry), `service.ts` (main service), `workflow.ts` (state machine), `workspace.ts` (worktree management), `policy.ts` (safety policies), `agent-runner.ts` (Codex agent execution), `config.ts`, `tracker/` (status tracking)
- Uses native Node.js test runner (via `tsx --test`)

### Shared Contracts (`shared/contracts/`)
- Zod 4 schemas defining API contracts shared between backend and mobile
- Modules: `auth.ts`, `common.ts`, `discovery.ts`, `events.ts`, `http.ts`, `matches.ts`
- Backend tests validate response shapes against these contracts
- Has its own `tsconfig.json`

## Key Conventions

- **Module boundaries enforced**: The harness (`scripts/check-repo-policies.mjs`) validates import policies. Screens/features must respect domain boundaries. Run `npm run policy:check` or the workspace-level `check:boundaries` to verify.
- **Environment variables**: Backend uses `config/app.config.ts`, mobile uses `src/config/env.ts` wrapping `EXPO_PUBLIC_*` vars. Never access `process.env` directly in feature code.
- **Storage keys**: Use `constants/storage.ts` (`STORAGE_KEYS`) — never hardcode AsyncStorage keys in screens/services.
- **API contract stability**: Don't change API contracts unless the task explicitly modifies both backend and mobile. Shared contracts live in `shared/contracts/`.
- **Storybook coverage**: Visual mobile changes must update Storybook in the same diff.
- **Photo uploads**: Local `public/uploads/profile` in dev; served as static assets by NestJS. Cloud adapter seam exists but isn't wired yet.
- **Screens must not import raw axios client**: Use feature hooks from `src/features/` which wrap React Query.
- **Forms**: Always use `react-hook-form` + Zod for form validation.
- **Pre-submit**: Run `npm run pre-submit` before opening PRs; this checks docs, policies, and tests.
- **Git hooks**: Install repo-managed hooks via `npm run hooks:install`.

## Local Infrastructure

```bash
docker compose up -d       # Starts Postgres 16 (5433) + Redis 7 (6379)
```

Database credentials (dev): `brdg_user` / `brdg_password` / `brdg_db`.

Seeded test users: `preview.lana@brdg.local`, `preview.mason@brdg.local`, `preview.niko@brdg.local` (password: `PreviewPass123!`). Reset scenario: `npm run dev:scenario -- ui-preview`.

## CI

GitHub Actions workflows:
- **`ci.yml`**: `workflow_dispatch` trigger. Three jobs:
  - `backend-migration-rehearsal` — replays Prisma migrations against a fresh Postgres 16 instance
  - `fast-pr` — diff-driven `run-harness-lane.mjs --lane pr-fast` against `origin/main`
  - `main-check` — full `run-harness-lane.mjs --lane main-check`
  - Node 22; harness artifacts uploaded on every run
- **`deploy-backend.yml`**: Deploys backend on push to `main` or manual dispatch. Builds Docker image, pushes to GHCR, deploys to Lightsail. Supports dry-run and rollback modes.
- **`deploy-testflight.yml`**: Triggered by `v*` tags. EAS Build & Submit to TestFlight.
- **`harness-maintenance.yml`**: Automated harness maintenance tasks.

Harness orchestrated by `scripts/run-harness-lane.mjs`. Use `npm run harness:doctor` to diagnose issues and `npm run harness:ci-context -- --branch <branch>` for CI context info.

## Testing

- **Backend**: `npx jest` from `backend/`; test regex `*.spec.ts`; tests are co-located with source in each module; mocks for external services in `test-support/`
- **Mobile**: `npx jest` from `mobile/`; uses jest-expo; runs with `--runInBand --detectOpenHandles --forceExit`; `__tests__/` directories alongside source
- **Symphony**: `tsx --test src/**/*.test.ts`; Node.js native test runner
- **Root**: `node --test scripts/__tests__/*.test.mjs`; tests for harness scripts
- **E2E**: Maestro flows in `maestro/flows/` for mobile UI automation; `npm run screenshots` for full screenshot capture

## Deployment

- **Backend**: Production deploys via `.github/workflows/deploy-backend.yml` to AWS Lightsail. Environment validation via `deploy/api/production.env.schema.json`. Never deploy manually; always go through the workflow.
- **Mobile**: TestFlight/App Store via local Xcode (`npm run release:ios`) by default. EAS path exists but Xcode mode is preferred. Preflight with `npm run release:ios:check`.

## Key Documentation

- `docs/ARCHITECTURE.md` — Module boundaries, layer conventions, mobile/backend structure
- `docs/REPO_MAP.md` — Fast repo navigation guide
- `docs/HARNESS.md` — Validation lanes, policy rules, CI shape
- `docs/DEV_LOOP.md` — Day-to-day startup and troubleshooting
- `docs/STORYBOOK_WORKFLOW.md` — Component review process
- `docs/FUNCTIONAL_MATRIX.md` — Feature expectations matrix
- `docs/APP_STORE_RELEASE.md` — iOS release process
- `docs/APP_STORE_CONNECT_METADATA.md` — App Store metadata
- `docs/DEPLOY_LIGHTSAIL.md` — Backend deployment to Lightsail
- `docs/MOBILE_FORM_UX.md` — Mobile form UX patterns
- `WORKFLOW.md` — Symphony orchestration contract
- `AGENTS.md` — Agent guide, canonical commands, cross-stack rules, skills
- `CONTRIBUTING.md` — Contribution guidelines
- `APP_ROADMAP.md` — Product roadmap
- `CODEBASE_REVIEW.md` — Historical codebase review notes
