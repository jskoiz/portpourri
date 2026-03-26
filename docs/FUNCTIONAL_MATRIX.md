# BRDG Functional Matrix

This matrix tracks the visible MVP surfaces and whether each user-facing action is live, editorial-only, or intentionally limited in the current stack.

| Surface | User action | Status | Source of truth |
| --- | --- | --- | --- |
| Auth | Sign up, sign in, restore session, delete account | live | `auth` API + mobile auth store |
| Onboarding | Save fitness basics and session intent context | partial | `PUT /profile/fitness` |
| Discovery | Load feed, like, pass, open profile detail | live | `discovery` API |
| Profile detail | Load another user and open chat when already matched | live only for existing matches | `GET /profile/:id` + `GET /matches` |
| Profile | Load profile, edit fitness basics, delete account | live | `GET /profile`, `PUT /profile/fitness`, `DELETE /auth/me` |
| Profile | Edit bio/city/intent from the app | live | `PUT /profile` |
| Profile | Upload, reorder, set primary, and remove photos | live | `POST /profile/photos`, `PATCH /profile/photos/:id`, `DELETE /profile/photos/:id` |
| Explore | Browse live events and open event detail | live | `events` API |
| Explore | Quick actions sheet for category and event navigation | live | explore feature + bottom-sheet shell |
| Explore | Community and spot cards | editorial only | local curated content, no backend join CTA |
| Create | Create event and open event detail | live | `POST /events` |
| Create | Sheet-driven activity/timing substeps | live | create feature + bottom-sheet shell |
| Event detail | Load event, RSVP | live | `GET /events/:id`, `POST /events/:id/rsvp` |
| My Events | Joined and hosted event list | live | `GET /events/me` |
| Matches | Load conversations and open chat | live | `GET /matches` |
| Chat | Load messages, send message, realtime stream and poll fallback | live | `matches` API + realtime service |
| Chat | Quick-action suggested openers | live | chat feature + bottom-sheet shell |
| Notifications | List, mark one read, mark all read | live | `notifications` API |
| Component workshop | Storybook for isolated mobile UI review | dev-only | Storybook for React Native |
| Seeded QA runtime | Deterministic seeded app flows | dev-only | `npm run dev:scenario -- ui-preview` |

## Release expectation

- No visible CTA should point to mock-only behavior without being labeled as editorial.
- Follow [`docs/STORYBOOK_WORKFLOW.md`](./STORYBOOK_WORKFLOW.md) for visual iteration; Storybook validates isolated states, while runtime claims still need authenticated app checks.
- `npm run smoke` is the minimum local regression gate before release or TestFlight promotion.
- Release QA must explicitly cover profile edits, profile photo mutations, and the sheet-driven discovery/explore/create/chat flows before submission.
- The seeded `ui-preview` scenario is the canonical local runtime for deterministic release/readiness checks; rerun it after backend restarts.

## Planning note

- The shipped functionality in this matrix is complete on `main`.
- The next major product planning track should focus on event conversion, re-engagement, and trust/profile quality systems rather than reopening already-shipped interaction work.
