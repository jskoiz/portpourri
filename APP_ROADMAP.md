# BRDG App - Project Status & Roadmap

> Historical snapshot only.
> This document is preserved for context and may not reflect the current implementation. Use [`docs/DEV_LOOP.md`](/Users/jerry/Desktop/brdg/docs/DEV_LOOP.md), [`docs/ARCHITECTURE.md`](/Users/jerry/Desktop/brdg/docs/ARCHITECTURE.md), [`docs/FUNCTIONAL_MATRIX.md`](/Users/jerry/Desktop/brdg/docs/FUNCTIONAL_MATRIX.md), and the current `backend/src/**` and `mobile/src/**` trees as the live source of truth.
>
> 2026-03-16 note: the items previously listed here as Phase 2 and Phase 3 backlog are now shipped on `main`. Keep this file as context for how the product was originally framed, but use the "Current snapshot" section below for the latest high-level planning direction.

## Current Snapshot (2026-03-16)

### Shipped through Phase 3
* **Connection loop**: matching, matches list, chat thread, realtime/poll fallback messaging.
* **Activity loop**: explore feed, event creation, RSVP, joined/hosted events.
* **Profile management**: full profile editing for city, bio, intents, fitness profile, and account deletion.
* **Photo system**: upload, reorder, primary-photo selection, delete/hide, and consistent fallback rendering across profile/discovery/chat/matches/detail surfaces.
* **Interaction cleanup**: shared bottom-sheet flows for discovery filters, explore quick actions, create chooser steps, and chat quick actions.
* **Release/readiness flow**: seeded `ui-preview` QA path, Storybook workflow, smoke coverage, and in-app build provenance checks.

### Recommended next phase
**Phase 4: Event Conversion & Re-engagement**

Recommended product priorities:
* **Event growth loop**
  * Improve invite/share flows from event detail and chat.
  * Make it easier to turn a match/chat into a specific plan.
  * Add stronger host controls and attendee visibility.
* **Notifications and re-engagement**
  * Improve relevance and grouping.
  * Add clearer deep links back into chat, matches, and event detail.
* **Trust and profile quality**
  * Profile completeness and profile-quality nudges.
  * Stronger moderation/reporting and clearer verification cues.
* **Observability follow-through**
  * Make transient mobile failure UX single-owner so generic API toasts do not overlap with inline retry surfaces.
  * Add request-scoped correlation IDs so discovery, events, push, and realtime logs can be tied together locally during failure triage.
  * Continue retiring ad hoc mobile warning paths outside the normalized API and boundary flows.
* **UX accessibility and interaction hardening**
  * Continue the mobile UX/a11y sweep after the current shared-primitive pass.
  * Prioritize deeper redesign work for auth/onboarding and dense feed/detail surfaces: `LoginScreen`, `SignupScreen`, `OnboardingScreen`, `HomeScreen`, `ExploreScreen`, `CreateScreen`, `MatchesScreen`, `MyEventsScreen`, `EventDetailScreen`, `NotificationsScreen`, and `ProfileDetailScreen`.
  * Keep Storybook previews and focused interaction/accessibility tests moving with each screen pass.

This file remains a historical roadmap, but if it is updated again, Phase 4 should be organized around event conversion and re-engagement rather than the old "connection update" backlog below.

## 📱 Current Status (MVP Phase 1)

We have successfully established the foundation of the BRDG app. The core navigation loop and user identity systems are in place.

### ✅ Completed Features
*   **Authentication**: Login/Signup flow with JWT authentication.
*   **Onboarding**: Basic user data collection (Name, Age, Gender).
*   **Navigation**: Persistent Bottom Tab Bar (Discover, Explore, Create, Matches, Profile).
*   **Discover Feed**:
    *   Swipeable card interface (`SwipeDeck`).
    *   Rich card data: Photos, Age, City, Bio, and Intent Tags (Dating/Workout).
    *   Backend integration for fetching feed.
*   **Profile**:
    *   Detailed user view with Avatar, Stats, and Bio.
    *   Fitness Profile display (Intensity, Frequency, Goals).
*   **Backend**:
    *   Prisma Schema for Users, Profiles, Photos, Matches, and Fitness Activities.
    *   Seeding script to populate DB with diverse test users.
    *   `/auth/me` endpoint for session restoration.

---

## 🚧 Missing Functionality (To Build)

To reach a fully functional MVP that delivers on the "Connect through movement" promise, the following features are critical:

### 1. Connection & Matching Logic
*   **Like/Pass Actions**: Wire up the Swipe Left/Right actions to backend endpoints.
*   **Match Detection**: Backend logic to check for mutual likes.
*   **Match Screen**: A "It's a Match" modal that prompts users to *Start Chat* or *Suggest Activity*.

### 2. Messaging & Social
*   **Matches Tab**: Replace placeholder with a list of active matches.
*   **Chat Interface**: Real-time messaging (WebSocket/Socket.io).
*   **Activity Suggestions**: "Suggest a hike" or "Plan a workout" buttons inside chat.

### 3. Explore (Local Activities)
*   **Activity Feed**: A feed of local gyms, trails, and surf spots (Google Places API or curated DB).
*   **Event Creation**: Allow users to post "Looking for a belay partner at 5pm" (The `Create` tab).

