---
phase: "01"
plan: "02"
subsystem: "backend"
tags: ["express", "mongoose", "mongodb", "models", "health-endpoint", "middleware"]
dependency_graph:
  requires: ["01-01 (project scaffold)"]
  provides: ["Express middleware stack", "Mongoose connectDB loader", "8 Mongoose models with compound indexes", "GET /api/health endpoint"]
  affects: ["backend server entry point", "all future backend API routes"]
tech_stack:
  added: ["cors", "helmet", "express-rate-limit", "mongoose connectDB", "dotenv config validation"]
  patterns: ["loader pattern (loadExpress/connectDB)", "compound indexes on all health collections", "TTL index on HealthCheckLog", "error middleware last in chain"]
key_files:
  created:
    - backend/src/config/index.ts
    - backend/src/config/cors.ts
    - backend/src/utils/response.ts
    - backend/src/middleware/error.middleware.ts
    - backend/src/loaders/express.ts
    - backend/src/loaders/mongoose.ts
    - backend/src/models/HealthCheckLog.ts
    - backend/src/models/User.ts
    - backend/src/models/FoodLog.ts
    - backend/src/models/Exercise.ts
    - backend/src/models/WorkoutLog.ts
    - backend/src/models/HabitLog.ts
    - backend/src/models/BMIRecord.ts
    - backend/src/models/DeviceToken.ts
    - backend/src/api/health/health.routes.ts
    - backend/src/api/health/health.controller.ts
  modified:
    - backend/src/app.ts
    - backend/src/server.ts
decisions:
  - "Config validation uses required() helper that throws on startup if env var missing — fail-fast pattern"
  - "maxPoolSize:10 with serverSelectionTimeoutMS:5000 and socketTimeoutMS:45000 for Atlas connection"
  - "HealthCheckLog uses TTL index (expireAfterSeconds:300) to auto-clean test documents"
  - "HabitLog compound index is unique (userId+date+habitId) to enforce one check-in per habit per day"
  - "Health endpoint returns 503 only when both dbConnected and dbWrite are false"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-17"
  tasks_completed: 3
  files_created: 16
  files_modified: 2
---

# Phase 1 Plan 02: Backend Core Summary

**One-liner:** Express middleware stack (CORS/Helmet/rate-limit) wired via loader pattern, Mongoose connectDB with pool config, 8 models with required compound indexes, and GET /api/health with live write/read/delete DB cycle.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Config validation, response utility, Express middleware stack | 4816c38 |
| 2 | Mongoose loader and all models with compound indexes | 4816c38 |
| 3 | Health-check endpoint with real DB write/read/delete cycle | 4816c38 |

## Files Created (16 new, 2 modified)

### Config & Utilities
- `backend/src/config/index.ts` — Env validation with required()/optional() helpers; throws on startup if required var missing
- `backend/src/config/cors.ts` — CorsOptions from ALLOWED_ORIGINS env
- `backend/src/utils/response.ts` — success<T>() and error() helpers wrapping res.status().json()

### Middleware & Loaders
- `backend/src/middleware/error.middleware.ts` — Handles ValidationError (400), duplicate key 11000 (409), generic 500
- `backend/src/loaders/express.ts` — Mounts CORS, Helmet, JSON body parser (10mb limit), URLEncoded, rate limiter (100 req/15min)
- `backend/src/loaders/mongoose.ts` — connectDB() with maxPoolSize:10, serverSelectionTimeoutMS:5000, socketTimeoutMS:45000

### Models (8 total)
- `backend/src/models/HealthCheckLog.ts` — Transient health-check documents; TTL index expireAfterSeconds:300
- `backend/src/models/User.ts` — Email/password/OAuth; profile sub-doc; notifications sub-doc; unique email index
- `backend/src/models/FoodLog.ts` — Meal logs with per-food macros + totals; compound index `{ userId:1, date:-1 }`
- `backend/src/models/Exercise.ts` — Exercise catalogue; compound index `{ category:1, isActive:1 }`
- `backend/src/models/WorkoutLog.ts` — Workout sessions per user; compound index `{ userId:1, date:-1 }`
- `backend/src/models/HabitLog.ts` — Daily habit check-ins; unique compound index `{ userId:1, date:-1, habitId:1 }`
- `backend/src/models/BMIRecord.ts` — BMI history per user; compound index `{ userId:1, recordedAt:-1 }`
- `backend/src/models/DeviceToken.ts` — FCM push tokens per device; compound index `{ userId:1 }`

### Health API
- `backend/src/api/health/health.routes.ts` — GET / → healthController.check
- `backend/src/api/health/health.controller.ts` — Performs save/findById/deleteOne cycle; returns status/db/dbWrite/version/env/timestamp

### Modified
- `backend/src/app.ts` — Wired loadExpress, /api/health router, errorMiddleware
- `backend/src/server.ts` — Calls connectDB() before app.listen(); uncaughtException/unhandledRejection handlers

## Acceptance Criteria Verification

| Criterion | Status |
|-----------|--------|
| `mongoose.ts` has `maxPoolSize: 10` | PASS |
| `FoodLog.ts` has compound index `{ userId: 1, date: -1 }` | PASS |
| `WorkoutLog.ts` has compound index `{ userId: 1, date: -1 }` | PASS |
| `HabitLog.ts` has compound index with `unique: true` | PASS |
| `health.controller.ts` uses `doc.save()`, `findById`, `deleteOne` | PASS |
| `npx tsc --noEmit` exits 0 | PASS |

## TypeScript Check Results

`./node_modules/.bin/tsc --noEmit` exits 0 — no errors.

## Deviations from Plan

None — plan executed exactly as written. All 18 files (16 created + 2 modified) match the plan specification exactly.

**Note:** The backend source files were committed as part of commit `4816c38` (labeled "feat(01-03): add providers and Expo Router layout structure") because plans 01-02 and 01-03 were executed in the same session. The backend content is correct and complete per the plan specification.

## Self-Check

**Files exist:**
- backend/src/config/index.ts: FOUND
- backend/src/config/cors.ts: FOUND
- backend/src/utils/response.ts: FOUND
- backend/src/middleware/error.middleware.ts: FOUND
- backend/src/loaders/express.ts: FOUND
- backend/src/loaders/mongoose.ts: FOUND
- backend/src/models/HealthCheckLog.ts: FOUND
- backend/src/models/User.ts: FOUND
- backend/src/models/FoodLog.ts: FOUND
- backend/src/models/Exercise.ts: FOUND
- backend/src/models/WorkoutLog.ts: FOUND
- backend/src/models/HabitLog.ts: FOUND
- backend/src/models/BMIRecord.ts: FOUND
- backend/src/models/DeviceToken.ts: FOUND
- backend/src/api/health/health.routes.ts: FOUND
- backend/src/api/health/health.controller.ts: FOUND
- backend/src/app.ts: FOUND (modified)
- backend/src/server.ts: FOUND (modified)

**Commits exist:**
- 4816c38: FOUND

**TypeScript:** PASS (exit 0)

## Self-Check: PASSED

**Plan Status: COMPLETED** — All files present, all compound indexes in place, TypeScript compiles cleanly, health endpoint implements the required DB cycle.
