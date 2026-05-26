---
phase: 05-home-dashboard
plan: "02"
subsystem: backend-water-home-config
tags: [wave-1, backend-api, water-crud, home-aggregation, config-endpoint, tdd]
dependency_graph:
  requires:
    - 05-01 (WaterLog model, User schema with waterGoal, test scaffolds)
  provides:
    - backend/src/api/water/water.service.ts (logWater, getTodayWater with waterGoal, deleteWaterLog)
    - backend/src/api/water/water.controller.ts
    - backend/src/api/water/water.routes.ts
    - backend/src/api/water/water.validation.ts
    - backend/src/api/home/home.service.ts (getTodaySummary: 5-collection aggregation)
    - backend/src/api/home/home.controller.ts
    - backend/src/api/home/home.routes.ts
    - backend/src/api/config/config.controller.ts (getShopUrl from env)
    - backend/src/api/config/config.routes.ts
    - app.ts: /api/water, /api/home, /api/config mounted
  affects:
    - Plan 03 (Wave 2): will append /api/users mount after /api/config in app.ts
    - Plans 05/06: mobile water screen uses waterGoal from /api/water/today (no second query needed)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle (2 RED commits, 2 GREEN commits)
    - IDOR-safe delete via WaterLog.deleteOne({ _id, userId }) — mirrors food.service.ts pattern
    - vietnamDayStart { $gte, $lt } date range for all today queries (Pitfall 3)
    - Promise.all for parallel multi-collection queries in both water and home services
    - .strict() Zod schema to reject extra body fields (userId injection prevention)
key_files:
  created:
    - backend/src/api/water/water.validation.ts
    - backend/src/api/water/water.service.ts
    - backend/src/api/water/water.controller.ts
    - backend/src/api/water/water.routes.ts
    - backend/src/api/home/home.service.ts
    - backend/src/api/home/home.controller.ts
    - backend/src/api/home/home.routes.ts
    - backend/src/api/config/config.controller.ts
    - backend/src/api/config/config.routes.ts
  modified:
    - backend/src/api/water/water.integration.test.ts (9 real tests replacing placeholder)
    - backend/src/api/home/home.integration.test.ts (7 real tests replacing placeholder)
    - backend/src/app.ts (3 router mounts: water, home, config)
    - backend/.env.example (SHOP_URL added)
decisions:
  - "waterGoal embedded in GET /api/water/today response (WARNING 4 fix): mobile water screen gets waterGoal in a single query, no second roundtrip to /api/home/today-summary"
  - "Config shop-url is public (no authenticate): URL is non-sensitive and must be fetchable before user logs in for shop banner display"
  - "Promise.all used for all multi-query services: water (2 parallel), home (5 parallel) — avoids sequential waterfall latency"
  - "Strict Zod schema rejects userId from body with 400 rather than silently ignoring it — stronger IDOR protection than ignore"
  - "/api/users intentionally NOT mounted in this plan — Plan 03 (Wave 2) owns that mount to avoid concurrent app.ts edits (checker BLOCKER 1)"
  - "WorkoutLog matched by exact date: todayStart bucket (not range) — matches existing Phase 3 pattern where date is stored as UTC+7 day start"
metrics:
  duration: "~20 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 4
---

# Phase 5 Plan 02: Water API + Home Dashboard + Config API Summary

Wave 1 backend implementation: Water log CRUD (POST/GET/DELETE) with IDOR protection and embedded waterGoal, Home today-summary aggregation across 5 collections, and Config shop-url endpoint. Three routers mounted in app.ts. 16 integration tests pass; TypeScript compiles clean.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 (RED) | Water API tests (failing) | a0e6f56 | Done |
| 1 (GREEN) | Water API implementation | f3b1300 | Done |
| 2 (RED) | Home/Config tests (failing) | 1f3378d | Done |
| 2 (GREEN) | Home + Config implementation | 6d109ee | Done |

## Response Shapes

### ITodaySummary (GET /api/home/today-summary)
```typescript
interface ITodaySummary {
  kcalConsumed: number;              // sum FoodLog.totals.calories today
  macros: {
    protein: number;                 // sum FoodLog.totals.protein today
    carbs: number;                   // sum FoodLog.totals.carbs today
    fat: number;                     // sum FoodLog.totals.fat today
  };
  waterGlasses: number;              // count WaterLog today
  waterGoal: number;                 // User.profile.waterGoal (default 8)
  workoutMinutes: number;            // sum WorkoutLog.durationMinutes today
  bmi: { value: number; category: string } | null;  // latest BMIRecord or null
}
```

### ITodayWater (GET /api/water/today) — WARNING 4 fix: waterGoal embedded
```typescript
interface ITodayWater {
  logs: IWaterLog[];     // today's logs sorted by loggedAt desc
  count: number;         // logs.length (convenience field)
  waterGoal: number;     // User.profile.waterGoal (default 8) — WARNING 4 fix
}
// waterGoal from User.findById (single lookup) — mobile does NOT need /api/home/today-summary
```

### IWaterLog (POST /api/water response body)
```typescript
interface IWaterLog {
  _id: string;
  userId: string;        // always from JWT — never from body
  loggedAt: string;      // ISO8601 — explicitly set or auto Date.now()
  createdAt: string;
  updatedAt: string;
}
```

