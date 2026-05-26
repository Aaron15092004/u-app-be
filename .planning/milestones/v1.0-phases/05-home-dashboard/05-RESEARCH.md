# Phase 5: Home Dashboard, Profile & Notifications - Research

**Researched:** 2026-05-19
**Domain:** React Native (Expo SDK 54) dashboard + FCM push notifications + node-cron scheduling
**Confidence:** HIGH (all critical technical claims verified against codebase, npm registry, or official documentation)

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-73:** WaterLog model = full collection. Schema `{ userId: ObjectId, loggedAt: Date }`. One document per glass. Compound index `{ userId: 1, loggedAt: -1 }`. Count documents for today to get glass count.
- **D-74:** Daily water goal = user-configurable. Add `waterGoal: { type: Number, default: 8 }` to `User.profile`.
- **D-75:** Water logging UI = dedicated water log screen (`(home)/water.tsx`). Tap water summary card on Home → push to water screen.
- **D-76:** Profile = 5th tab. Icon `person`/`person-outline` (Ionicons). Label "Hồ sơ". After BMI tab in `(tabs)/_layout.tsx`. Screen at `app/(tabs)/profile/index.tsx`.
- **D-77:** Profile editing = separate Edit Profile screen (push). `(tabs)/profile/edit.tsx`. Fields: name, dob/age, height, weight, health goal. Endpoint: `PATCH /api/users/profile`.
- **D-78:** Achievement badges = 4 icons in horizontal row. Milestones 7/14/28/60 days. Unlocked = `#E8F5E9` bg + `#4CAF50` icon. Locked = `#F5F5F5` bg + `#BDBDBD` icon. Computed from streak count (D-50).
- **D-79:** Replace single `reminderTime` with two separate fields in `User.notifications`: `waterReminderTime: { type: String, default: '08:00' }` and `workoutReminderTime: { type: String, default: '07:00' }`. Remove `reminderTime`. Breaking change — migration note: no existing production users.
- **D-80:** Streak alert = fixed cron job at 20:00 UTC+7 daily. Logic: all users with streak > 0 who have < 3 habits checked today → FCM "Bạn sắp mất streak! Hoàn thành thói quen trước nửa đêm". Always fires, not user-configurable.
- **D-81:** FCM scheduling = node-cron per-minute job on backend. Each minute: query users with `waterReminderTime == currentHH:MM` AND `notifications.waterReminder == true` → FCM batch. Same for `workoutReminderTime`. Separate cron for 20:00 streak alert. Use `node-cron` package (add to `backend/package.json`).
- **D-82:** Shop URL = configurable from backend. `GET /api/config/shop-url` returns `{ url: string }`. URL stored in `SHOP_URL` env var (default 'https://u-app.vn/shop'). Cache 1 hour in TanStack Query.
- **D-83:** Open shop with `expo-linking` (`Linking.openURL`). Already in Expo SDK 54. No WebView, no new install needed.

### Claude's Discretion

- **Dashboard aggregation:** single endpoint `GET /api/home/today-summary` returning `{ kcalConsumed, waterGlasses, waterGoal, workoutMinutes }` vs 3 separate queries. (Claude decides at planning.)
- **Achievement badges display logic:** Computed from streak count, 4 badges, green/gray. (D-78 locked; Claude decides rendering approach.)
- **Help & Support (PRO-06):** Static screen with FAQ + email contact. Claude decides format.
- **Notification rationale screen (NOTIF-01):** Modal or dedicated screen. Claude decides.
- **Home greeting format:** "Xin chào, [tên]!" using `auth.user.name` from AuthProvider.

### Deferred Ideas (OUT OF SCOPE)

- Custom habit creation (v2)
- 5th Food tab (Phase 4 deferred)
- Biometric unlock before health data (v2)
- Water intake history chart (7-day/30-day — v2; water log screen shows today only)
- Barcode scan (Phase 4 deferred)
- Multiple reminder times per day (v2; Phase 5 has 1 daily water reminder)

</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| HOME-01 | Home shows greeting by name + notification bell | `useAuth().user.name` from AuthProvider; bell is display-only (no-op) in Phase 5 |
| HOME-02 | Home shows today summary: kcal consumed, water glasses, workout minutes | Requires new `GET /api/home/today-summary` aggregating FoodLog + WaterLog + WorkoutLog |
| HOME-03 | Home has quick actions: Quét bữa ăn, Bắt đầu tập, Thói quen | Expo Router `router.push()` to existing routes — no new backend |
| HOME-04 | Home shows BMI widget (value + category) | Query BMIRecord for latest entry; `computeBMI`/`categorizeBMI` already in bmi.service |
| HOME-05 | Home shows Nutrition summary today (Calo/Protein/Carbs/Fat with progress bars) | FoodLog data; `GET /api/home/today-summary` can include macro totals |
| HOME-06 | Home shows Ủ Shop banner (tap opens external link) | `GET /api/config/shop-url` → `Linking.openURL(url)` |
| PRO-01 | Profile shows avatar, name, email | From `useAuth().user` (MMKV cached user); avatar from User model |
| PRO-02 | Profile shows stats: streak days, workout count, calories burned | Requires new `GET /api/users/profile/stats` endpoint |
| PRO-03 | User can view and update: name, age, height, weight, health goal | `PATCH /api/users/profile` — extends existing bmi.service pattern |
| PRO-04 | Achievement badges at streak milestones 7/14/28/60 days | Badge unlock logic from streak count from `GET /api/habits/streak` |
| PRO-05 | User can toggle notification on/off from Profile settings | `PATCH /api/users/notifications`; notification settings screen |
| PRO-06 | Help & Support screen | Static screen with FAQ accordion + email contact |
| PRO-07 | User logout from Profile | Reuse existing `auth.logout()` from AuthProvider |
| NOTIF-01 | Rationale screen before first permission request | Modal with `Notifications.requestPermissionsAsync()` + MMKV flag to show once |
| NOTIF-02 | Water reminder FCM notification (per user-set time) | node-cron per-minute job; User.notifications.waterReminderTime |
| NOTIF-03 | Workout reminder FCM notification (per user-set time) | node-cron per-minute job; User.notifications.workoutReminderTime |
| NOTIF-04 | Streak alert FCM at 20:00 daily | node-cron `0 20 * * *` with `timezone: 'Asia/Ho_Chi_Minh'` |

