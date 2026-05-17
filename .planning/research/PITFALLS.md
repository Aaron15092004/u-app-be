# Pitfalls Research — Ủ App

**Domain:** React Native + Node.js health/habit mobile app
**Researched:** 2026-05-17
**Overall confidence:** HIGH (multiple sources corroborated; official docs verified)

---

## React Native / Expo Pitfalls

### CRITICAL — JS Thread Blocking on Health Data Calculations

**What goes wrong:** Calorie totals, macro aggregations, streak calculations, and chart data preparation all run on the single JavaScript thread. If done inline during render, they freeze the UI — the user sees the app "stutter" while scrolling through food logs or loading the dashboard.

**Why it happens:** React Native has one JS thread. Heavy synchronous computation (e.g., summing a month of meal entries, computing 7-day moving averages for weight) blocks all rendering and touch handling.

**Consequences:** Janky scroll, unresponsive buttons, user perception that the app is slow or broken.

**Prevention:**
- Move all aggregation to the backend and return pre-computed summaries.
- For client-side computations, use `useMemo` and `useCallback` aggressively; never compute derived data during render.
- For heavy tasks that must stay on device, consider `react-native-worklets-core` or `InteractionManager.runAfterInteractions`.

**Detection:** Profile with Flipper's Performance Monitor. If JS thread usage spikes above 80% during scroll, you have blocking computation.

**Confidence:** HIGH — React Native official docs, multiple performance guides confirm this pattern.

---

### CRITICAL — FlatList Re-render Avalanche in Food Logs and History

**What goes wrong:** The daily food log and workout history screens use large lists. Without proper memoization, every state update (e.g., toggling a habit checkbox) re-renders every list item.

**Why it happens:** Inline `renderItem` arrow functions recreate on every render. List items that receive object props fail shallow equality checks even when data is identical.

**Consequences:** On a $150 Android device (the Vietnamese mass-market phone), this causes 500ms+ UI freezes.

**Prevention:**
- Extract list item components, wrap with `React.memo`.
- Wrap `renderItem` in `useCallback`.
- Provide `getItemLayout` for fixed-height lists (meal cards, habit items) — this is the single highest-impact FlatList optimization.
- Set `maxToRenderPerBatch={5}` and `windowSize={5}` for long food history lists.
- Never use `ScrollView` for lists longer than ~20 items.

**Detection:** Enable the React Native performance monitor. Any list scroll that shows dropped frames is a symptom.

**Confidence:** HIGH — React Native official docs, multiple community guides.

---

### MODERATE — AsyncStorage Is Not Secure and Has Size Limits

**What goes wrong:** Developers store JWT tokens or refresh tokens in `AsyncStorage` because it is the obvious default. On Android, AsyncStorage data is stored in plain text and accessible to anyone with device access or ADB.

**Why it happens:** AsyncStorage is the documented go-to for persistence; the security caveat is easy to miss.

**Consequences:** Token theft from compromised device; user account takeover.

**Prevention:**
- Store refresh tokens in `expo-secure-store` (wraps iOS Keychain and Android Keystore).
- Keep access tokens in memory only (React state or Zustand store).
- Implement Axios interceptor-based refresh token rotation so the access token lifecycle is fully automatic.

**Additional size pitfall:** AsyncStorage has a ~6 MB limit on iOS. Persisting large health datasets (e.g., every food photo path, full workout history) will hit this and silently fail or corrupt data.

**Confidence:** HIGH — React Native security docs, official Expo docs, multiple security guides.

---

### MODERATE — Expo Managed Workflow Native Module Gap

**What goes wrong:** The team starts in managed workflow, then discovers a required library (e.g., `react-native-vision-camera` for live food detection, or a specific health SDK) requires bare workflow native modifications.

**Why it happens:** Managed workflow abstracts native code, but some packages require direct Xcode/Gradle changes that config plugins do not yet support.

**Consequences:** Forced mid-project "eject" (prebuild), breaking CI pipelines, requiring native expertise the team may not have.

**Prevention:**
- Audit all planned libraries against Expo's compatibility list before the project starts.
- For the Ủ app: `expo-camera`, `expo-image-picker`, `expo-notifications`, `expo-apple-authentication` are all fully managed-compatible.
- If `react-native-vision-camera` (live camera overlay) is required later, plan for a development build via EAS from the start — do not rely on Expo Go for camera features beyond basic capture.
- Prefer EAS development builds over Expo Go for any production feature involving camera or notifications.

