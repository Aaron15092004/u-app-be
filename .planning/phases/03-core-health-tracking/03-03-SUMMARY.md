---
phase: "03"
plan: "03"
subsystem: backend/habits
tags: [habits, streak, heatmap, api, mongodb]
dependency_graph:
  requires: [03-02]
  provides: [habits-api]
  affects: [mobile-habits-screen]
tech_stack:
  added: []
  patterns: [findOneAndUpdate-upsert, aggregate-groupBy-date, UTC+7-bucket]
key_files:
  created:
    - backend/src/api/habits/habits.validation.ts
    - backend/src/api/habits/habits.service.ts
    - backend/src/api/habits/habits.controller.ts
    - backend/src/api/habits/habits.routes.ts
    - backend/src/api/habits/habits.integration.test.ts
  modified:
    - backend/src/app.ts
    - backend/package.json
decisions:
  - "Use $setOnInsert (not $set) for checkedAt to preserve first-check timestamp on upsert"
  - "Streak in-progress rule (D-49): if today < 3 habits, skip today and count from yesterday"
  - "Fixed test:habits script to use --env-file=.env.test (config module throws without it)"
metrics:
  duration: "~20 minutes"
  completed_date: "2026-05-18"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 03 Plan 03: Habits API + Streak + Weekly Heatmap Summary

**One-liner:** 4-endpoint habits REST API with idempotent check-in ($setOnInsert), UTC+7 bucket weekly heatmap, and streak counting with in-progress-today edge case per D-49.

## Endpoint Shapes

### POST /api/habits/check-in
**Auth:** Bearer JWT required

Request body:
```json
{ "habitId": "water" }
```
Valid habitId values: `water`, `vegetables`, `exercise`, `sleep`, `reading`, `nut-milk`

Response 200:
```json
{
  "success": true,
  "data": {
    "habitId": "water",
    "date": "2026-05-18T17:00:00.000Z",
    "checkedAt": "2026-05-18T07:30:00.000Z"
  }
}
```
- Idempotent: duplicate check-in returns 200 (not 409), same `checkedAt` timestamp preserved
- Extra fields → 400 (schema is `.strict()`)
- Invalid habitId → 400 "Thói quen không hợp lệ"

### GET /api/habits/today
**Auth:** Bearer JWT required

Response 200:
```json
{
  "success": true,
  "data": {
    "completed": ["water", "exercise"],
    "progress": { "count": 2, "percent": 33 }
  }
}
```
- Percent calculated as `Math.round(count / 6 * 100)`

### GET /api/habits/weekly
**Auth:** Bearer JWT required

Response 200:
```json
{
  "success": true,
  "data": [
    { "date": "2026-05-12", "qualified": false },
    { "date": "2026-05-13", "qualified": false },
    { "date": "2026-05-14", "qualified": true },
    ...
    { "date": "2026-05-18", "qualified": true }
  ]
}
```
- Always returns exactly 7 entries (oldest → newest)
- `qualified: true` when user completed >= 3 distinct habits on that UTC+7 day

### GET /api/habits/streak
**Auth:** Bearer JWT required

Response 200:
```json
{
  "success": true,
  "data": { "streakDays": 5 }
}
```

## Streak Algorithm (D-49, D-50)

The streak counts consecutive UTC+7 days where the user completed >= 3 distinct habits.

**In-progress-today rule (D-49):** Today is only counted if it already has >= 3 qualifying habits. If today has fewer than 3, today is skipped (treated as "still in progress") and counting starts from yesterday.

```
Algorithm:
1. Aggregate HabitLog for last 365 days, group by date bucket, count distinct habitIds
2. Build a Set<timestamp> of "qualified" days (count >= 3)
3. If today is in the set: startOffset = 0 (include today)
   Else: startOffset = 1 (skip today, start from yesterday)
4. Walk back from startOffset: increment streak until first non-qualified day
```

Example scenarios:
- Today: 3 habits, yesterday: 3, two days ago: 3 → streakDays = 3
- Today: 2 habits (in-progress), yesterday: 3, two days ago: 3 → streakDays = 2 (today skipped)
- Today: 3 habits, yesterday: 0, two days ago: 3 → streakDays = 1 (break at yesterday)

## Test Pass Count

**12/12 integration tests pass**

| # | Test | Status |
|---|------|--------|
| 1 | POST /check-in no auth → 401 | PASS |
| 2 | POST /check-in valid water → 200 | PASS |
| 3 | POST /check-in invalid habitId → 400 | PASS |
| 4 | POST /check-in duplicate same day → idempotent, same checkedAt | PASS |
| 5 | POST /check-in extra field userId → 400 (strict) | PASS |
| 6 | GET /today after 3 check-ins → count=3, percent=50 | PASS |
| 7 | GET /today new user → empty, zeros | PASS |
| 8 | GET /weekly 7 entries, today+yesterday qualified | PASS |
| 9 | GET /streak 3 habits today → streakDays=1 | PASS |
| 10 | GET /streak 3 consecutive days → streakDays=3 | PASS |
| 11 | GET /streak today in-progress (2 habits) + 2 qualified days → streakDays=2 | PASS |
| 12 | Cross-tenant: User B data NOT visible to User A | PASS |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Wrong JWT helper function name in test**
- **Found during:** Task 2 (integration tests — TypeScript error)
- **Issue:** Plan specified `generateAccessToken` but the actual export from `utils/jwt.ts` is `signAccessToken`
- **Fix:** Updated import and call site in habits.integration.test.ts to use `signAccessToken`
- **Files modified:** `backend/src/api/habits/habits.integration.test.ts`

**2. [Rule 3 - Blocking] test:habits script missing --env-file flag**
- **Found during:** Task 2 (test run failed — config module threw on missing CLOUDINARY_CLOUD_NAME)
- **Issue:** `config/index.ts` calls `dotenv.config()` which requires `.env.test` to be loaded via `--env-file=.env.test` before module evaluation
- **Fix:** Updated `test:habits` script in package.json to include `--env-file=.env.test`
- **Files modified:** `backend/package.json`

**3. [Concurrent agent] app.ts BMI router added by agent 03-04**
- **Found during:** Task 1 (after writing habits module)
- **Issue:** Agent 03-04 (BMI) added `bmiRouter` import and mount to app.ts while habits agent was running — this is expected concurrent behavior
- **Resolution:** No conflict. Both `/api/habits` and `/api/bmi` are present and correctly mounted before `errorMiddleware`

## Confirmation: In-Progress-Today Edge Case (D-49)

Test 11 explicitly validates: when today has only 2 habits (below threshold), the streak correctly skips today and reports `streakDays = 2` (from yesterday + two-days-ago), not 0 or 3. The `startOffset = todayQualified ? 0 : 1` logic in `getStreak()` implements this rule.

## Self-Check: PASSED

- [x] `backend/src/api/habits/habits.validation.ts` exists
- [x] `backend/src/api/habits/habits.service.ts` exists
- [x] `backend/src/api/habits/habits.controller.ts` exists
- [x] `backend/src/api/habits/habits.routes.ts` exists
- [x] `backend/src/api/habits/habits.integration.test.ts` exists
- [x] `grep "AuthRequest).user.id"` in controller.ts matches (4 handlers)
- [x] `grep ".strict()"` in validation.ts matches
- [x] `grep "$setOnInsert"` in service.ts matches
- [x] `grep "/api/habits"` in app.ts matches before errorMiddleware
- [x] `grep -c "authenticate"` in routes.ts returns 4
- [x] `npx tsc --noEmit` exits 0
- [x] `npm run test:habits` exits 0 (12/12 pass)
- [x] Commit hash: 911a015
