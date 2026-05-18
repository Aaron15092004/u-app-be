---
phase: "03"
plan: "05"
subsystem: mobile-infra
tags: [tab-layout, design-tokens, api-clients, zustand, typescript]
dependency_graph:
  requires: [03-01, 03-02, 03-03, 03-04]
  provides: [tab-navigation, color-tokens, exercise-api, workout-api, habit-api, bmi-api, timer-store]
  affects: [mobile-ui, mobile-state]
tech_stack:
  added: []
  patterns: [expo-router-tabs, zustand-bare-create, axios-typed-api]
key_files:
  created:
    - mobile/src/lib/api/exercises.api.ts
    - mobile/src/lib/api/workouts.api.ts
    - mobile/src/lib/api/habits.api.ts
    - mobile/src/lib/api/bmi.api.ts
    - mobile/src/stores/timerStore.ts
  modified:
    - mobile/src/app/(tabs)/_layout.tsx
    - mobile/tailwind.config.js
    - mobile/src/constants/colors.ts
    - mobile/src/lib/api/types.ts
decisions:
  - "TEXT_SECONDARY already existed in colors.ts — used directly (no fallback needed)"
  - "timerStore uses bare create() with no persist — in-memory only as specified"
  - "Pre-existing TS errors (expo-apple-authentication, @react-native-google-signin) are not from this plan"
metrics:
  duration: "~10 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_changed: 9
---

# Phase 03 Plan 05: Mobile Infrastructure — 4-Tab Layout, Design Tokens, API Clients, Timer Store

## One-liner

4-tab Expo Router layout with Ionicons, 11 NativeWind color tokens, typed Axios API clients for exercises/workouts/habits/BMI, and in-memory Zustand timer store.

## What Was Built

### Task 1: Tab Layout + Design Tokens

**_layout.tsx** — Replaced 1-tab stub with 4-tab layout:

| Tab | Screen name | Icon (focused) | Icon (unfocused) |
|-----|-------------|----------------|------------------|
| Trang chủ | index | home | home-outline |
| Tập luyện | exercises | barbell | barbell-outline |
| Thói quen | habits | checkmark-circle | checkmark-circle-outline |
| BMI | bmi | body | body-outline |

**tailwind.config.js** — Added 11 new tokens (all existing tokens preserved):

| Token | Hex |
|-------|-----|
| timer-bg | #FF6B35 |
| bmi-underweight | #64B5F6 |
| bmi-normal | #4CAF50 |
| bmi-overweight | #FFA726 |
| bmi-obese | #EF5350 |
| habit-active | #4CAF50 |
| habit-inactive | #E0E0E0 |
| streak-badge | #FF6B35 |
| difficulty-easy | #4CAF50 |
| difficulty-medium | #FFA726 |
| difficulty-hard | #EF5350 |

**colors.ts** — Appended 11 UPPER_SNAKE_CASE constants below existing 8:
`TIMER_BG`, `BMI_UNDERWEIGHT`, `BMI_NORMAL`, `BMI_OVERWEIGHT`, `BMI_OBESE`,
`HABIT_ACTIVE`, `HABIT_INACTIVE`, `STREAK_BADGE`, `DIFFICULTY_EASY`, `DIFFICULTY_MEDIUM`, `DIFFICULTY_HARD`

### Task 2: API Types + 4 API Client Modules

**types.ts** — Appended 18 new Phase 3 exports below existing 13 auth exports (total 31 exports):

**Type exports added:**

| Type | Category |
|------|----------|
| `ICategory` | Exercise union type |
| `IDifficulty` | Exercise union type |
| `IExerciseStep` | Exercise interface |
| `IExercise` | Exercise interface |
| `ICreateWorkoutLog` | Workout interface |
| `IWorkoutLog` | Workout interface |
| `IWeeklyStats` | Workout interface |
| `IHabitId` | Habit union type |
| `ITodayHabits` | Habit interface |
| `IWeeklyHabit` | Habit interface |
| `IStreak` | Habit interface |
| `IBMICategory` | BMI union type |
| `IBMIRecord` | BMI interface |
| `ISaveBMIResponse` | BMI interface |
| `IBMIHistoryEntry` | BMI interface |

**API function signatures:**

```typescript
// exercises.api.ts
listExercisesApi(category?: ICategory): Promise<IExercise[]>
getExerciseApi(id: string): Promise<IExercise>

// workouts.api.ts
createWorkoutLogApi(body: ICreateWorkoutLog): Promise<IWorkoutLog>
getWeeklyStatsApi(): Promise<IWeeklyStats>

// habits.api.ts
checkInHabitApi(habitId: IHabitId): Promise<{ habitId: IHabitId; date: string; checkedAt: string }>
getTodayHabitsApi(): Promise<ITodayHabits>
getWeeklyHabitsApi(): Promise<IWeeklyHabit[]>
getStreakApi(): Promise<IStreak>

// bmi.api.ts
saveBMIApi(heightCm: number, weightKg: number): Promise<ISaveBMIResponse>
getBMIHistoryApi(): Promise<IBMIHistoryEntry[]>
```

### Task 3: Zustand Timer Store

**timerStore.ts** — In-memory Zustand store, no persist middleware.

**State-transition table:**

| Action | isRunning | isPaused | remainingSeconds | exerciseId |
|--------|-----------|----------|-----------------|------------|
| Initial | false | false | 0 | null |
| `start(id, secs)` | true | false | secs | id |
| `pause()` | false | true | unchanged | unchanged |
| `resume()` | true | false | unchanged | unchanged |
| `tick()` | unchanged | unchanged | max(0, s-1) | unchanged |
| `reset()` | false | false | 0 | null |

## Deviations from Plan

None — plan executed exactly as written.

`TEXT_SECONDARY` already existed in `colors.ts` (value `#757575`) so the import in `_layout.tsx` worked without any fallback.

## Known Stubs

The 3 new tab screens (`exercises`, `habits`, `bmi`) do not exist yet — they will be created in Wave 4 plans 03-06 through 03-09. The tab bar renders but tapping those tabs will show a 404/empty screen until those plans run. This is expected and documented in the plan.

## Self-Check: PASSED

- mobile/src/app/(tabs)/_layout.tsx: FOUND (4 Tabs.Screen entries)
- mobile/tailwind.config.js: FOUND (11 new tokens + 8 existing)
- mobile/src/constants/colors.ts: FOUND (11 new + 8 existing constants)
- mobile/src/lib/api/types.ts: FOUND (Phase 3 types appended)
- mobile/src/lib/api/exercises.api.ts: FOUND
- mobile/src/lib/api/workouts.api.ts: FOUND
- mobile/src/lib/api/habits.api.ts: FOUND
- mobile/src/lib/api/bmi.api.ts: FOUND
- mobile/src/stores/timerStore.ts: FOUND
- Commit 2fa2605: FOUND
