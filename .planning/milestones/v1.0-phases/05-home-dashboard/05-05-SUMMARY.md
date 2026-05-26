---
phase: 05-home-dashboard
plan: "05"
subsystem: mobile-api-contracts + route-scaffolding
tags: [wave-2, mobile, types, api-modules, routing, stub-screens, profile-tab]
dependency_graph:
  requires:
    - 05-02 (backend /api/water/today response with waterGoal — WARNING 4 fix)
    - 05-03 (backend /api/users/profile/stats with notifications block — WARNING 3 fix)
    - 05-04 (backend /api/notifications/register-token hardened with authenticate)
  provides:
    - mobile/src/lib/api/types.ts (Phase 5 types block appended)
    - mobile/src/lib/api/home.api.ts (getTodaySummaryApi, getShopUrlApi)
    - mobile/src/lib/api/water.api.ts (logWaterApi, getTodayWaterApi, deleteWaterApi)
    - mobile/src/lib/api/users.api.ts (getProfileStatsApi, updateProfileApi, updateNotificationsApi)
    - mobile/src/lib/api/notifications.api.ts (registerTokenApi)
    - mobile/src/app/(tabs)/_layout.tsx (5th Profile tab registered)
    - mobile/src/app/(tabs)/profile/_layout.tsx (Stack layout — Pitfall 5)
    - mobile/src/app/(home)/_layout.tsx (Stack layout — Pitfall 6)
    - 5 stub screens for Wave 3 plans to fill in
  affects:
    - Plan 06 (Home dashboard): consumes ITodaySummary, ITodayWater, getTodaySummaryApi, getTodayWaterApi, logWaterApi, deleteWaterApi, getShopUrlApi
    - Plan 07 (Profile screens): consumes IProfileStats, IUserNotifications, getProfileStatsApi, updateProfileApi, updateNotificationsApi, registerTokenApi; replaces stub screens
tech_stack:
  added: []
  patterns:
    - apiClient.get<{ success: boolean; data: T }> pattern (consistent with habits.api.ts / bmi.api.ts)
    - Stack layout in route groups prevents sub-screens from appearing as tabs (Pitfall 5/6)
    - Stub screens with SafeAreaView + ScreenHeader + placeholder Text (no data fetching)
    - Import apiClient from './client' (single instance — JWT interceptor + refresh preserved)
key_files:
  created:
    - mobile/src/lib/api/home.api.ts
    - mobile/src/lib/api/water.api.ts
    - mobile/src/lib/api/users.api.ts
    - mobile/src/lib/api/notifications.api.ts
    - mobile/src/app/(tabs)/profile/_layout.tsx
    - mobile/src/app/(tabs)/profile/index.tsx
    - mobile/src/app/(tabs)/profile/edit.tsx
    - mobile/src/app/(tabs)/profile/notifications.tsx
    - mobile/src/app/(tabs)/profile/help.tsx
    - mobile/src/app/(home)/_layout.tsx
    - mobile/src/app/(home)/water.tsx
  modified:
    - mobile/src/lib/api/types.ts (Phase 5 types block appended at end)
    - mobile/src/app/(tabs)/_layout.tsx (5th Profile tab added after BMI)
decisions:
  - "ITodayWater includes waterGoal field (WARNING 4 fix) — Plan 06 water screen reads waterGoal from getTodayWaterApi, no second roundtrip to /api/home/today-summary"
  - "IProfileStats includes notifications: IUserNotifications block (WARNING 3 fix) — Plan 07 notifications screen initialises form state from getProfileStatsApi().notifications, not hardcoded defaults"
  - "All 4 new API modules import apiClient from './client' — JWT interceptor + refresh logic preserved (T-05-05-02 mitigated)"
  - "(tabs)/profile/_layout.tsx is Stack with headerShown false — profile sub-screens push via router.push, not separate tabs (Pitfall 5)"
  - "(home)/_layout.tsx is Stack with headerShown false — water.tsx pushes from Home tab (Pitfall 6)"
  - "Profile tab is 5th tab after BMI with Ionicons person/person-outline icons and title 'Hồ sơ' (D-76)"
  - "Plan 05 requirements scope: HOME-01-06 + PRO-01/04/06/07 + NOTIF-01 contract surface only (per checker WARNING 1); PRO-02/03/05 + NOTIF-02/03 full implementation owned by Plan 07"
metrics:
  duration: "~15 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_created: 11
  files_modified: 2
---

# Phase 5 Plan 05: Mobile API Contracts + Route Scaffolding Summary

Wave 2 mobile foundations — five Phase 5 TypeScript interfaces (ITodayWater.waterGoal + IProfileStats.notifications WARNING fixes), four API modules (9 functions total), 5th Profile tab registration, Stack route-group layouts, and five stub screens for Wave 3.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Append Phase 5 types + create 4 API modules | ca483a4 | types.ts, home.api.ts, water.api.ts, users.api.ts, notifications.api.ts |
| 2 | Register 5th Profile tab + route groups + stub screens | 40cdedd | (tabs)/_layout.tsx, profile/_layout.tsx, (home)/_layout.tsx, 5 stub screens |

## Phase 5 Types Block (Final — Copy-Paste Ready)

