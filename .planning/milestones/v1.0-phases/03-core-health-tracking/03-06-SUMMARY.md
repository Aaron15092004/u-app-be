---
phase: "03"
plan: "06"
subsystem: mobile-workout-screens
tags: [react-native, expo-router, tanstack-query, workout, exercise, components]
dependency_graph:
  requires: [03-05]
  provides: [exercises-list-screen, exercises-detail-screen, exercise-card, category-filter-chip, weekly-stat-card, daily-challenge-card]
  affects: [mobile-tabs-navigation]
tech_stack:
  added: []
  patterns: [expo-router-stack, tanstack-query-usequery, flatlist-nested-scrollview, sticky-absolute-button]
key_files:
  created:
    - mobile/src/components/ui/ExerciseCard.tsx
    - mobile/src/components/ui/CategoryFilterChip.tsx
    - mobile/src/components/ui/WeeklyStatCard.tsx
    - mobile/src/components/ui/DailyChallengeCard.tsx
    - mobile/src/app/(tabs)/exercises/_layout.tsx
    - mobile/src/app/(tabs)/exercises/index.tsx
    - mobile/src/app/(tabs)/exercises/[id]/_layout.tsx
    - mobile/src/app/(tabs)/exercises/[id]/index.tsx
  modified: []
decisions:
  - "D-42: no image thumbnail — dùng Ionicons category icon thay thế (80x80 view)"
  - "exercises/[id]/ directory tạo sẵn để Plan 07 thêm timer.tsx vào đó"
  - "router.push /(tabs)/exercises/{id}/timer handoff sang Plan 07"
metrics:
  duration: "~25 phút"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 8
---

# Phase 03 Plan 06: Workout Screens + Components Summary

**One-liner:** Exercise list + detail screens với 4 presentational components (ExerciseCard, CategoryFilterChip, WeeklyStatCard, DailyChallengeCard) dùng TanStack Query + Expo Router stack.

## What Was Built

### 4 Presentational Components

**ExerciseCard** (`mobile/src/components/ui/ExerciseCard.tsx`)
- Props: `{ exercise: IExercise; onPress: () => void }`
- Pressable row: 80x80 category icon thumbnail + Vietnamese name + difficulty pill + duration/kcal
- Difficulty: easy→'Dễ' #4CAF50, medium→'Trung bình' #FFA726, hard→'Khó' #EF5350
- Category icons: yoga→'body-outline', cardio→'bicycle-outline', weights→'barbell-outline', stretching→'fitness-outline'
- Pressed opacity: 0.85

**CategoryFilterChip** (`mobile/src/components/ui/CategoryFilterChip.tsx`)
- Props: `{ label: string; active: boolean; onPress: () => void }`
- Active: bg #4CAF50 + white text; Inactive: bg white + border #D1D5DB + text #212121
- paddingHorizontal:16, paddingVertical:8, borderRadius:20, fontWeight:'700', fontSize:14
- accessibilityState={{ selected: active }}

**WeeklyStatCard** (`mobile/src/components/ui/WeeklyStatCard.tsx`)
- Props: `{ label: string; value: string | number; unit?: string }`
- Non-interactive View: bg SURFACE, borderRadius:16, flex:1, alignItems:center
- value (bold 700, size 20) + label (size 12, TEXT_SECONDARY)

**DailyChallengeCard** (`mobile/src/components/ui/DailyChallengeCard.tsx`)
- Props: `{ targetKcal: number; currentKcal: number; title?: string }`
- Default title: 'Mục tiêu hôm nay: Đốt 300 kcal'
- Progress bar: h:8 radius:4 #E0E0E0 track + PRIMARY fill tính theo Math.min(100,Math.round((current/target)*100))%
- "{currentKcal} / {targetKcal} kcal" right-aligned size 12

### Screens

**exercises/_layout.tsx** — Stack với headerShown: false

**exercises/[id]/_layout.tsx** — Stack với headerShown: false (sẵn sàng cho Plan 07 thêm timer.tsx)

**exercises/index.tsx (Exercise List)**
- useState: activeFilter: 'all' | ICategory = 'all'
- useQuery(['exercises', activeFilter]) → listExercisesApi
- useQuery(['workouts','stats','weekly']) → getWeeklyStatsApi
- Filter chips: Tất cả / Yoga / Cardio / Tạ / Giãn cơ
- Render: Heading "Tập luyện" → 4 WeeklyStatCards → DailyChallengeCard → chips → FlatList
- Loading: 3 skeleton Views h:100 bg:#E0E0E0
- Error: "Không thể tải danh sách bài tập. Kiểm tra kết nối và thử lại." + "Thử lại" button
- Empty: "Không có bài tập nào trong danh mục này."

**exercises/[id]/index.tsx (Exercise Detail)**
- useLocalSearchParams<{id:string}>()
- useQuery(['exercise', id]) → getExerciseApi(id)
- Loading: ActivityIndicator large centered
- Error: "Không thể tải bài tập." centered
- Sections: Mô tả + Các động tác (numbered steps + durationSeconds)
- Sticky absolute bottom: PrimaryButton "Bắt đầu tập"

## Router.push Target Strings

- List → Detail: `/(tabs)/exercises/${item._id}`
- Detail → Timer (Plan 07): `/(tabs)/exercises/${id}/timer`

## Loading / Empty / Error Strings

| State | Screen | Text |
|-------|--------|------|
| Error | List | "Không thể tải danh sách bài tập. Kiểm tra kết nối và thử lại." |
| Retry | List | "Thử lại" |
| Empty | List | "Không có bài tập nào trong danh mục này." |
| Error | Detail | "Không thể tải bài tập." |
| CTA | Detail | "Bắt đầu tập" |

## Commits

| Task | Commit | Files |
|------|--------|-------|
| Task 1: 4 components | be89256 | ExerciseCard, CategoryFilterChip, WeeklyStatCard, DailyChallengeCard |
| Task 2: List screen + layouts | 8854e4b | exercises/_layout, exercises/[id]/_layout, exercises/index |
| Task 3: Detail screen | fbc0d76 | exercises/[id]/index |

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. API data flows through TanStack Query to UI — no hardcoded placeholder data.

## Self-Check: PASSED

- mobile/src/components/ui/ExerciseCard.tsx: EXISTS
- mobile/src/components/ui/CategoryFilterChip.tsx: EXISTS
- mobile/src/components/ui/WeeklyStatCard.tsx: EXISTS
- mobile/src/components/ui/DailyChallengeCard.tsx: EXISTS
- mobile/src/app/(tabs)/exercises/_layout.tsx: EXISTS
- mobile/src/app/(tabs)/exercises/index.tsx: EXISTS
- mobile/src/app/(tabs)/exercises/[id]/_layout.tsx: EXISTS
- mobile/src/app/(tabs)/exercises/[id]/index.tsx: EXISTS
- Commits be89256, 8854e4b, fbc0d76: VERIFIED
- TypeScript: 0 errors in new files (2 pre-existing errors in apple-signin.ts unrelated to plan)
