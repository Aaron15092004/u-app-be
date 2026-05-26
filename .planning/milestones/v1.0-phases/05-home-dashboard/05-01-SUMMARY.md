---
phase: 05-home-dashboard
plan: "01"
subsystem: backend-models + mobile-tokens
tags: [wave-0, schema-migration, waterlog, test-scaffold, color-tokens]
dependency_graph:
  requires: []
  provides:
    - backend/src/models/WaterLog.ts
    - backend/src/api/home/home.integration.test.ts
    - backend/src/api/water/water.integration.test.ts
    - backend/src/api/users/users.integration.test.ts
    - User schema (waterGoal, waterReminderTime, workoutReminderTime)
    - node-cron@4.2.1 installed in backend
    - expo-linear-gradient installed in mobile
    - Achievement badge color tokens
  affects:
    - All Wave 1 backend plans (05-02 through 05-07) that extend test scaffolds
    - NOTIF-02/NOTIF-03 cron scheduler (depends on node-cron + waterReminderTime/workoutReminderTime)
tech_stack:
  added:
    - node-cron@4.2.1 (backend dependency, D-81)
    - "@types/node-cron@3.0.11" (backend devDependency)
    - expo-linear-gradient@15.0.8 (mobile, Expo SDK 54 compatible)
    - "@react-native-community/datetimepicker@8.4.4" (mobile, Expo SDK 54 compatible)
  patterns:
    - MongoMemoryServer + JWT signAccessToken test scaffold (mirrors food.integration.test.ts)
    - Non-unique compound index on WaterLog (mirrors WorkoutLog pattern)
key_files:
  created:
    - backend/src/models/WaterLog.ts
    - backend/src/api/home/home.integration.test.ts
    - backend/src/api/water/water.integration.test.ts
    - backend/src/api/users/users.integration.test.ts
  modified:
    - backend/package.json (node-cron dep + 3 npm test scripts)
    - backend/src/models/User.ts (D-74 waterGoal, D-79 waterReminderTime/workoutReminderTime)
    - mobile/package.json (expo-linear-gradient + datetimepicker)
    - mobile/src/constants/colors.ts (BADGE_UNLOCKED_BG, BADGE_LOCKED, BADGE_LOCKED_BG)
    - mobile/tailwind.config.js (badge-unlocked-bg, badge-locked, badge-locked-bg)
decisions:
  - "WaterLog uses non-unique compound index { userId: 1, loggedAt: -1 } per D-73 (multiple glasses per day)"
  - "expo install resolved expo-linear-gradient@15.0.8 and @react-native-community/datetimepicker@8.4.4 as SDK 54 compatible (not 55.x/9.x as RESEARCH estimated)"
  - "All Wave 1 tests must extend these scaffolds — do not create new test files; add tests to the existing files"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-19T13:47:40Z"
  tasks_completed: 3
  tasks_total: 3
  files_created: 4
  files_modified: 5
---

# Phase 5 Plan 01: Wave 0 Foundations Summary

Wave 0 foundations installed: node-cron + expo packages, User schema migrated per D-74/D-79, WaterLog model created per D-73, three integration test scaffolds wired with MongoMemoryServer + JWT setup, and achievement badge color tokens added per D-78.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Install dependencies and migrate User schema | 39d6f85 | Done |
| 2 | Create WaterLog model and three integration test scaffolds | 8465dbb | Done |
| 3 | Add mobile achievement badge color tokens | 73f86ca | Done |

## Installed Package Versions (Exact)

### Backend
| Package | Requested | Installed | Notes |
|---------|-----------|-----------|-------|
| node-cron | 4.2.1 | 4.2.1 | Exact match |
| @types/node-cron | 3.0.11 | 3.0.11 | Exact match |

### Mobile (via npx expo install)
| Package | RESEARCH Estimate | Installed | Notes |
|---------|-------------------|-----------|-------|
| expo-linear-gradient | ~55.0.14 | 15.0.8 | Expo SDK 54 compatible (Expo chose this version) |
| @react-native-community/datetimepicker | ~9.1.0 | 8.4.4 | Expo SDK 54 compatible (Expo chose this version) |

Note: `npx expo install` resolves SDK-compatible versions automatically (RESEARCH.md Pitfall 4). The installed versions (15.0.8 / 8.4.4) are what Expo SDK 54 requires — no action needed.

## User.ts Schema Diff Summary (D-74 + D-79)

### IUser.profile interface
```diff
+ waterGoal?: number;
```

### IUser.notifications interface
```diff
- reminderTime: string;
+ waterReminderTime: string;
+ workoutReminderTime: string;
```

