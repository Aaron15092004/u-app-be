---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: "Feature release nhanh: code unlimited scan, sữa Ủ theo BMI, barcode, đánh giá app, ảnh bài tập"
status: ready_to_plan
last_updated: 2026-05-26T12:32:46.821Z
last_activity: 2026-05-26
progress:
  total_phases: 6
  completed_phases: 1
  total_plans: 5
  completed_plans: 5
  percent: 17
stopped_at: Phase 01 complete (5/5) — ready to discuss Phase 2
---

# Project State — Ủ App

## Current Phase

Phase 1 — v2 Data Foundation — **Complete** (Plan 5 of 5 complete)

## Status

Phase 1 execution is complete. Plan 01-05 added automated backend verification for CODE-11 and v2 data foundation contracts; next action is Phase 1 verification or Phase 2 planning.

## Phase Progress

| Phase | Name | Status |
|-------|------|--------|
| 1 | v2 Data Foundation | Complete |
| 2 | Campaign Codes & Unlimited Scan Entitlements | Pending |
| 3 | Barcode Food Scan | Pending |
| 4 | Ủ Milk Recommendation | Pending |
| 5 | Exercise Media Operations | Pending |
| 6 | Feedback & Ratings | Pending |

## Progress Bar

```
Phase 1 [##########] 100%
Phase 2 [----------] 0%
Phase 3 [----------] 0%
Phase 4 [----------] 0%
Phase 5 [----------] 0%
Phase 6 [----------] 0%
```

## Performance Metrics

- Requirements covered: 36/36
- Phases completed: 1/6
- Plans completed: 5/5
- Last plan metric: Phase 01 Plan 05 completed in 4320s, 2 tasks, 7 files

## Accumulated Context

### Key Decisions Logged

- Phase 01 Plan 01: Redeem-code hashing uses HMAC-SHA-256 with `REDEEM_CODE_PEPPER`; raw codes remain transient export/query payload material only.
- Phase 01 Plan 01: v2 scan entitlement foundation uses finite `high_daily_quota` metadata, not an unbounded scan bypass.
- Phase 01 Plan 02: RedeemCode persists only `codeHash` and metadata; raw reusable code fields are absent.
- Phase 01 Plan 02: UserScanEntitlement stores finite `high_daily_quota` policy with unique `redeemCodeId` linkage for future atomic redemption.
- Phase 01 Plan 02: FoodItem barcode fields are optional string arrays and Vietnamese text search keeps `default_language: none` while adding brand.
- Phase 01 Plan 02: Exercise keeps `imageUrl` unchanged and adds optional `imageAssetId` for future media workflows.
- Phase 01 Plan 02: Nut-milk rules are static backend constants with explicit BMI 23.0 boundary handling.
- Phase 01 Plan 03: User campaign and rating mutation routes validate input but return 501 until their workflow phases implement persistence.
- Phase 01 Plan 03: GET /api/recommendations/nut-milk returns static backend nut-milk rules from Plan 01-02.
- Phase 01 Plan 03: Barcode route validates 6-18 digit strings and never coerces barcode values to numbers.
- Phase 01 Plan 03: Admin campaign, rating, and media asset scaffolds are mounted only below the existing router-level admin guard.
- Phase 01 Plan 04: Persisted client/admin redeem-code DTOs expose `codeHash`, `codePrefix`, status, and metadata only; `rawCode` is limited to explicit response-only export rows.
- Phase 01 Plan 04: Scan entitlement DTOs carry `activeUntil`, `campaignId`, `redeemCodeId`, and finite `high_daily_quota` policy metadata.
- Phase 01 Plan 04: Barcode contract DTOs keep barcode values as strings and expose `isSaveReady` plus required macro fields for minimum nutrition readiness.
- Phase 01 Plan 04: Exercise `imageUrl` remains unchanged while optional `imageAssetId` prepares future media asset workflows.
- Phase 01 Plan 05: `test:v2-foundation` is the fast backend gate for Phase 1 data foundation contracts.
- Phase 01 Plan 05: CODE-11 is verified at service and model/index layers: normalized HMAC hashes, no plaintext schema paths, and unique `codeHash` enforcement.
- Phase 01 Plan 05: Barcode tests assert string digit handling with leading zeros and required macro fields before save-ready behavior.
- Phase 01 Plan 05: Admin v2 scaffold tests verify campaign, rating, and media endpoints remain behind `requireAdmin`.
- Stack: Expo SDK 54 + React 19 + Express 5.1 + MongoDB Atlas M2 + LogMeal/GPT-4o-mini + Cloudinary + Firebase FCM
- AI food scan proxied through backend — never called directly from client
- Apple Sign In is required (App Store Guideline 4.8) when any OAuth is present
- Image compression to <500KB before AI scan; rate limit 20 scans/user/day
- Google OAuth uses `@react-native-google-signin/google-signin` (native), not `expo-auth-session`
- MongoDB requires compound index `{ userId: 1, date: -1 }` from Phase 1
- Push notifications use server-side FCM (not local scheduling) for OEM device compatibility
- Exercises API uses lean() queries for performance; seed script idempotent via countDocuments threshold 100
- Render deploy target: singapore region, free tier, healthCheckPath /api/health ✓ Done
- EAS build: 3 profiles (development/preview/production), free tier for dev phase ✓ Done
- Mobile CI excluded from GitHub Actions (requires Expo environment) — run typecheck locally ✓ Done
- All 8 Mongoose models created with required compound indexes ✓ Done
- GET /api/health performs real write/read/delete DB probe (not just readyState) ✓ Done
- Cloudinary, Firebase Admin SDK, FCM, AI stub all wired ✓ Done
- Phase 3 Expo Go fixes: React 18→19, Reanimated 3→4, worklets 0.5, expo-secure-store 14→15, expo-notifications 0.29→0.32 ✓ Done
- victory-native/Skia replaced with plain RN chart in Expo Go (native build sẽ restore) ✓ Done
- MMKV, Google Sign-In, Apple Sign-In mocked for Expo Go testing ✓ Done