**Confidence:** HIGH — Expo official docs, multiple migration reports.

---

### MODERATE — React Native New Architecture Library Incompatibility

**What goes wrong:** Expo SDK 52+ enables the New Architecture (Fabric + JSI) by default. Third-party libraries that have not been updated crash silently or behave incorrectly.

**Why it happens:** Bridgeless mode eliminates the legacy bridge; libraries that relied on the old bridge fail without migration.

**Prevention:**
- Check every dependency against the New Architecture compatibility list at `reactwg/react-native-new-architecture`.
- High-risk libraries for Ủ: any Bluetooth/HealthKit SDKs, older camera libraries, CodePush (deprecated — use EAS Update instead).
- Lock to known-compatible library versions in `package.json`.

**Confidence:** MEDIUM — community reports from 2024, Expo official migration guide.

---

### MINOR — Timer Drift in Workout Timer

**What goes wrong:** The workout timer uses `setInterval` with a counter increment. When the app is backgrounded or the device locks, the OS pauses the JS thread, causing the timer to run slower than real time. Reported cases: a 10-second interval stretching to 89 seconds on a locked device.

**Why it happens:** The JS thread is not a real-time thread. The OS can throttle or suspend it.

**Prevention:**
- Never use counter increment with `setInterval`. Instead, record `startTime = Date.now()` when the timer begins, and compute `elapsed = Date.now() - startTime` on each tick.
- For background continuity (rest timers that need to fire even when backgrounded), use `expo-task-manager` + `expo-background-fetch`.
- Add an `AppState` listener: on `active`, recalculate elapsed time from stored start timestamp.

**Confidence:** HIGH — multiple React Native timer issue threads, official React Native timer docs.

---

## Camera & AI Food Analysis Pitfalls

### CRITICAL — Uncompressed Image Upload Causing Memory Crashes and API Cost Runaway

**What goes wrong:** Camera photos on modern phones are 3–8 MB JPEG files. Sending these raw to the AI food analysis API has two consequences: (1) the upload hangs or crashes on slow Vietnamese 4G connections, and (2) API cost is a function of image size for some providers, causing unpredictable billing.

**Why it happens:** `expo-image-picker` returns the full-resolution image URI. Developers often pass this directly to `fetch`/`axios` as a FormData blob.

**Consequences:**
- iOS memory crash (`EXC_RESOURCE`) when `expo-image-manipulator` processes very large images without intermediate downscaling first.
- Android `OutOfMemoryError` on phones with 3–4 GB RAM (common mid-range devices in Vietnam).
- API response times of 8–15 seconds for large images, pushing past the 2-second user abandonment threshold.

**Prevention:**
- Always compress before upload. Target pipeline: capture → resize to max 1024px width → compress to 0.7 quality → convert to WebP.
- Use `expo-image-manipulator` with an iterative strategy: compress → check file size → re-compress if above target (e.g., 500 KB for food photos).
- Never feed a raw camera URI directly to the AI API.
- Adjust compression target based on connection type (`NetInfo`): 300 KB on cellular, 800 KB on WiFi.

**Detection:** Log image file size before and after compression. Alert in development if pre-compression size exceeds 4 MB without compression step.

**Confidence:** HIGH — multiple GitHub issues in `react-native-camera`, `expo-image-manipulator`, confirmed by official Expo issue tracker.

---

### CRITICAL — AI API Latency Causing UI Deadlock

**What goes wrong:** The app calls the food recognition API synchronously before letting the user do anything. If the API takes 5+ seconds (common on Vietnamese mobile networks), the entire food logging flow is blocked.

**Why it happens:** Direct API integration without a loading state design pattern treats the AI response as a required gate.

**Consequences:** User stares at spinner, becomes frustrated, abandons the food logging feature — the app's core value proposition fails.

