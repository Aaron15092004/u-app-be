---
phase: 05-home-dashboard
plan: "06"
subsystem: home-dashboard-screens + water-log-screen + ui-components
tags: [wave-3, mobile, home-dashboard, water-log, ui-components, tanstack-query]
dependency_graph:
  requires:
    - 05-02 (backend /api/water/today with waterGoal embedded — WARNING 4 fix)
    - 05-03 (backend /api/home/today-summary + /api/config/shop-url)
    - 05-05 (type contracts ITodaySummary, ITodayWater; API modules; route stubs)
  provides:
    - mobile/src/app/(tabs)/index.tsx (Home Dashboard screen — full rewrite)
    - mobile/src/app/(home)/water.tsx (Water Log screen — full rewrite)
    - mobile/src/components/ui/TodaySummaryRow.tsx
    - mobile/src/components/ui/HomeSection.tsx
    - mobile/src/components/ui/MacroProgressBar.tsx
    - mobile/src/components/ui/NutritionProgressCard.tsx
    - mobile/src/components/ui/BMIWidget.tsx
    - mobile/src/components/ui/ShopBanner.tsx
    - mobile/src/components/ui/QuickActionsRow.tsx
    - mobile/src/components/ui/WaterControls.tsx
    - mobile/src/components/ui/WaterLogItem.tsx
  affects:
    - Plan 07 (Profile screens): home tab now has full dashboard; water tab navigable from home
tech_stack:
  added: []
  patterns:
    - StyleSheet.create (continued from Phase 3-4 convention, NativeWind v4 migration deferred)
    - TanStack Query v5 useQuery + useMutation with onSettled invalidation
    - expo-linear-gradient LinearGradient for ShopBanner green gradient
    - expo-linking Linking.openURL for shop URL open
    - invalidateQueries(['home','summary']) after all water mutations (cache coherence)
    - Single-query waterGoal pattern (waterGoal from getTodayWaterApi response — WARNING 4 fix)
key_files:
  created:
    - mobile/src/components/ui/TodaySummaryRow.tsx
    - mobile/src/components/ui/HomeSection.tsx
    - mobile/src/components/ui/MacroProgressBar.tsx
    - mobile/src/components/ui/NutritionProgressCard.tsx
    - mobile/src/components/ui/BMIWidget.tsx
    - mobile/src/components/ui/ShopBanner.tsx
    - mobile/src/components/ui/QuickActionsRow.tsx
    - mobile/src/components/ui/WaterControls.tsx
    - mobile/src/components/ui/WaterLogItem.tsx
  modified:
    - mobile/src/app/(tabs)/index.tsx (full rewrite — replaced placeholder + D-69 temp buttons)
    - mobile/src/app/(home)/water.tsx (full rewrite — replaced Plan 05 stub)
decisions:
  - "waterGoal sourced exclusively from getTodayWaterApi() response (waterQuery.data.waterGoal) — water.tsx does NOT call getTodaySummaryApi (WARNING 4 fix)"
  - "All water mutations (logMutation, deleteMutation) use onSettled to invalidate both ['water','today'] and ['home','summary'] — keeps dashboard count in sync"
  - "logout NOT on home tab — delegated to Plan 07 Profile tab per D-76 and UI-SPEC"
  - "D-69 temp nav buttons removed; 'Phase 3 sắp ra mắt' placeholder removed"
  - "StyleSheet.create used throughout — NativeWind v4 migration deferred per validation_note"
  - "ShopBanner returns null when url is null and not loading — prevents rendering broken banner"
  - "Delete in water.tsx shows Alert confirmation before calling deleteMutation (UX safety)"
  - "WaterControls disables minus button when count===0 (opacity 0.4, disabled prop)"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  tasks_total: 2
  files_created: 9
  files_modified: 2
---

# Phase 5 Plan 06: Home Dashboard + Water Log Screens Summary

Wave 3 delivery — 9 new UI components plus full rewrites of the Home Dashboard screen and Water Log screen. Removes D-69 temporary navigation buttons, wires all TanStack Query cache invalidations, and implements the WARNING 4 fix (waterGoal from single water query).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Build 9 Home/Water UI components | a779838 | TodaySummaryRow, HomeSection, MacroProgressBar, NutritionProgressCard, BMIWidget, ShopBanner, QuickActionsRow, WaterControls, WaterLogItem |
| 2 | Rewrite (tabs)/index.tsx + (home)/water.tsx | 4a9b6d8 | (tabs)/index.tsx, (home)/water.tsx |