</phase_requirements>

---

## Summary

Phase 5 is an assembly phase — it aggregates data from all prior phases (FoodLog, WorkoutLog, HabitLog, BMIRecord, WaterLog) into a unified Home Dashboard, creates a Profile tab with achievement badges and stats, and wires FCM push notifications via a backend cron scheduler. Most complexity is in (1) writing efficient MongoDB aggregation queries for the home summary endpoint, (2) the node-cron scheduler wiring in server.ts, and (3) the notification permission flow on mobile.

The codebase already has all key infrastructure: FCM service (`backend/src/services/fcm.service.ts`), DeviceToken model, TanStack Query v5 patterns, and the `authenticate` middleware. Phase 5 adds three new backend modules (`/api/home`, `/api/water`, `/api/config` and updates to `/api/users`) and roughly 20 new mobile components plus 7 screens.

The single highest-risk item is the User.notifications schema migration: the existing `reminderTime: string` field must be replaced by `waterReminderTime` + `workoutReminderTime`. Since there are no production users, this is a safe breaking change — but the planner must ensure the schema update happens in Wave 0 before any endpoint reads those fields.

**Primary recommendation:** Use a single `/api/home/today-summary` endpoint that aggregates kcal + water + workout + BMI in one backend round-trip. The home screen will have one query key `['home', 'summary']` that is invalidated whenever FoodLog, WaterLog, or WorkoutLog mutations settle.

---

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Home dashboard data aggregation | API / Backend | — | MongoDB aggregation across 4 collections; must be server-side for performance and security |
| FCM push scheduling | API / Backend | — | Server-side cron; OEM Android devices kill background JS processes (D-STATE.md) |
| Water glass logging | API / Backend | — | Persistent data, same pattern as HabitLog/WorkoutLog |
| Profile stats calculation | API / Backend | — | Requires aggregate queries against WorkoutLog + HabitLog; not suitable for client |
| Achievement badge unlock logic | Frontend (mobile) | — | Pure computation from streak count returned by existing `/api/habits/streak` — no new endpoint needed |
| Notification permission flow | Browser/Client | — | `requestPermissionsAsync` is a client-side OS API; rationale modal is pure UI |
| Shop URL delivery | API / Backend | — | D-82: URL configurable via env var, delivered via `/api/config/shop-url` |
| Notification settings toggle/time | API / Backend (PATCH) + Frontend | — | Mobile captures user input → PATCH /api/users/notifications persists to MongoDB |
| Tab layout (5th Profile tab) | Frontend (mobile) | — | Expo Router `(tabs)/_layout.tsx` configuration change |
| Device FCM token registration | Frontend → Backend | — | Mobile calls `getDevicePushTokenAsync()` → POST /api/notifications/register-token (already exists) |

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node-cron | 4.2.1 | Backend cron scheduling for FCM jobs | CONTEXT.md D-81 locked; established npm package since 2016 [VERIFIED: npm registry] |
| @types/node-cron | 3.0.11 | TypeScript types for node-cron | Official DefinitelyTyped package [VERIFIED: npm registry] |
| expo-notifications | ~0.32.17 (installed) | `requestPermissionsAsync` + `getDevicePushTokenAsync` | Already in mobile/package.json [VERIFIED: codebase] |
| expo-linking | ~7.0.5 (installed) | `Linking.openURL` for Ủ Shop banner | Already in mobile/package.json (D-83) [VERIFIED: codebase] |

### Supporting (new installs required)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| expo-linear-gradient | ~55.0.14 | Green gradient for Ủ Shop banner | UI-SPEC requires `#4CAF50 → #388E3C` gradient on shop banner [VERIFIED: npm registry] |
| @react-native-community/datetimepicker | ~9.1.0 | Time picker for notification settings screen | UI-SPEC: time picker for waterReminderTime/workoutReminderTime; already referenced in UI-SPEC [VERIFIED: npm registry] |

### Already Installed (no action needed)
| Library | Location | Purpose |
|---------|----------|---------|
| @tanstack/react-query v5 | mobile/package.json | All server state (`useQuery`/`useMutation`) |
| zustand v5 | mobile/package.json | Non-server UI state only |
| expo-router ~4.0.0 | mobile/package.json | File-based navigation |
| react-native-mmkv | mobile/package.json | MMKV flag to track "notif-rationale-shown" |
| firebase-admin ^13.0.0 | backend/package.json | FCM Admin SDK for batch send |
| mongoose ^8.0.0 | backend/package.json | MongoDB ODM |
| zod ^3.24.0 | backend/package.json | Request validation |

**Installation (Wave 0):**
```bash
# Backend
npm install node-cron @types/node-cron --save-dev-types --save

# Mobile
npx expo install expo-linear-gradient @react-native-community/datetimepicker
```

Exact commands:
```bash
# backend/
npm install node-cron
npm install --save-dev @types/node-cron

# mobile/ (use expo install to get SDK-compatible versions)
cd mobile && npx expo install expo-linear-gradient @react-native-community/datetimepicker
```

---

## Package Legitimacy Audit

> Note: `slopcheck` is installed (v0.6.1) but only checks PyPI; this is a Node.js phase. Manual npm registry verification performed instead.

| Package | Registry | Age | Source Repo | npm view confirmed | Disposition |
|---------|----------|-----|-------------|-------------------|-------------|
| node-cron | npm | ~10 yrs (created 2016-02-04) | github.com/merencia/node-cron | version 4.2.1, modified 2026-04-24 | Approved [VERIFIED: npm registry] |
| @types/node-cron | npm | DefinitelyTyped | github.com/DefinitelyTyped/DefinitelyTyped | version 3.0.11 | Approved [VERIFIED: npm registry] |
| expo-linear-gradient | npm | ~7 yrs (created 2019-02-14) | github.com/expo/expo (monorepo) | version 55.0.14, modified 2026-05-13 | Approved [VERIFIED: npm registry] |
| @react-native-community/datetimepicker | npm | ~7 yrs (created 2019-06-18) | github.com/react-native-datetimepicker/datetimepicker | version 9.1.0 | Approved [VERIFIED: npm registry] |