### Key Decisions Logged (Phase 4 Plan 02 additions)

- FoodItem text index uses default_language: 'none' — prevents English stemmer from mangling Vietnamese diacritics
- analyzeImage() OpenAI client instantiated at call time (not module scope) for test key override
- NutritionResult.imageUrl changed to string|null; always null in Phase 4 (D-62)
- Response normalization: Number(field) || 0 prevents NaN; totals recalculated from foods if AI omits them

### Key Decisions Logged (Phase 4 Plan 03 additions)

- Namespace import (import * as aiFoodService) used in controller for CJS mock compatibility in node:test
- String() cast on req.params.id and req.query.* to satisfy Express 5 ParamsDictionary (string | string[])
- All food endpoints have authenticate middleware; POST /scan additionally has uploadSingle (multer 5MB)
- IDOR protection: deleteFoodLog passes both _id AND userId to deleteOne — cross-user deletion impossible

### Key Decisions Logged (Phase 4 Plan 06 additions)

- processImage() helper shared between handleCapture and handleGallery — compress+scan flow extracted to avoid duplication
- Expo Router .expo/types/router.d.ts is gitignored; food routes must be added manually or via `expo start` regeneration
- result.tsx guards firstFood access with null coalescing (??) — prevents crashes if AI returns empty foods array

### Key Decisions Logged (Phase 4 Plan 05 additions)

- IScanFoodResponse defined as standalone interface in types.ts (not re-exported from store) — TypeScript module resolution in strict mode fails for dynamic import() in type position across lib/api → stores boundary
- foodScanStore exports NutritionResult + NutritionFoodItem types for use by Plans 06/07 screens
- (food)/ route group is Stack layout (not tabs), consistent with D-68 — 4 stub screens created

### Key Decisions Logged (Phase 4 Plan 04 additions)

