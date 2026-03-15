# BRDG Mobile Simplification Reset

Date: 2026-03-14

## Goal

This pass implemented the agreed simplification baseline for BRDG:

- keep Expo + React Native
- reduce mobile architectural sprawl
- remove dead preview and styling systems
- standardize server state and forms around mature libraries
- preserve the current backend shape except where duplicate ownership existed

This document records what was changed, why it was changed, what was verified, and what remains.

## Summary Of What Was Done

### 1. App shell and platform foundation

- Added a shared provider shell in `mobile/src/core/providers/AppProviders.tsx`.
- Added a shared query client in `mobile/src/lib/query/queryClient.ts`.
- Added shared query keys in `mobile/src/lib/query/queryKeys.ts`.
- Added Sentry bootstrap scaffolding in `mobile/src/core/observability/sentry.ts`.
- Added typed root stack and tab params in `mobile/src/core/navigation/types.ts`.
- Added a Tamagui configuration and primitive layer in:
  - `mobile/src/design/tamagui.config.ts`
  - `mobile/src/design/primitives/index.tsx`
- Switched the internal app shell folder from `mobile/src/app` to `mobile/src/core`.
  - Reason: Expo was incorrectly treating `src/app` as an Expo Router app root and rendering a blank screen.

### 2. Design system and styling cleanup

- Removed the unused Tailwind/NativeWind setup:
  - deleted `mobile/global.css`
  - deleted `mobile/tailwind.config.js`
  - removed the Babel plugin from `mobile/babel.config.js`
- Moved theme ownership toward the new design foundation while preserving the existing BRDG look.
- Removed the unused light theme surface from the active token setup in `mobile/src/theme/tokens.ts`.

### 3. Storybook and preview workflow

- Added Storybook scaffolding:
  - `mobile/.rnstorybook/index.ts`
  - `mobile/.rnstorybook/main.ts`
  - `mobile/.rnstorybook/preview.ts`
  - `mobile/src/stories/AppButton.stories.tsx`
- Added Metro config to support Storybook integration: `mobile/metro.config.js`
- Added a `storybook` script in `mobile/package.json`.
- Removed duplicate preview surfaces:
  - deleted `mobile/src/screens/CodexPreviewScreen.tsx`
  - deleted `mobile/src/screens/AppStorePreviewScreens.tsx`
- Removed dormant preview navigation plumbing from `MainTabNavigator`.

### 4. Server state reset with React Query

- Added `@tanstack/react-query` and moved screen data access toward feature hooks.
- Added feature hooks:
  - `mobile/src/features/discovery/hooks/useDiscoveryFeed.ts`
  - `mobile/src/features/events/hooks/useExploreEvents.ts`
  - `mobile/src/features/events/hooks/useMyEvents.ts`
  - `mobile/src/features/events/hooks/useEventDetail.ts`
  - `mobile/src/features/matches/hooks/useMatches.ts`
  - `mobile/src/features/chat/hooks/useChatThread.ts`
  - `mobile/src/features/notifications/hooks/useNotifications.ts`
  - `mobile/src/features/notifications/hooks/useUnreadNotificationCount.ts`
  - `mobile/src/features/profile/hooks/useProfile.ts`

### 5. Screen migrations completed in this pass

These screens were moved away from direct store or direct raw-client behavior and onto the new foundation:

- `HomeScreen`
  - uses `useDiscoveryFeed`
  - uses query-backed refetch instead of local fetch wiring
  - uses query-backed unread count
- `ExploreScreen`
  - uses `useExploreEvents`
  - uses query-backed unread count
- `NotificationsScreen`
  - uses `useNotifications`
  - no longer depends on the old notification store
- `MatchesScreen`
  - uses `useMatches`
  - switched to FlashList
  - uses `expo-image`
- `MyEventsScreen`
  - uses `useMyEvents`
  - switched to FlashList
- `EventDetailScreen`
  - uses `useEventDetail`
  - uses `expo-image`
- `ChatScreen`
  - uses `useChatThread`
  - switched to FlashList
  - uses `expo-image`
- `ProfileScreen`
  - uses `useProfile`
  - saves via the profile hook instead of raw client access
- `OnboardingScreen`
  - no longer uses the deleted intent store
  - saves via `profileApi.updateFitness`
  - now uses `react-hook-form` + `zod`

### 6. Form standardization

- Added `react-hook-form` + `zod` and migrated the major user-input flows:
  - `mobile/src/screens/LoginScreen.tsx`
  - `mobile/src/screens/SignupScreen.tsx`
  - `mobile/src/screens/CreateScreen.tsx`
  - `mobile/src/screens/OnboardingScreen.tsx`
- Added schemas:
  - `mobile/src/features/auth/schema.ts`
  - `mobile/src/features/events/schema.ts`
  - `mobile/src/features/onboarding/schema.ts`

### 7. Dead state and dead UI removal

- Deleted `mobile/src/store/intentStore.ts`
- Deleted `mobile/src/store/notificationStore.ts`
- Deleted `mobile/src/components/IntentSelector.tsx`
- Replaced notification badge usage with query-derived unread counts

### 8. Tooling and workflow additions

- Added a screen-boundary guard script:
  - `mobile/scripts/check-screen-boundaries.js`
- Added a feature scaffolding generator:
  - `mobile/_templates/feature/new/hello.ejs.t`
  - `mobile/_templates/feature/new/prompt.js`
- Added helper test render utilities:
  - `mobile/src/lib/testing/renderWithProviders.tsx`

### 9. Backend cleanup

- Removed duplicate write ownership from the matches controller:
  - deleted `POST /matches/like`
