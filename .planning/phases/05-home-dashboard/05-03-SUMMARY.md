---
phase: 05-home-dashboard
plan: "03"
subsystem: backend-users-profile
tags: [wave-2, backend-api, profile-stats, notifications, tdd, mass-assignment-defence, idor]
dependency_graph:
  requires:
    - 05-01 (User schema with waterGoal + notifications fields, test scaffolds)
    - 05-02 (app.ts with water/home/config mounts already present — serial edit)
  provides:
    - backend/src/api/users/users.validation.ts (Zod .strict() whitelist schemas for both PATCH endpoints)
    - backend/src/api/users/users.service.ts (getProfileStats + updateUserProfile + updateUserNotifications)
    - backend/src/api/users/users.controller.ts (3 handlers — all use req.user.id from JWT)
    - backend/src/api/users/users.routes.ts (GET /profile/stats, PATCH /profile, PATCH /notifications)
    - app.ts: /api/users mounted after /api/config (additive, Plan 02 mounts intact)
  affects:
    - Plan 05/06: mobile profile tab reads /api/users/profile/stats for stats row
    - Plan 07: mobile notifications screen reads notifications block from getProfileStats for form init (WARNING 3 fix)
tech_stack:
  added: []
  patterns:
    - TDD RED/GREEN cycle (RED commit 705b2dc, GREEN commit e9b272c)
    - Zod .strict() mass-assignment defence — rejects unknown keys with 400
    - Promise.all parallel: streak + count + aggregate + notifications in single await
    - getStreak delegation — habits.service.getStreak reused (no reimplementation)
    - Dot-notation update for nested subdocuments (profile.* + notifications.*)
    - IDOR-safe: all queries use new mongoose.Types.ObjectId(req.user.id from JWT)
key_files:
  created:
    - backend/src/api/users/users.validation.ts
    - backend/src/api/users/users.service.ts
    - backend/src/api/users/users.controller.ts
    - backend/src/api/users/users.routes.ts
  modified:
    - backend/src/api/users/users.integration.test.ts (12 real tests replacing placeholder)
    - backend/src/app.ts (additive: import + app.use('/api/users', usersRouter))
decisions:
  - "getProfileStats returns notifications block so mobile Plan 07 can initialise notification settings form from server state (WARNING 3 fix)"
  - "Zod .strict() on both PATCH schemas — rejects role/email/passwordHash with 400 (stronger than field-whitelist-in-service alone)"
  - "getStreak delegated to habits.service.ts — no streak logic reimplemented in users.service.ts"
  - "Promise.all for 4 parallel queries in getProfileStats (streak + count + aggregate + notifications)"
  - "app.ts edit is additive single-line only — Wave 2 serialization ensures no conflict with Plan 02"
  - "authenticate count = 4 in routes (import line counts too) — 3 routes each with authenticate middleware"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-19"
  tasks_completed: 1
  tasks_total: 1
  files_created: 4
  files_modified: 2
---

# Phase 5 Plan 03: Users Profile Stats + PATCH Profile + PATCH Notifications Summary

Wave 2 backend implementation: Three /api/users endpoints delivering profile stats aggregation (streak + workout totals), PATCH profile with Zod .strict() whitelist, and PATCH notifications with HH:MM regex validation. Router mounted in app.ts after Plan 02's mounts. 12 integration tests pass covering mass-assignment defence, IDOR isolation, and notifications round-trip.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 (RED) | Users integration tests (failing) | 705b2dc | Done |
| 1 (GREEN) | Users validation + service + controller + routes + app.ts mount | e9b272c | Done |

## Endpoint Signatures

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| /api/users/profile/stats | GET | Bearer JWT | Aggregated stats: streakDays + totalWorkouts + totalKcalBurned + notifications block |
| /api/users/profile | PATCH | Bearer JWT | Update name/heightCm/weightKg/goalType/waterGoal via Zod whitelist |
| /api/users/notifications | PATCH | Bearer JWT | Update waterReminder/workoutReminder/waterReminderTime/workoutReminderTime via Zod whitelist |

## IProfileStats Response Shape

```typescript
interface IProfileStats {
  streakDays: number;          // from habits.service.getStreak (delegates D-49/50 logic)
  totalWorkouts: number;       // WorkoutLog.countDocuments({ userId })
  totalKcalBurned: number;     // WorkoutLog aggregate $sum caloriesBurned
  notifications: {             // User.findById.select('notifications') — WARNING 3 fix
    waterReminder: boolean;    // default: true
    workoutReminder: boolean;  // default: true
    waterReminderTime: string; // default: '08:00' (D-79)
    workoutReminderTime: string; // default: '07:00' (D-79)
  };
}
// notifications block allows mobile Plan 07 to seed form state from server
// rather than hardcoded defaults (WARNING 3 fix)
```

## Zod Schema Snippets