- Vietnamese food seed: 150-item static JSON committed to source control; seed:foods idempotent via countDocuments >= 50 check
- Idempotency threshold 50 (not 150) — allows partial re-seed if needed while preventing duplicate full runs
- source field cast as 'manual' | 'openfoods' union in TypeScript — JSON import types strings generically

### Key Decisions Logged (Phase 5 Plan 01 additions)

- WaterLog model: non-unique compound index { userId: 1, loggedAt: -1 } per D-73 (one document per glass)
- expo install resolved expo-linear-gradient@15.0.8 (not 55.x) and datetimepicker@8.4.4 (not 9.x) — SDK 54 compatible versions
- All Wave 1 tests must extend existing scaffolds: home/water/users.integration.test.ts
- User schema breaking change safe per RESEARCH.md A2 (no production users)

### Key Decisions Logged (Phase 5 Plan 04 additions)

- sendBatchNotificationToUsers uses single $in query + Promise.allSettled — batch FCM pattern
- Per-minute cron uses manual UTC+7 offset math (never server local time) per Pitfall 2
- startScheduler() bootstrapped AFTER connectDB() + loadFirebase() in server.ts — Pitfall 1
- register-token endpoint hardened with authenticate middleware; controller uses req.user.id from JWT
- All FCM notification bodies are generic strings (no PII) matching UI-SPEC Copywriting Contract

### Key Decisions Logged (Phase 5 Plan 02 additions)

- waterGoal embedded in GET /api/water/today response (WARNING 4 fix): mobile water screen gets waterGoal in single query — no second roundtrip to /api/home/today-summary
- Config shop-url is public (no authenticate): URL is non-sensitive, fetchable before login
- Promise.all for all multi-query services: water (2 parallel), home (5 parallel)
- Strict Zod schema rejects userId from body with 400 — stronger than ignore (IDOR protection)
- /api/users intentionally NOT mounted yet — Plan 03 Wave 2 owns that mount (checker BLOCKER 1 serialization)
- WorkoutLog matched by exact todayStart bucket (not $gte/$lt range) — matches Phase 3 pattern

### Key Decisions Logged (Phase 5 Plan 03 additions)

- getProfileStats returns notifications block so mobile Plan 07 can initialise notification settings form from server state (WARNING 3 fix)
- Zod .strict() on both PATCH schemas rejects role/email/passwordHash with 400 (mass-assignment defence, Test 7 asserts)
- getStreak delegated to habits.service.ts — no streak logic reimplemented in users.service.ts (D-49/50 reuse)
- Promise.all for 4 parallel queries in getProfileStats: streak + count + aggregate + notifications lookup
- app.ts edit additive single-line mount only — Wave 2 serialization ensures no conflict with Plan 02

### Key Decisions Logged (Phase 5 Plan 05 additions)

- ITodayWater.waterGoal enables single-query water screen — Plan 06 reads waterGoal from getTodayWaterApi, no second roundtrip to getTodaySummaryApi (WARNING 4 fix applied in types)
- IProfileStats.notifications block enables Plan 07 to initialise notification form from server state, not hardcoded defaults (WARNING 3 fix applied in types)
- All 4 new API modules import apiClient from './client' — single JWT-interceptor instance preserved (T-05-05-02)
- (tabs)/profile/_layout.tsx Stack layout prevents profile sub-screens from appearing as tabs (Pitfall 5)
- (home)/_layout.tsx Stack layout enables router.push('/(home)/water') from home tab (Pitfall 6)
- Profile tab is 5th tab after BMI with person/person-outline icons and title 'Hồ sơ' (D-76)
- Plan 05 requirements scope: HOME-01-06 + PRO-01/04/06/07 + NOTIF-01 contract surface; PRO-02/03/05 + NOTIF-02/03 full implementation deferred to Plan 07

### Key Decisions Logged (Phase 5 Plan 06 additions)