**Prevention:**
- Set a strict 10-second client-side timeout on the AI API call via Axios `timeout` config.
- Design the UI as optimistic: show a "Analyzing..." state that does not block navigation. Let the user add manual corrections while AI processes.
- Implement a fallback: if AI API times out, immediately drop into manual food search mode with a toast notification ("Analysis took too long — please enter manually").
- On the Node.js backend, implement a proxy layer that queues AI requests, returns a job ID immediately, and the mobile app polls or receives a push notification when complete.

**Confidence:** HIGH — industry standard UX pattern; specific to mobile AI integration per TokenMix API latency research.

---

### CRITICAL — AI API Cost Runaway Without Server-Side Rate Limiting

**What goes wrong:** A single user discovers they can spam the food photo button. Each tap triggers a new API call to the AI provider. At $0.01–0.10 per image analysis call, a user who takes 50 photos in a session generates significant cost that destroys unit economics.

**Why it happens:** Mobile apps that call AI APIs directly (without a backend proxy) have no server-side throttle. Even with a backend proxy, if the proxy has no per-user rate limit, a bad actor can abuse the endpoint.

**Consequences:** Monthly AI costs explode. At scale (10,000 users, 30 food logs/day average), this becomes $3,000–30,000/month uncontrolled.

**Prevention:**
- Never call AI APIs directly from the mobile client. All AI calls must go through your Node.js proxy.
- Implement per-user rate limiting on the backend: maximum 20 AI food analyses per user per day (configurable).
- Use `express-rate-limit` with a per-user key (user ID from JWT, not IP address — IP-based limits collapse on carrier NAT which is common in Vietnam).
- Cache identical image hashes: if the same food photo is submitted twice (user retry), return the cached result without a second API call.
- Add cost monitoring alerting: if daily AI spend exceeds a threshold, trigger an alert before the bill arrives.

**Confidence:** HIGH — Express rate limiting official docs, AI API cost control research.

---

### MODERATE — AI Food Recognition Accuracy Expectations for Vietnamese Food

**What goes wrong:** Western food recognition AI APIs (Clarifai, LogMeal, etc.) are trained predominantly on Western cuisine. Vietnamese dishes (phở, bánh mì, bún bò Huế, cơm tấm) have poor recognition rates or return wrong nutrition data.

**Why it happens:** Training data bias — most public food datasets are USDA or European-centric.

**Consequences:** Users get wildly incorrect calorie counts, distrust the app, stop using the AI feature.

**Prevention:**
- Evaluate your chosen AI API against a Vietnamese food test set before committing.
- Always show the recognized food name and let users confirm or correct it before accepting the nutrition data.
- Build a correction flow that feeds back to improve recognition over time.
- Consider a hybrid: AI identifies the dish → your backend looks up nutrition from a Vietnamese food database (e.g., custom database or FatSecret with Vietnamese entries).
- Never display AI-generated calorie numbers as authoritative without user confirmation.

**Confidence:** MEDIUM — general AI training data bias known; Vietnamese-specific accuracy data limited (LOW confidence on specific accuracy rates).

---

## Authentication Pitfalls

### CRITICAL — Apple Sign In Is Mandatory for App Store Approval

**What goes wrong:** The team implements Google OAuth and ships to the App Store without "Sign in with Apple." Apple rejects the app during review.

**Why it happens:** App Store Review Guideline 4.8 requires that any app offering third-party login must also offer Apple Sign In as an equivalent option. This is non-negotiable.

**Consequences:** App Store submission rejection. Delay of 1–2 weeks to implement Apple Sign In under deadline pressure.

**Prevention:**
- Implement `expo-apple-authentication` from day one alongside Google OAuth.
- Configure the Apple Sign In capability in your Apple Developer account before first TestFlight build.
- Note: Apple Sign In only works on iOS and macOS. Show it only on iOS; the Android build should only show Google OAuth.

**Confidence:** HIGH — Apple App Store Guidelines (official), Expo official docs for `expo-apple-authentication`.

---

### CRITICAL — Apple Credentials Are Only Provided Once

**What goes wrong:** When a user first signs in with Apple, the server receives their name and email. On all subsequent sign-ins, Apple sends only a user identifier — not the email or name. If the backend does not store these on the first sign-in, the user's display name and email are lost permanently.

**Why it happens:** Apple's privacy design intentionally limits data exposure after the initial authorization.

**Consequences:** Users see "Unknown User" throughout the app; emails for notifications/recovery are missing; password reset flows break for Apple sign-in users.

