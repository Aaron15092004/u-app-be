# Plan 04-07 Summary — Search + Diary Screens + Home Nav Buttons

**Phase:** 04-ai-food-scan
**Plan:** 04-07
**Status:** Complete
**Completed:** 2026-05-19

## What Was Built

### Task 1: 4 New UI Components

**`mobile/src/components/ui/FoodSearchBar.tsx`**
Controlled TextInput with Ionicons `search-outline` left icon, 48px height, borderRadius 12px, focus border toggling to #4CAF50, placeholder "Tìm theo tên món ăn...". Debounce handled by caller (300ms in search.tsx).

**`mobile/src/components/ui/DatePill.tsx`**
Pressable date selector pill — 44px height, borderRadius 22px. Active: #4CAF50 background + white text (14px/700). Inactive: #F5F5F5 background + #212121 text (14px/400). Displays formatted date label ("Hôm nay", "T7 17/5" etc.).

**`mobile/src/components/ui/FoodDiaryItem.tsx`**
Diary row component with long-press to reveal delete action using React Native Animated API. Shows food name (16px/700/#212121), timestamp (14px/400/#BDBDBD), kcal right (16px/700/#4CAF50 + "kcal" 14px/#757575). Delete revealed on swipe: #EF5350 background, trash icon + "Xóa" label.

**`mobile/src/components/ui/ServingSizeSheet.tsx`**
Modal bottom sheet for manual search serving size input. White background, top borderRadius 20px, handle bar. Food name heading (24px/700), kcal/100g sub-label, numeric TextInput (default 100g), live kcal calculation row, PrimaryButton "Thêm vào nhật ký".

### Task 2: 2 Full Screen Implementations + Home Nav Buttons

**`mobile/src/app/(food)/search.tsx`** (replaces stub)
Full manual food search screen:
- FoodSearchBar with 300ms debounce (useCallback + setTimeout/clearTimeout)
- Minimum 2 chars to trigger GET `/api/food/items?q=`
- FlatList with white card items (food name + kcal/100g)
- Initial hint state (restaurant-outline icon) and empty state
- ServingSizeSheet on item tap — calculates scaled nutrition, POSTs to `/api/food/logs` with `aiProvider: 'manual'`
- Success toast "Đã lưu bữa ăn!" on save

**`mobile/src/app/(food)/diary.tsx`** (replaces stub)
Full food diary screen:
- 7-day DatePill selector (today + 6 days back, "Hôm nay" label for today)
- Daily kcal summary card (#F5F5F5 bg, total vs 2000 kcal goal)
- TanStack Query `useQuery` for GET `/api/food/logs?date=YYYY-MM-DD`
- `useMutation` for DELETE with Alert confirmation ("Bữa ăn này sẽ bị xóa vĩnh viễn...")
- FoodDiaryItem list with swipe-delete
- Empty state: restaurant-outline icon + "Chưa có bữa ăn nào" + PrimaryButton "Quét bữa ăn"

**`mobile/src/app/(tabs)/index.tsx`** (D-69 navigation entry points added)
Two temporary navigation buttons added below existing content:
- "Quét bữa ăn" → `router.push('/(food)/scan')` 
- "Nhật ký ăn" → `router.push('/(food)/diary')`
Comment marks them for removal in Phase 5 when home dashboard is built.

## Commits

| Hash | Message |
|------|---------|
| 0c9d805 | feat(04-07): create FoodSearchBar, DatePill, FoodDiaryItem, ServingSizeSheet UI components |
| f1958b4 | feat(04-07): implement search + diary screens + D-69 home tab navigation buttons |

## Verification

- Backend TypeScript: `npx tsc --noEmit` exits 0 (clean)
- Mobile TypeScript: pre-existing Expo Router type generation errors in Phase 2/3 auth files (unrelated to Phase 4 — require `expo start` to regenerate `.expo/types/router.d.ts`)
- All Phase 4 new files typecheck correctly
- FOOD-07, FOOD-08, FOOD-09 requirements covered

## Requirements Covered

- FOOD-07: Manual food search in Vietnamese database ✓
- FOOD-08: Vietnamese food DB (200+ items via seed) searchable ✓
- FOOD-09: Food diary by date with history ✓
- D-67: GET /api/food/items?q= with 300ms debounce ✓
- D-68: (food)/ route group (not a tab) ✓
- D-69: Two temp buttons on (tabs)/index.tsx ✓