- waterGoal sourced exclusively from getTodayWaterApi() response (waterQuery.data.waterGoal) — water.tsx does NOT import getTodaySummaryApi (WARNING 4 fix confirmed in implementation)
- All water mutations (logMutation, deleteMutation) use onSettled to invalidate ['water','today'] and ['home','summary'] — home dashboard stays coherent after water screen changes
- logout NOT on home tab — delegated to Plan 07 Profile tab per D-76 and UI-SPEC (D-69 temp buttons removed)
- ShopBanner returns null when url is null and not loading — prevents rendering broken banner
- 9 new StyleSheet.create UI components — NativeWind v4 migration deferred per plan validation_note
- Delete in water.tsx shows Alert confirmation before deleteMutation.mutate (UX safety guard)
- WaterControls disables minus button (opacity 0.4, disabled prop) when count===0

### Key Decisions Logged (Phase 5 Plan 07 additions)

- notifications.tsx form state seeded from getProfileStatsApi().notifications via useEffect+null-guard (WARNING 3 fix) — hardcoded defaults never overwrite saved user settings
- Loading guard (waterReminder===null) prevents rendering toggle rows before server seed arrives
- edit.tsx invalidates ['water','today'] alongside ['home','summary'] and ['users','profile','stats'] (WARNING 4 chain — waterGoal propagates to water.tsx after Profile edit)
- Logout placed on Profile tab PrimaryButton outlined (Pitfall 9 — Plans 06+07 same wave, logout never absent)
- NotificationRationaleModal interim tsc validation after writing (WARNING 2 mitigation) — only pre-existing router.d.ts errors
- 8 new StyleSheet.create components — consistent with Plan 05/06 convention (NativeWind v4 migration deferred)
- expo-clipboard wrapped in try/require with Alert fallback for Expo Go compatibility
- MMKV getNotifAsked/setNotifAsked added to mmkv.ts mock (existing exports untouched)

### Key Decisions Logged (Phase 4 additions)

- AI food scan: GPT-4o-mini sole provider for Phase 4 (LogMeal deferred — no pricing/key yet) — D-58
- FoodLog schema: mealType removed (flat list by date, no meal categorization) — D-61
- No Cloudinary image storage for food scans (analyze + discard, imageUrl=null) — D-62
- Vietnamese food DB: 200-300 curated items from static JSON (OpenFoodFacts CSV is 9GB — impractical) — D-66
- Food screens: (food)/ stack route group, NOT a 5th tab — D-68
- Rate limit: server-side countDocuments check, 20 AI scans/user/day — D-72
- expo-camera was not installed — Wave 0 adds it + openai npm package in backend — RESEARCH Pitfall 1/2 [RESOLVED in 04-01]
- expo-image-picker/manipulator upgraded SDK 51→54 with --legacy-peer-deps (React 19 conflict pre-existing)

### Key Decisions Logged (Phase 6 Plan 01 additions)

- User.isActive ban flag: authenticate checks `=== false` not `!== true` — existing docs with undefined pass safely (pre-migration compatibility)
- authenticate made async for per-request DB lookup — no isActive in JWT payload per D-97 (revocation latency acceptable within JWT TTL)
- requireAdmin checks role from JWT payload (req.user.role) — no extra DB query needed for role since role is low-churn
- seed-admin is idempotent: exits cleanly if email already exists — safe to run multiple times in CI/staging
- Admin integration tests scaffold in failing state until Plan 02 routes exist — intentional RED-before-GREEN approach

### Key Decisions Logged (Phase 6 Plan 03 additions)

- Tailwind v4 CSS-first: no tailwind.config.js — @tailwindcss/vite plugin handles all config via CSS @import
- shadcn toast deprecated in latest CLI — replaced with sonner; Toaster imported from @/components/ui/sonner
- vite-env.d.ts created manually — Vite scaffold from Plan 01 was missing it (caused TS2339 on import.meta.env)
- @/ alias configured in both vite.config.ts (resolve.alias) and tsconfig.json (paths) — required for bundler + TS server
- React.lazy + Suspense for 3 CRUD stub pages — allows Plan 03 to typecheck before Plan 04 writes implementations
- axios 401 refresh queue: isRefreshing flag + failedQueue array prevents concurrent token refresh storms
- loginAdmin() validates role === 'admin' — rejects non-admin credentials with Vietnamese error message

