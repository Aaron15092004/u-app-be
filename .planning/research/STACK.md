# Stack Research — Ủ App

**Researched:** 2026-05-17
**Overall confidence:** MEDIUM-HIGH (verified against official docs and multiple current sources)

---

## Mobile (React Native)

### Expo SDK

**Use Expo SDK 53** (current stable as of research date).

- SDK 53 ships with React Native 0.79
- SDK 54 (React Native 0.81) was released September 2025 — stable, but SDK 53 has broader community examples
- SDK 55 (React Native 0.83, released February 2026) is available but very new; ecosystem lag is real
- Recommendation: Start with SDK 53 or 54. Do not start on SDK 55 unless you need a specific feature — third-party library compatibility lags 1-2 SDK versions behind

**Push notifications note:** Starting with SDK 54, push notifications no longer work inside Expo Go. Use a Development Build from day one.

**Confidence:** HIGH — sourced from official Expo changelog at expo.dev/changelog

---

### Navigation

**Use Expo Router v3/v4 (file-based routing)**

Expo Router is the Expo-native choice and is built on top of React Navigation 7 internally. It provides:
- File-system-based routing (folder = screen hierarchy)
- Bottom tabs via `(tabs)/_layout.tsx`
- Deep linking out of the box
- Web compatibility if you ever add a web dashboard

**For the Ủ app specifically:** The five main sections (Home, Food Log, Workout, Habits, Profile) map cleanly to a bottom tab layout under `app/(tabs)/`. Modal screens (camera, food detail, workout timer) go in `app/(modals)/`.

**Do not use React Navigation standalone** — Expo Router wraps it and eliminates the manual stack configuration boilerplate. React Navigation 7 standalone is for non-Expo projects.

**Confidence:** HIGH — official Expo docs confirm Expo Router as the recommended navigation solution for Expo projects

---

### State Management

**Two-library approach: Zustand (client state) + TanStack Query v5 (server state)**

| Library | Role | Why |
|---------|------|-----|
| Zustand ~5.x | Client-side UI state: active workout timer, current meal session, habit streak counters in memory | Zero boilerplate, synchronous reads, <5KB bundle size |
| TanStack Query v5 | All API data: food logs, nutrition history, user profile, BMI history | Automatic caching, background refetch, stale-while-revalidate, offline support |

Redux is explicitly excluded. The overhead-to-benefit ratio is too high for a mobile health app of this scope. TanStack Query eliminates 90% of Redux's server-state use case. Zustand covers the remaining local state without Redux ceremony.

**Confidence:** HIGH — multiple 2025 sources confirm Zustand + TanStack Query as the de facto modern replacement for Redux in React Native apps

---

### Local Storage / Persistence

**Use react-native-mmkv for persisted client state**

MMKV is ~30x faster than AsyncStorage, fully synchronous (no async/await), and supports encryption. Wire it into Zustand's persist middleware for offline-capable state (e.g., last workout, streak data).

Use `expo-secure-store` for auth tokens (access token, refresh token) — it uses the device's secure enclave (Keychain on iOS, Keystore on Android).

Do NOT use @react-native-async-storage/async-storage for anything performance-sensitive. It is deprecated in Expo Go and slower by an order of magnitude.

**Confidence:** HIGH — GitHub benchmarks and 2025 community consensus confirm MMKV superiority

---

### Charts (BMI History, Calorie Trends, Workout Progress)

**Use victory-native-xl (from FormidableLabs / Nearform)**

- Renders via Skia (GPU-accelerated), not react-native-svg
- Smooth 60fps animations natively
- Full TypeScript support
- Supports line charts (BMI over time), bar charts (weekly calories), area charts (workout streaks)

Requires peer dependencies:
```
react-native-reanimated
react-native-gesture-handler
@shopify/react-native-skia
```

All three are Expo-compatible and installable via `npx expo install`.

**Alternative considered:** react-native-gifted-charts — good feature set but higher CPU/memory usage, no Skia GPU rendering. Use only if Skia integration proves too complex.

**Do NOT use:** react-native-chart-kit — unmaintained, SVG-only, poor performance, last meaningful update was 2021.

**Confidence:** MEDIUM-HIGH — sourced from npm trends comparison and LogRocket 2025 chart library roundup

---

### Camera / Image Picker

**Use expo-image-picker (latest: ~15.x for SDK 53/54)**

