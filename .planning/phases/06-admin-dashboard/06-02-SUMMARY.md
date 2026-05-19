---
phase: "06"
plan: "02"
subsystem: backend/admin-api
tags: [admin, crud, express, zod, mongoose]
dependency_graph:
  requires: ["06-01"]
  provides: ["backend/src/api/admin/*", "/api/admin/* endpoints"]
  affects: ["backend/src/app.ts"]
tech_stack:
  added: []
  patterns: ["router.use() auth guard", "Zod safeParse validation", "service-controller separation", "IDOR protection via req.params only"]
key_files:
  created:
    - backend/src/api/admin/admin.validation.ts
    - backend/src/api/admin/admin.service.ts
    - backend/src/api/admin/admin.controller.ts
    - backend/src/api/admin/admin.routes.ts
  modified:
    - backend/src/app.ts
decisions:
  - "All routes protected at router level via router.use(authenticate, requireAdmin) — not per-route"
  - "banUser is a toggle (isActive = !target.isActive) with self-ban and admin-ban protection"
  - "lean() results cast through unknown to satisfy TypeScript strict mode (Mongoose FlattenMaps incompatibility)"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-20"
  tasks_completed: 3
  files_created: 4
  files_modified: 1
---

# Phase 6 Plan 02: Admin API Router with Full CRUD Summary

Complete `/api/admin/*` Express router — 13 endpoints covering image upload, exercise CRUD, food-item CRUD, and user management — all gated by `authenticate + requireAdmin` at the router level, with Zod validation, IDOR protection, and admin/self-action guards.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Zod validation schemas for admin module | 82b1d1d | admin.validation.ts |
| 2 | Admin service layer (upload, exercises, food-items, users) | 82b1d1d | admin.service.ts |
| 3 | Controller, routes, app.ts mount | 82b1d1d | admin.controller.ts, admin.routes.ts, app.ts |

## Endpoints Delivered

```
POST   /api/admin/upload          — multer + Cloudinary proxy (folder query param)
GET    /api/admin/exercises       — paginated list with optional ?search=
POST   /api/admin/exercises       — create (201)
PATCH  /api/admin/exercises/:id   — partial update
DELETE /api/admin/exercises/:id   — delete (404 if not found)
GET    /api/admin/food-items      — paginated list with optional ?search=
POST   /api/admin/food-items      — create with source='manual' forced
PATCH  /api/admin/food-items/:id  — partial update
DELETE /api/admin/food-items/:id  — delete
GET    /api/admin/users           — paginated (email name role isActive createdAt)
PATCH  /api/admin/users/:id/ban   — toggle isActive (403 if target is admin)
DELETE /api/admin/users/:id       — delete (403 if target is admin, 403 if self)
```

## Verification Results

- `npm run typecheck` — exit 0, no errors
- `npm run test:admin` — 17 tests, 12 suites, 0 failures
  - requireAdmin guard: 401 (no token), 403 (regular user)
  - isActive ban check: banned user gets 401 on any protected endpoint
  - Exercise CRUD: create/list/update/delete with 400 validation and 404 not-found
  - Food item CRUD: create/update/delete
  - User management: list, ban toggle, delete with admin protection

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - TypeScript error] Lean() result cast through unknown**
- **Found during:** Task 2 — running `npm run typecheck`
- **Issue:** `Exercise.find().lean()` returns `FlattenMaps<IExercise>[]` which TypeScript strict mode rejects as a direct cast to `IExercise[]` due to incompatible `MongoClient` type depths.
- **Fix:** Changed `items as IExercise[]` to `items as unknown as IExercise[]` in both `listExercises` and `listFoodItems` service functions.
- **Files modified:** `backend/src/api/admin/admin.service.ts`
- **Commit:** 82b1d1d

## Known Stubs

None — all endpoints are fully wired to MongoDB models.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: admin-escalation-guard | admin.service.ts | banUser and deleteUser both check target.role === 'admin' before acting — prevents horizontal privilege escalation between admin accounts |

## Self-Check: PASSED

- [x] `backend/src/api/admin/admin.validation.ts` — exists
- [x] `backend/src/api/admin/admin.service.ts` — exists
- [x] `backend/src/api/admin/admin.controller.ts` — exists
- [x] `backend/src/api/admin/admin.routes.ts` — exists
- [x] `backend/src/app.ts` — modified, adminRouter mounted
- [x] Commit 82b1d1d — verified in git log
- [x] 17/17 integration tests pass
- [x] typecheck exits 0
