# BRDG App Store Connect metadata

> Historical snapshot from the March 12, 2026 App Store Connect sync.
> Verify live App Store Connect values before shipping. The attached-build details below do not automatically reflect the current TestFlight build.
> Before the next submission, re-check that screenshots and review notes still match the post-Phase-3 profile editing, photo-management, and bottom-sheet behavior.

Last updated: March 12, 2026

## Listing fields

- App name: `BRDG`
- Subtitle: `Meet through movement`
- Promotional text: `Match through shared workouts, local events, and real plans instead of dead-end chats.`
- Primary category: `Social Networking`
- Secondary category: `Health & Fitness`
- Age rating currently assigned by App Store Connect: `9+`
- Copyright: `2026 BRDG`
- Price: `Free`

## Description

BRDG is an activity-first social app for people who would rather start with a run, class, hike, lift, surf session, or coffee plan than another dead-end chat.

Instead of matching on photos alone, BRDG helps people connect through movement, lifestyle fit, and clear intent. Users can discover nearby people, browse events, create plans, message matches, and turn alignment into something real.

BRDG is built for active people who want lower-pressure connection, better follow-through, and a more natural way to meet.

## Keywords

`active dating,workout partner,fitness meetup,run club,yoga,hiking,local events`

## URLs

- Marketing URL: `https://brdg.social/`
- Support URL: `https://brdg-appstore-site-8us5o7ntf-jerrys-projects-56fec7b3.vercel.app/support`
- Privacy Policy URL: `https://brdg-appstore-site-8us5o7ntf-jerrys-projects-56fec7b3.vercel.app/privacy`

## Review notes

- Account creation is available directly in the app; no pre-provisioned reviewer account is required.
- Account deletion is available in-app from the profile/settings area.
- The app does not use non-exempt encryption beyond standard platform networking.
- App Review contact: `BRDG Support`, `hello@brdg.social`, `+18086400255`

## Age-rating answers submitted

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

These values produced an App Store Connect age rating of `9+`.

## Screenshot set

### iPhone 6.9-inch

- `output/app-store/iphone-69-01-discover.png`
- `output/app-store/iphone-69-02-explore.png`
- `output/app-store/iphone-69-03-create.png`
- `output/app-store/iphone-69-04-inbox.png`
- `output/app-store/iphone-69-05-profile.png`

### iPad 13-inch

- `output/app-store/ipad-129-01-discover.png`
- `output/app-store/ipad-129-02-explore.png`
- `output/app-store/ipad-129-03-create.png`

## Attached build

- App Store version `1.0` is now attached to build `4`
- App Store Connect build id: `c292dc5a-3576-4e9b-a096-861b865f2910`
- Build processing state: `VALID`
- Export compliance on build `4`: `usesNonExemptEncryption = false`
- Apple-generated build icon was verified against `mobile/assets/icon.png` and matches exactly

## Remaining blocker

The remaining App Store Connect blockers are in the web UI only:

- `Content Rights` in App Information
- `App Privacy` questionnaire in App Privacy

The App Store Connect API update succeeded for subtitle, description, keywords, URLs, categories, screenshots, attached build, age-rating questionnaire, copyright, price schedule, and App Review contact details.

The remaining step is the final App Store Connect review submission action in Apple's UI. The public API accepted the metadata updates, but the `appStoreVersionSubmissions` endpoint currently rejects `CREATE` for this app version.
