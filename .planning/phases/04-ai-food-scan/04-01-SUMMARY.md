---
phase: "04"
plan: "01"
subsystem: "ai-food-scan"
tags: [dependencies, packages, test-scaffold, openai, expo-camera]
dependency_graph:
  requires: []
  provides:
    - openai npm package in backend (Phase 4 backend plans)
    - expo-camera in mobile (Phase 4 scan screen)
    - food integration test scaffold (gates all Phase 4 backend work)
  affects:
    - backend/package.json
    - mobile/package.json
    - backend/src/api/food/food.integration.test.ts
tech_stack:
  added:
    - openai@^6.38.0 (backend dependency — official OpenAI Node.js SDK)
    - expo-camera@~17.0.10 (mobile — CameraView, useCameraPermissions, SDK 54)
    - expo-image-picker@~17.0.11 (mobile — upgraded from SDK 51 ~15.0.0)
    - expo-image-manipulator@~14.0.8 (mobile — upgraded from SDK 51 ~12.0.0)
  patterns:
    - Node.js built-in test runner (node:test) + supertest + MongoMemoryServer
    - env stubs before imports pattern (prevents key-not-found on import)
    - assert.fail('TODO') for pending test cases (activatable per-plan)
key_files:
  created:
    - backend/src/api/food/food.integration.test.ts
  modified:
    - backend/package.json (added openai dep + test:food script)
    - mobile/package.json (added expo-camera, upgraded image packages)
    - backend/package-lock.json
    - mobile/package-lock.json
decisions:
  - "OPENAI_API_KEY='test-key' stub added at test file top — never use real key in tests (T-04-02 threat mitigation)"
  - "expo-image-picker/manipulator upgraded to SDK 54 with --legacy-peer-deps due to React 19 peer conflict in the project"
  - "expo-camera installed at ~17.0.10 (SDK 54 compatible, not ~15.0.0 as originally noted in research)"
metrics:
  duration: "~3 minutes 30 seconds"
  completed_date: "2026-05-19"
  tasks_completed: 2
  files_created: 1
  files_modified: 4
---

# Phase 4 Plan 01: Dependencies + Test Scaffold Summary

**One-liner:** Install openai backend SDK + expo-camera mobile package and create 7-case integration test scaffold gating all Phase 4 food API work.

## What Was Built

### Task 1: Package installations

- **backend**: `npm install openai` → `openai@^6.38.0` added to dependencies. Verified via `node -e "require('openai'); console.log('ok')"`.
- **mobile**: `npx expo install expo-camera` → `expo-camera@~17.0.10` (SDK 54 compatible). This resolves the RESEARCH.md Pitfall 1 (missing expo-camera causing scan screen crash).
- **mobile**: `expo-image-picker` upgraded from `~15.0.0` (SDK 51) to `~17.0.11` (SDK 54). `expo-image-manipulator` upgraded from `~12.0.0` (SDK 51) to `~14.0.8`. The `npx expo install` command for these two packages hit a React 19/react-dom@18.3.1 peer dep conflict (pre-existing in the project). Applied `--legacy-peer-deps` as a workaround — packages install and work correctly in Expo Go.

### Task 2: Food integration test scaffold

- Created `backend/src/api/food/food.integration.test.ts` following the exact bmi.integration.test.ts pattern.
- 7 test cases covering all Phase 4 backend requirements (FOOD-01/02/05/07/08/09 + D-72 rate limit).
- Each test uses `assert.fail('TODO: implement when routes exist')` — activatable per-plan as routes are added.
- `OPENAI_API_KEY = 'test-key'` stub at file top prevents import-time errors.
- Added `"test:food"` script to `backend/package.json` following the `test:bmi` pattern.
- `npm run test:food` starts without any "Cannot find module" errors — suite runs with 7 pending failures.

## Verification Results

| Check | Result |
|-------|--------|
| `node -e "require('openai')"` exits 0 | PASSED |
| `grep '"expo-camera"' mobile/package.json` | PASSED (1 match) |
| `npm run test:food` starts without import errors | PASSED (7 todo failures, no crashes) |
| `grep '"test:food"' backend/package.json` | PASSED (1 match) |

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | 9ded3cb | chore(04-01): install openai (backend) + expo-camera/image packages (mobile) |
| Task 2 | 7efc935 | test(04-01): add food integration test scaffold + test:food script |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] expo-image-picker/manipulator upgrade via npx expo install failed with peer dep conflict**

- **Found during:** Task 1
- **Issue:** `npx expo install expo-image-picker expo-image-manipulator` exited with `ERESOLVE: react@19.0.0 vs react-dom@18.3.1` peer dependency conflict. This is a pre-existing conflict in the project (React 19 while some transitive deps expect React 18).
- **Fix:** Used `npm install expo-image-picker@~17.0.11 expo-image-manipulator@~14.0.8 --legacy-peer-deps`. Packages install correctly and are verified in `node_modules`.
- **Files modified:** mobile/package.json, mobile/package-lock.json
- **Commit:** 9ded3cb

**2. [Rule 3 - Info] expo-camera resolved to ~17.0.10 not ~15.0.0**

- **Found during:** Task 1
- **Issue:** PLAN.md and RESEARCH.md mentioned `expo-camera ~15.0.0` (SDK 51 tag), but `npx expo install expo-camera` resolved to `~17.0.10` (SDK 54 tag) — the correct current SDK 54 compatible version.
- **Fix:** Accepted SDK 54 version. This is better than SDK 51. No action needed.
- **Commit:** 9ded3cb

## Known Stubs

None. This plan installs packages and creates a test scaffold only. No UI or API stubs.

## Threat Flags

None. No new network endpoints or auth paths introduced. OPENAI_API_KEY threat (T-04-02) mitigated by using literal `'test-key'` string in test file.

## Self-Check: PASSED

- [x] `backend/src/api/food/food.integration.test.ts` exists (min_lines: 60, actual: 158)
- [x] `backend/package.json` contains "openai" and "test:food"
- [x] `mobile/package.json` contains "expo-camera"
- [x] Commits 9ded3cb and 7efc935 exist in git log
- [x] `npm run test:food` starts without module errors