**Packages removed due to slopcheck [SLOP] verdict:** none
**Packages flagged as suspicious [SUS]:** none

All 4 packages are well-established, official, or community-maintained with long track records. No postinstall scripts with network calls detected.

---

## Architecture Patterns

### System Architecture Diagram

```
Mobile App
│
├── app/(tabs)/index.tsx (Home Dashboard)
│   ├── GET /api/home/today-summary ──────────────────────────────┐
│   │   (TanStack Query, cache 30s, invalidate on water/food/wko) │
│   └── GET /api/config/shop-url ─────────────────────────┐      │
│       (TanStack Query, cache 1hr)                        │      │
│                                                          ▼      ▼
│                                               Backend: home.service.ts
│                                               Aggregates: FoodLog + WaterLog +
│                                               WorkoutLog + BMIRecord (today, UTC+7)
│
├── app/(home)/water.tsx (Water Log)
│   ├── POST /api/water ──────────────────────────────────────── WaterLog.create()
│   ├── DELETE /api/water/:id ───────────────────────────────── WaterLog.deleteOne()
│   └── GET /api/water/today ────────────────────────────────── WaterLog.find(today)
│
├── app/(tabs)/profile/index.tsx (Profile)
│   ├── GET /api/users/profile/stats ────────────────────────── aggregate: streak+workouts+kcal
│   └── GET /api/habits/streak (reuses existing endpoint)
│
├── app/(tabs)/profile/edit.tsx (Edit Profile)
│   └── PATCH /api/users/profile ───────────────────────────── User.findByIdAndUpdate(profile+waterGoal)
│
├── app/(tabs)/profile/notifications.tsx (Notification Settings)
│   └── PATCH /api/users/notifications ─────────────────────── User.findByIdAndUpdate(notifications)
│
└── Notification Permission Flow
    app/(home)/notification-rationale.tsx (Modal)
    └── Notifications.requestPermissionsAsync() ────────────── OS permission dialog
        └── Notifications.getDevicePushTokenAsync() ─────────── FCM token
            └── POST /api/notifications/register-token ───────── DeviceToken.upsert()

Backend Cron Scheduler (server.ts bootstrap)
├── Per-minute cron (* * * * *) [Asia/Ho_Chi_Minh]
│   ├── Water reminder: find users where waterReminderTime==HH:MM AND waterReminder==true
│   │   └── fcm.service.sendBatchNotification(userIds, waterMessage)
│   └── Workout reminder: find users where workoutReminderTime==HH:MM AND workoutReminder==true
│       └── fcm.service.sendBatchNotification(userIds, workoutMessage)
└── Daily 20:00 cron (0 20 * * *) [Asia/Ho_Chi_Minh]
    └── Streak alert: find users with streak>0 AND todayHabits<3
        └── fcm.service.sendBatchNotification(userIds, streakMessage)
```

### Recommended Project Structure (new files only)

```
backend/src/
├── models/
│   └── WaterLog.ts                    # New model (D-73)
├── api/
│   ├── home/
│   │   ├── home.routes.ts             # GET /api/home/today-summary
│   │   ├── home.controller.ts
│   │   └── home.service.ts            # Aggregates FoodLog+WaterLog+WorkoutLog+BMIRecord
│   ├── water/
│   │   ├── water.routes.ts            # POST /api/water, GET /api/water/today, DELETE /api/water/:id
│   │   ├── water.controller.ts
│   │   ├── water.service.ts
│   │   └── water.validation.ts
│   ├── users/
│   │   ├── users.routes.ts            # PATCH /api/users/profile, GET /api/users/profile/stats, PATCH /api/users/notifications
│   │   ├── users.controller.ts
│   │   └── users.service.ts
│   └── config/
│       ├── config.routes.ts           # GET /api/config/shop-url
│       └── config.controller.ts
├── services/
│   └── fcm.service.ts                 # Add sendBatchNotificationToUsers() method
└── cron/
    └── scheduler.ts                   # node-cron jobs, bootstrapped from server.ts

mobile/src/
├── app/
│   ├── (tabs)/
│   │   ├── _layout.tsx                # Add 5th Profile tab (D-76)
│   │   ├── index.tsx                  # Full rewrite — real Home Dashboard
│   │   └── profile/
│   │       ├── index.tsx              # Profile tab screen
│   │       ├── edit.tsx               # Edit Profile screen (stack push)
│   │       ├── notifications.tsx      # Notification Settings screen
│   │       └── help.tsx               # Help & Support screen
│   └── (home)/
│       ├── _layout.tsx                # Stack layout for home sub-screens
│       └── water.tsx                  # Water Log screen (D-75)
├── lib/api/
│   ├── home.api.ts                    # getTodaySummaryApi, getShopUrlApi
│   ├── water.api.ts                   # logWaterApi, getTodayWaterApi, deleteWaterApi
│   ├── users.api.ts                   # getProfileStatsApi, updateProfileApi, updateNotificationsApi
│   └── types.ts                       # Add new Phase 5 types
└── components/ui/
    ├── TodaySummaryRow.tsx
    ├── HomeSection.tsx
    ├── MacroProgressBar.tsx
    ├── NutritionProgressCard.tsx
    ├── BMIWidget.tsx
    ├── ShopBanner.tsx
    ├── QuickActionsRow.tsx
    ├── AchievementBadge.tsx
    ├── AchievementBadgesRow.tsx
    ├── ProfileMenuCard.tsx
    ├── ProfileMenuRow.tsx
    ├── WaterControls.tsx
    ├── WaterLogItem.tsx
    ├── NotificationRationaleModal.tsx
    ├── NotifToggleRow.tsx
    ├── NotifTimeRow.tsx
    └── FAQItem.tsx
```

---

## Critical Patterns

### Pattern 1: node-cron Timezone Scheduling

**What:** Schedule jobs at Vietnam local time (UTC+7)
**Source:** node-cron official docs; npm registry confirms v4.2.1 [VERIFIED: npm registry]

