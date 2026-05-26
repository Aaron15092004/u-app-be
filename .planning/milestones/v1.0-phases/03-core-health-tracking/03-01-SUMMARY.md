---
phase: "03"
plan: "01"
subsystem: exercises-api
tags: [exercises, seed, vietnamese, api, jwt-auth]
dependency_graph:
  requires: [02-auth-module]
  provides: [exercises-list-endpoint, exercises-detail-endpoint, exercise-seed-data]
  affects: [workout-logging, home-dashboard]
tech_stack:
  added: []
  patterns: [resource-router-pattern, zod-validation, lean-query, idempotent-seed]
key_files:
  created:
    - backend/src/api/exercises/exercises.validation.ts
    - backend/src/api/exercises/exercises.service.ts
    - backend/src/api/exercises/exercises.controller.ts
    - backend/src/api/exercises/exercises.routes.ts
    - backend/src/scripts/seed-exercises.ts
    - backend/src/api/exercises/exercises.integration.test.ts
  modified:
    - backend/src/app.ts
    - backend/package.json
decisions:
  - Used lean() on all Exercise queries for performance (avoids Mongoose document overhead)
  - Seed script uses insertMany with ordered:false for bulk insert efficiency
  - Seed is idempotent via countDocuments check before insert (threshold: 100)
  - Integration tests use MongoMemoryServer for isolated in-memory database
metrics:
  duration: "~25 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 6
  files_modified: 2
---

# Phase 3 Plan 01: Exercises API + Vietnamese Seed Script Summary

Exercises REST API with JWT authentication, category filtering, and 100-entry Vietnamese seed script (25 per category).

## What Was Built

### Endpoint Shapes

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| GET | /api/exercises | Bearer JWT required | List all active exercises, optional ?category= filter |
| GET | /api/exercises/:id | Bearer JWT required | Get single exercise by ObjectId |

**GET /api/exercises response:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "...",
      "name": "Tư thế ngọn núi",
      "category": "yoga",
      "difficulty": "easy",
      "durationMinutes": 5,
      "caloriesBurned": 30,
      "imageUrl": null,
      "description": "...",
      "steps": [
        { "order": 1, "instruction": "...", "durationSeconds": 10 }
      ],
      "isActive": true,
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

**Error responses:**
- 401: `{ "success": false, "error": "Token không hợp lệ hoặc đã hết hạn" }` — missing/invalid JWT
- 400: `{ "success": false, "error": "Danh mục không hợp lệ" }` — invalid category query param
- 400: `{ "success": false, "error": "ID bài tập không hợp lệ" }` — non-ObjectId path param
- 404: `{ "success": false, "error": "Bài tập không tồn tại" }` — valid ObjectId not in DB

### Seed Distribution

| Category | Count | Example exercises |
|----------|-------|-------------------|
| yoga | 25 | Tư thế ngọn núi, Chiến binh I/II/III, Tư thế tam giác, Tư thế cây, Chó úp mặt, Em bé, Rắn hổ mang, Cây cầu... |
| cardio | 25 | Chạy bộ tại chỗ, Nhảy dây, Burpees, Leo núi tại chỗ, Nhảy bật cao, Squat nhảy, Tuck Jump, Skater Jump, Bear Crawl... |
| weights | 25 | Squat tạ đơn, Đẩy ngực tạ đơn, Gập tay tạ đơn, Deadlift tạ ấm, Lunges tạ, Romanian Deadlift, Hip Thrust, Bulgarian Split Squat... |
| stretching | 25 | Giãn gân kheo, Giãn tứ đầu đùi, Giãn vai cánh tay, Con mèo, Giãn lưng dưới, Giãn cổ, IT Band, World's Greatest Stretch... |
| **TOTAL** | **100** | All imageUrl: null, Vietnamese names/steps, ≥3 steps each |

### Seed Idempotency

Both messages verified in code:
- First run (< 100 existing): `Đã seed ${result.length} bài tập.`
- Subsequent runs (≥ 100 existing): `Đã có đủ bài tập, bỏ qua seed (count=${existing}).`

Run with: `cd backend && npm run seed`

### Integration Test Results

7/7 tests passing (`npm run test:exercises`):

| # | Test | Status |
|---|------|--------|
| 1 | GET /api/exercises without token → 401 | PASS |
| 2 | GET /api/exercises with valid token → 200, length=4 (inactive excluded) | PASS |
| 3 | GET /api/exercises?category=yoga → 200, length=1 | PASS |
| 4 | GET /api/exercises?category=invalid → 400 "Danh mục không hợp lệ" | PASS |
| 5 | GET /api/exercises/:yogaId → 200, _id matches | PASS |
| 6 | GET /api/exercises/notanid → 400 "ID bài tập không hợp lệ" | PASS |
| 7 | GET /api/exercises/000000000000000000000000 → 404 "Bài tập không tồn tại" | PASS |

## Deviations from Plan

None — plan executed exactly as written.

The workoutsRouter import already existed in app.ts when the file was updated (parallel plan progress) — exercises router was added alongside it as expected by the plan.

## Known Stubs

None — all Exercise documents are fully structured with real Vietnamese content. The `imageUrl: null` is intentional per plan spec (D-42), to be replaced when image upload functionality is implemented in a later phase.

## Self-Check: PASSED

- backend/src/api/exercises/exercises.validation.ts — exists
- backend/src/api/exercises/exercises.service.ts — exists
- backend/src/api/exercises/exercises.controller.ts — exists
- backend/src/api/exercises/exercises.routes.ts — exists
- backend/src/scripts/seed-exercises.ts — exists (100 imageUrl: null entries)
- backend/src/api/exercises/exercises.integration.test.ts — exists (7/7 passing)
- Commits: 1d58591, ab54541, 9e63d1c
