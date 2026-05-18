---
phase: "03"
plan: "04"
subsystem: backend/bmi
tags: [bmi, health-tracking, api, mongodb-aggregation, atomic-save]
dependency_graph:
  requires: [03-02]
  provides: [bmi-api]
  affects: [app.ts, User.profile]
tech_stack:
  added: []
  patterns: [transaction-with-fallback, utc7-day-grouping, zod-strict-validation]
key_files:
  created:
    - backend/src/api/bmi/bmi.validation.ts
    - backend/src/api/bmi/bmi.service.ts
    - backend/src/api/bmi/bmi.controller.ts
    - backend/src/api/bmi/bmi.routes.ts
    - backend/src/api/bmi/bmi.integration.test.ts
  modified:
    - backend/src/app.ts
    - backend/package.json
decisions:
  - "Transaction fallback: withTransaction on Atlas replica set, sequential save on standalone (MongoMemoryServer)"
  - "History grouping: UTC+7 offset added as $dateToString in aggregation pipeline (no timezone lib needed)"
  - "test:bmi uses --env-file=.env.test (same pattern as other test scripts)"
metrics:
  duration: "~25 min"
  completed: "2026-05-18"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 03 Plan 04: BMI API + Atomic Save + 30-Day History Summary

BMI CRUD backend with atomic dual-write (BMIRecord + User.profile) using transaction-with-fallback and UTC+7 daily deduplication aggregation pipeline.

## Endpoint Shapes

### PATCH /api/bmi
**Auth:** Bearer JWT required

**Request body:**
```json
{ "heightCm": 170, "weightKg": 65 }
```

**Response 200:**
```json
{
  "success": true,
  "data": {
    "bmiRecord": {
      "_id": "...",
      "userId": "...",
      "heightCm": 170,
      "weightKg": 65,
      "bmi": 22.5,
      "category": "normal",
      "recordedAt": "2026-05-18T..."
    },
    "user": {
      "heightCm": 170,
      "weightKg": 65
    }
  }
}
```

**Validation errors (400):**
- heightCm < 100 or > 220: "Chiều cao phải từ 100 đến 220 cm"
- weightKg < 30 or > 200: "Cân nặng phải từ 30 đến 200 kg"
- Unknown fields: 400 (strict())

### GET /api/bmi/history
**Auth:** Bearer JWT required

**Response 200:**
```json
{
  "success": true,
  "data": [
    { "date": "2026-05-13", "bmi": 20.8, "category": "normal" },
    { "date": "2026-05-14", "bmi": 22.5, "category": "normal" }
  ]
}
```
- Up to 30 entries, oldest first
- 1 entry per UTC+7 calendar day (last record of day wins — D-55)

## BMI Category Boundaries

| BMI Range        | Category    |
|-----------------|-------------|
| < 18.5          | underweight |
| 18.5 <= x < 25  | normal      |
| 25 <= x < 30    | overweight  |
| >= 30           | obese       |

Boundaries: 18.5 = normal, 25 = overweight, 30 = obese (strict less-than checks).

## Transaction vs Fallback Path

Tests ran using **sequential fallback path** — MongoMemoryServer does not support transactions. The `withTransaction` path is used on Atlas replica sets in production.

Fallback detection checks:
- `err.codeName === 'IllegalOperation'`
- `/Transaction numbers are only allowed on a replica set/`
- `/transactions are not supported/` (case-insensitive)

## D-54 Atomic Verification

Test 10 explicitly verifies that after `PATCH /api/bmi`:
- `BMIRecord` is created with correct values
- `User.profile.heightCm` and `User.profile.weightKg` are updated in the same request
- DB query confirms `User.findById(userId).profile.heightCm === 170`

Both writes succeed together. In the fallback path, if `User.findByIdAndUpdate` fails after `BMIRecord.create`, the BMIRecord is deleted to maintain consistency.

## Test Results

**16/16 tests pass**

| # | Test | Result |
|---|------|--------|
| 1 | computeBMI(170,65)===22.5 | PASS |
| 2 | computeBMI(180,100)===30.9 | PASS |
| 3 | categorizeBMI(17)==='underweight' | PASS |
| 4 | categorizeBMI(18.5)==='normal' (boundary) | PASS |
| 5 | categorizeBMI(24.9)==='normal' | PASS |
| 6 | categorizeBMI(25)==='overweight' (boundary) | PASS |
| 7 | categorizeBMI(30)==='obese' (boundary) | PASS |
| 8 | PATCH without auth → 401 | PASS |
| 9 | PATCH valid → 200 + bmi+category+user | PASS |
| 10 | User.profile.heightCm updated in DB (D-54) | PASS |
| 11 | heightCm=99 → 400 Vietnamese error | PASS |
| 12 | weightKg=201 → 400 | PASS |
| 13 | extra field userId → 400 strict() | PASS |
| 14 | history with no records → [] | PASS |
| 15 | cross-tenant isolation: 3 records A, not B | PASS |
| 16 | same-day dedup: latest bmi wins (24.2) | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript pipeline aggregation type error**
- **Found during:** Task 1 — `npx tsc --noEmit`
- **Issue:** Union type inference for pipeline array caused `_id?: undefined` conflict with `PipelineStage` type
- **Fix:** Explicitly typed `const pipeline: PipelineStage[]` and removed `as const` from sort values
- **Files modified:** `bmi.service.ts`
- **Commit:** 93f3f7a (part of main commit)

**2. [Rule 1 - Bug] TypeScript null cast after withTransaction**
- **Found during:** Task 1 — `npx tsc --noEmit`
- **Issue:** `updatedUser` typed as `null` after `session.withTransaction`, TypeScript could not cast directly
- **Fix:** Used `as unknown as { profile: ... }` pattern for safe runtime cast
- **Files modified:** `bmi.service.ts`

**3. [Rule 3 - Blocking] Test script missing --env-file flag**
- **Found during:** Task 2 — test run failed with config throw
- **Issue:** `npm run test:bmi` lacked `--env-file=.env.test`; dotenv loaded `.env` with empty CLOUDINARY vars
- **Fix:** Added `--env-file=.env.test` to match existing test:auth/workouts pattern
- **Files modified:** `package.json`

## Known Stubs

None.

## Threat Flags

None — endpoints follow established auth middleware pattern. No new trust boundaries introduced.

## Self-Check: PASSED

- backend/src/api/bmi/bmi.validation.ts: FOUND
- backend/src/api/bmi/bmi.service.ts: FOUND
- backend/src/api/bmi/bmi.controller.ts: FOUND
- backend/src/api/bmi/bmi.routes.ts: FOUND
- backend/src/api/bmi/bmi.integration.test.ts: FOUND
- Commit 93f3f7a: FOUND
- 16/16 tests: PASS