```typescript
// Source: node-cron v4 API — timezone option
import cron from 'node-cron';

// Per-minute water/workout reminder dispatcher
cron.schedule('* * * * *', async () => {
  const now = new Date();
  // Get HH:MM in UTC+7
  const utc7 = new Date(now.getTime() + 7 * 60 * 60 * 1000);
  const hh = String(utc7.getUTCHours()).padStart(2, '0');
  const mm = String(utc7.getUTCMinutes()).padStart(2, '0');
  const currentTime = `${hh}:${mm}`;
  
  await sendWaterReminders(currentTime);
  await sendWorkoutReminders(currentTime);
}, {
  timezone: 'Asia/Ho_Chi_Minh',
});

// Streak alert at 20:00 daily
cron.schedule('0 20 * * *', async () => {
  await sendStreakAlerts();
}, {
  timezone: 'Asia/Ho_Chi_Minh',
});
```

**Cron expression reference:**
- Every minute: `* * * * *`
- Daily at 20:00 UTC+7: `0 20 * * *` (with `timezone: 'Asia/Ho_Chi_Minh'`)
- IANA timezone for Vietnam: `Asia/Ho_Chi_Minh` (UTC+7, no DST)

**Bootstrap from server.ts:** Import and call a `startScheduler()` function after `connectDB()` and `loadFirebase()`.

**CRITICAL:** node-cron per-minute job for reminders should NOT use timezone-native scheduling since we compare `currentHH:MM` in UTC+7 — compute the time string manually using UTC offset rather than relying on timezone to shift the expression. The `0 20 * * *` streak job DOES use timezone to fire at local 20:00. [ASSUMED — based on UTC+7 offset math; the pattern matches D-51 date utility]

### Pattern 2: FCM Batch Send (extend existing fcm.service.ts)

**What:** Send notification to multiple users by userId list
**Source:** Existing `backend/src/services/fcm.service.ts` [VERIFIED: codebase]

```typescript
// Extend existing fcm.service.ts with batch method
export async function sendBatchNotificationToUsers(
  userIds: string[],
  notification: { title: string; body: string; data?: Record<string, string> }
): Promise<void> {
  if (userIds.length === 0) return;
  
  const tokens = await DeviceToken.find({
    userId: { $in: userIds.map(id => new mongoose.Types.ObjectId(id)) }
  }).lean();
  
  // Send in parallel (fire-and-forget per token — mirror existing pattern)
  await Promise.allSettled(
    tokens.map(deviceToken =>
      admin.messaging().send({
        notification: { title: notification.title, body: notification.body },
        data: notification.data,
        token: deviceToken.token,
      }).catch(err => console.error(`FCM batch fail for token ${deviceToken.token}:`, err))
    )
  );
}
```

### Pattern 3: WaterLog Model (new — D-73)

**What:** One document per glass, counted for today
**Source:** Established by D-73; mirrors HabitLog pattern [VERIFIED: codebase decision]

```typescript
// backend/src/models/WaterLog.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IWaterLog extends Document {
  userId: mongoose.Types.ObjectId;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const WaterLogSchema = new Schema<IWaterLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    loggedAt: { type: Date, required: true, default: Date.now },
  },
  { timestamps: true }
);

WaterLogSchema.index({ userId: 1, loggedAt: -1 });  // D-73

export default mongoose.model<IWaterLog>('WaterLog', WaterLogSchema);
```

**Count pattern for today:**
```typescript
const todayStart = vietnamDayStart(new Date());
const tomorrowStart = new Date(todayStart.getTime() + 86400000);
const count = await WaterLog.countDocuments({
  userId: new mongoose.Types.ObjectId(userId),
  loggedAt: { $gte: todayStart, $lt: tomorrowStart },
});
```

### Pattern 4: User.notifications Schema Migration (D-79)

**What:** Replace single `reminderTime` with two separate time fields
**Source:** CONTEXT.md D-79 [VERIFIED: codebase — User.ts line 18 shows `reminderTime` exists]

```typescript
// backend/src/models/User.ts — notifications subdocument change
notifications: {
  waterReminder: boolean;      // existing
  workoutReminder: boolean;    // existing
  waterReminderTime: string;   // NEW (replaces reminderTime)
  workoutReminderTime: string; // NEW
  // reminderTime REMOVED
};

// Schema definition
notifications: {
  waterReminder: { type: Boolean, default: true },
  workoutReminder: { type: Boolean, default: true },
  waterReminderTime: { type: String, default: '08:00' },
  workoutReminderTime: { type: String, default: '07:00' },
},
```

**Migration note:** No production data exists. The single `reminderTime` field in existing User.ts is removed. The TypeScript interface `IUser` must also be updated.

### Pattern 5: Home Today-Summary Endpoint

**What:** Single aggregation endpoint for Home Dashboard
**Source:** Analysis of existing FoodLog.service + WorkoutLog.service patterns [VERIFIED: codebase]

```typescript
// home.service.ts
export async function getTodaySummary(userId: string) {
  const todayStart = vietnamDayStart(new Date());
  const tomorrowStart = new Date(todayStart.getTime() + 86400000);
  const userObjId = new mongoose.Types.ObjectId(userId);

  const [foodAgg] = await FoodLog.aggregate([
    { $match: { userId: userObjId, date: { $gte: todayStart, $lt: tomorrowStart } } },
    { $group: { _id: null, kcal: { $sum: '$totals.calories' }, protein: { $sum: '$totals.protein' }, carbs: { $sum: '$totals.carbs' }, fat: { $sum: '$totals.fat' } } },
  ]);
  
  const waterCount = await WaterLog.countDocuments({
    userId: userObjId,
    loggedAt: { $gte: todayStart, $lt: tomorrowStart },
  });
  
  const [workoutAgg] = await WorkoutLog.aggregate([
    { $match: { userId: userObjId, date: todayStart } },
    { $group: { _id: null, minutes: { $sum: '$durationMinutes' } } },
  ]);
  
  const latestBMI = await BMIRecord.findOne({ userId: userObjId })
    .sort({ recordedAt: -1 }).select('bmi category').lean();
  
  const user = await User.findById(userObjId)
    .select('profile.waterGoal').lean();
  
  return {
    kcalConsumed: foodAgg?.kcal ?? 0,
    macros: { protein: foodAgg?.protein ?? 0, carbs: foodAgg?.carbs ?? 0, fat: foodAgg?.fat ?? 0 },
    waterGlasses: waterCount,
    waterGoal: user?.profile?.waterGoal ?? 8,
    workoutMinutes: workoutAgg?.minutes ?? 0,
    bmi: latestBMI ? { value: latestBMI.bmi, category: latestBMI.category } : null,
  };
}
```