### 4. Profile Editing
*   **Edit Profile Screen**: Forms to update Bio, Photos, and Fitness Preferences.
*   **Photo Upload**: Integration with S3/Cloudinary for real photo uploads.

### 5. Discovery Filters
*   **Filter Modal**: UI to filter feed by:
    *   Intent (Dating vs. Workout)
    *   Distance / Location
    *   Activity Type (Yoga, Lifting, Surfing)

---

## 🗺️ Roadmap

### Phase 2: The "Connection" Update (Next Priority)
*   [x] Implement backend `Like` and `Match` endpoints.
*   [x] Build the **Matches Screen** (List view).
*   [x] Build the **Chat Screen** (Basic text messaging).
*   [x] **Goal**: Users can actually match and talk.

### Phase 3: The "Activity" Update
*   [x] Build the **Explore Feed** (Mock data first, then real API).
*   [x] Implement **Create** functionality (Post a status/invite).
*   [x] Expand profile editing and profile-photo management.
*   [x] Roll out shared layered interaction flows with bottom sheets.
*   [x] **Goal**: Users can plan specific activities, not just chat.

### Phase 4: Polish & Retention
*   [ ] **Notifications & Re-engagement**: improve relevance, grouping, and deep links.
*   [ ] **Event conversion**: improve invite/share flows and chat-to-event planning.
*   [ ] **Trust & profile quality**: completeness, moderation/reporting, verification cues.
*   [ ] **Settings & retention polish**: account management, privacy controls, and targeted UX refinement.
*   [ ] **UX/a11y redesign follow-up**: continue the primary-flow sweep with deeper screen-level passes for auth, onboarding, discovery, events, notifications, and profile detail while keeping Storybook/test coverage in the diff.

---

## 💡 Suggestions & Enhancements

Based on the initial "Connection through movement" concept, here are some tailored suggestions:

### 🧬 "Vibe Check" / Compatibility
*   **Fitness Compatibility Score**: Instead of just showing tags, calculate a simple % match based on intensity and frequency.
    *   *Example*: "90% Match - You both lift 5x/week."
*   **"First Date" Ideas**: Auto-suggest activities based on shared interests.
    *   *If both like Coffee & Hiking*: "How about a coffee walk at Runyon Canyon?"

### 🛡️ Safety & Trust
*   **Verified Gyms**: Allow users to verify they belong to a specific gym (e.g., Equinox, Gold's). This adds trust and context.
*   **Group Mode**: Allow users to match as a "Workout Group" (2-3 friends) to lower the barrier for meeting new people.

### ⚡ Engagement Loops
*   **"Workout of the Week"**: A global challenge (e.g., "Run 5k this weekend") that users can join and discuss.
*   **Streak Badges**: "Surfed 3 days in a row" - displayed on the profile card to show active lifestyle.

### 💎 Monetization (Premium)
*   **"Power Hour"**: Boost visibility during peak workout times (6am / 6pm).
*   **Advanced Filters**: Filter by specific gym membership or skill level (e.g., "Advanced Climbers Only").

---

## 🧭 Detailed Click Map & Interaction Flows

### 1️⃣ Entry Point (Post-Onboarding)
**Screen: Welcome Context Screen**
*   **Goal**: Set the user's "Session Mode" (Dating vs. Workout) for the current session.
*   **Actions**:
    *   "Find Matches" -> Sets `mode=dating` -> Go to Discover.
    *   "Find Workout Partners" -> Sets `mode=workout` -> Go to Discover.
    *   "Explore Local Activities" -> Go to Explore Tab.

### 2️⃣ Discover Tab (Primary)
**Screen: Discover Feed**
*   **Card Interactions**:
    *   **Tap Body**: Open Profile Detail.
    *   **Tap Connect**: Send connection request (triggers "Intent Conflict" check).
    *   **Tap Pass**: Remove from feed.
*   **Header Controls**:
    *   **Filter**: Open Filter Modal (Mode, Distance, Age, Activities).
    *   **Mode Pill**: Switch between Dating/Workout/Both.

### 3️⃣ Connection Logic (The "Smart" Connect)
*   **Case A: Mutual Interest** -> Navigate to **Connected Screen** (Animation + "Start Chat").
*   **Case B: One-way** -> Toast "Connection sent".
*   **Case C: Intent Conflict** -> *Critical Feature*.
    *   *Logic*: If User A is in "Dating" mode but User B is "Workout Only", show Alert: "You’re looking for Dating. This user is Workout‑focused."
    *   *Options*: Continue (send anyway) or Cancel.

### 4️⃣ Chat & Matches
**Screen: Chat Thread**
*   **Inline System Actions**:
    *   "Suggest a hike" -> Opens Explore Picker.
    *   "Plan a workout" -> Opens Scheduler.
*   **Technical Note**: Requires structured message types (`text`, `activity_invite`).

### 5️⃣ Explore Tab (Uniqueness Driver)
**Screen: Local Activities**
*   **Categories**: "Hiking near you", "Surf spots", "Gyms".
*   **Action**: "Invite a connection" -> Pick a match -> Send structured invite.

### 6️⃣ Create (+) Tab
**Screen: Create Menu**
*   **Actions**:
    *   **Create Workout Invite**: Builder flow (Activity + Time + Invitees).
    *   **Post Activity**: Short status update ("Hitting Gold's at 5pm").