**Prevention:**
- On first Apple Sign In, immediately persist `email`, `fullName.givenName`, and `fullName.familyName` to your MongoDB user document.
- The user can also choose to hide their real email — Apple provides a relay address. Store the relay address as the canonical email; do not assume it is a real mailbox.
- Test the "already signed in" flow in development by revoking Apple credentials in device Settings.

**Confidence:** HIGH — Expo official `expo-apple-authentication` docs explicitly document this limitation.

---

### CRITICAL — Google OAuth redirect_uri_mismatch in Production

**What goes wrong:** Google Sign In works perfectly in Expo Go and development builds, then fails in production with `Error 400: redirect_uri_mismatch`. This is the most frequently reported Google OAuth issue in the Expo ecosystem.

**Why it happens:** Expo Go uses `host.exp.exponent` as the package name. Standalone builds use your actual bundle ID (e.g., `com.yourteam.uapp`). Google Cloud Console OAuth credentials are configured for one scheme but production sends another.

**Consequences:** Google login broken in production; users cannot sign in.

**Prevention:**
- Create separate OAuth 2.0 client IDs in Google Cloud Console for: Web (for Expo Go/dev), iOS (for production iOS), Android (for production Android).
- Use `@react-native-google-signin/google-signin` (native implementation) instead of `expo-auth-session` for Google login — it is more reliable in production and handles the scheme differences automatically.
- Test with a production build on a real device before App Store submission.
- After Expo SDK 53, `expo-auth-session` + Google broke for some configurations — migrate to the native package.

**Confidence:** HIGH — multiple confirmed GitHub issues in expo/expo repository, community-verified fix.

---

### MODERATE — JWT Access Token Expiry Not Handled Gracefully

**What goes wrong:** The backend issues short-lived access tokens (15 min recommended). The app makes an API call after the token expires, receives a 401, and crashes or shows an unhandled error instead of silently refreshing.

**Why it happens:** Token expiry handling requires Axios interceptors with refresh logic — a pattern that is non-trivial and often skipped in early development.

**Consequences:** Users are randomly logged out mid-session, destroying retention.

**Prevention:**
- Implement Axios response interceptor: on 401, call the refresh token endpoint, retry the original request, and only log out the user if the refresh token itself is expired or invalid.
- Handle the race condition: if multiple parallel requests get 401 simultaneously, only one should trigger the refresh; the others should queue and wait.
- Refresh tokens must be stored in `expo-secure-store`, not AsyncStorage.

**Confidence:** HIGH — React Native JWT security guide, Axios interceptor pattern well-documented.

---

### MINOR — OAuth Deep Link Handling on Android

**What goes wrong:** After Google OAuth completes, the browser redirects back to the app via a custom scheme deep link. On some Android versions, the deep link fails to re-open the app, leaving the user stuck in the browser.

**Prevention:**
- Register your custom URI scheme properly in `app.json` under `android.intentFilters`.
- Test the full OAuth flow on physical Android devices (Samsung, Xiaomi — dominant in Vietnam market), not just emulators.
- Prefer native Google Sign In SDK over browser-based OAuth to avoid this entirely.

**Confidence:** MEDIUM — community-reported, multiple GitHub issues.

---

## Push Notification Pitfalls

### CRITICAL — iOS Permission is One-Shot and Cannot Be Re-Requested

**What goes wrong:** The app requests notification permission on first launch without context. The user denies it. iOS will never show the permission dialog again for this app. The user never receives habit reminders or workout nudges.

**Why it happens:** Many developers call `requestPermissionsAsync()` in the app root without a pre-permission prompt screen.

**Consequences:** Permanent loss of notification capability for a significant portion of users, killing the habit tracking feature's effectiveness.

**Prevention:**
- Show a custom "permission rationale" screen before the system dialog: "Ủ will remind you to log meals and stay on track with workouts — allow notifications?"
- Only call `requestPermissionsAsync()` at a moment of high user intent (e.g., when the user first sets a habit reminder).
- If permission is denied, show a persistent in-app prompt guiding users to Settings → Ủ → Notifications.
- Never block app features behind notification permission; degrade gracefully.

**Confidence:** HIGH — Expo official notification docs, iOS Human Interface Guidelines.