### Pattern 6: TanStack Query v5 with Cross-Query Invalidation

**What:** Home summary cache invalidated when food/water/workout changes
**Source:** Existing TanStack Query v5 patterns in habits.tsx [VERIFIED: codebase]

```typescript
// In home screen — query key for today-summary
const summaryQuery = useQuery({
  queryKey: ['home', 'summary'],
  queryFn: getTodaySummaryApi,
  staleTime: 30_000,  // 30s — dashboard data
});

// In water.api.ts mutations — after onSettled:
queryClient.invalidateQueries({ queryKey: ['home', 'summary'] });

// In food confirm mutation (Phase 4 food diary) — add to onSettled:
queryClient.invalidateQueries({ queryKey: ['home', 'summary'] });

// After workout complete (Phase 3 timer/complete) — add to onSettled:
queryClient.invalidateQueries({ queryKey: ['home', 'summary'] });
```

**Cache time for shop URL (D-82):**
```typescript
const shopUrlQuery = useQuery({
  queryKey: ['config', 'shop-url'],
  queryFn: getShopUrlApi,
  staleTime: 60 * 60 * 1000,  // 1 hour per D-82
  gcTime: 60 * 60 * 1000,
});
```

### Pattern 7: expo-notifications Permission Flow (NOTIF-01)

**What:** Request FCM permission with rationale modal first
**Source:** [CITED: docs.expo.dev/versions/latest/sdk/notifications/]

```typescript
// NotificationRationaleModal.tsx
import * as Notifications from 'expo-notifications';
import { getMMKV, setMMKV } from '../lib/storage/mmkv'; // existing MMKV helper

const NOTIF_ASKED_KEY = 'notif_permission_asked';

// Check if we should show rationale (first time only)
async function checkAndRequestPermission() {
  const alreadyAsked = getMMKV(NOTIF_ASKED_KEY); // MMKV boolean flag
  if (alreadyAsked) return;
  
  // Show rationale modal first — user taps "Bật thông báo"
  // Then inside the modal accept handler:
  setMMKV(NOTIF_ASKED_KEY, true);
  const { granted } = await Notifications.requestPermissionsAsync();
  if (granted) {
    // Android 13+: create notification channel first
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
    });
    const tokenData = await Notifications.getDevicePushTokenAsync();
    const fcmToken = tokenData.data;
    await registerTokenApi(fcmToken, Platform.OS === 'ios' ? 'ios' : 'android');
  }
}
```

**Key return value:** `requestPermissionsAsync()` returns `{ granted: boolean, ios?: {...}, android?: {...} }`. Check `granted` boolean, not `.status` string. [CITED: docs.expo.dev/versions/latest/sdk/notifications/]

**Android 13+ requirement:** Must call `setNotificationChannelAsync('default', {...})` before `getDevicePushTokenAsync()`. [CITED: docs.expo.dev/versions/latest/sdk/notifications/]

**FCM token type:** Use `getDevicePushTokenAsync()` (returns native FCM token) since backend uses Firebase Admin SDK directly — not the Expo push token service. [CITED: docs.expo.dev/push-notifications/sending-notifications-custom/]

**Expo Go note:** Push notifications do not work inside Expo Go in SDK 54+. Test with a development build. [CITED: docs.expo.dev/versions/latest/sdk/notifications/]

### Pattern 8: DateTimePicker for Notification Times

**What:** iOS/Android time picker, already referenced in UI-SPEC
**Source:** UI-SPEC.md; `@react-native-community/datetimepicker` v9.1.0 [VERIFIED: npm registry]

```typescript
// NotifTimeRow.tsx
import DateTimePicker from '@react-native-community/datetimepicker';

// Show inline on iOS, modal on Android (per UI-SPEC)
// Parse HH:MM string to Date for DateTimePicker value:
function parseTimeString(timeStr: string): Date {
  const [hh, mm] = timeStr.split(':').map(Number);
  const d = new Date();
  d.setHours(hh, mm, 0, 0);
  return d;
}

// On change: format back to HH:MM
function formatTimeString(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}
```

**Debounce on PATCH (UI-SPEC: 800ms):** Use a local ref-based debounce before calling `PATCH /api/users/notifications` so that time picker sliding doesn't spam the API.

### Pattern 9: Profile Stats Endpoint

**What:** Aggregate streak + total workouts + total kcal burned for Profile screen
**Source:** HabitLog.aggregate pattern from habits.service.ts [VERIFIED: codebase]; WorkoutLog.aggregate from workouts.service.ts [VERIFIED: codebase]

```typescript
// users.service.ts
export async function getProfileStats(userId: string) {
  const userObjId = new mongoose.Types.ObjectId(userId);
  
  // Streak — delegate to existing getStreak() in habits.service
  const { streakDays } = await getStreak(userId);
  
  // Total workouts (all time)
  const totalWorkouts = await WorkoutLog.countDocuments({ userId: userObjId });
  
  // Total calories burned (all time)
  const [kcalAgg] = await WorkoutLog.aggregate([
    { $match: { userId: userObjId } },
    { $group: { _id: null, total: { $sum: '$caloriesBurned' } } },
  ]);
  
  return {
    streakDays,
    totalWorkouts,
    totalKcalBurned: kcalAgg?.total ?? 0,
  };
}
```

### Pattern 10: PATCH /api/users/profile

**What:** Update User.profile fields + waterGoal
**Source:** Extends existing bmi.service.ts pattern (D-54, `User.findByIdAndUpdate`) [VERIFIED: codebase]

```typescript
// users.service.ts
export async function updateUserProfile(userId: string, body: {
  name?: string;
  heightCm?: number;
  weightKg?: number;
  goalType?: 'lose' | 'maintain' | 'gain';
  waterGoal?: number;
}) {
  const update: Record<string, unknown> = {};
  if (body.name !== undefined) update.name = body.name;
  if (body.heightCm !== undefined) update['profile.heightCm'] = body.heightCm;
  if (body.weightKg !== undefined) update['profile.weightKg'] = body.weightKg;
  if (body.goalType !== undefined) update['profile.goalType'] = body.goalType;
  if (body.waterGoal !== undefined) update['profile.waterGoal'] = body.waterGoal;
  
  const user = await User.findByIdAndUpdate(
    userId,
    update,
    { new: true, runValidators: true }
  ).select('name profile').lean();
  
  if (!user) throw makeError('Người dùng không tồn tại', 404);
  return user;
}
```