## Final Screen Structures

### (tabs)/index.tsx — Home Dashboard (237 lines)

Section order per UI-SPEC Screen 1:
1. Greeting Row — "Xin chào, {auth.user?.name ?? 'bạn'}!" (28px/700) + Vietnamese date subline + bell icon (no-op Pressable)
2. TodaySummaryRow — kcal/water/workout cards; water card wrapped in TouchableOpacity → push `/(home)/water`
3. ShopBanner — LinearGradient green, Linking.openURL(shopUrlQuery.data.url), null when URL unavailable
4. QuickActionsRow — scan-outline → `/(food)/scan`, barbell-outline → `/(tabs)/exercises`, checkmark-circle-outline → `/(tabs)/habits`
5. BMIWidget — pressable card, BMI value/category with color tokens, empty state; → `/(tabs)/bmi`
6. NutritionProgressCard — 4 MacroProgressBar stacked (Calo/Protein/Carbs/Chất béo), empty state text

Queries:
- `['home', 'summary']` via getTodaySummaryApi, staleTime 30s
- `['config', 'shop-url']` via getShopUrlApi, staleTime 1h

### (home)/water.tsx — Water Log Screen (295 lines)

WARNING 4 fix applied: waterGoal read from `waterQuery.data?.waterGoal` only. No getTodaySummaryApi import.

Single query: `['water', 'today']` via getTodayWaterApi returns `{ logs, count, waterGoal }`.

Layout per UI-SPEC Screen 2:
1. ScreenHeader title="Nhật ký nước" showBack=true
2. Goal card — "{count} / {waterGoal}" display + "ly hôm nay" subline + 12px progress bar; goal reached shows "Đã đạt mục tiêu! Tuyệt vời"
3. WaterControls — circular +/- buttons (52×52, borderRadius 26); minus disabled when count===0
4. "Lịch sử hôm nay" section heading
5. WaterLogItem list (reverse chronological, newest at top) or empty state

Mutations:
- logMutation: `() => logWaterApi()`, onSettled → invalidate ['water','today'] + ['home','summary']
- deleteMutation: `(id: string) => deleteWaterApi(id)`, onSettled → same invalidations
- Delete shows Alert confirmation before mutate (UX guard)

## Component Dependency Graph

```
(tabs)/index.tsx
  ├── TodaySummaryRow → WeeklyStatCard (×3, water card wrapped in TouchableOpacity)
  ├── ShopBanner → LinearGradient + Linking.openURL
  ├── QuickActionsRow → Pressable (×3, Ionicons)
  ├── BMIWidget → Pressable (entire card)
  └── NutritionProgressCard → MacroProgressBar (×4)

(home)/water.tsx
  ├── ScreenHeader (existing)
  ├── WaterControls → Pressable (×2 circular)
  └── WaterLogItem (×N) → Ionicons + Pressable (delete)
```

## Cache Invalidation Chains

After every water mutation (log or delete):
1. `['water', 'today']` invalidated → water.tsx re-fetches count/logs/waterGoal
2. `['home', 'summary']` invalidated → when user navigates back to home, waterGlasses count is fresh

This ensures the TodaySummaryRow water card (home) reflects changes made in the water log screen.

## Logout Responsibility

Logout was on the old (tabs)/index.tsx (D-69 placeholder). Per UI-SPEC and D-76:
- Home tab: no logout button
- Profile tab (Plan 07): logout via Alert confirmation with PrimaryButton outlined variant

## Styling Note

All 9 new components and 2 rewritten screens use `StyleSheet.create` to match existing Phase 3–4 components (WeeklyStatCard, DailyChallengeCard, PrimaryButton, etc.). NativeWind v4 migration is deferred to a dedicated UI refactor phase per the plan's `validation_note`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all screens in this plan are fully implemented with real data sources.

HomeSection component is created but not used directly by the screens (screens build their own card layouts inline). It is available for future use.

## Threat Flags

No new threat surface beyond the plan's threat model:
- T-05-06-01: delete IDOR — mobile sends only log `_id`; backend enforces `{ _id, userId }` filter (Plan 02)
- T-05-06-02: stale home dashboard — onSettled invalidates `['home','summary']` after every water mutation
- T-05-06-03: shop URL open redirect — URL comes only from backend GET /api/config/shop-url, never user input
- T-05-06-06: waterGoal stale — single atomic query (WARNING 4 fix confirmed)

## Self-Check: PASSED