### UserSchema profile block
```diff
+ waterGoal: { type: Number, default: 8 },
```

### UserSchema notifications block
```diff
- reminderTime: { type: String, default: '08:00' },
+ waterReminderTime: { type: String, default: '08:00' },
+ workoutReminderTime: { type: String, default: '07:00' },
```

Migration note per RESEARCH.md A2: No production users exist — breaking change safe.

## WaterLog Model Definition

File: `backend/src/models/WaterLog.ts`

```typescript
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

WaterLogSchema.index({ userId: 1, loggedAt: -1 });  // D-73: non-unique

export default mongoose.model<IWaterLog>('WaterLog', WaterLogSchema);
```

## Test Scaffold Locations

| File | Purpose | Requirements |
|------|---------|--------------|
| `backend/src/api/home/home.integration.test.ts` | HOME summary endpoint tests | HOME-02, HOME-05, HOME-06 |
| `backend/src/api/water/water.integration.test.ts` | WaterLog CRUD + count tests | D-73 |
| `backend/src/api/users/users.integration.test.ts` | Profile stats + update tests | PRO-02, PRO-03, PRO-05 |

All three files contain:
- `process.env.*` stubs copied verbatim from `food.integration.test.ts` lines 4-19
- MongoMemoryServer `before`/`after` hooks
- `beforeEach` with two-user (userA, userB) setup for IDOR testing
- `signAccessToken` JWT for both users
- `water.integration.test.ts` also includes `WaterLog.deleteMany({})` in `beforeEach`

**IMPORTANT for Wave 1 plans:** All Wave 1 tests must extend these scaffolds — do not create new test files; add tests to the existing files.

## npm Scripts Added

```json
"test:home": "node --env-file=.env.test --require tsx/cjs --test src/api/home/home.integration.test.ts",
"test:water": "node --env-file=.env.test --require tsx/cjs --test src/api/water/water.integration.test.ts",
"test:users": "node --env-file=.env.test --require tsx/cjs --test src/api/users/users.integration.test.ts"
```

## Color Tokens Added (D-78)

### mobile/src/constants/colors.ts
```typescript
export const BADGE_UNLOCKED_BG = '#E8F5E9';
export const BADGE_LOCKED = '#BDBDBD';
export const BADGE_LOCKED_BG = '#F5F5F5';
```

### mobile/tailwind.config.js
```js
'badge-unlocked-bg': '#E8F5E9',
'badge-locked': '#BDBDBD',
'badge-locked-bg': '#F5F5F5',
```

Note: `BADGE_UNLOCKED` icon color (#4CAF50) = existing `PRIMARY`; `BADGE_LOCKED_BG` (#F5F5F5) = existing `BACKGROUND`. New tokens are semantic aliases for badge feature only.

## Deviations from Plan

### Deviation 1: expo-linear-gradient and datetimepicker installed at different versions than RESEARCH estimated

- **Found during:** Task 1
- **Issue:** RESEARCH.md estimated expo-linear-gradient ~55.0.14 and @react-native-community/datetimepicker ~9.1.0, but `npx expo install` resolved 15.0.8 and 8.4.4 respectively.
- **Fix:** Not a bug — RESEARCH.md Pitfall 4 explicitly instructs to use `npx expo install` (not npm install) so Expo resolves SDK-compatible versions. The installed versions are correct for Expo SDK 54.
- **Files modified:** mobile/package.json
- **Rule:** No rule triggered — expected behavior per Pitfall 4. Documented as informational deviation.

## Known Stubs

None. This plan creates foundation-only artifacts (models, scaffolds, tokens) — no UI rendering with stub data.

## Threat Flags

No new network endpoints, auth paths, or file access patterns introduced in this plan. WaterLog model has no routes in Wave 0 — authenticate middleware will be added in Wave 1.

## Self-Check: PASSED

- `backend/src/models/WaterLog.ts` — EXISTS
- `backend/src/api/home/home.integration.test.ts` — EXISTS
- `backend/src/api/water/water.integration.test.ts` — EXISTS
- `backend/src/api/users/users.integration.test.ts` — EXISTS
- Commit 39d6f85 — EXISTS (chore: install node-cron + expo packages + User schema migration)
- Commit 8465dbb — EXISTS (feat: WaterLog model + test scaffolds)
- Commit 73f86ca — EXISTS (feat: achievement badge color tokens)
- `cd backend && npx tsc --noEmit` — exit code 0
- `npm run test:home && npm run test:water && npm run test:users` — all pass