### Pattern 11: Achievement Badge Unlock Logic

**What:** Client-side computation from streak count
**Source:** D-78 decision; streak comes from `GET /api/habits/streak` (already exists) [VERIFIED: codebase]

```typescript
// AchievementBadgesRow.tsx
const MILESTONES = [7, 14, 28, 60];

function isBadgeUnlocked(streakDays: number, milestone: number): boolean {
  return streakDays >= milestone;
}

// In Profile screen — reuse existing useQuery for streak:
const streakQuery = useQuery({
  queryKey: ['habits', 'streak'],
  queryFn: getStreakApi,
});
const streakDays = streakQuery.data?.streakDays ?? 0;
```

No new backend endpoint needed for badge unlock — pure frontend logic from streak count.

### Anti-Patterns to Avoid

- **Calling FCM from mobile client directly:** All FCM sends must go through backend. Mobile only calls `getDevicePushTokenAsync()` and registers the token. [CLAUDE.md critical rule]
- **Using AsyncStorage for notification permission flag:** Use MMKV (`setMMKV`/`getMMKV`). [CLAUDE.md: no AsyncStorage]
- **Passing `waterGoal` to `profile.waterGoal` nested key via dot notation in Mongoose:** Use `{ 'profile.waterGoal': value }` update syntax — already established in bmi.service.ts for `profile.heightCm`. [VERIFIED: codebase]
- **Using `reminderTime` after schema migration:** The old field must be deleted from both schema and interface before any endpoint reads `waterReminderTime` or `workoutReminderTime`.
- **Registering cron jobs in app.ts before DB connection:** Cron jobs must bootstrap in `server.ts` after `connectDB()` — not in `app.ts` which is only Express config.
- **Using `expo-notifications` for local scheduling:** D-81 mandates server-side FCM, not local notification scheduling. `expo-notifications` is used only for permission + token registration.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Cron job scheduling | Custom `setInterval` + time comparison | `node-cron` (D-81) | setInterval drifts, no timezone awareness, no cron expression syntax |
| FCM token management | Custom token table logic | Existing `DeviceToken` model + `registerDeviceToken()` in fcm.service.ts | Already wired in Phase 1 |
| UTC+7 day boundaries | Custom `new Date()` arithmetic | Existing `vietnamDayStart()` in `backend/src/utils/date.ts` | Already covers the UTC+7 offset; all health services use it |
| Notification permission flow | Custom permission state machine | `expo-notifications` + MMKV flag | OS handles the actual dialog; just need `requestPermissionsAsync()` |
| Time string formatting | Custom formatter | Standard `padStart(2,'0')` one-liner | Trivial; the HH:MM format string pattern is used across the project |
| MongoDB aggregation for stats | Multiple separate queries | `WorkoutLog.aggregate()` with `$group` `$sum` | One round-trip vs N sequential queries |

---

## Common Pitfalls

### Pitfall 1: Cron job registering before DB is ready
**What goes wrong:** Cron fires immediately but `WaterLog`, `HabitLog`, `WorkoutLog` models aren't connected.
**Why it happens:** `cron.schedule()` is called at module import time if not guarded.
**How to avoid:** Call `startScheduler()` inside `startServer()` in server.ts, after `await connectDB()`. Import `scheduler.ts` lazily or wrap in a function.
**Warning signs:** `MongoNotConnectedError` in cron job logs on startup.

### Pitfall 2: Per-minute cron time comparison using server timezone
**What goes wrong:** Server may run in UTC (Render.com default). Cron expression `* * * * *` fires every minute UTC — but you compare `currentHH:MM` without converting to UTC+7. Users set `waterReminderTime: '08:00'` meaning 08:00 UTC+7 but the server fires at 08:00 UTC (= 15:00 UTC+7).
**Why it happens:** `new Date()` returns UTC; `.getHours()` returns server local time.
**How to avoid:** Always compute the HH:MM comparison string using `utc7 = new Date(now.getTime() + 7*60*60*1000); hh = utc7.getUTCHours()`. This is the same pattern as `vietnamDayStart()`.
**Warning signs:** Notifications consistently arrive 7 hours late (or early).

### Pitfall 3: WaterLog countDocuments with wrong date range
**What goes wrong:** `WaterLog.countDocuments({ userId, loggedAt: { $gte: todayStart } })` includes tomorrow's documents if user logs past midnight.
**Why it happens:** Missing upper bound on date filter.
**How to avoid:** Always use `{ $gte: todayStart, $lt: tomorrowStart }` pattern — established in `food.service.ts.getFoodLogsForDate()`.

### Pitfall 4: expo-linear-gradient not found if Expo install not used
**What goes wrong:** `npm install expo-linear-gradient` may install a version incompatible with Expo SDK 54.
**Why it happens:** Native module versions must match Expo SDK.
**How to avoid:** Use `npx expo install expo-linear-gradient` which resolves the SDK-compatible version.
**Same applies to:** `@react-native-community/datetimepicker`.

### Pitfall 5: Tab layout `profile` folder needs its own `_layout.tsx`
**What goes wrong:** `app/(tabs)/profile/` sub-screens (edit, notifications, help) show as separate tabs in the tab bar instead of being a stack inside the profile tab.
**Why it happens:** Expo Router treats each folder within `(tabs)/` as a separate tab by default unless a stack layout is declared.
**How to avoid:** Create `app/(tabs)/profile/_layout.tsx` as a `<Stack>` component. The `index.tsx` is the profile tab; `edit.tsx`, `notifications.tsx`, `help.tsx` are stack screens.

### Pitfall 6: `(home)/` route group needs its own `_layout.tsx`
**What goes wrong:** `water.tsx` pushed from Home tab appears as a root screen instead of a stack from Home.
**Why it happens:** Missing `(home)/_layout.tsx` Stack definition.
**How to avoid:** Create `app/(home)/_layout.tsx` as a `<Stack>` with `headerShown: false` (ScreenHeader handles it per UI-SPEC).