- System photo library picker + camera launch in one package
- Required for the food photo → AI nutrition analysis feature
- No separate expo-camera needed unless you build a custom camera UI

Important SDK 54+ behavior change: `allowsEditing` defaults to `false`, meaning iOS requires explicit media library permission to access the original file. Configure permissions in `app.json` explicitly.

```json
{
  "plugins": [
    ["expo-image-picker", {
      "photosPermission": "Allow Ủ to access your photos for food logging.",
      "cameraPermission": "Allow Ủ to take photos for food recognition."
    }]
  ]
}
```

**Confidence:** HIGH — official Expo documentation

---

### Push Notifications

**Use expo-notifications + FCM v1 HTTP API (via Firebase service account)**

- expo-notifications abstracts FCM (Android) and APNs (iOS) behind one API
- Google deprecated the legacy FCM protocol; FCM HTTP v1 is now mandatory
- Expo's push service can relay via FCM v1 if you provide a Firebase service account key
- For reminders (meal logging, workout, habit streaks) — schedule local notifications with `expo-notifications` `scheduleNotificationAsync`; use server-side push for streak congratulations or inactivity nudges

**SDK 54+ breaking change:** Push notifications do NOT work in Expo Go — test via Development Build from the start.

**Confidence:** HIGH — official Expo push notifications documentation and FCM migration guides

---

### Styling

**Use NativeWind v4 (Tailwind CSS for React Native)**

NativeWind processes Tailwind class names at build time into StyleSheet objects — no runtime overhead. Developer velocity advantage is significant: same mental model as web Tailwind.

Expo officially documents NativeWind as a supported Tailwind solution (docs.expo.dev/guides/tailwind). NativeWind v4 is compatible with Expo Router and SDK 53+.

**Alternative:** Plain `StyleSheet.create()` — lowest overhead, no setup, but verbose. Acceptable for a team already fluent in RN StyleSheet. NativeWind is the better choice if any team member has a web/Tailwind background.

**Do NOT use:** styled-components in React Native — adds runtime cost and is largely superseded by NativeWind for utility-first styling.

**Confidence:** MEDIUM — NativeWind v4 is relatively new; some edge cases with Expo Router layouts require workarounds

---

## Backend (Node.js)

### Framework

**Express.js 5.1.x (now the npm default)**

Express 5 became the npm latest in March 2025. Key improvements relevant to this app:
- Native async/await error handling: rejected promises in route handlers are automatically forwarded to error middleware — no more wrapping every handler in try/catch
- Drops Node.js < 18 support (use Node 20 LTS or 22 LTS)
- Security improvements: no more ReDoS-vulnerable regex route patterns

**Use Node.js 20 LTS** (stable, production-ready). Node 22 LTS is available and compatible.

**Confidence:** HIGH — Express 5.1 release announcement at expressjs.com, confirmed npm default status

---

### Language

**TypeScript throughout — both mobile and backend**

Use `ts-node` or `tsx` for local development, compile to JS for production. Use `@types/express` for Express 5 types.

Zod for runtime validation of all API request bodies and query params. Zod v3.24+ has 40M+ weekly downloads and is the de facto standard.

---

### Authentication

**JWT (jsonwebtoken) + Passport.js strategies**

| Package | Version | Role |
|---------|---------|------|
| jsonwebtoken | ^9.x | Sign and verify access/refresh tokens |
| passport | ^0.7.x | Strategy container |
| passport-google-oauth20 | ^2.x | Google OAuth 2.0 |
| passport-apple | ^2.x | Apple Sign In (required for iOS App Store) |

**Token strategy:**
- Access token: 15 minutes, stored in memory (not localStorage, not AsyncStorage)
- Refresh token: 7 days, stored in `expo-secure-store` on device, stored hashed in MongoDB on server
- Refresh tokens are rotated on each use (reuse = invalidate entire family)

**Apple Sign In is mandatory** if you plan to submit to the iOS App Store and offer any other social login. Apple's App Store policy requires it.

**Confidence:** MEDIUM-HIGH — JWT patterns from official docs; Passport.js Apple strategy has some community complaints about documentation gaps

---

### Database ODM

**Mongoose 8.x (on top of MongoDB Atlas)**