---

### CRITICAL — Android 13+ Requires Runtime Permission

**What goes wrong:** The app targets Android 13 (API 33) but does not request `POST_NOTIFICATIONS` at runtime. No notifications are delivered on Android 13+ devices, silently.

**Why it happens:** Pre-Android 13 apps did not need runtime notification permission. The change in API 33 is a breaking change that catches many developers off guard.

**Prevention:**
- Call `Notifications.requestPermissionsAsync()` on Android 13+ devices explicitly.
- Create at least one notification channel before requesting permission — Android 13 will not prompt until a channel exists.
- Test on Android 13/14 physical device (Xiaomi, Samsung are relevant Vietnam market targets).

**Confidence:** HIGH — Android 13 official docs, Expo notification docs.

---

### MODERATE — Foreground Notifications Are Silently Swallowed

**What goes wrong:** The developer tests notifications while the app is open. No notification appears. The bug is assumed to be a system-level issue, but it is actually the expected default behavior: Expo notifications received in the foreground are consumed silently without any UI.

**Why it happens:** This is an intentional default in `expo-notifications`. The developer is unaware of `setNotificationHandler`.

**Consequences:** Habit reminder fires while the user is in the app — they never see it. Meal logging reminder at lunchtime is invisible.

**Prevention:**
- Configure `Notifications.setNotificationHandler` at app startup to control foreground notification display.
- For habit reminders, show a foreground notification with `shouldShowAlert: true, shouldPlaySound: true`.

**Confidence:** HIGH — Expo official notification docs.

---

### MODERATE — Background Task Scheduling Unreliable on Android

**What goes wrong:** Scheduled local notifications (daily meal reminders, workout prompts) fire correctly in development but miss their schedule in production on Android when the app is in the background or killed.

**Why it happens:** Android OEMs (especially Xiaomi, Oppo, Vivo — dominant in Vietnam) aggressively kill background processes to preserve battery. This breaks `expo-task-manager` background tasks.

**Consequences:** Unreliable habit reminders — the core engagement mechanic of the app fails for a significant portion of users.

**Prevention:**
- Use Expo Push Notifications (server-side triggered via FCM) instead of local scheduling for time-sensitive reminders — server push is immune to OEM battery optimization.
- For local-only scheduling, use `expo-notifications` scheduled notifications rather than background tasks — these are more reliable on Android.
- Inform users during onboarding on Xiaomi/MIUI and similar devices to whitelist the app in battery settings. Detect the manufacturer and show device-specific instructions.

**Confidence:** HIGH — community reports across multiple Expo issues, well-documented MIUI battery restriction problem.

---

### MINOR — Expo Push Token Is Not a Stable Identifier

**What goes wrong:** The backend stores the Expo push token as the user's notification address. The token changes when the user reinstalls the app, clears app data, or restores from backup. Old tokens silently fail delivery.

**Prevention:**
- On every app start, call `getExpoPushTokenAsync()` and compare with the stored token. If changed, update the backend.
- Treat push tokens as mutable and volatile — they are not user identifiers.
- Store one token per device per user (a user may have multiple devices).

**Confidence:** HIGH — Expo push notification official docs.

---

## MongoDB Health Data Modeling Pitfalls

### CRITICAL — Storing Every Health Event as an Individual Document

**What goes wrong:** Each meal log entry, each habit check-in, each workout set is stored as a separate MongoDB document. After 90 days, a single user has 5,000–15,000 documents. Querying "show me this week's calorie trend" requires scanning hundreds of documents per user with aggregation pipelines.

**Why it happens:** Newcomers to MongoDB treat it like a SQL table with one row per event. This is the natural but wrong pattern for high-frequency health data.

**Consequences:** Slow dashboard loads (200ms+ aggregation queries per user), high Atlas read operation costs, inability to scale past a few thousand users on M0/M2 tier.

**Prevention:**
- Use the **bucket pattern**: one document per user per day, containing an array of that day's events.
  ```json
  {
    "userId": "...",
    "date": "2026-05-17",
    "meals": [...],
    "habitCheckins": [...],
    "workouts": [...],
    "dailySummary": { "totalCalories": 1850, "protein": 120 }
  }
  ```