### Pitfall 7: IAuthUser does not include profile fields
**What goes wrong:** `useAuth().user.name` works but `user.profile.waterGoal` or `user.avatar` is not in `IAuthUser` type.
**Why it happens:** `IAuthUser` in `mobile/src/lib/api/types.ts` only has `{ id, email, name, role, profileCompleted }` — no `profile` nested object or `avatar`.
**How to avoid:** Profile stats and waterGoal come from dedicated API endpoints (`GET /api/users/profile/stats`, `GET /api/home/today-summary`). Do NOT try to extend `IAuthUser` to include profile data — that would require a `/me` endpoint (not planned). For the avatar initial, use `user.name.charAt(0)` from AuthProvider.

### Pitfall 8: FCM token on Android requires `setNotificationChannelAsync` first
**What goes wrong:** `getDevicePushTokenAsync()` returns successfully but notifications don't arrive on Android 13+.
**Why it happens:** Android 13+ requires explicit channel creation and the POST_NOTIFICATIONS permission — system prompt not shown without it.
**How to avoid:** Before calling `getDevicePushTokenAsync()`, call `Notifications.setNotificationChannelAsync('default', { name: 'default', importance: Notifications.AndroidImportance.MAX })`. [CITED: docs.expo.dev/versions/latest/sdk/notifications/]

### Pitfall 9: `(tabs)/index.tsx` rewrite — don't lose logout
**What goes wrong:** The new Home Dashboard replaces `index.tsx` which currently contains the only logout button.
**Why it happens:** D-69 cleanup removes the temp logout; Profile tab (PRO-07) now owns logout. If Profile tab implementation is in a later wave than Home rewrite, there is a gap.
**How to avoid:** Ensure Profile tab (with logout) is in the SAME wave as Home Dashboard rewrite, or add temporary logout to Profile tab stub.

---

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Per-minute cron job time comparison uses manual UTC+7 math (`now.getTime() + 7*60*60*1000`) rather than timezone-native JavaScript | Pattern 1, Pitfall 2 | Notifications fire at wrong time — 7h offset error |
| A2 | No production users exist yet, so `reminderTime` → `waterReminderTime`/`workoutReminderTime` migration has no data to backfill | Pattern 4 | If any test/staging users exist, their reminder setting is lost silently |
| A3 | `getDevicePushTokenAsync()` returns the native FCM token on Android (not Expo push token) when used with a development build | Pattern 7 | Token format mismatch — Firebase Admin SDK rejects Expo format tokens |
| A4 | The existing `POST /api/notifications/register-token` endpoint (Phase 1) requires no changes for Phase 5 token registration | Architecture | If endpoint has auth issues or missing fields, token registration fails silently |
| A5 | `expo-linear-gradient` SDK 55 is compatible with Expo Router 4 / Expo SDK 54 | Standard Stack | Build failure if versions conflict (mitigated by using `npx expo install`) |
| A6 | `(home)/` route group for water screen requires a new `_layout.tsx` Stack | Architecture | If Expo Router handles it differently, may need adjustment |

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | node-cron | ✓ | 22.15.0 | — |
| MongoDB Atlas | WaterLog, home summary | ✓ (connection string in .env.example) | M2 per STATE.md | — |
| Firebase Admin SDK | FCM batch send | ✓ (firebase-admin ^13.0.0 in package.json) | 13.x | — |
| expo-notifications | Permission + token | ✓ ~0.32.17 in mobile/package.json | 0.32.17 | — |
| expo-linking | Shop banner URL | ✓ ~7.0.5 in mobile/package.json | 7.0.5 | — |
| node-cron | Backend scheduler | ✗ (not in backend/package.json) | needs 4.2.1 | — |
| expo-linear-gradient | Shop banner gradient | ✗ (not in mobile/package.json) | needs ~55.0.14 | Solid #4CAF50 bg (UI-SPEC fallback) |
| @react-native-community/datetimepicker | Notification time picker | ✗ (not in mobile/package.json) | needs ~9.1.0 | TextInput for HH:MM string (degrade to manual entry) |

**Missing dependencies with no fallback:**
- `node-cron` — required for D-81 cron scheduler; no other approach meets the OEM notification delivery requirement.

**Missing dependencies with fallback:**
- `expo-linear-gradient` — UI-SPEC documents fallback: solid `#4CAF50` background instead of gradient.
- `@react-native-community/datetimepicker` — can fallback to TextInput for time entry if install blocked.

---

## Validation Architecture