Mongoose provides:
- Schema enforcement (critical for food logs with nested nutrition objects, workout schemas)
- Middleware hooks (`pre('save')` for password hashing, calorie total calculation)
- `populate()` for user → logs references
- TypeScript support via `mongoose` types

**Performance note:** For BMI history chart queries (time-series aggregation), drop down to the native MongoDB aggregation pipeline via `Model.aggregate()` — Mongoose passes these through without overhead.

The native MongoDB driver is 2x faster in benchmarks but requires manual schema management. For this app's scale (thousands to tens of thousands of users), Mongoose's DX advantage outweighs the raw performance delta.

**Confidence:** HIGH — MongoDB official documentation, multiple benchmark sources

---

### File Upload (Food Images)

**Multer (memory storage) → Cloudinary SDK**

Flow:
1. Mobile uploads image to your Express API
2. Multer holds the buffer in memory (do not write to disk on serverless/cloud)
3. Express sends buffer to Cloudinary via `cloudinary.uploader.upload_stream()`
4. Cloudinary returns a URL → stored in MongoDB food log entry
5. Optional: send Cloudinary URL to AI food recognition API (some APIs accept URLs directly, avoiding double upload)

**Why Cloudinary over S3:**
- Built-in image optimization and CDN delivery — food thumbnails served at the right size automatically
- Free tier: 25 credits/month (~25GB storage + transformations), adequate for MVP
- No need to configure CloudFront separately
- React Native SDK: `cloudinary-react-native` exists (official Expo-compatible)
- S3 is cheaper at scale (100k+ users) but requires manual CloudFront + image processing setup

**Why Multer over Busboy:**
Multer is built on Busboy internally, but provides Express middleware integration out of the box. Busboy is lower-level and offers streaming advantages for very large files — food images are small (< 5MB), so Multer is the right abstraction level.

**Confidence:** MEDIUM-HIGH — Cloudinary official React Native docs, Multer official Express middleware page

---

### Validation

**Zod v3.24+**

Define schemas once, reuse for TypeScript types and runtime validation:

```typescript
const FoodLogSchema = z.object({
  imageUrl: z.string().url(),
  mealType: z.enum(['breakfast', 'lunch', 'dinner', 'snack']),
  loggedAt: z.coerce.date(),
  nutrition: z.object({
    calories: z.number().min(0),
    protein: z.number().min(0),
    carbs: z.number().min(0),
    fat: z.number().min(0),
  }).optional(),
});
```

**Confidence:** HIGH — Zod is the standard; 40M+ weekly downloads confirmed

---

### API Rate Limiting & Security

| Package | Purpose |
|---------|---------|
| express-rate-limit ^7.x | Prevent AI API abuse (food recognition endpoint is expensive) |
| helmet ^8.x | HTTP security headers |
| cors ^2.x | CORS for mobile + admin dashboard |
| bcryptjs ^2.x | Password hashing (if email/password auth is added later) |

**Confidence:** HIGH — established packages with no meaningful alternatives

---

## AI Food Analysis

### Option Comparison

| API | Accuracy (Top-1) | Accuracy (Top-5) | Pricing | Best For |
|-----|-----------------|-----------------|---------|---------|
| Calorie Mama | ~63% | ~88% | Opaque — contact sales | Highest raw accuracy, specialized |
| LogMeal | Purpose-built for food | 1300+ dishes | Free trial 30 days; tiered subscription (Analyse / Monitor / Recommend) | Best food-specialized API with nutrition built in |
| OpenAI GPT-4o Vision | Not benchmark-tested | ~flexible | $2.50/M input tokens; ~$0.003/image with gpt-4o-mini | Most flexible, handles edge cases and descriptions |
| OpenAI GPT-4o-mini Vision | Same as above | Same | ~$0.003/image | Best cost-for-accuracy ratio for flexible use |
| Clarifai food-item-recognition | ~38% | ~64% | Free tier available | Lowest accuracy; not recommended for production |

### Recommendation

**Primary: LogMeal API**

LogMeal is purpose-built for food recognition and nutritional analysis. It returns:
- Food identification (dish name, ingredients)
- Nutritional breakdown (calories, macros) without a secondary lookup
- 1300+ dish database with the largest food image training dataset

The 30-day unlimited free trial is ideal for development and testing. The Analyse tier subscription fits MVP needs.

**Fallback / Supplement: OpenAI GPT-4o-mini Vision**

