# TestFlight Honolulu Rollout Notes

Date: 2026-03-11

## Scope

- Replaced the generic demo seed with a Honolulu and Oahu-focused dataset for beta testing.
- Refreshed the mobile Explore mock content to match the seeded market.
- Shipped a corrected TestFlight build with vendored React and Hermes dSYMs included.
- Added and attached `b.dorser@ymail.com` to the active TestFlight build.

## Backend Seed

- Updated `backend/prisma/seed.ts` to avoid destructive full-database wipes in shared environments.
- Seed now removes only legacy demo users and the `@seed.brdg.app` cohort before recreating demo content.
- Seeded live production data:
  - 16 demo profiles
  - 18 events
  - 88 RSVPs
- Production verification after seed:
  - `https://api.brdg.social/events` returned the Honolulu event set
  - first seeded event visible was `Ala Moana Sunrise Run Club`

## Mobile / TestFlight

- Explore content was updated from Los Angeles placeholders to Honolulu-specific events, spots, and community posts.
- iOS build metadata was corrected so the app version comes from Xcode settings instead of a hardcoded plist value.
- Added a post-embed iOS build phase that generates dSYMs for:
  - `React.framework`
  - `ReactNativeDependencies.framework`
  - `hermes.framework`

## Build History

- Build `2`
  - uploaded successfully
  - App Store Connect build id: `1d423bbb-fcb0-4ef3-bac3-0bb19032faf8`
  - issue: upload warned about missing vendored framework dSYMs

- Build `3`
  - corrected archive with vendored framework dSYMs present
  - App Store Connect build id: `bef4458a-e808-4d65-b883-d4cf185e97f4`
  - processing state: `VALID`
  - `usesNonExemptEncryption` set to `false`
  - internal build state: `IN_BETA_TESTING`

## Tester

- Beta tester email: `b.dorser@ymail.com`
- Beta tester id: `3f6ab12c-5284-4145-a17f-4c19355ec6bd`
- Tester is attached to build `3`

## Files to Keep

- `backend/prisma/seed.ts`
- `mobile/src/screens/ExploreScreen.tsx`
- `mobile/src/components/ui/AppIcon.tsx`
- `mobile/ios/mobile/Info.plist`
- `mobile/ios/mobile.xcodeproj/project.pbxproj`
- `mobile/ios/scripts/generate-vendored-framework-dsyms.sh`

## Local-Only State

- `mobile/.env.production` was used locally to drive the release build, but it remains intentionally uncommitted.
