---
phase: "06"
plan: "01"
subsystem: backend
tags: [schema, middleware, auth, admin, seed]
dependency_graph:
  requires: []
  provides: [User.isActive, FoodItem.imageUrl, requireAdmin, authenticate-ban-check, seed-admin]
  affects: [backend/src/models/User.ts, backend/src/models/FoodItem.ts, backend/src/middleware/auth.middleware.ts]
tech_stack:
  added: []
  patterns: [isActive-ban-gate, role-guard-middleware, idempotent-seed-script]
key_files:
  created:
    - backend/src/scripts/seed-admin.ts
    - backend/src/api/admin/admin.integration.test.ts
  modified:
    - backend/src/models/User.ts
    - backend/src/models/FoodItem.ts
    - backend/src/middleware/auth.middleware.ts
    - backend/package.json
decisions:
  - "isActive !== false (not === true) in authenticate so existing docs without the field are treated as active"
  - "authenticate made async for DB lookup on every request — intentional per D-97 (no isActive in JWT payload)"
  - "seed-admin is idempotent: skips creation if email already exists"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-20"
  tasks: 5
  files_changed: 6
---

# Phase 6 Plan 01: Backend Foundations — Model Changes, Middleware, Seed Script Summary

Backend schema and middleware groundwork required by every subsequent admin plan. Adds `User.isActive` ban flag, `FoodItem.imageUrl` media field, async `authenticate` with DB-level ban check, `requireAdmin` role guard, idempotent admin seeder, and integration test scaffold.

## What Was Built

### Task 1 — User.isActive schema field
- Added `isActive: boolean` to `IUser` interface
- Added `isActive: { type: Boolean, default: true }` to `UserSchema` (after `passwordResetTokenExpiry`)
- Existing documents without this field return `undefined` from MongoDB; the middleware checks `!== false` so they pass safely

### Task 2 — FoodItem.imageUrl schema field
- Added `imageUrl: string | null` to `IFoodItem` interface
- Added `imageUrl: { type: String, default: null }` to `FoodItemSchema` (after `vitaminC`)

### Task 3 — Middleware changes
- `authenticate` function: made `async`, added `User.findById(payload.sub).select('isActive')` DB lookup
- Banned users (`isActive === false`) receive `401 Tài khoản đã bị khóa`
- Undefined `isActive` (pre-migration docs) passes safely — guard is `=== false`, not `!== true`
- New exported `requireAdmin(req, res, next)`: checks `user.role !== 'admin'`, returns `403 Chỉ quản trị viên mới có quyền truy cập`

### Task 4 — Seed script + package.json scripts
- Created `backend/src/scripts/seed-admin.ts`
  - Validates `ADMIN_EMAIL` and `ADMIN_PASSWORD` env vars (password >= 8 chars)
  - Idempotent: skips if account with that email already exists
  - Creates user with `role: 'admin'`, `isActive: true`, `profileCompleted: true`
- Added `"seed:admin": "tsx src/scripts/seed-admin.ts"` to `backend/package.json`

### Task 5 — Integration test scaffold
- Created `backend/src/api/admin/admin.integration.test.ts`
  - Uses `MongoMemoryServer` — never touches real Atlas
  - Covers: `requireAdmin` guard (403 for user, 401 for no token), `isActive` ban check (401 + correct Vietnamese error string), exercise CRUD (create/list/patch/delete), food item CRUD (create/patch/delete), user management (list/ban/delete with admin-protection guards)
  - Tests are intentionally failing until Plan 02 creates the admin routes (correct — this is the scaffold)
- Added `"test:admin": "node --env-file=.env.test --require tsx/cjs --test src/api/admin/admin.integration.test.ts"` to `backend/package.json`

## Commits

| Commit  | Message                                                               | Tasks |
|---------|-----------------------------------------------------------------------|-------|
| 1d2cb03 | feat(06-01): add User.isActive and FoodItem.imageUrl schema fields    | 1, 2  |
| 9943379 | feat(06-01): add requireAdmin middleware and isActive ban check to authenticate | 3 |
| 780f21a | feat(06-01): add seed:admin script and admin integration test scaffold | 4, 5 |

Deploy order was respected: schema commit precedes middleware commit as required by the plan's critical deploy sequence.

## Deviations from Plan

None — plan executed exactly as written.

## Verification Results

- [x] `npm run typecheck` from `backend/` exits 0 — no TypeScript errors
- [x] `User.ts` has `isActive: boolean` in IUser interface and `isActive: { type: Boolean, default: true }` in UserSchema
- [x] `FoodItem.ts` has `imageUrl: string | null` in IFoodItem interface and `imageUrl: { type: String, default: null }` in FoodItemSchema
- [x] `auth.middleware.ts` exports `requireAdmin` function
- [x] `auth.middleware.ts` `authenticate` is `async` and contains `User.findById` with `isActive !== false` check
- [x] `backend/src/scripts/seed-admin.ts` exists
- [x] `backend/package.json` has `"seed:admin"` and `"test:admin"` scripts
- [x] `backend/src/api/admin/admin.integration.test.ts` exists
- [x] Tests correctly fail until Plan 02 adds routes (expected behavior for scaffold)

## Known Stubs

None — this plan creates infrastructure, not UI or data-fetching stubs.

## Threat Flags

| Flag | File | Description |
|------|------|-------------|
| threat_flag: elevated-privilege-seed | backend/src/scripts/seed-admin.ts | Script creates admin-role user; must only be run by ops with Atlas access and valid env vars. Never expose as HTTP endpoint. |

## Self-Check: PASSED

- `backend/src/models/User.ts` — found, contains `isActive`
- `backend/src/models/FoodItem.ts` — found, contains `imageUrl`
- `backend/src/middleware/auth.middleware.ts` — found, exports `requireAdmin`, `authenticate` is async
- `backend/src/scripts/seed-admin.ts` — found
- `backend/src/api/admin/admin.integration.test.ts` — found
- Commits 1d2cb03, 9943379, 780f21a — all present in git log
