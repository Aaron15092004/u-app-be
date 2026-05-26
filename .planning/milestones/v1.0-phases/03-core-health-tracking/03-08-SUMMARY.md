---
phase: "03"
plan: "08"
subsystem: mobile-habits
tags: [react-native, habits, optimistic-ui, tanstack-query, heatmap, streak]
dependency_graph:
  requires: [03-03, 03-05]
  provides: [habits-screen, habit-checkin-ui]
  affects: [mobile-tabs]
tech_stack:
  added: []
  patterns: [optimistic-mutation, tanstack-query-v5, stylesheet-not-nativewind]
key_files:
  created:
    - mobile/src/components/ui/HabitRow.tsx
    - mobile/src/components/ui/HabitHeatmap.tsx
    - mobile/src/components/ui/StreakBadge.tsx
    - mobile/src/app/(tabs)/habits/_layout.tsx
    - mobile/src/app/(tabs)/habits/index.tsx
  modified: []
decisions:
  - "StyleSheet used (not NativeWind className) per project convention"
  - "HABIT_DEFAULTS as centralized source of truth for HAB-02 compliance"
  - "D-57: Đánh dấu +1 is button label only, does not mean multiple increments"
metrics:
  duration_minutes: 25
  completed_date: "2026-05-18"
  tasks_completed: 2
  files_created: 5
---

# Phase 03 Plan 08: Habits Screen + Components Summary

Habits screen với optimistic check-in, streak badge, heatmap 7 ngày, và tips section — sử dụng TanStack Query v5 cho state server-side.

## HABIT_DEFAULTS (HAB-02 source of truth)

| ID         | Tên hiển thị       | Icon            |
|------------|--------------------|-----------------|
| water      | Uống 8 ly nước     | water-outline   |
| vegetables | Ăn 5 bữa rau củ    | leaf-outline    |
| exercise   | Tập luyện 30 phút  | fitness-outline |
| sleep      | Ngủ đủ 8 tiếng     | moon-outline    |
| reading    | Đọc sách 20 phút   | book-outline    |
| nut-milk   | Uống sữa hạt       | cafe-outline    |

Tất cả 6 habit rows được render từ HABIT_DEFAULTS trong habits/index.tsx.

## Key Callbacks

### onMutate (optimistic update)
1. Cancel pending `['habits', 'today']` queries
2. Snapshot previous data
3. Update cache optimistically: thêm habitId vào completed[], tính lại count/percent
4. Clear rowError cho habitId đó
5. Return `{ previous, habitId }` cho context

### onError (rollback)
1. Restore snapshot `ctx.previous` vào cache `['habits', 'today']`
2. Set rowError message: `'Không thể cập nhật. Thử lại.'`

### onSettled (invalidate)
3 queryKeys bị invalidate sau mỗi mutation:
1. `['habits', 'today']`
2. `['habits', 'weekly']`
3. `['habits', 'streak']`

## Components

### HabitRow
- Height: 72dp, flexRow, paddingHorizontal 16
- Left: 36x36 rounded View (borderRadius 18) + Ionicons icon tại PRIMARY color
- Center: Text flex:1 fontSize 16
- Right (chưa hoàn thành): Pressable "Đánh dấu +1" — fontSize 14/700 PRIMARY; disabled khi isCompletedToday hoặc mutation.isPending
- Right (đã hoàn thành): `<Ionicons name="checkmark-circle" />` — không có Pressable (binary done per D-57)
- accessibilityRole="button", accessibilityState={{ disabled: isCompletedToday }}

### HabitHeatmap
- flexRow justifyContent:'space-between'
- 7 cells: 36x36 circle (borderRadius 18)
- HABIT_ACTIVE (#4CAF50) nếu qualified, HABIT_INACTIVE (#E0E0E0) nếu không
- Label dưới cell: CN/T2/T3/T4/T5/T6/T7 từ `dayLabelFromDate()` với UTC+7

### StreakBadge
- flexRow gap:6 alignItems:center
- `<Ionicons name="flame-outline" size:18 color:STREAK_BADGE (#FF6B35) />`
- streakDays > 0: Text "{n} ngày" 14/700 STREAK_BADGE
- streakDays = 0: Text "Bắt đầu chuỗi ngày của bạn!" small TEXT_SECONDARY
- Wrapper: pH:12 pV:6 bg-SURFACE borderRadius:20

## Screen Layout (habits/index.tsx)

1. **Header row** (pH:16, mT:16): "Thói quen" (28/700) left + StreakBadge right
2. **Progress text** (pH:16, mT:8): "{count}/6 hoàn thành — {percent}%"
3. **Habit list** (mT:16, mH:16, bg-SURFACE, radius:16, pV:8):
   - Loading: 6 skeleton Views h:72
   - Error: text + Pressable refetch
   - Normal: 6 HabitRow với dividers, rowError dưới mỗi row khi có lỗi
4. **Heatmap** (mT:24): "Tuần này" + HabitHeatmap trong card
5. **Tips** (mT:24): "Mẹo nhỏ" + tip text trong card

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- mobile/src/components/ui/HabitRow.tsx — EXISTS in git HEAD (committed in f95cb91)
- mobile/src/components/ui/HabitHeatmap.tsx — EXISTS in git HEAD
- mobile/src/components/ui/StreakBadge.tsx — EXISTS in git HEAD
- mobile/src/app/(tabs)/habits/_layout.tsx — EXISTS in git HEAD
- mobile/src/app/(tabs)/habits/index.tsx — EXISTS in git HEAD
- npx tsc --noEmit: only pre-existing errors (apple-signin.ts, google-signin.ts) — 0 new errors from plan-08 files
- All 15 acceptance criteria: PASS
