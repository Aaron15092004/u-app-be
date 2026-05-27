---
status: complete
created: 2026-05-27
quick_id: 260527-mfj
slug: fix-notification-reminders
---

# Quick Task: Fix Notification Reminders

## Goal

Fix reminder notifications for water, workout, and sữa Ủ while preventing the mobile notification permission flow from failing on missing Firebase/FCM initialization.

## Scope

- Add nut-milk reminder settings to backend user notification state.
- Add nut-milk reminder controls to the mobile notification settings screen.
- Schedule local daily reminders on-device for water, workout, and sữa Ủ.
- Keep remote push-token registration non-blocking and out of the permission modal path.

## Verification

- `npm run typecheck` in `backend`
- `npx tsc --noEmit` in `mobile`
- `node --require tsx/cjs --test src/api/users/users.integration.test.ts` in `backend`