- Kept `POST /discovery/like/:id` as the canonical like entrypoint
- Updated verification and controller tests accordingly:
  - `backend/src/matches/matches.controller.ts`
  - `backend/src/matches/matches.controller.spec.ts`
  - `backend/verify_matches.js`

### 10. Runtime fix for web and visual verification

While validating the running app, the web bundle was broken for two reasons:

1. Expo treated `src/app` as an Expo Router root
2. Web runtime dependencies required by Expo dev tools and Lottie were missing after the cleanup

Fixes applied:

- renamed `mobile/src/app` to `mobile/src/core`
- installed:
  - `react-native-css-interop`
  - `@lottiefiles/dotlottie-react`

After those fixes, the app was visually verified in a real browser:

- the login screen rendered
- seeded preview credentials worked
- the app successfully navigated into the Discover screen with live seeded content

## Packages Added

Mobile dependencies added in this pass:

- `tamagui`
- `@tamagui/config`
- `@tamagui/animations-react-native`
- `@tanstack/react-query`
- `react-hook-form`
- `zod`
- `@hookform/resolvers`
- `@shopify/flash-list`
- `@gorhom/bottom-sheet`
- `@sentry/react-native`
- `expo-image`
- `@storybook/react-native`
- `@storybook/addon-ondevice-actions`
- `@storybook/addon-ondevice-controls`
- `hygen`
- `react-native-css-interop`
- `@lottiefiles/dotlottie-react`

## Packages And Systems Removed

- `nativewind`
- `tailwindcss`
- `global.css`
- the Tailwind Babel wiring
- duplicate preview screens
- dead intent and notification stores

## Checks And Verification

The following were run successfully:

```bash
npm run check:mobile
npm run check:backend
npm run check
```

Validation included:

- mobile typecheck
- mobile Jest suite
- backend typecheck
- backend Jest suite
- browser-based visual verification of the running app

## Current State

The app now:

- runs again without the blank screen issue
- has a working shared provider shell
- uses React Query as the new server-state foundation
- uses RHF + Zod for the major auth/create/onboarding flows
- no longer carries Tailwind/NativeWind or the duplicate preview surfaces
- no longer uses the old notification and intent stores
- preserves the current backend module structure while removing duplicate match-like route ownership

## What Is Still Not Finished

This pass established the new baseline, but it did not complete the whole long-range cleanup plan.

### Remaining architecture work

- large screens still need deeper decomposition into:
  - thin route containers
  - extracted sections/cards
  - local feature components
  - smaller style modules
- the mobile tree is improved, but not fully reorganized into pure feature-slice ownership everywhere
- `ProfileScreen`, `HomeScreen`, and `ExploreScreen` still carry too much UI and styling density

### Remaining design-system work

- Tamagui is present as the new primitive foundation, but most legacy custom UI components still exist
- the next step is to migrate repeated cards, layout primitives, top bars, and form controls onto the Tamagui-backed layer consistently
- bottom-sheet usage has been planned but not yet rolled out across filters, quick actions, and layered flows

### Remaining dev-workflow work

- Storybook is wired, but the component workshop inventory is still very small
- more stories should be added for:
  - cards
  - headers
  - inputs
  - notification items
  - event modules
  - profile modules
- more generator templates should be added for real feature scaffolding

### Remaining mobile data-layer work

- more flows should be moved behind query/mutation hooks so that route containers stop owning async state
- profile detail and some remaining surfaces still deserve another pass for consistency and stronger boundaries

## Recommended Next Steps

### Phase 1: Finish screen decomposition

Status: completed on March 14, 2026.

Priority order:

1. `mobile/src/screens/HomeScreen.tsx`
2. `mobile/src/screens/ExploreScreen.tsx`
3. `mobile/src/screens/ProfileScreen.tsx`
4. `mobile/src/screens/CreateScreen.tsx`
5. `mobile/src/screens/ChatScreen.tsx`

Target rules:

- route containers under 200 LOC where practical
- no giant `StyleSheet.create` blocks in route files
- extracted subcomponents for all repeated sections
- completed with no LOC exceptions:
  - `HomeScreen.tsx` 153 LOC
  - `ExploreScreen.tsx` 69 LOC
  - `ProfileScreen.tsx` 126 LOC
  - `CreateScreen.tsx` 136 LOC
  - `ChatScreen.tsx` 91 LOC
- route-local styles moved into feature-local `*.styles.ts` modules
- `CreateScreen` create submission moved behind `useCreateEvent`
- `ProfileScreen` environment chips are now explicitly non-persisted/read-only in this phase

### Phase 2: Make the design system real

- migrate shared UI primitives to the Tamagui-backed design layer
- standardize buttons, cards, surfaces, inputs, chips, and empty states
- remove redundant legacy custom primitives after migration
- canonical primitives now live in `mobile/src/design/primitives/index.tsx`:
  - `Button`
  - `Card`
  - `Input`
  - `Chip`
  - `StatePanel`
- legacy wrappers remain transitional for route-level compatibility:
  - `AppButton`
  - `AppCard`
  - `AppInput`
  - `AppState`
- feature modules should import the design primitives directly instead of the legacy wrappers

### Phase 3: Complete iOS-first interaction cleanup

- introduce bottom sheets for:
  - filters
  - quick actions
  - menu flows
  - create-flow substeps
- audit motion and haptics against the current iOS-first goals

### Phase 4: Expand Storybook and dev tooling

- add component stories for real product modules
- add a root-level convenience command for Storybook
- add more scaffolding templates for feature slices

## Notes For Review

- The repo-local `AGENTS.md` guidance was followed.
- The release workflow was not touched.
- The backend was intentionally not rewritten.
- The reset favored stable migration steps over a risky all-at-once restructure.
