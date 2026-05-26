---
phase: 05-home-dashboard
plan: "04"
subsystem: backend-notifications + cron-scheduler
tags: [wave-1, fcm, cron, notifications, scheduler, jwt-hardening]
dependency_graph:
  requires:
    - 05-01 (node-cron installed, User schema has waterReminderTime/workoutReminderTime)
    - Phase 1/2 (fcm.service.ts with sendNotificationToUser + registerDeviceToken)
  provides:
    - backend/src/services/fcm.service.ts (sendBatchNotificationToUsers added)
    - backend/src/cron/scheduler.ts (startScheduler with two cron jobs)
    - /api/notifications/register-token (hardened with authenticate middleware)
    - server.ts scheduler bootstrap after DB + Firebase
  affects:
    - Plan 07 (mobile must call /api/notifications/register-token after auth + FCM permission grant)
    - All future plans relying on FCM batch delivery
tech_stack:
  added: []
  patterns:
    - sendBatchNotificationToUsers — single $in query + Promise.allSettled batch pattern
    - Manual UTC+7 offset math in cron (not server local time) — Pitfall 2
    - startScheduler() bootstrapped AFTER connectDB() + loadFirebase() — Pitfall 1
    - Generic notification bodies (no PII) — T-05-04-04
key_files:
  created:
    - backend/src/cron/scheduler.ts
  modified:
    - backend/src/services/fcm.service.ts (sendBatchNotificationToUsers added)
    - backend/src/api/notifications/notification.routes.ts (authenticate added)
    - backend/src/api/notifications/notification.controller.ts (req.user.id from JWT)
    - backend/src/server.ts (startScheduler() call added)
decisions:
  - "sendBatchNotificationToUsers uses single $in query (not per-user queries) for efficiency"
  - "Promise.allSettled ensures one bad FCM token does not abort the whole batch"
  - "Per-minute cron job computes currentTime via manual UTC+7 offset math — not server local time (Pitfall 2)"
  - "Streak alert logic: streakDays > 0 AND todayLogs.length < 3 (less than 3 distinct habits)"
  - "startScheduler() placement: after loadFirebase() at line 10, before app.listen() at line 12"
  - "register-token controller reads userId from (req as AuthRequest).user.id — phase1-test-user placeholder removed"
  - "sendBatchNotificationToUsers called 3 times in scheduler (water + workout + streak)"
  - "All notification bodies are generic strings matching UI-SPEC Copywriting Contract exactly"
metrics:
  duration: "~12 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 4
---

# Phase 5 Plan 04: FCM Scheduling + Notification Hardening Summary

Server-side FCM scheduling via node-cron — per-minute water/workout reminder dispatcher and daily 20:00 streak alert, batch-sending with $in query + Promise.allSettled; /api/notifications/register-token hardened with JWT authenticate middleware.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend fcm.service + harden register-token | 58b80aa | fcm.service.ts, notification.routes.ts, notification.controller.ts |
| 2 | Create cron/scheduler.ts + bootstrap server.ts | 8116edb | cron/scheduler.ts, server.ts |

## New FCM Service Export

### sendBatchNotificationToUsers

```typescript
export async function sendBatchNotificationToUsers(
  userIds: string[],
  notification: { title: string; body: string; data?: Record<string, string> }
): Promise<void>
```

**Behavior:**
- Early return if `userIds.length === 0`
- Single `$in` query to resolve all DeviceTokens: `DeviceToken.find({ userId: { $in: objIds } }).lean()`
- `Promise.allSettled` over FCM sends — one bad token does not abort the batch
- Errors logged via `console.error` per existing pattern

**Preserved exports (unchanged):**
- `sendNotificationToUser(userId, notification)` — single-user, sequential loop
- `registerDeviceToken(userId, token, platform)` — upsert by token

## scheduler.ts Cron Expressions and Dispatch Functions

### Cron jobs registered by startScheduler()

| Job | Expression | Timezone | Purpose |
|-----|------------|----------|---------|
| Per-minute reminder | `'* * * * *'` | `Asia/Ho_Chi_Minh` | Water + workout reminder dispatch |
| Daily streak alert | `'0 20 * * *'` | `Asia/Ho_Chi_Minh` | Streak-at-risk alert at 20:00 VN time |

### UTC+7 Manual Offset Math (Pitfall 2 compliance)

```typescript
const now = new Date();
const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
const hh = String(utc7.getUTCHours()).padStart(2, '0');
const mm = String(utc7.getUTCMinutes()).padStart(2, '0');
const currentTime = `${hh}:${mm}`;
```

Server local time is NEVER used for time comparison — offset computed manually.