```typescript
// users.validation.ts — both schemas use .strict() (mass-assignment defence)

export const updateProfileSchema = z.object({
  name: z.string().min(1, 'Tên không được để trống').max(80).optional(),
  heightCm: z.number().min(80, 'Chiều cao không hợp lệ').max(250).optional(),
  weightKg: z.number().min(20, 'Cân nặng không hợp lệ').max(300).optional(),
  goalType: z.enum(['lose', 'maintain', 'gain']).optional(),
  waterGoal: z.number().int().min(1).max(20, 'Số ly tối đa là 20').optional(),
}).strict();  // rejects role, email, passwordHash, etc.

export const updateNotificationsSchema = z.object({
  waterReminder: z.boolean().optional(),
  workoutReminder: z.boolean().optional(),
  waterReminderTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ không hợp lệ (HH:MM)').optional(),
  workoutReminderTime: z.string()
    .regex(/^([01]\d|2[0-3]):[0-5]\d$/, 'Giờ không hợp lệ (HH:MM)').optional(),
}).strict();
```

## Mass-Assignment Defence Approach

`.strict()` on both PATCH schemas: any request body containing fields NOT in the whitelist (e.g., `role`, `email`, `passwordHash`, `refreshTokenHash`) is rejected with HTTP 400 before the service layer is even called. Test 7 verifies: sending `{ name: 'X', role: 'admin', email: 'evil@x.com', passwordHash: 'pwned' }` returns 400 AND DB confirms `role === 'user'` and `email` unchanged.

## Tests Added (12 total)

| Test | Description |
|------|-------------|
| 1 | GET /api/users/profile/stats without auth → 401 |
| 2 | GET stats with no data → zeros + default notifications (D-79 defaults) |
| 3 | GET stats with 3 HabitLogs + 2 WorkoutLogs → streakDays=1, totalWorkouts=2, totalKcalBurned=350 |
| 4 (IDOR) | UserB sees zeros after UserA seed — cross-user isolation |
| 5 | PATCH /api/users/profile without auth → 401 |
| 6 | PATCH profile with valid fields → 200, DB updated (name, heightCm, weightKg, goalType, waterGoal) |
| 7 (mass-assignment) | PATCH profile with role/email/passwordHash → 400; DB role/email unchanged |
| 8 (HH:MM regex) | PATCH notifications with '25:99' → 400 with Vietnamese error message |
| 9 | PATCH notifications with valid data → 200; DB notifications updated |
| 10 (partial) | PATCH only waterReminderTime → other notification fields unchanged |
| 11 (range) | waterGoal=100 → 400 (max 20 enforced) |
| 12 (round-trip) | PATCH waterReminderTime='11:11' then GET stats → notifications.waterReminderTime='11:11' (mobile Plan 07 form-init) |

## Wave Reassignment Note

This plan was originally Wave 1, moved to Wave 2 to serialize the `backend/src/app.ts` edit with Plan 02 (checker BLOCKER 1). Both plans mount routers in app.ts; running them in parallel would create a merge conflict with no atomic coordination. Plan 02 ships first (water/home/config), then this plan adds the `/api/users` mount as a single additive line.

## Note for Mobile Plan 07 Executor

`IProfileStats` now includes the `notifications` block. Mobile `notifications.tsx` screen MUST:
1. Update `IProfileStats` type in `mobile/src/lib/api/types.ts` to include the notifications field
2. Call `getProfileStatsApi()` to seed the notification settings form initial state
3. Do NOT use hardcoded default values for `waterReminderTime`/`workoutReminderTime` — read from server response

## app.ts Current State

```typescript
// After this plan (Plan 03, Wave 2):
app.use('/api/water', waterRouter);    // Plan 02
app.use('/api/home', homeRouter);      // Plan 02
app.use('/api/config', configRouter);  // Plan 02
app.use('/api/users', usersRouter);    // Plan 03 (this plan — additive)
app.use(errorMiddleware);
```

## Deviations from Plan

None — plan executed exactly as written. .strict() schemas provide the mass-assignment defence as specified. getStreak delegation confirmed (no reimplementation). All 12 tests pass.

## Known Stubs

None. All 3 endpoints return real data from MongoDB.

## Threat Flags

No new threat surface beyond what was registered in the plan's threat model. All mitigations implemented:
- T-05-03-01 mass-assignment: .strict() rejects unknown keys → 400, verified by Test 7
- T-05-03-02 HH:MM injection: regex `^([01]\d|2[0-3]):[0-5]\d$` enforced, verified by Test 8
- T-05-03-03 IDOR: all queries use `new mongoose.Types.ObjectId(req.user.id)`, verified by Test 4
- T-05-03-04 Unauthenticated access: authenticate on all 3 routes, verified by Tests 1, 5
- T-05-03-05 Privilege escalation: role absent from updateProfileSchema; .strict() rejects it
- T-05-03-06 Concurrent app.ts edit: Wave 2 serialization — Plan 02 completes first

## Self-Check: PASSED

Files created/exist:
- backend/src/api/users/users.validation.ts — EXISTS
- backend/src/api/users/users.service.ts — EXISTS
- backend/src/api/users/users.controller.ts — EXISTS
- backend/src/api/users/users.routes.ts — EXISTS

Commits:
- 705b2dc — test(05-03): add failing tests for users profile/stats/notifications (RED)
- e9b272c — feat(05-03): implement users profile stats, PATCH profile, PATCH notifications

Tests: 12/12 pass
TypeScript: npx tsc --noEmit exits 0
