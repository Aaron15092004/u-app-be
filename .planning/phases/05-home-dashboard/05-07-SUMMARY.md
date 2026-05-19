---
phase: 05-home-dashboard
plan: "07"
subsystem: mobile-profile
tags:
  - profile
  - notifications
  - ui-components
  - mmkv
  - expo-notifications
  - fcm
dependency_graph:
  requires:
    - 05-05  # API types + stubs
    - 05-06  # water.tsx cache invalidation chain
    - 05-03  # getProfileStatsApi includes notifications block (WARNING 3 fix)
    - 05-04  # registerTokenApi endpoint hardened
  provides:
    - Profile tab full implementation (PRO-01 through PRO-07)
    - Notification rationale modal (NOTIF-01)
    - Notification settings screen (NOTIF-02/03 mobile surface)
  affects:
    - mobile/src/app/(tabs)/profile/*
    - mobile/src/components/ui/*
    - mobile/src/lib/storage/mmkv.ts
tech_stack:
  added: []
  patterns:
    - StyleSheet.create (consistent with Plans 05/06 — NativeWind v4 migration deferred)
    - useEffect + null-guard seed pattern for WARNING 3 fix
    - 800ms debounce for time PATCH (useRef setTimeout)
    - TanStack Query useQuery for form initialization (not hardcoded defaults)
key_files:
  created:
    - mobile/src/components/ui/AchievementBadge.tsx
    - mobile/src/components/ui/AchievementBadgesRow.tsx
    - mobile/src/components/ui/ProfileMenuCard.tsx
    - mobile/src/components/ui/ProfileMenuRow.tsx
    - mobile/src/components/ui/NotificationRationaleModal.tsx
    - mobile/src/components/ui/NotifToggleRow.tsx
    - mobile/src/components/ui/NotifTimeRow.tsx
    - mobile/src/components/ui/FAQItem.tsx
  modified:
    - mobile/src/app/(tabs)/profile/index.tsx
    - mobile/src/app/(tabs)/profile/edit.tsx
    - mobile/src/app/(tabs)/profile/notifications.tsx
    - mobile/src/app/(tabs)/profile/help.tsx
    - mobile/src/lib/storage/mmkv.ts
decisions:
  - StyleSheet.create used for all 8 new components (WARNING 5 / validation_note — NativeWind v4 migration deferred)
  - Interim tsc run after NotificationRationaleModal (WARNING 2 mitigation — highest-risk component validated first)
  - notifications.tsx seeds form state from getProfileStatsApi().notifications via useEffect+null-guard (WARNING 3 fix)
  - Loading guard returns ActivityIndicator when waterReminder===null (before server seed) to avoid rendering toggle rows with bogus defaults
  - waterGoal invalidates ['water','today'] in edit.tsx (WARNING 4 chain — ensures water.tsx reads updated waterGoal after Profile edit)
  - auth.logout() placed on Profile tab Logout button (Pitfall 9 — Plans 06 and 07 ship in same wave, logout never absent)
  - expo-clipboard wrapped in try/require with Alert fallback for compatibility
metrics:
  duration_minutes: 45
  completed_date: "2026-05-19"
  tasks_completed: 2
  files_modified: 13
---

# Phase 5 Plan 07: Profile Tab + Notification Settings Summary

**One-liner:** Profile tab with avatar/stats/badges/menu/logout, Edit Profile PATCH, Notification Settings seeding form from server state (WARNING 3 fix), FCM permission rationale modal, Help FAQ — 8 new StyleSheet.create UI components.

## What Was Built

### Task 1 — 8 UI Components + MMKV Helper (commit: 90d6409)

**Component specs delivered:**

1. **AchievementBadge.tsx** — 56x56 circle, `medal-outline` icon. Unlocked: `BADGE_UNLOCKED_BG` (#E8F5E9) bg + `PRIMARY` (#4CAF50) icon. Locked: `BADGE_LOCKED_BG` (#F5F5F5) bg + `BADGE_LOCKED` (#BDBDBD) icon. Label "{N} ngày" below.

2. **AchievementBadgesRow.tsx** — White card, "Thành tích" title, 4 AchievementBadge using `MILESTONES = [7, 14, 28, 60]` (D-78). `unlocked = streakDays >= milestone`.

3. **ProfileMenuCard.tsx** — White card with `React.Children.map` to insert 1px #E0E0E0 dividers between children. `overflow: hidden` on outer.

4. **ProfileMenuRow.tsx** — Height 52 pressable row, icon + label (left) + chevron-forward (right). Press feedback `#F5F5F5`.

5. **NotificationRationaleModal.tsx** — Full-screen Modal (animationType='slide'). 80px notifications-outline icon, "Nhận nhắc nhở sức khỏe" title, 3 bullet rows (water/barbell/flame icons), "Bật thông báo" filled + "Để sau" outlined CTAs.
   - **Permission flow (Pitfall 8):** `requestPermissionsAsync` → if granted: `setNotificationChannelAsync` (Android only) → `getDevicePushTokenAsync` → `registerTokenApi`. Error swallowed with `console.warn`. `onAccept()` always called (so MMKV flag is set regardless of permission outcome).

6. **NotifToggleRow.tsx** — Height 64 row, label + sublabel (left), Switch with `trackColor { false: '#E0E0E0', true: PRIMARY }` (right).

7. **NotifTimeRow.tsx** — Pressable time row with `DateTimePicker` from `@react-native-community/datetimepicker@8.4.4`. `parseTimeString`/`formatTimeString` helpers. iOS: `display='inline'`, Android: `display='default'` + auto-close. Caller debounces PATCH.

8. **FAQItem.tsx** — Accordion with local `expanded` state, `chevron-down`/`chevron-forward` toggle, answer renders when expanded.

**MMKV helper additions (mobile/src/lib/storage/mmkv.ts):**
```
const NOTIF_ASKED_KEY = 'notif_permission_asked';
export function getNotifAsked(): boolean { return storage.getBoolean(NOTIF_ASKED_KEY) ?? false; }
export function setNotifAsked(value: boolean): void { storage.set(NOTIF_ASKED_KEY, value); }
```
Existing exports untouched.

**Interim tsc validation (WARNING 2):** After writing NotificationRationaleModal.tsx, `npx tsc --noEmit` was run before building the other 7 components. Only pre-existing router.d.ts errors. No new type errors from the modal.

---

### Task 2 — 4 Profile Screens (commit: 53eaea1)

**Profile tab section order (profile/index.tsx):**
1. Avatar (initial letter circle if no avatar field) + name + email
2. Stats row: streakDays (flame icon) / totalWorkouts / totalKcalBurned — from `getProfileStatsApi()`
3. AchievementBadgesRow — streakDays from `getStreakApi()`
4. ProfileMenuCard — 3 ProfileMenuRow: Edit / Notifications / Help
5. Logout: `PrimaryButton variant="outlined"` → `Alert.alert` confirm → `auth.logout()`

**Edit Profile (edit.tsx):**
- Form fields: Tên hiển thị (TextInput), Chiều cao cm (numeric), Cân nặng kg (numeric), Mục tiêu sức khỏe (3-option selector: Giảm cân/Duy trì/Tăng cân → lose/maintain/gain), Mục tiêu nước (stepper 4-16)
- PATCH body shape: `{ name?, heightCm?, weightKg?, goalType?, waterGoal }`
- **Cache invalidation list:** `['home','summary']`, `['users','profile','stats']`, `['water','today']`
- `['water','today']` invalidation is the WARNING 4 chain — ensures water.tsx reads updated `waterGoal` after Profile edit (not stale value from prior query)

**Notification Settings (notifications.tsx) — WARNING 3 fix:**

Form initialisation flow:
```
useQuery(['users','profile','stats'], getProfileStatsApi)
  └─ serverNotif = data?.notifications
     └─ useEffect: if (serverNotif && waterReminder === null) { seed all 4 state vars }
```

The `=== null` guard ensures:
- State is seeded exactly once on first server data arrival
- Subsequent query refetches (window focus, invalidation) do NOT overwrite user's in-progress edits
- Hardcoded defaults ('08:00', '07:00') are only used as `?? fallback` in render, never as initial state

PATCH timing:
- Toggle change: `mutation.mutate({ waterReminder: v })` — immediate
- Time change: `debouncedMutate({ waterReminderTime: newTime })` — 800ms debounce via `useRef<ReturnType<typeof setTimeout>>`

Rationale modal trigger:
```
useEffect(() => {
  if (!getNotifAsked()) setShowRationale(true);
}, []);
```
Both `handleAccept` and `handleDismiss` call `setNotifAsked(true)` — modal shown at most once per device.

**Permission flow sequence:**
```
NotificationRationaleModal "Bật thông báo" pressed
  → requestPermissionsAsync()
  → (granted && Android) setNotificationChannelAsync('default', MAX)   ← Pitfall 8
  → getDevicePushTokenAsync()
  → registerTokenApi(tokenData.data, platform)                         ← POST /api/notifications/register-token
  → (always) onAccept()                                                ← sets MMKV flag
```

**Help screen (help.tsx):**
- FAQ card: 4 FAQItem accordion items (Câu hỏi thường gặp)
- Contact card: email row (support@u-app.vn) with `copy-outline` clipboard copy + Alert feedback; version row from `Constants.expoConfig?.version` (fallback 'v1.0.0')

---

## Styling Decision (WARNING 5 / validation_note)

All 8 new components use `StyleSheet.create`, consistent with existing Phase 5 components (WeeklyStatCard, TodaySummaryCard, WaterControls, etc.). NativeWind v4 migration is deferred to a dedicated UI refactor phase. Plan 07 size note: completed without splitting (WARNING 2); interim tsc validation after NotificationRationaleModal mitigated the risk.

---

## Deviations from Plan

None — plan executed exactly as written.

**router.d.ts note:** New linting errors for `router.push('/(tabs)/profile/edit')` etc. in profile/index.tsx are the same pre-existing pattern as `router.push('/(home)/water')` in index.tsx from Plan 06 and `router.push('/(tabs)/')` in login.tsx from Plan 02. All are router.d.ts type generation issues that resolve on `expo start` (STATE.md: "pre-existing router.d.ts errors only").

---

## Task 3 — Device Verification Checkpoint (PENDING)

**Status:** Awaiting human operator confirmation.

Manual checkpoint covers:
- Home dashboard render (Plans 05/06)
- Water log +/- flow (Plan 06)
- Profile tab navigation, stats, badges, menu (this plan)
- Edit profile PATCH + cache invalidation chain including waterGoal (WARNING 4 step 6)
- Notification rationale shown ONCE (MMKV flag)
- Notification settings persist saved times across screen close/open (WARNING 3 step 11)
- FCM water/workout reminders arrive at configured time (NOTIF-02/03)
- Streak alert at 20:00 UTC+7 (NOTIF-04)
- Help FAQ accordion + email clipboard
- Logout flow

The checkpoint is a blocking gate (`gate="blocking"`) — plan is not fully complete until the operator types 'approved' after device verification.

---

## Self-Check

- [x] 8 component files exist under mobile/src/components/ui/
- [x] 4 screen files replaced (no longer Plan 05 stubs)
- [x] mmkv.ts has getNotifAsked/setNotifAsked
- [x] Task 1 commit: 90d6409
- [x] Task 2 commit: 53eaea1
- [x] TypeScript: only pre-existing router.d.ts errors

## Self-Check: PASSED