### Dispatch Function Signatures

```typescript
// Module-private
async function dispatchWaterReminders(currentTime: string): Promise<void>
async function dispatchWorkoutReminders(currentTime: string): Promise<void>
async function dispatchStreakAlerts(): Promise<void>

// Exported
export function startScheduler(): void
```

### Streak Alert Logic

1. Fetch all users via `User.find({}).select('_id').lean()`
2. For each user: call `getStreak(userId)`
3. Skip if `streakDays === 0`
4. Query `HabitLog.find({ userId, date: vietnamDayStart(new Date()) }).select('habitId').lean()`
5. If `todayLogs.length < 3` → add to at-risk list
6. Call `sendBatchNotificationToUsers(atRiskUserIds, streak_alert_notification)`

## server.ts Bootstrap Order

```typescript
await connectDB();      // line 8
await loadFirebase();   // line 9
startScheduler();       // line 10 — AFTER DB + Firebase (Pitfall 1)
app.listen(...);        // line 12
```

Critical: scheduler bootstrapped only inside `startServer()` — never at module import time.

## Notification Body Strings (Final — UI-SPEC Copywriting Contract)

| Type | Title | Body | Data.type |
|------|-------|------|-----------|
| Water reminder | `Nhắc uống nước` | `Đã đến giờ uống nước rồi! Hãy uống một ly nhé.` | `water_reminder` |
| Workout reminder | `Nhắc tập luyện` | `Đã đến giờ tập luyện. Bắt đầu ngay để giữ streak nhé!` | `workout_reminder` |
| Streak alert | `Sắp mất streak!` | `Bạn sắp mất streak! Hoàn thành thói quen trước nửa đêm.` | `streak_alert` |

All bodies are generic strings — no user name, no kcal, no BMI, no email, no health metrics (T-05-04-04 PII compliance).

## /api/notifications/register-token Hardening

**Before (Phase 1 placeholder):**
```typescript
// notification.routes.ts — no auth
router.post('/register-token', notificationController.registerToken);

// notification.controller.ts — hardcoded userId
await notificationService.saveDeviceToken('phase1-test-user', token, platform);
```

**After (Phase 5 hardened):**
```typescript
// notification.routes.ts — authenticated (T-05-04-01 mitigated)
router.post('/register-token', authenticate, notificationController.registerToken);

// notification.controller.ts — userId from JWT
const userId = (req as AuthRequest).user.id;
await notificationService.saveDeviceToken(userId, token, platform);
```

## Manual Test Plan (Deferred — requires real device + FCM)

Per VALIDATION.md, cron timing and FCM delivery require physical device testing. Deferred items:

1. Register FCM token via `POST /api/notifications/register-token` with valid JWT
2. Set `notifications.waterReminderTime` to `HH:MM+1` (1 minute ahead in UTC+7)
3. Wait for per-minute cron to fire — verify notification appears on device
4. Manually trigger streak alert by calling streak-alert dispatch with test userId
5. Verify FCM notification body matches UI-SPEC strings exactly (no PII visible)

## Note for Plan 07 (Mobile FCM Integration)

Plan 07 (mobile) must:
1. Request FCM permission via `expo-notifications`
2. Retrieve FCM device token: `await Notifications.getExpoPushTokenAsync()`
3. Call `POST /api/notifications/register-token` with Bearer JWT token in Authorization header
4. Body: `{ token: <fcm_token>, platform: 'ios' | 'android' }`
5. This must happen AFTER: user is authenticated AND FCM permission is granted

The endpoint now requires `authenticate` middleware — unauthenticated calls will receive 401.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All dispatch functions query real MongoDB collections; all notification bodies are finalized strings.

## Threat Flags

No new threat surface beyond what the plan's threat model covers. All T-05-04-01 through T-05-04-04 mitigations implemented as planned.

## Self-Check: PASSED

- `backend/src/cron/scheduler.ts` — EXISTS
- `backend/src/services/fcm.service.ts` export `sendBatchNotificationToUsers` — EXISTS
- `backend/src/api/notifications/notification.routes.ts` authenticate — EXISTS
- Commit 58b80aa — EXISTS (feat: extend fcm.service + harden register-token)
- Commit 8116edb — EXISTS (feat: add cron/scheduler.ts + bootstrap server.ts)
- `cd backend && npx tsc --noEmit` — exit code 0
- `cd backend && npm run test:auth` — 24/24 pass
- All grep gates (cron expressions, UTC+7 math, Asia/Ho_Chi_Minh x2, sendBatchNotificationToUsers x3, no PII) — PASS
- startScheduler() AFTER loadFirebase() line order — PASS