> workflow.nyquist_validation: not explicitly set — treating as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` + `supertest` (backend) |
| Config file | none — per-module test files run via `package.json` scripts |
| Quick run command | `node --env-file=.env.test --require tsx/cjs --test src/api/home/home.integration.test.ts` |
| Full suite command | `npm run test:home && npm run test:water && npm run test:users` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| HOME-02 | GET /api/home/today-summary returns correct kcal/water/workout | integration | `npm run test:home` | ❌ Wave 0 |
| PRO-02 | GET /api/users/profile/stats returns streak+workouts+kcal | integration | `npm run test:users` | ❌ Wave 0 |
| PRO-03 | PATCH /api/users/profile updates name/height/weight/goal/waterGoal | integration | `npm run test:users` | ❌ Wave 0 |
| PRO-05 | PATCH /api/users/notifications updates waterReminderTime/workoutReminderTime | integration | `npm run test:users` | ❌ Wave 0 |
| HOME-06 | GET /api/config/shop-url returns configured URL | integration | `npm run test:home` (extend) | ❌ Wave 0 |
| D-73 | WaterLog.countDocuments correctly counts today's glasses (UTC+7) | unit | `npm run test:water` | ❌ Wave 0 |
| NOTIF-01 | Rationale modal shown once (MMKV flag) | manual | — | manual-only |
| NOTIF-02/03 | FCM water/workout reminders fire at correct UTC+7 time | manual | — | manual-only (cron timing) |
| NOTIF-04 | Streak alert cron fires at 20:00 UTC+7 | manual | — | manual-only (cron timing) |

### Wave 0 Gaps
- [ ] `src/api/home/home.integration.test.ts` — covers HOME-02, HOME-05, HOME-06
- [ ] `src/api/water/water.integration.test.ts` — covers D-73 (WaterLog CRUD + count)
- [ ] `src/api/users/users.integration.test.ts` — covers PRO-02, PRO-03, PRO-05
- [ ] Add `test:home`, `test:water`, `test:users` scripts to `backend/package.json`

---

## Security Domain

> `security_enforcement`: not set in config — treating as enabled.

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | yes — all new endpoints | Existing `authenticate` middleware (already wired in prior phases) |
| V3 Session Management | no — tokens not changed | — |
| V4 Access Control | yes — all user data must scope to `req.user.id` | IDOR-safe: use `userId` from JWT, never from request body |
| V5 Input Validation | yes — PATCH profile, PATCH notifications, POST water | Zod validation schemas (same pattern as all prior phases) |
| V6 Cryptography | no — no new secrets or hash operations | — |

### Known Threat Patterns for This Stack

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| IDOR on water log delete | Tampering | `WaterLog.deleteOne({ _id, userId })` — same pattern as food.service.ts IDOR fix |
| FCM cron leaks user data via notification body | Information Disclosure | Notification body must not include PII (health data); copy is generic per UI-SPEC |
| Shop URL open redirect | Tampering | URL comes from server env var only (D-82); not user-provided; `Linking.openURL` does not allow arbitrary redirects from user input |
| PATCH /api/users/profile mass assignment | Tampering | Zod schema whitelist only allowed fields; do NOT spread `req.body` directly onto update |
| Cron job does not authenticate | Spoofing | Cron jobs are server-internal; no HTTP endpoint; no auth token needed |

---

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Local notification scheduling (Expo Notifications) | Server-side FCM (firebase-admin) | OEM Android (Xiaomi, Oppo) kill background Expo JS runtime; server-side FCM bypasses this |
| `expo-notifications` with `scheduleNotificationAsync` | `getDevicePushTokenAsync` + backend FCM send | Correct for server-driven delivery; local scheduling deferred |
| `react-native-datetimepicker` (deprecated) | `@react-native-community/datetimepicker` | Official community package; same functionality |

**Deprecated/outdated:**
- `expo-notifications` for scheduling: The old `scheduleNotificationAsync` local approach is NOT used — Phase 5 uses it only for permission + token. [CITED: STATE.md decision log]
- Single `reminderTime` field: Replaced by `waterReminderTime` + `workoutReminderTime` per D-79.

---

## Open Questions

1. **FCM token registration timing**
   - What we know: `POST /api/notifications/register-token` exists from Phase 1. It does not require `authenticate` middleware (see Phase 1 routes — TODO comment present).
   - What's unclear: Should Phase 5 add `authenticate` middleware to this endpoint? Currently unprotected.
   - Recommendation: Add `authenticate` middleware in Phase 5 so token is always scoped to authenticated user. Low risk — the endpoint already receives `userId` in the request body but an authenticated endpoint is strictly safer.

2. **`(home)/` vs `(tabs)/index` stack for Water Log routing**
   - What we know: UI-SPEC says `app/(home)/water.tsx`; Expo Router has existing `(food)/` pattern for stack routes.
   - What's unclear: Does the water screen need a `(home)/` group or can it live at `(tabs)/water.tsx` as a hidden tab?
   - Recommendation: Use `(home)/` route group with Stack layout, matching the `(food)/` pattern from Phase 4. Avoids tab bar appearing on water screen.

3. **Home summary staleTime**
   - What we know: Dashboard data changes when user logs food, water, or completes workout.
   - What's unclear: 30s staleTime vs 0 (always refetch on focus)?
   - Recommendation: 30s staleTime with `refetchOnWindowFocus: true`. TanStack Query v5 default is `refetchOnWindowFocus: true`; when app comes to foreground the query will refetch if stale.

---

## Sources

### Primary (HIGH confidence)
- `backend/src/models/User.ts` — existing schema fields verified
- `backend/src/services/fcm.service.ts` — FCM infrastructure confirmed
- `backend/src/utils/date.ts` — vietnamDayStart() pattern verified
- `backend/src/api/habits/habits.service.ts` — streak computation and countDocuments patterns
- `backend/src/api/workouts/workouts.service.ts` — WorkoutLog.aggregate() patterns
- `backend/src/api/food/food.service.ts` — FoodLog.countDocuments and date range patterns
- `mobile/src/providers/AuthProvider.tsx` — user.name available, no profile fields in IAuthUser
- `mobile/src/app/(tabs)/_layout.tsx` — 4-tab layout to extend
- `mobile/src/app/(tabs)/habits/index.tsx` — TanStack Query v5 useQuery/useMutation patterns
- `mobile/src/constants/colors.ts` — design tokens
- npm registry — node-cron v4.2.1 (created 2016, modified 2026-04-24), @types/node-cron v3.0.11
- npm registry — expo-linear-gradient v55.0.14 (created 2019, Expo monorepo)
- npm registry — @react-native-community/datetimepicker v9.1.0 (created 2019)

### Secondary (MEDIUM confidence)
- [CITED: docs.expo.dev/versions/latest/sdk/notifications/] — requestPermissionsAsync return type (`{ granted: boolean }`), Android 13+ channel requirement
- [CITED: docs.expo.dev/push-notifications/sending-notifications-custom/] — getDevicePushTokenAsync returns native FCM token

### Tertiary (LOW confidence)
- WebSearch: node-cron v4 timezone option `{ timezone: 'Asia/Ho_Chi_Minh' }` — cross-verified with GitHub repo README structure

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all packages verified on npm registry; existing packages verified in codebase
- Architecture: HIGH — derived from existing codebase patterns (habits/workouts/bmi services)
- node-cron API: MEDIUM — npm registry confirms v4.2.1 legitimate; timezone option confirmed from multiple web sources but not from official docs page (404)
- Pitfalls: HIGH — derived from codebase reading and established project patterns (D-51 UTC+7, D-22 no AsyncStorage, etc.)

**Research date:** 2026-05-19
**Valid until:** 2026-06-19 (stable libraries; node-cron v4 API unlikely to change)