```typescript
// ---------------------------------------------------------------------------
// Phase 5 Types — Home Dashboard, Profile & Notifications
// ---------------------------------------------------------------------------

export interface ITodaySummary {
  kcalConsumed: number;
  macros: { protein: number; carbs: number; fat: number };
  waterGlasses: number;
  waterGoal: number;
  workoutMinutes: number;
  bmi: { value: number; category: string } | null;
}

export interface IWaterLog {
  _id: string;
  userId: string;
  loggedAt: string;
  createdAt: string;
}

export interface ITodayWater {
  logs: IWaterLog[];
  count: number;
  waterGoal: number; // WARNING 4 fix
}

export interface IUserNotifications {
  waterReminder: boolean;
  workoutReminder: boolean;
  waterReminderTime: string;
  workoutReminderTime: string;
}

export interface IProfileStats {
  streakDays: number;
  totalWorkouts: number;
  totalKcalBurned: number;
  notifications: IUserNotifications; // WARNING 3 fix
}
```

## All 9 API Function Signatures

### home.api.ts
```typescript
getTodaySummaryApi(): Promise<ITodaySummary>
getShopUrlApi(): Promise<{ url: string }>
```

### water.api.ts
```typescript
logWaterApi(loggedAt?: string): Promise<IWaterLog>
getTodayWaterApi(): Promise<ITodayWater>
deleteWaterApi(id: string): Promise<void>
```

### users.api.ts
```typescript
getProfileStatsApi(): Promise<IProfileStats>
updateProfileApi(body: { name?: string; heightCm?: number; weightKg?: number; goalType?: 'lose' | 'maintain' | 'gain'; waterGoal?: number }): Promise<{ name: string; email: string; profile: object }>
updateNotificationsApi(body: Partial<IUserNotifications>): Promise<{ notifications: IUserNotifications }>
```

### notifications.api.ts
```typescript
registerTokenApi(token: string, platform: 'ios' | 'android'): Promise<void>
```

## Tab Layout Final Structure (5 tabs)

```
(tabs)/_layout.tsx
  <Tabs>
    <Tabs.Screen name="index"     title="Trang chủ"  icon: home/home-outline />
    <Tabs.Screen name="exercises" title="Tập luyện"  icon: barbell/barbell-outline />
    <Tabs.Screen name="habits"    title="Thói quen"  icon: checkmark-circle/checkmark-circle-outline />
    <Tabs.Screen name="bmi"       title="BMI"        icon: body/body-outline />
    <Tabs.Screen name="profile"   title="Hồ sơ"      icon: person/person-outline />  ← NEW (D-76)
  </Tabs>
```

## Route Paths (All Resolve)

| Path | File | Status |
|------|------|--------|
| `/(tabs)/profile` | `(tabs)/profile/index.tsx` | Stub (Plan 07 replaces) |
| `/(tabs)/profile/edit` | `(tabs)/profile/edit.tsx` | Stub (Plan 07 replaces) |
| `/(tabs)/profile/notifications` | `(tabs)/profile/notifications.tsx` | Stub (Plan 07 replaces) |
| `/(tabs)/profile/help` | `(tabs)/profile/help.tsx` | Stub (Plan 07 replaces) |
| `/(home)/water` | `(home)/water.tsx` | Stub (Plan 06 replaces) |

## Notes for Downstream Plans

### Note for Plan 06 (Home Dashboard)

- `water.tsx` must read `waterGoal` directly from `getTodayWaterApi()` response.
- Do NOT call `getTodaySummaryApi()` again just to get `waterGoal` — that was the WARNING 4 anti-pattern.
- `(home)/water.tsx` stub is ready at `mobile/src/app/(home)/water.tsx` — replace with full implementation.

### Note for Plan 07 (Profile Screens)

- `notifications.tsx` must initialise form state from `getProfileStatsApi().notifications`.
- Do NOT hardcode defaults like `'08:00'` / `'07:00'` — that was the WARNING 3 anti-pattern.
- All 4 profile stub screens are ready to be replaced: `index.tsx`, `edit.tsx`, `notifications.tsx`, `help.tsx`.
- After FCM permission grant: call `registerTokenApi(token, platform)` — backend now requires `authenticate` middleware.

### Requirements Scope Note (checker WARNING 1)

Plan 05 only delivers contract surface:
- HOME-01–06: types + API modules
- PRO-01 (5th tab), PRO-04 (profile stub), PRO-06 (help stub), PRO-07 (logout placeholder in profile stub)
- NOTIF-01: notifications stub screen so route resolves

Full implementation:
- PRO-02/03/05 (avatar, edit profile, badge screen) → Plan 07
- NOTIF-02/03 (rationale modal, FCM permission flow) → Plan 07

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| `ProfileScreen` | `(tabs)/profile/index.tsx` | Plan 07 replaces with full implementation |
| `EditProfileScreen` | `(tabs)/profile/edit.tsx` | Plan 07 replaces with full implementation |
| `NotificationSettingsScreen` | `(tabs)/profile/notifications.tsx` | Plan 07 replaces with full implementation |
| `HelpScreen` | `(tabs)/profile/help.tsx` | Plan 07 replaces with full implementation |
| `WaterLogScreen` | `(home)/water.tsx` | Plan 06 replaces with full implementation |

All stubs render SafeAreaView + ScreenHeader + placeholder Text only. No data fetching. These stubs are intentional — they allow router.push paths to resolve in Plan 06/07 before the real content is implemented.

## Threat Flags

No new threat surface beyond what the plan's threat model covers. All T-05-05-01 through T-05-05-03 mitigations implemented:
- T-05-05-01: API modules only send fields matching backend Zod whitelist schemas
- T-05-05-02: All modules import `apiClient from './client'` — single instance confirmed
- T-05-05-03: Stub screens render placeholder Text only; no PII risk

## Self-Check: PASSED
