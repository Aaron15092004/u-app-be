---
phase: 5
slug: home-dashboard-profile-notifications
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-05-19
---

# Phase 5 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Node.js built-in `node:test` + `supertest` (backend) |
| **Config file** | none — per-module test files, run via `package.json` scripts |
| **Quick run command** | `cd backend && node --env-file=.env.test --require tsx/cjs --test src/api/home/home.integration.test.ts` |
| **Full suite command** | `cd backend && npm run test:home && npm run test:water && npm run test:users` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run quick run command for the relevant API module
- **After every plan wave:** Run full suite command
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Mobile Verification Strategy

Phase 5 mobile plans (05, 06, 07) use TypeScript strict compilation (`npx tsc --noEmit`) as their automated verification gate rather than React Native Testing Library behavioral tests. This is intentional and compliant with the Nyquist rule under the following conditions:

**Why behavioral tests are deferred for mobile in Phase 5:**

- `expo-notifications` permission flow (`requestPermissionsAsync`, `getDevicePushTokenAsync`) requires a real OS permission dialog — not exercisable in jsdom or Expo Go.
- `@react-native-community/datetimepicker` UI is a native module — not testable in jsdom.
- MMKV (`react-native-mmkv`) requires a development build — per STATE.md "MMKV, Google Sign-In, Apple Sign-In mocked for Expo Go testing".
- `expo-linear-gradient` GPU rendering and `expo-linking` system browser launch cannot be exercised in CI.

**What TypeScript compilation catches:**

- API contract drift between mobile types (`ITodayWater.waterGoal`, `IProfileStats.notifications`) and backend response shapes from Plans 02 and 03. This is the primary regression risk for mobile interface-first plans.
- Invalid prop types on new UI components (AchievementBadge, NotificationRationaleModal, etc.).
- Import path errors across the new route groups `(tabs)/profile/` and `(home)/`.

**Phase-level behavioral gate:**
All mobile behavioral verification is consolidated into the blocking-human checkpoint at **Plan 07 Task 3** ("Phase 5 device verification"). That checkpoint executes 17 manual steps on a real EAS development build covering: home dashboard render, water log +/- flow (WARNING 4 waterGoal propagation), profile tab navigation, edit profile PATCH, notification settings initialisation from saved state (WARNING 3 persistence), rationale modal (once only), FCM water/workout reminders at configured time, FCM streak alert at 20:00 UTC+7, help screen FAQ + clipboard, and logout.

**Nyquist compliance rationale:**

- Plans 01–04 (backend, Waves 0–1): full integration test suites via `npm run test:home`, `npm run test:water`, `npm run test:users`, plus `npx tsc --noEmit`. All IDOR, mass-assignment, and UTC+7 boundary behaviors have automated integration tests.
- Plans 05–07 (mobile, Waves 2–3): `npx tsc --noEmit` per task; full E2E behavioral verification at Plan 07 Task 3 device checkpoint. This satisfies Nyquist behavioral coverage at the phase level because the device checkpoint is a blocking gate — Plans 05–07 cannot be marked complete until the checkpoint passes.

