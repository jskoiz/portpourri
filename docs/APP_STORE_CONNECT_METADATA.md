# BRDG App Store Connect metadata

Use [`APP_STORE_RELEASE.md`](./APP_STORE_RELEASE.md) as the canonical release and provenance workflow. This file is a dated App Store Connect snapshot plus an operator checklist for the metadata that still has to be verified live before any submission.

## Live checklist before submission

Run these checks every time before trusting the metadata or attached-build state:

1. Run `npm run release:ios:check` and use the generated `mobile/build/ios-release-manifest.json` as the current source of build provenance.
2. Verify the latest live App Store Connect build number and the currently attached build/version for `com.avmillabs.brdg`.
3. Re-check that screenshots still match the shipped UX after profile editing, photo management, and bottom-sheet changes.
4. Re-check that review notes still match the current account creation, account deletion, and reviewer contact flow.
5. Confirm the App Store Connect UI still shows `Content Rights` and `App Privacy` in the expected completed state.
6. Regenerate screenshots from the repo-owned path when needed:

```bash
npm run screenshots
# or
npm run screenshots:quick
```

This file is not authoritative for build provenance. Use the current release manifest plus the in-app build provenance panel described in [`APP_STORE_RELEASE.md`](./APP_STORE_RELEASE.md).

## Operator handoff payload

Carry these values forward with each submission:

- branch
- full git SHA
- app version
- iOS build number
- API URL
- build date
- attached App Store Connect build id
- screenshot set used

## Historical snapshot

Snapshot date: `2026-03-12`
Source of record: `manual App Store Connect sync`
Applies to app version: `1.0`
Applies to build number: `4`
Last verified by: `repo snapshot only`
Superseded by: `verify live App Store Connect state before the next release`

### Listing fields last submitted

- App name: `BRDG`
- Subtitle: `Meet through movement`
- Promotional text: `Match through shared workouts, local events, and real plans instead of dead-end chats.`
- Primary category: `Social Networking`
- Secondary category: `Health & Fitness`
- Age rating last observed in App Store Connect: `9+`
- Copyright: `2026 BRDG`
- Price: `Free`

### Description last submitted

BRDG is an activity-first social app for people who would rather start with a run, class, hike, lift, surf session, or coffee plan than another dead-end chat.

Instead of matching on photos alone, BRDG helps people connect through movement, lifestyle fit, and clear intent. Users can discover nearby people, browse events, create plans, message matches, and turn alignment into something real.

BRDG is built for active people who want lower-pressure connection, better follow-through, and a more natural way to meet.

### Keywords last submitted

`active dating,workout partner,fitness meetup,run club,yoga,hiking,local events`

### URLs last submitted

- Marketing URL: `https://brdg.social/`
- Support URL: `https://brdg-appstore-site-8us5o7ntf-jerrys-projects-56fec7b3.vercel.app/support`
- Privacy Policy URL: `https://brdg-appstore-site-8us5o7ntf-jerrys-projects-56fec7b3.vercel.app/privacy`

### Review notes last submitted

- Account creation is available directly in the app; no pre-provisioned reviewer account is required.
- Account deletion is available in-app from the profile/settings area.
- The app does not use non-exempt encryption beyond standard platform networking.
- App Review contact: `BRDG Support`, `hello@brdg.social`, `+18086400255`

### Age-rating answers last observed

- Advertising: `No`
- Alcohol, tobacco, or drug references: `None`
- Contests: `None`
- Gambling: `No`
- Simulated gambling: `None`
- Weapons: `None`
- Health or wellness topics: `Yes`
- Loot boxes: `No`
- Medical or treatment information: `None`
- Messaging and chat: `Yes`
- Parental controls: `No`
- Profanity or crude humor: `None`
- Age assurance: `No`
- Sexual content graphic and nudity: `None`
- Sexual content or nudity: `None`
- Horror or fear themes: `None`
- Mature or suggestive themes: `Infrequent or mild`
- Unrestricted web access: `No`
- User-generated content: `Yes`
- Cartoon or fantasy violence: `None`
- Realistic prolonged graphic or sadistic violence: `None`
- Realistic violence: `None`

These values produced an App Store Connect age rating of `9+` at snapshot time.

### Screenshot source assets at snapshot time

- iPhone 6.9-inch:
  - `output/app-store/iphone-69-01-discover.png`
  - `output/app-store/iphone-69-02-explore.png`
  - `output/app-store/iphone-69-03-create.png`
  - `output/app-store/iphone-69-04-inbox.png`
  - `output/app-store/iphone-69-05-profile.png`
- iPad 13-inch:
  - `output/app-store/ipad-129-01-discover.png`
  - `output/app-store/ipad-129-02-explore.png`
  - `output/app-store/ipad-129-03-create.png`

### Attached build at snapshot time

- App Store version `1.0` was attached to build `4`
- App Store Connect build id: `c292dc5a-3576-4e9b-a096-861b865f2910`
- Build processing state: `VALID`
- Export compliance on build `4`: `usesNonExemptEncryption = false`
- Apple-generated build icon matched `mobile/assets/icon.png`

### Snapshot outcome

At snapshot time, the remaining App Store Connect blockers were:

- `Content Rights` in App Information
- `App Privacy` questionnaire in App Privacy

The App Store Connect API update had succeeded for subtitle, description, keywords, URLs, categories, screenshots, attached build, age-rating questionnaire, copyright, price schedule, and App Review contact details.

The remaining step at snapshot time was the final App Store Connect review submission action in Apple's UI. The public API accepted the metadata updates, but the `appStoreVersionSubmissions` endpoint rejected `CREATE` for that app version.