- Pre-compute `dailySummary` on each write (update, not recalculate at read time).
- For longer-term trends (weekly/monthly), maintain a separate `userWeeklyStats` collection updated via aggregation on each day-bucket write.
- Use MongoDB 5.0+ native time-series collections for biometric data (weight, heart rate) — they compress and query this pattern natively.

**Confidence:** HIGH — MongoDB official time-series best practices, MongoDB community forum health data thread.

---

### CRITICAL — Atlas M0 Free Tier Connection Limit in Production

**What goes wrong:** The Node.js backend is deployed as a serverless function (Vercel, Railway, or similar) without connection pooling configuration. Each serverless invocation opens a new MongoDB connection. Under load, the 500-connection M0 free tier limit is hit, causing `MongoServerError: too many connections`.

**Why it happens:** Serverless functions do not reuse connections between invocations by default. Each cold start creates a new `MongoClient`.

**Consequences:** App becomes unavailable at moderate traffic (~100 concurrent users). The error manifests as 500 responses across all API endpoints simultaneously.

**Prevention:**
- Declare `MongoClient` outside the serverless handler function so it is cached between warm invocations.
- Set `maxPoolSize: 10` to limit connections per instance.
- For the university project scope (hundreds of users), upgrade from M0 to M2 ($9/mo) before any real user load — M0 is genuinely unsuitable for production.
- Monitor active connections in Atlas Dashboard; alert at 80% of limit.

**Confidence:** HIGH — MongoDB Atlas official free tier limits documentation.

---

### MODERATE — Missing Compound Indexes for Health Query Patterns

**What goes wrong:** The most common queries are `{ userId, date }` (daily dashboard) and `{ userId, date: { $gte, $lte } }` (weekly/monthly charts). Without compound indexes on `(userId, date)`, MongoDB performs full collection scans as data grows.

**Why it happens:** Developers create single-field indexes on `userId` and assume that is sufficient. Range queries on `date` within a user's data require a compound index.

**Prevention:**
- Create compound index: `db.meals.createIndex({ userId: 1, date: -1 })` on all health data collections.
- Use `explain()` during development to verify index usage before shipping.
- For habit tracking queries that filter by `userId` + `habitId` + `date`, add a three-field compound index.

**Confidence:** HIGH — MongoDB index documentation, standard query optimization practice.

---

### MODERATE — Schema Inconsistency Breaking Atlas Search and Compression

**What goes wrong:** Early in development, food log documents have different field sets (some have `imageUrl`, others do not; some have `aiAnalysis`, others do not). MongoDB accepts this but it breaks compression efficiency in time-series collections and complicates aggregation queries that assume consistent shape.

**Prevention:**
- Define Mongoose schemas with explicit `default` values so all documents are structurally consistent even when fields are empty.
- Use `null` consistently for absent optional values rather than omitting the field entirely.
- Run a schema validation script before enabling Atlas Search indexing.

**Confidence:** HIGH — MongoDB time-series best practices documentation explicitly notes this pitfall.

---

### MINOR — Storing User Weight/Height in Multiple Places

**What goes wrong:** Calorie calculations require height, weight, age, and activity level. These are stored both in the `user` collection and duplicated inside each workout or meal document at creation time. When the user updates their weight, only the `user` document is updated — old calculations become stale.

**Prevention:**
- Store biometric profile in one place: `user.profile.currentWeight`, `user.profile.height`, etc.
- Log historical weight entries separately in a `weightHistory` time-series collection.
- Never denormalize biometric data into food/workout documents. Calorie calculations should always reference the user's weight at the time of the activity — store `weightAtTime` only for historical accuracy, not the entire profile.

**Confidence:** MEDIUM — standard data modeling principle; specific to health apps.

---

## Phase Mapping

