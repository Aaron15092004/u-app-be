# Phase 5: Home Dashboard, Profile & Notifications - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-05-19
**Phase:** 5-Home Dashboard, Profile & Notifications
**Areas discussed:** Water tracking, Tab structure + Profile nav, Notification times, Ủ Shop banner

---

## Water tracking

| Option | Description | Selected |
|--------|-------------|----------|
| Simple daily counter | WaterIntake model: one doc per user per day, glasses: Number | |
| Full WaterLog collection | Each glass = separate document (userId, loggedAt) | ✓ |
| Embedded in User.todayStats | Denormalized in User document | |

**User's choice:** Full WaterLog collection

| Option | Description | Selected |
|--------|-------------|----------|
| Hardcode 8 glasses | Standard recommendation, simple v1 | |
| User-configurable goal | waterGoal field in User.profile, set in Profile settings | ✓ |

**User's choice:** User-configurable goal

| Option | Description | Selected |
|--------|-------------|----------|
| Tap widget to +1 | Increment directly from Home dashboard card | |
| Dedicated water log screen | Modal/screen with +/- controls and history | ✓ |

**User's choice:** Dedicated water log screen

---

## Tab structure + Profile nav

| Option | Description | Selected |
|--------|-------------|----------|
| 5th tab (person icon) | Profile as proper tab next to BMI | ✓ |
| Profile from Home header avatar | No new tab, navigate from header | |
| Replace BMI tab with Profile | Merge BMI into Profile tab, keep 4 tabs | |

**User's choice:** 5th tab (person icon)

| Option | Description | Selected |
|--------|-------------|----------|
| Separate Edit Profile screen | Push navigation to edit screen | ✓ |
| Inline editing on Profile | Tap-to-edit inline | |

**User's choice:** Separate Edit Profile screen

| Option | Description | Selected |
|--------|-------------|----------|
| Badge row in Profile screen | Horizontal 4 badges below stats | |
| Achievement modal from Profile | Full-screen achievement list | |
| You decide | Claude picks implementation | ✓ |

**User's choice:** You decide (Claude's discretion)

---

## Notification times

| Option | Description | Selected |
|--------|-------------|----------|
| Separate times for each | waterReminderTime + workoutReminderTime | ✓ |
| One shared reminder time | Keep single reminderTime for both | |

**User's choice:** Separate times for each

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed 20:00 if no habits done | Daily cron, send if < 3 habits checked | ✓ |
| 9 hours before midnight (15:00) | Earlier warning | |
| User-configurable streak alert time | User sets in settings | |

**User's choice:** Fixed 20:00 if no habits done yet

| Option | Description | Selected |
|--------|-------------|----------|
| node-cron per-minute job | Check each minute, match user reminder times | ✓ |
| Daily batch at fixed UTC times | Run hourly, group by reminder time | |

**User's choice:** node-cron per-minute job

---

## Ủ Shop banner

| Option | Description | Selected |
|--------|-------------|----------|
| Placeholder URL | Hardcoded placeholder URL | |
| Configurable URL from backend | /api/config/shop-url endpoint, env var | ✓ |

**User's choice:** Configurable URL from backend

| Option | Description | Selected |
|--------|-------------|----------|
| System browser | expo-linking Linking.openURL (already available) | ✓ |
| In-app WebView | react-native-webview install + new screen | |

**User's choice:** System browser (expo-linking)

---

## Claude's Discretion

- Achievement badges placement and visual design (badge row in Profile, green/gray states)
- Dashboard aggregation strategy (single /api/home/today-summary vs multiple queries)
- Help & Support screen format (PRO-06)
- Notification rationale screen format (NOTIF-01)

## Deferred Ideas

- Custom habit creation — v2
- Food tab (5th) — Phase 4 D-68; keeping food as stack routes
- Water intake history chart (multi-day) — v2
- Multiple daily water reminders — v2