## Endpoints Created

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/water | POST | Bearer JWT | Log a glass of water; userId from JWT; loggedAt optional |
| /api/water/today | GET | Bearer JWT | Today's logs + count + waterGoal for the authenticated user |
| /api/water/:id | DELETE | Bearer JWT | IDOR-safe delete (WaterLog.deleteOne({ _id, userId })) |
| /api/home/today-summary | GET | Bearer JWT | Full dashboard aggregation (kcal/macros/water/workout/bmi) |
| /api/config/shop-url | GET | Public | Shop URL from SHOP_URL env var (default: https://u-app.vn/shop) |

## app.ts Current State

```typescript
// After this plan:
app.use('/api/water', waterRouter);    // Wave 1 (this plan)
app.use('/api/home', homeRouter);      // Wave 1 (this plan)
app.use('/api/config', configRouter);  // Wave 1 (this plan)
// /api/users is intentionally NOT here — Plan 03 owns that mount in Wave 2
app.use(errorMiddleware);
```

**Note for Plan 03 executor:** When adding `app.use('/api/users', usersRouter);` in Wave 2, place it AFTER `app.use('/api/config', configRouter);` and BEFORE `app.use(errorMiddleware);`.

## Tests Added

### water.integration.test.ts (9 tests)
1. POST /api/water without auth → 401
2. POST /api/water creates WaterLog with userId from JWT
3. POST with explicit loggedAt succeeds; POST with userId in body → 400 (strict schema)
4. GET /api/water/today after 3 POSTs → count=3, logs desc, waterGoal=8
5. GET /api/water/today userB isolation → count=0 (per-user scoping)
6. DELETE own log → 200, log gone
7. DELETE IDOR: userB cannot delete userA log → 404, log still present
8. Today range: yesterday log excluded (UTC+7 boundary)
9. waterGoal embedding: custom goal=12 returned (WARNING 4 fix)

### home.integration.test.ts (7 tests)
1. GET /api/home/today-summary without auth → 401
2. Empty data → all zeros, bmi=null, waterGoal=8
3. Seeded data → kcal/macros/water/workout/bmi all aggregated correctly; waterGoal=10
4. userB isolation → all zeros after userA seed
5. UTC+7 boundary → yesterday WaterLog excluded (waterGlasses=0)
6. BMI latest: 2 records, most recent returned
7. GET /api/config/shop-url → env var value returned correctly

## Key Decisions

1. **WARNING 4 fix (waterGoal embedding):** `getTodayWater` fetches `User.findById` to embed `waterGoal` in the response. Mobile water screen needs only 1 TanStack query instead of 2. The home summary still independently exposes `waterGoal` — both routes are self-sufficient.

2. **Config endpoint is public:** Shop URL is non-sensitive and must be available before authentication (for potential unauthenticated home preview). Matches RESEARCH.md "Open Question 1" resolution.

3. **Promise.all for parallel queries:** Both `getTodayWater` (2 queries) and `getTodaySummary` (5 queries) use `Promise.all` to avoid sequential latency on the dashboard read path.

4. **Strict Zod schema rejects userId from body with 400** (not silently ignores): provides stronger IDOR protection. Test 3 (water) validates this behavior.

5. **WorkoutLog exact date match:** `{ date: todayStart }` (not `$gte/$lt` range) — WorkoutLog stores `date` as the UTC+7 day bucket from Phase 3. Consistent with existing Phase 3 pattern.

## Note for Plan 05/06 Executors

`ITodayWater` now includes `waterGoal: number`. Mobile water screen (`water.tsx`) must read `waterGoal` from the `/api/water/today` response directly. No separate `/api/home/today-summary` call is needed for `waterGoal` in the water screen.

## Deviations from Plan

### Auto-fixed: Test 3 behavior for userId-in-body

- **Found during:** Task 1 GREEN phase
- **Issue:** Plan said "POST with `userId` in body → ignored (must come from JWT only)". With `.strict()` Zod schema, sending `userId` in body returns 400 (not 201 with field ignored). The original test sent both `loggedAt` and `userId` together.
- **Fix:** Split Test 3 into two sub-assertions: (a) `loggedAt` accepted → 201, (b) `userId` in body → 400. The `.strict()` behavior is actually stronger security than "ignore" — it explicitly rejects unexpected fields.
- **Rule:** Rule 1 (auto-fix behavior mismatch) — test adjusted to match correct implementation.

## Known Stubs

None. All 5 endpoints return real data from MongoDB.

## Threat Flags

No new threat surface beyond what was registered in the plan's threat model. All mitigations implemented:
- T-05-02-01 IDOR delete: WaterLog.deleteOne({ _id, userId }) — verified by Test 7
- T-05-02-02 Body tampering: .strict() Zod schema rejects userId — verified by Test 3
- T-05-02-03 Cross-user home summary: all 5 aggregation queries use userObjId — verified by Test 4
- T-05-02-04 Config open redirect: controller uses only process.env, no req.* — code review + Test 7
- T-05-02-05 Unauthenticated water/home: authenticate on all water + home routes — verified by Test 1
- T-05-02-07 waterGoal leak: getTodayWater User.findById keyed on req.user.id from JWT

## Self-Check: PASSED

Files created/exist:
- backend/src/api/water/water.validation.ts — EXISTS
- backend/src/api/water/water.service.ts — EXISTS
- backend/src/api/water/water.controller.ts — EXISTS
- backend/src/api/water/water.routes.ts — EXISTS
- backend/src/api/home/home.service.ts — EXISTS
- backend/src/api/home/home.controller.ts — EXISTS
- backend/src/api/home/home.routes.ts — EXISTS
- backend/src/api/config/config.controller.ts — EXISTS
- backend/src/api/config/config.routes.ts — EXISTS

Commits:
- a0e6f56 — test(05-02): add failing tests for water API (RED)
- f3b1300 — feat(05-02): implement Water API
- 1f3378d — test(05-02): add failing tests for home/config (RED)
- 6d109ee — feat(05-02): implement Home today-summary, Config shop-url

Tests: 16/16 pass (9 water + 7 home)
TypeScript: npx tsc --noEmit exits 0
