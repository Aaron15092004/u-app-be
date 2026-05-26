---
phase: "03"
plan: "09"
subsystem: mobile-bmi
tags: [bmi, slider, victory-native, react-native, ui]
dependency_graph:
  requires: [03-04, 03-05]
  provides: [bmi-screen]
  affects: [mobile-tabs]
tech_stack:
  added:
    - "@react-native-community/slider ^5.0.1"
  patterns:
    - CartesianChart + Bar from victory-native for BMI history chart
    - useMutation + invalidateQueries for atomic save + cache refresh
    - useAuthStore.getState().setUser for profile propagation after save
key_files:
  created:
    - mobile/src/components/ui/BMIScaleBar.tsx
    - mobile/src/components/ui/BMIResultCard.tsx
    - mobile/src/components/ui/BMIChart.tsx
    - mobile/src/app/(tabs)/bmi/_layout.tsx
    - mobile/src/app/(tabs)/bmi/index.tsx
  modified:
    - mobile/package.json
    - mobile/babel.config.js
decisions:
  - "Used --legacy-peer-deps for @react-native-community/slider install due to @shopify/react-native-skia peer conflict with react-native@0.79.0"
  - "BMIScaleBar uses inline left percent as string with type cast (React Native supports percentage strings in some positions)"
  - "BMIChart typed with explicit generic CartesianChart<ChartDatum, 'x', 'bmi'> to satisfy TypeScript"
metrics:
  duration: "~25 minutes"
  completed: "2026-05-18"
  tasks_completed: 3
  files_created: 5
  files_modified: 2
---

# Phase 03 Plan 09: BMI Mobile Screen Summary

BMI screen với live-calculating sliders, atomic save, 30-day chart, và advice card — dùng @react-native-community/slider + victory-native CartesianChart.

## What Was Built

### Task 1: Slider Dependency + Babel Config
- Cài `@react-native-community/slider@^5.0.1` bằng `--legacy-peer-deps` (do xung đột peer dep với @shopify/react-native-skia@1.12.4 yêu cầu react-native <0.78.0, project dùng 0.79.0)
- Cập nhật `babel.config.js`: giữ `nativewind/babel`, thêm `react-native-reanimated/plugin` làm plugin cuối

**babel.config.js plugin list sau plan này:**
```javascript
plugins: ['nativewind/babel', 'react-native-reanimated/plugin']
```

### Task 2: 3 Presentational Components

**BMIScaleBar.tsx** — Thanh màu 4 đoạn (underweight/normal/overweight/obese) với dot chỉ vị trí BMI hiện tại. Công thức vị trí: `((bmi - 15) / 25) * 100` percent.

**BMIResultCard.tsx** — Card hiển thị điểm BMI (font 20/700 màu PRIMARY), tên category tiếng Việt, embed BMIScaleBar, nhãn phạm vi "15" / "40".

**BMIChart.tsx** — Bar chart qua `CartesianChart` + `Bar` của victory-native. Empty state hiện text tiếng Việt "Chưa có dữ liệu BMI...". Màu bar #4CAF50.

### Task 3: BMI Screen + Layout

**bmi/_layout.tsx** — Stack wrapper với `headerShown: false`.

**bmi/index.tsx** — Màn hình đầy đủ:
- Khởi tạo state heightCm/weightKg từ `auth.user?.profile` (fallback 170/65), clamp trong range slider
- `useMemo` cho bmi + category (live compute client-side, không gọi API)
- Sliders: Chiều cao 100–220 cm, Cân nặng 30–200 kg (D-56 ranges)
- `useMutation` gọi `saveBMIApi` → invalidate 'bmi/history' → update useAuthStore user profile
- Toast "Đã lưu!" (2s) + FormErrorText khi lỗi
- Advice card với 4 chuỗi CATEGORY_ADVICE
- Chart section với BMIChart + historyQuery.data

## BMI Category Boundaries (Client-Side)

| BMI | Category | Tiếng Việt |
|-----|----------|------------|
| < 18.5 | underweight | Thiếu cân |
| 18.5 – 24.9 | normal | Bình thường |
| 25.0 – 29.9 | overweight | Thừa cân |
| ≥ 30.0 | obese | Béo phì |

Khớp chính xác với backend Plan 03-04 boundaries.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] npx expo install slider thất bại do peer dep conflict**
- **Found during:** Task 1
- **Issue:** `@shopify/react-native-skia@1.12.4` yêu cầu `react-native >=0.64 <0.78.0` nhưng project dùng `react-native@0.79.0`
- **Fix:** Dùng `npm install @react-native-community/slider --legacy-peer-deps` thay vì `npx expo install`
- **Files modified:** mobile/package.json, mobile/package-lock.json

**2. [Rule 1 - TypeScript] BMIScaleBar left% type cast**
- **Found during:** Task 2
- **Issue:** React Native StyleSheet không accept string percentage trực tiếp trong type system
- **Fix:** Cast `'${percent}%' as unknown as number` để pass TypeScript; React Native runtime hỗ trợ string percentage cho left/right/top/bottom

## Known Stubs

Không có stubs — tất cả data đều live (historyQuery từ API, bmi computed real-time từ sliders).

## Manual Smoke Test Note

Không thể chạy trên thiết bị trong môi trường này. TypeScript pass (`npx tsc --noEmit` exit 0 cho các file mới — lỗi duy nhất còn lại là pre-existing `apple-signin.ts` TS2339 từ Phase 2). Tất cả acceptance criteria grep checks pass.

## Self-Check: PASSED

- [x] `mobile/src/components/ui/BMIScaleBar.tsx` exists
- [x] `mobile/src/components/ui/BMIResultCard.tsx` exists
- [x] `mobile/src/components/ui/BMIChart.tsx` exists
- [x] `mobile/src/app/(tabs)/bmi/_layout.tsx` exists
- [x] `mobile/src/app/(tabs)/bmi/index.tsx` exists
- [x] `@react-native-community/slider` in package.json dependencies
- [x] `react-native-reanimated/plugin` in babel.config.js (last plugin)
- [x] Commits: 98d1242, f95cb91, b27bd8c