When LogMeal fails to recognize a food (edge cases, Vietnamese dishes not in its dataset), fall back to GPT-4o-mini with a structured prompt:

```
Analyze this food image. Return JSON: { "dish": string, "ingredients": string[], "estimated_nutrition": { "calories": number, "protein_g": number, "carbs_g": number, "fat_g": number } }. Be conservative on portion estimates.
```

Cost: ~$0.003/image (gpt-4o-mini). At 10 photos/user/day, 100 users = ~$3/day = ~$90/month. Acceptable for MVP, reconsider at scale.

**Do NOT use Clarifai as primary** — 38% top-1 accuracy is too low for a nutrition tracking feature where incorrect identification causes users to log wrong calories. Users will churn if food recognition is unreliable.

### Vietnamese Food Challenge

LogMeal's 1300-dish database skews toward Western/Mediterranean cuisine. Vietnamese dishes (bún bò Huế, phở, bánh mì) may have lower recognition rates. Mitigation:
1. Allow user to manually confirm/correct the AI's suggestion
2. Use GPT-4o-mini as fallback with a prompt that names "Vietnamese cuisine" explicitly
3. Build a community correction system to improve your own dataset over time

**Confidence:** MEDIUM — LogMeal accuracy from peer-reviewed PMC study (2020, sample sizes varied); pricing from official docs (specific amounts not publicly listed, require signup); GPT-4o-mini pricing from official OpenAI pricing page as of research date

---

## Key Library Choices

| Library | Version | Purpose | Confidence |
|---------|---------|---------|-----------|
| expo | ~53.x (or 54.x) | Core Expo SDK, development build tooling | HIGH |
| expo-router | ~4.x | File-based navigation (tabs, stacks, modals) | HIGH |
| react-native-reanimated | ^3.x | Animations (workout timer, streak celebration) | HIGH |
| react-native-gesture-handler | ^2.x | Gesture interactions (swipe to delete log) | HIGH |
| @shopify/react-native-skia | ^1.x | GPU rendering for charts | MEDIUM-HIGH |
| victory-native-xl | ^40.x | BMI history, calorie, workout charts | MEDIUM-HIGH |
| zustand | ^5.x | Client-side UI state management | HIGH |
| @tanstack/react-query | ^5.x | Server state, API caching, background sync | HIGH |
| react-native-mmkv | ^3.x | Fast local key-value storage, token persistence helper | HIGH |
| expo-secure-store | ~14.x | Secure token storage (Keychain/Keystore) | HIGH |
| expo-image-picker | ~15.x | Camera + photo library access for food photos | HIGH |
| expo-notifications | ~0.29.x | Push notification scheduling and receiving | HIGH |
| nativewind | ^4.x | Tailwind CSS styling for React Native | MEDIUM |
| express | ^5.1.x | HTTP server framework | HIGH |
| typescript | ^5.x | Type safety across codebase | HIGH |
| mongoose | ^8.x | MongoDB ODM with schema validation | HIGH |
| zod | ^3.24.x | Runtime request validation | HIGH |
| jsonwebtoken | ^9.x | JWT sign/verify | HIGH |
| passport | ^0.7.x | Auth strategy middleware | MEDIUM-HIGH |
| passport-google-oauth20 | ^2.x | Google OAuth 2.0 | MEDIUM-HIGH |
| passport-apple | ^2.x | Apple Sign In | MEDIUM |
| multer | ^1.4.x | Multipart form upload middleware | HIGH |
| cloudinary | ^2.x | Image upload + CDN delivery | MEDIUM-HIGH |
| cloudinary-react-native | ^2.x | Direct mobile → Cloudinary upload | MEDIUM |
| express-rate-limit | ^7.x | Rate limiting (protect AI endpoint) | HIGH |
| helmet | ^8.x | HTTP security headers | HIGH |
| bcryptjs | ^2.x | Password hashing (future email auth) | HIGH |

---

## What NOT to Use

