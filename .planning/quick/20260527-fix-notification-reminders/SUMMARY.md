---
status: complete
completed: 2026-05-27
quick_id: 260527-mfj
slug: fix-notification-reminders
---

# Summary

Implemented local daily reminder scheduling for water, workout, and sữa Ủ. The notification rationale modal now only requests local notification permission and creates the Android channel; it no longer calls native device push token APIs that require Firebase/FCM credentials.

Backend user notification settings now persist `nutMilkReminder` and `nutMilkReminderTime`, expose them in profile stats, validate PATCH payloads, and include a server-side cron dispatcher for remote nut-milk reminders when FCM is configured.

Verification passed:

- `backend`: `npm run typecheck`
- `mobile`: `npx tsc --noEmit`
- `backend`: `node --require tsx/cjs --test src/api/users/users.integration.test.ts`