### Key Decisions Logged (Phase 6 Plan 04 additions)

- zodResolver cast to FormResolver<T> for Zod v4 ZodPipe coerce.number() type mismatch with @hookform/resolvers v5
- NumericField union type for MACRO_FIELDS to prevent null value from imageUrl spreading to Input.value
- sonner toast() replaces useToast — @/hooks/use-toast does not exist in base-nova shadcn setup
- useFieldArray rows keyed by field.id (not index) — required for correct re-render on remove
- Admin rows in UsersPage return null for actions cell — cannot be banned/deleted from UI
- DataTable<T, TValue> generic with getCoreRowModel + getPaginationRowModel + skeleton loading
- ImageUploadField uploads via POST /api/admin/upload with FormData — no manual Content-Type header

### Key Decisions Logged (Phase 6 Plan 02 additions)

- All routes protected at router level via router.use(authenticate, requireAdmin) — not per-route
- banUser is a toggle (isActive = !target.isActive) with self-ban and admin-ban protection (403)
- lean() results cast through unknown to satisfy TypeScript strict mode (Mongoose FlattenMaps incompatibility)
- IDOR protection: all resource IDs from req.params.id only, never from request body
- createFoodItem always sets source: 'manual' regardless of request body

### Open Questions

1. ~~Vietnamese food database source~~ — resolved: curated static JSON ~200 items from OpenFoodFacts filtered subset
2. LogMeal production pricing — GPT-4o-mini chosen for Phase 4; LogMeal deferred post-launch
3. Apple Developer Account ($99/year) — must be active before production build
4. EAS plan tier — free tier limits builds/month
5. Monetization model — freemium vs. fully free affects scope
6. Admin dashboard timeline — needed before or after launch?
7. OPENAI_API_KEY — must be set in backend/.env before Phase 4 scan endpoint works

### Blockers

None currently.

### Todos

- [x] Confirm Vietnamese food data source before Phase 4 — resolved: static JSON
- [ ] Set OPENAI_API_KEY in backend/.env before executing Phase 4
- [ ] Activate Apple Developer Account before production build
- [ ] Confirm LogMeal pricing or choose GPT-4o-mini sole provider (GPT-4o-mini chosen for Phase 4)
- [x] Decide EAS plan tier — Free tier cho dev, upgrade trước App Store
- [ ] Fill in backend/.env with real MongoDB Atlas URI + Cloudinary + Firebase credentials
- [ ] Run `eas init` in mobile/ to assign real EAS projectId in app.json
- [ ] Verify health endpoint with real DB: `curl http://localhost:3000/api/health`
- [ ] Before EAS build: restore real MMKV, Google Sign-In, Apple Sign-In, BMIChart (victory-native)
- [ ] Export Figma assets (logo.png, icon.png, splash.png, adaptive-icon.png) to mobile/assets/images/
- [ ] **Phase 5 device verification** — run EAS dev build + 17-step manual checklist (Plan 07 Task 3 deferred checkpoint): Home Dashboard render, Water Log +/- + WARNING 4 waterGoal, Profile tab navigation, Edit Profile PATCH, Notification settings persistence (WARNING 3), Rationale modal once-only, FCM water/workout reminders at configured time, FCM streak alert 20:00 UTC+7, Help FAQ + clipboard, Logout

## Session Continuity

**Last action**: Phase 01 Plan 05 complete (commits cacf680, cdb684d, 2645c68). Added automated v2 foundation contract tests and fast backend verification script.
**Next action**: Verify Phase 1 or proceed to Phase 2 planning/execution.
**Resume file**: None

## Last Updated

2026-05-26 (Phase 01 Plan 05 complete)

## Current Position

Phase: 2
Plan: Not started
Status: Ready to plan
Last activity: 2026-05-26
