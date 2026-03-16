# BRDG mobile testing

The mobile workspace now has app-level coverage for auth, discovery, explore, create, chat, profile, and shared primitive interactions.

## What is covered first

Current suite focus:
- auth entry and signup flows
- discovery and explore screen interactions
- create flow substeps and success state
- chat composer/send flow
- profile save flow
- shared primitive regression coverage

Release/readiness note:
- the Jest suite does not replace the seeded runtime QA path for Phase 3 profile photo management or bottom-sheet interactions
- use repo-root `npm run smoke` plus `npm run dev:scenario -- ui-preview` when validating release candidates locally

## Run locally

From `mobile/`:

```bash
npm test
```

Other useful checks:

```bash
npm run typecheck
npm run check
npm run storybook:start
```

## Notes

- Tests use `jest-expo` and `@testing-library/react-native`
- Shared native test seams are mocked in `jest.setup.js` for Expo image picker, haptics, and bottom sheets
- Network/store boundaries are mocked where needed so the suite stays deterministic
- Storybook is available for component and interaction review; use the repo-root `npm run storybook` convenience command when working from the monorepo root

## Recommended next targets

1. profile photo-management edge cases and failure states
2. bottom-sheet module stories for explore/chat/create
3. stronger assertions around build provenance rendering in the profile screen
4. auth store persistence behavior (`loadToken`, invalid token fallback)
