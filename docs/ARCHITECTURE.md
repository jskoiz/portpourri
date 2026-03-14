# BRDG Architecture Map

## Monorepo Layout

- `mobile/` — Expo React Native client
- `backend/` — NestJS API + Prisma
- `docs/` — project documentation and conventions

## Mobile Architecture (`mobile/src`)

- `app/`
  - `providers/` — app shell providers for Tamagui, React Query, Safe Area, Bottom Sheet, and Sentry
  - `navigation/types.ts` — typed root stack and tab params
- `design/`
  - `tamagui.config.ts` — primitive system configuration
  - `primitives/` — shared layout/text primitives
- `api/`
  - `client.ts` — shared axios client + auth interceptors
  - `errors.ts` — API error normalization
  - `types.ts` — shared API response/domain types
- `config/`
  - `env.ts` — Expo environment access (`EXPO_PUBLIC_API_URL`)
- `constants/`
  - `storage.ts` — canonical AsyncStorage keys
- `services/`
  - `api.ts` — feature-oriented API adapters (`authApi`, `discoveryApi`, `matchesApi`, `profileApi`)
- `features/`
  - feature hooks for query/mutation ownership (`discovery`, `events`, `chat`, `matches`, `notifications`, `profile`)
- `lib/`
  - `query/` — shared QueryClient and cache keys
- `store/`
  - `authStore.ts` — auth/session bootstrap only
- `screens/`, `navigation/`, `components/` — presentation and routing

### Mobile conventions

1. Screens should not call the raw axios client directly.
2. Server state should flow through feature hooks backed by React Query.
3. Forms should use `react-hook-form` + `zod`.
4. Do not hardcode storage key strings; use `STORAGE_KEYS`.
5. Keep environment access centralized via `config/env.ts`.
6. Normalize API errors before surfacing them in UI state.

## Backend Architecture (`backend/src`)

- `config/`
  - `app.config.ts` — centralized env parsing/defaults for runtime and scripts
- `auth/`, `profile/`, `discovery/`, `matches/`, `prisma/` — domain modules
- `main.ts` — bootstrap and static assets/cors wiring

### Backend conventions

1. Read runtime config through `appConfig`, not `process.env` directly in modules.
2. Keep module boundaries by domain (`auth`, `profile`, `discovery`, `matches`).
3. Reuse environment conventions in scripts (`backend/scripts/env.js`) for non-Nest tooling.
4. Preserve API contracts when refactoring internals.

## Environment Variables

### Mobile

- `EXPO_PUBLIC_API_URL` — API base URL consumed by `mobile/src/config/env.ts`

### Backend

- `PORT` — server listen port
- `JWT_SECRET` — JWT signing secret (required)
- `DATABASE_URL` — Prisma/Postgres connection URL
- `BASE_URL` — public asset base URL for seed photo links
- `API_BASE_URL` — API base URL used by helper scripts

## Refactor intent

This structure is optimized for composability and safer future growth:
- endpoint calls are isolated from UI components,
- server state ownership sits in feature hooks instead of screen files,
- design primitives are centralized instead of being redefined per screen,
- configuration is centralized and typed,
- feature modules remain explicit and easy to expand.
