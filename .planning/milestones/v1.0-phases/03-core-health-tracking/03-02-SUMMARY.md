---
phase: "03"
plan: "02"
subsystem: backend
tags: [workouts, api, utc7, date-utility, security, aggregation]
dependency_graph:
  requires: []
  provides: [POST /api/workouts, GET /api/workouts/stats/weekly, utils/date.ts]
  affects: [backend/src/app.ts]
tech_stack:
  added: []
  patterns: [bucket-pattern, cross-tenant-isolation, zod-strict, aggregation-pipeline]
key_files:
  created:
    - backend/src/utils/date.ts
    - backend/src/api/workouts/workouts.validation.ts
    - backend/src/api/workouts/workouts.service.ts
    - backend/src/api/workouts/workouts.controller.ts
    - backend/src/api/workouts/workouts.routes.ts
    - backend/src/api/workouts/workouts.integration.test.ts
    - backend/.env.test
  modified:
    - backend/src/app.ts
    - backend/package.json
    - backend/src/config/index.ts
decisions:
  - "Used dotenv.config({override: false}) so pre-set test env stubs are not overwritten"
  - "Used Node 20+ --env-file flag for cross-platform test env (avoids cross-env package install)"
  - "targetKcal hardcoded to 300 per WO-04 daily challenge spec"
  - "vietnamDayStart uses pure arithmetic (+7h UTC offset) — no Luxon/date-fns dependency"
metrics:
  duration: "~35 minutes"
  completed: "2026-05-18"
  tasks_completed: 2
  files_created: 7
  files_modified: 3
  tests_passed: 8
---

# Phase 03 Plan 02: Workouts API + UTC+7 Date Utility Summary

Workouts backend module với POST /api/workouts và GET /api/workouts/stats/weekly, kèm UTC+7 date utility thuần arithmetic. Cross-tenant isolation qua ObjectId $match trong aggregation pipeline. Zod .strict() blocks userId injection từ body.

## Endpoint Shapes

### POST /api/workouts

**Request body (validated by createWorkoutLogSchema with .strict()):**
```json
{
  "exerciseName": "Chạy bộ",
  "durationMinutes": 30,
  "caloriesBurned": 250,
  "completedAt": "2026-05-18T10:00:00.000Z",
  "exerciseId": "507f1f77bcf86cd799439011"  // optional
}
```

**Response 201:**
```json
{
  "success": true,
  "data": {
    "_id": "...",
    "userId": "...",
    "exerciseName": "Chạy bộ",
    "durationMinutes": 30,
    "caloriesBurned": 250,
    "date": "2026-05-17T17:00:00.000Z",
    "completedAt": "2026-05-18T10:00:00.000Z",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

**userId always comes from JWT (AuthRequest.user.id) — never from body.**

### GET /api/workouts/stats/weekly

**Response 200:**
```json
{
  "success": true,
  "data": {
    "days": 3,
    "exercises": 8,
    "kcal": 1200,
    "minutes": 120,
    "todayKcal": 250,
    "targetKcal": 300
  }
}
```

**Empty stats (no logs):**
```json
{
  "success": true,
  "data": {
    "days": 0,
    "exercises": 0,
    "kcal": 0,
    "minutes": 0,
    "todayKcal": 0,
    "targetKcal": 300
  }
}
```

## Aggregation $match Shape

```typescript
// Weekly stats pipeline — MUST use ObjectId, not string
{ $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: start } } }

// Today's kcal pipeline
{ $match: { userId: new mongoose.Types.ObjectId(userId), date: todayStart } }
```

`start` = UTC+7 day start of 7 days ago (from `lastNDaysRange(7)`)
`todayStart` = UTC+7 day start of current day (from `vietnamDayStart(new Date())`)
`date` field = `dateBucket` computed by `vietnamDayStart(payload.completedAt)` at create time

## Test Results

| # | Test Case | Result |
|---|-----------|--------|
| 1 | POST without auth → 401 "Token không hợp lệ" | PASS |
| 2 | Valid POST → 201, data.userId equals JWT userId | PASS |
| 3 | POST with spoofed userId in body → 400 (strict) or JWT wins | PASS |
| 4 | POST durationMinutes: -5 → 400 | PASS |
| 5 | POST completedAt: 'not-a-date' → 400 "Thời điểm hoàn thành không hợp lệ" | PASS |
| 6 | Cross-tenant isolation: user A sees only own 200 kcal, not B's 300 kcal | PASS |
| 7 | GET stats no logs → { days:0, exercises:0, kcal:0, minutes:0, todayKcal:0, targetKcal:300 } | PASS |
| 8 | 3 distinct day buckets → days===3 (or 2 at UTC+7 boundary) | PASS |

**Total: 8/8 pass**

## userId-Spoof Test Confirmation

Test 3 verifies Zod `.strict()` behavior: the schema REJECTS extra keys including `userId` in the body. Result was **400 (strict rejection)** — the spoofed userId `aaaaaaaaaaaaaaaaaaaaaaaa` was blocked at validation, never reaching the service layer. JWT userId precedence was confirmed.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed dotenv overwriting test env stubs**
- **Found during:** Task 2 (running integration tests)
- **Issue:** `config/index.ts` called `dotenv.config()` without `override: false`. When `.env` file existed on disk with empty CLOUDINARY values, dotenv loaded it and overwrote the `process.env` assignments in the test file, causing `required()` to throw before any test ran.
- **Fix:** Changed to `dotenv.config({ override: false })` so pre-existing `process.env` values (set by test) are not overwritten by `.env` file.
- **Files modified:** `backend/src/config/index.ts`
- **Commit:** 644d5c0

**2. [Rule 1 - Bug] test:auth script was also broken by the same issue**
- **Found during:** Verifying fix applied to both test scripts
- **Issue:** `test:auth` had the same env stub problem — `tsx/cjs` hoists `require()` before module-level `process.env` assignments in compiled CJS output.
- **Fix:** Updated `test:auth` script to use `--env-file=.env.test` alongside `test:workouts`.
- **Files modified:** `backend/package.json`
- **Commit:** 644d5c0

**3. [Rule 2 - Missing Critical] Added .env.test for cross-platform test runner**
- **Found during:** Task 2 (fixing test script)
- **Issue:** Inline env var prefix syntax (`KEY=value cmd`) works on bash/Linux but fails on Windows CMD where npm scripts run.
- **Fix:** Created `backend/.env.test` with test stubs, used `node --env-file=.env.test` (Node 20+ native, no package install needed, cross-platform).
- **Files added:** `backend/.env.test`
- **Commit:** 644d5c0

## Self-Check: PASSED

Files verified:
- backend/src/utils/date.ts: EXISTS
- backend/src/api/workouts/workouts.validation.ts: EXISTS
- backend/src/api/workouts/workouts.service.ts: EXISTS
- backend/src/api/workouts/workouts.controller.ts: EXISTS
- backend/src/api/workouts/workouts.routes.ts: EXISTS
- backend/src/api/workouts/workouts.integration.test.ts: EXISTS

Commits verified:
- fe8daa8: workouts module + date utility
- 644d5c0: integration tests + env fix

TypeScript: `npx tsc --noEmit` exits 0
Tests: `npm run test:workouts` 8/8 pass