`wave_0_complete` will flip to `true` after Plan 01 executes and the three integration test scaffolds are created and green.

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Threat Ref | Secure Behavior | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|------------|-----------------|-----------|-------------------|-------------|--------|
| 5-01-01 | 01 | 1 | HOME-02 | IDOR | userId from JWT not body | integration | `npm run test:home` | ❌ Wave 0 | ⬜ pending |
| 5-01-02 | 01 | 1 | PRO-02 | IDOR | profile/stats scoped to req.user.id | integration | `npm run test:users` | ❌ Wave 0 | ⬜ pending |
| 5-01-03 | 01 | 1 | PRO-03 | Mass assign | Zod whitelist on PATCH /api/users/profile | integration | `npm run test:users` | ❌ Wave 0 | ⬜ pending |
| 5-01-04 | 01 | 1 | PRO-05 | Mass assign | Zod whitelist on PATCH /api/users/notifications | integration | `npm run test:users` | ❌ Wave 0 | ⬜ pending |
| 5-01-05 | 01 | 1 | HOME-06 | Open redirect | URL from env var only, not user input | integration | `npm run test:home` | ❌ Wave 0 | ⬜ pending |
| 5-01-06 | 01 | 1 | D-73 | IDOR | WaterLog.deleteOne({ _id, userId }) | integration | `npm run test:water` | ❌ Wave 0 | ⬜ pending |
| 5-05-01 | 05 | 2 | HOME-01–06 | N/A | API contract types compile against backend shapes | tsc | `cd mobile && npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-05-02 | 05 | 2 | PRO-01, PRO-04 | N/A | Route group stack layouts resolve; 5th tab wired | tsc | `cd mobile && npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-06-01 | 06 | 3 | HOME-01–06 | N/A | Home Dashboard + Water screen compile; no D-69 remnants | tsc | `cd mobile && npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-07-01 | 07 | 3 | PRO-01–07, NOTIF-01 | N/A | Profile + Notification components compile; interim tsc after NotificationRationaleModal | tsc | `cd mobile && npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-07-02 | 07 | 3 | PRO-01–07, NOTIF-01 | N/A | Profile/Edit/Notifications/Help screens compile | tsc | `cd mobile && npx tsc --noEmit` | ✅ | ⬜ pending |
| 5-xx-01 | xx | x | NOTIF-01 | N/A | Rationale shown once (MMKV flag) | manual | — | manual-only | ⬜ pending |
| 5-xx-02 | xx | x | NOTIF-02 | N/A | FCM water reminder fires at correct UTC+7 time | manual | — | manual-only | ⬜ pending |
| 5-xx-03 | xx | x | NOTIF-03 | N/A | FCM workout reminder fires at correct UTC+7 time | manual | — | manual-only | ⬜ pending |
| 5-xx-04 | xx | x | NOTIF-04 | N/A | Streak alert cron fires at 20:00 UTC+7 | manual | — | manual-only | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] `backend/src/api/home/home.integration.test.ts` — covers HOME-02 (today-summary), HOME-05 (BMI widget data), HOME-06 (shop-url)
- [ ] `backend/src/api/water/water.integration.test.ts` — covers D-73 (WaterLog CRUD + countDocuments today)
- [ ] `backend/src/api/users/users.integration.test.ts` — covers PRO-02 (profile/stats), PRO-03 (PATCH profile), PRO-05 (PATCH notifications)
- [ ] Add `test:home`, `test:water`, `test:users` scripts to `backend/package.json`

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Home Dashboard renders greeting, 3 summary cards, banner, quick actions, BMI widget, macro progress bars | HOME-01 | React Native layout — not testable in jsdom | Run EAS dev build; log in; verify Home tab per UI-SPEC Screen 1 section order |
| Water Log screen shows count/goal and +/- controls; goal sourced from /api/water/today | HOME-04 | Native ScrollView + TanStack mutation chain — not testable in jsdom | Tap water card on Home; verify "X / 8" (WARNING 4); tap +; verify count increments and home dashboard refreshes |
| Edit Profile form updates waterGoal and water screen reflects new goal | PRO-03 | Cross-screen cache invalidation chain requires live device | Change waterGoal from 8 to 12 in Edit Profile; navigate to water screen; verify "X / 12" |
| Notification Settings screen shows saved notification times on re-open | PRO-05 | MMKV + native DateTimePicker + cross-screen state | Set waterReminderTime to '11:30'; leave screen; reopen; verify '11:30' displayed (WARNING 3 check) |
| Notification permission rationale shown only once | NOTIF-01 | UI flow with MMKV flag — no backend call | Uninstall/clear data; open app; navigate to Profile → Notifications; confirm modal appears; dismiss; reopen — modal should not reappear |
| FCM water reminder delivered at configured time | NOTIF-02 | Cron timing requires real FCM delivery on device | Set waterReminderTime to 2 min from now; wait; verify FCM notification on device |
| FCM workout reminder delivered at configured time | NOTIF-03 | Cron timing requires real FCM delivery on device | Set workoutReminderTime to 2 min from now; wait; verify FCM notification on device |
| Streak alert sent at 20:00 UTC+7 for at-risk users | NOTIF-04 | Cron timing + real FCM on device | Set up user with streak > 0 and < 3 habits logged; wait until 20:00 UTC+7; verify FCM notification |

All manual-only verifications are consolidated into the **Plan 07 Task 3 blocking device checkpoint**.

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: backend plans 01-04 have full integration tests; mobile plans 05-07 use tsc + phase-level blocking checkpoint (see Mobile Verification Strategy)
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