| Phase | Pitfalls to Address Proactively | Consequence of Deferring |
|---|---|---|
| **Phase 1 — Project Setup** | Expo managed workflow library audit; AsyncStorage vs SecureStore decision; MongoDB compound index strategy; Atlas tier selection (M0 is not production) | Forced architectural changes mid-project if wrong choices are locked in |
| **Phase 2 — Authentication** | Apple Sign In mandatory from day one; Google OAuth native package selection; JWT Axios interceptor refresh pattern; Apple credentials one-time delivery | App Store rejection; Google login broken in production |
| **Phase 3 — Food Logging & AI** | Image compression pipeline before any AI API call; per-user server-side rate limiting on AI endpoint; AI response timeout + fallback UX; Vietnamese cuisine accuracy validation | Cost runaway; 5+ second blank screens; App Store rejection for billing abuse |
| **Phase 4 — Habit & Workout Tracking** | Timer using `Date.now()` delta not counter increment; AppState listener for background/foreground transitions; background notification reliability on MIUI/Android OEM | Timer shows wrong elapsed time; reminders stop firing for Xiaomi users |
| **Phase 5 — Push Notifications** | iOS one-shot permission rationale screen; Android 13 runtime permission + channel setup; foreground `setNotificationHandler`; server-side FCM for time-sensitive reminders | Permanent notification block for early users who deny; missed reminders |
| **Phase 6 — Data & Dashboard** | Bucket pattern for health data documents; pre-computed daily summaries; connection pooling for serverless; compound indexes verified with `explain()` | Slow dashboard at scale; Atlas connection exhaustion under load |
| **Phase 7 — Production** | EAS OTA runtime version pinning; Expo push token refresh on every app start; Android OEM battery whitelist guidance; App Store localization for Vietnamese | OTA updates go nowhere; notifications broken after reinstall; App Store rejection |

---

## Sources

- [Optimizing FlatList Configuration — React Native official docs](https://reactnative.dev/docs/optimizing-flatlist-configuration)
- [React Native Security — official docs](https://reactnative.dev/docs/security)
- [React Native Timers — official docs](https://reactnative.dev/docs/timers)
- [Expo Notifications — official docs](https://docs.expo.dev/versions/latest/sdk/notifications/)
- [expo-apple-authentication — official Expo docs](https://docs.expo.dev/versions/latest/sdk/apple-authentication/)
- [Expo New Architecture guide](https://docs.expo.dev/guides/new-architecture/)
- [MongoDB Atlas Free Cluster Limits — official docs](https://www.mongodb.com/docs/atlas/reference/free-shared-limitations/)
- [MongoDB Time Series Best Practices — official docs](https://www.mongodb.com/docs/manual/core/timeseries/timeseries-best-practices/)
- [expo-image-manipulator — official Expo docs](https://docs.expo.dev/versions/latest/sdk/imagemanipulator/)
- [Push notifications troubleshooting — Expo official docs](https://docs.expo.dev/push-notifications/faq/)
- [Making Expo Notifications Actually Work (Android 12+ and iOS)](https://medium.com/@gligor99/making-expo-notifications-actually-work-even-on-android-12-and-ios-206ff632a845)
- [Avoiding Common JWT Pitfalls in React Native](https://dev.to/iamdevbox/avoiding-common-jwt-pitfalls-in-react-native-development-538a)
- [Google OAuth redirect_uri_mismatch fix](https://shamigondal.hashnode.dev/google-signin-with-expo-react-native-solved-mismatchuri-solved-deeplinking-solved-redirect-issue-react-native)
- [Expo EAS OTA Update realities in production](https://medium.com/@biodunbio14/the-realities-of-ota-updates-with-expo-what-i-wish-i-knew-before-i-pushed-to-production-508561d7a043)
- [Best AI API for Mobile Apps: Latency, SDK Support, and Cost](https://tokenmix.ai/blog/best-ai-api-for-mobile-apps)
- [Efficiently Managing Timers in React Native](https://dev.to/shivampawar/efficiently-managing-timers-in-a-react-native-app-overcoming-background-foreground-timer-state-issues-map)
- [expo/expo GitHub issue — Google Authentication URI Mismatch on Android](https://github.com/expo/expo/issues/32468)
- [expo/expo GitHub issue — expo-image-manipulator memory crash on iOS](https://github.com/expo/expo/issues/40158)
- [New Architecture migration reports — reactwg](https://github.com/reactwg/react-native-new-architecture/discussions/177)
- [Securing APIs: Express rate limit — MDN Blog](https://developer.mozilla.org/en-blog/securing-apis-express-rate-limit-and-slow-down/)
- [How to localize your app for Vietnam — AppTweak](https://www.apptweak.com/en/aso-blog/how-to-localize-your-app-in-vietnamese)