| Anti-Recommendation | Reason |
|--------------------|--------|
| **Redux / Redux Toolkit** | Excessive boilerplate for this app scope; TanStack Query + Zustand covers all state needs more cleanly |
| **React Navigation standalone** | Expo Router wraps it and adds file-based routing; no reason to drop down to bare React Navigation in an Expo project |
| **react-native-chart-kit** | Unmaintained since ~2021, SVG-only, poor performance, no active community support |
| **@react-native-async-storage/async-storage** | 30x slower than MMKV, deprecated in Expo Go, no encryption |
| **Clarifai as primary food AI** | 38% top-1 accuracy is insufficient for a core health tracking feature; users will lose trust quickly |
| **styled-components in React Native** | Runtime style computation overhead; NativeWind or StyleSheet are better choices |
| **Express 4.x** | Express 5.1 is now the npm default; async error handling alone justifies the upgrade |
| **expo-camera (standalone)** | expo-image-picker covers 95% of use cases; only use expo-camera if you need a custom live camera UI |
| **SQLite (expo-sqlite) as primary DB** | For a cloud-synced multi-device health app, MongoDB Atlas is the right choice; SQLite is for offline-first apps with optional sync |
| **Firebase Realtime Database / Firestore** | Adds Google vendor lock-in on top of MongoDB; pick one database layer |
| **passport-jwt alone** | Still needs a refresh token strategy; pair with your own refresh token endpoint and rotation logic |
| **React Native Paper** | Heavy UI component library; for a custom-designed health app, NativeWind + custom components gives better design control |

---

## Confidence Levels

| Area | Level | Reasoning |
|------|-------|-----------|
| Expo SDK version (53/54) | HIGH | Official Expo changelog verified |
| Expo Router for navigation | HIGH | Official Expo recommendation, file-based routing is the new standard |
| Zustand + TanStack Query | HIGH | Dominant 2025 pattern, verified across multiple independent sources |
| MMKV over AsyncStorage | HIGH | Benchmark data from library author, official React Native community endorsement |
| victory-native-xl for charts | MEDIUM-HIGH | Performance claims verified via Skia architecture; newer library, some rough edges |
| NativeWind v4 | MEDIUM | v4 is relatively new, some Expo Router integration edge cases reported |
| Express 5 | HIGH | Official release confirmed, npm default since March 2025 |
| Mongoose 8.x | HIGH | Stable, official MongoDB docs recommend for most Node.js apps |
| Cloudinary over S3 | MEDIUM-HIGH | Pricing and DX advantage clear for MVP scale; S3 better at 100k+ users |
| LogMeal as primary AI API | MEDIUM | Accuracy from 2020 PMC study (best available benchmark); pricing requires direct contact; Vietnamese dish coverage unverified |
| GPT-4o-mini Vision as fallback | MEDIUM-HIGH | Pricing from official OpenAI docs; accuracy for food is qualitative (no standardized benchmark) |
| JWT + Passport for auth | MEDIUM-HIGH | Standard pattern; Apple Sign In passport strategy has less community documentation than Google |

---

## Sources

- Expo SDK changelog: https://expo.dev/changelog/sdk-54 and https://expo.dev/changelog
- Expo Router navigation docs: https://docs.expo.dev/develop/app-navigation/
- Expo push notifications setup: https://docs.expo.dev/push-notifications/push-notifications-setup/
- Express 5 release: https://expressjs.com/2025/03/31/v5-1-latest-release.html
- LogMeal API: https://logmeal.com/api/ and https://docs.logmeal.com/docs/guides-essential-concepts-plans-limits
- Calorie Mama API accuracy study (PMC): https://pmc.ncbi.nlm.nih.gov/articles/PMC7752530/
- OpenAI GPT-4o vision food tracker: https://dev.to/frosnerd/build-your-own-food-tracker-with-openai-platform-55n8
- OpenAI pricing: https://openai.com/api/pricing/
- victory-native-xl GitHub: https://github.com/FormidableLabs/victory-native-xl
- React Native chart comparison 2025: https://blog.logrocket.com/top-react-native-chart-libraries/
- MMKV benchmark: https://github.com/mrousavy/StorageBenchmark
- Mongoose vs native driver: https://www.mongodb.com/developer/languages/javascript/mongoose-versus-nodejs-driver
- Zustand + TanStack Query 2025: https://www.bugragulculer.com/blog/good-bye-redux-how-react-query-and-zustand-re-wired-state-management-in-25
- Cloudinary React Native SDK: https://cloudinary.com/documentation/react_native_image_and_video_upload
- NativeWind v5 docs: https://www.nativewind.dev/v5
- Expo Tailwind CSS guide: https://docs.expo.dev/guides/tailwind/
