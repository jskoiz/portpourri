# Codebase Review: BRDG App

## 🚨 Critical Issues (Bad Code / Security)

### 1. Hardcoded Secrets
- **File**: `backend/src/auth/jwt.strategy.ts`
- **Issue**: The JWT strategy uses a fallback secret `'secretKey'` if `JWT_SECRET` is not found in the environment.
- **Risk**: If deployed without the env var, the application is vulnerable to token forgery.
- **Recommendation**: Remove the fallback and throw an error if the secret is missing.

### 2. Hardcoded IP Address
- **File**: `mobile/src/api/client.ts`
- **Issue**: `BASE_URL` is hardcoded to `http://192.168.4.137:3000`.
- **Risk**: The app will fail to connect on any other network or device.
- **Recommendation**: Use an environment variable (e.g., `EXPO_PUBLIC_API_URL`) to configure the API URL dynamically.

### 3. Scalability Bottleneck in Discovery
- **File**: `backend/src/discovery/discovery.service.ts`
- **Issue**: The `getFeed` method fetches **all** `sentLikes` and `sentPasses` IDs into memory to create an `excludedIds` array.
- **Risk**: As a user's history grows (e.g., 10k swipes), this query will become extremely slow and eventually crash the server due to memory limits.
- **Recommendation**: Use a direct SQL `NOT EXISTS` or `LEFT JOIN` query (or Prisma's `none` filter if optimized) to filter candidates at the database level without loading exclusion lists into application memory.

## 👻 Hallucinations & Discrepancies

### 1. "Real-time" Messaging
- **Claim**: Roadmap states "Real-time messaging (WebSocket/Socket.io)".
- **Reality**: `ChatScreen.tsx` uses **polling** (`setInterval` every 5 seconds) and `MatchesService` uses standard REST endpoints. There is no WebSocket gateway in `AppModule`.
- **Impact**: Battery drain on mobile, latency in messages, and server load scaling issues.

### 2. Mock Data in "Completed" Features
- **File**: `mobile/src/screens/ExploreScreen.tsx`
- **Issue**: Uses hardcoded `MOCK_ACTIVITIES`.
- **File**: `mobile/src/screens/CreateScreen.tsx`
- **Issue**: The "Post Invite" button triggers an `Alert` but calls no backend API.
- **Impact**: These features are UI shells only.

### 3. Hardcoded Logic (Technical Debt)
- **File**: `backend/src/matches/matches.service.ts` & `discovery.service.ts`
- **Issue**: `isDatingMatch: true` is hardcoded.
- **Impact**: The "Intent Conflict" logic (Dating vs. Workout) described in the roadmap is completely bypassed.

## ♻️ Redundancies & Cleanliness

### 1. Unnecessary Dependencies
- **File**: `mobile/package.json`
- **Issue**: `simple-swizzle` and `invariant` are listed as direct dependencies.
- **Context**: These are typically internal transitive dependencies. Unless they are needed for a specific patch, they clutter the manifest.

### 2. Missing CORS Configuration
- **File**: `backend/src/main.ts`
- **Issue**: `app.enableCors()` is missing.
- **Impact**: While native apps might bypass this, web debugging or future web clients will fail to connect.

## ✅ Recommendations Summary

1.  **Security**: Immediately fix `jwt.strategy.ts` and externalize the API URL in `client.ts`.
2.  **Performance**: Refactor `DiscoveryService.getFeed` to avoid loading all history into memory.
3.  **Feature Parity**: Implement true WebSockets (Gateway) for chat or update the roadmap to reflect "Polling" as the MVP strategy.
4.  **Logic**: Implement the "Intent" check in `MatchesService` to stop hardcoding `isDatingMatch`.
