---
phase: 04-ai-food-scan
plan: 06
subsystem: mobile
tags: [camera, food-scan, expo-camera, expo-image-manipulator, zustand, react-native]
dependency_graph:
  requires: [04-03, 04-05]
  provides: [scan-screen, result-screen, ScanFrame, CameraControls, NutritionSummaryCard, NutritionDetailRow, FoodTagPill]
  affects: []
tech_stack:
  added: []
  patterns: [camera-view, image-compression, zustand-store-read, expo-router-push]
key_files:
  created:
    - mobile/src/components/ui/ScanFrame.tsx
    - mobile/src/components/ui/CameraControls.tsx
    - mobile/src/components/ui/FoodTagPill.tsx
    - mobile/src/components/ui/NutritionSummaryCard.tsx
    - mobile/src/components/ui/NutritionDetailRow.tsx
  modified:
    - mobile/src/app/(food)/scan.tsx
    - mobile/src/app/(food)/result.tsx
decisions:
  - "ScanFrame uses 4 absolute corner views each with 2 overlapping bars (L-bracket) — no SVG needed for simple green brackets"
  - "Expo Router (food)/ routes require router.d.ts update — file is gitignored (.expo/); Expo regenerates on next dev start"
  - "processImage() helper extracted to share compress+scan flow between camera capture and gallery pick"
  - "result.tsx guard: useEffect + router.back() if scanResult is null — prevents blank screen on direct navigation"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-19"
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 4 Plan 06: Camera Scan + AI Result Screens Summary

Full CameraView scan screen (dark theme, green frame overlay, compress-then-scan flow) and AI result screen (nutrition summary card, 4 micro-nutrient rows, save/retry CTAs) — the primary AI food scan user journey for Phase 4.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | ScanFrame, CameraControls, FoodTagPill UI components | 46d57fd | 3 files |
| 2 | NutritionSummaryCard, NutritionDetailRow, scan.tsx, result.tsx | 96087ee | 4 files |

## What Was Built

### ScanFrame.tsx

Pure presentational component. Renders a 260×260 view with 4 absolute corner bracket views (each composed of 2 overlapping bars forming an L-shape). Green color #4CAF50, arm 40px, stroke 4px, borderRadius 8px. Center hint: `camera-outline` Ionicon at 40px white + "Căn chỉnh bữa ăn vào khung" text.

### CameraControls.tsx

Props: `onGallery`, `onCapture`, `onFlash`, `flashEnabled`, `isLoading`. Three-button row (paddingHorizontal: 40):
- Gallery: 52px circle, rgba(255,255,255,0.15) bg, `image-outline` 24px white
- Capture: 80px outer ring (3px white border) containing 72px circle (#4CAF50); shows ActivityIndicator white when isLoading
- Flash: 52px circle, bg brightens to rgba(255,255,255,0.25) when flashEnabled; toggles `flash` / `flash-outline` icon
All buttons: opacity 0.4 when isLoading.

### FoodTagPill.tsx

Props: `{ label: string }`. Green pill: `#E8F5E9` bg, `#4CAF50` text, borderRadius 12, paddingH 8, paddingV 4.

### NutritionSummaryCard.tsx

Props: `{ calories, protein, carbs, fat }`. Green card (#4CAF50, borderRadius 16) with "Tổng calo" label, kcal value (36px/700/white). Below: 3-column macro row with Ionicons (fitness-outline/#4CAF50, leaf-outline/#FFA726, water-outline/#64B5F6), values rounded to 1 decimal (`.toFixed(1)g`).

### NutritionDetailRow.tsx

Props: `{ label, value, unit, color }`. Row with 4px×16px colored bar left of label, value+unit right-aligned in #757575.

### scan.tsx (full implementation)

Full camera scan screen:
- Dark theme: `SafeAreaView backgroundColor: '#000000'`
- `CameraView` ref + `useCameraPermissions()` hook
- `flash` state toggling `'off'` / `'on'`
- `compressImage(uri)`: `ImageManipulator.manipulateAsync` resize 800px, JPEG 0.7
- `processImage(uri)`: setIsScanning → compress → setPendingImageUri → scanFoodApi → setScanResult → push `/(food)/result`; 429 alert shows Vietnamese rate-limit message; generic error alert
- `handleCapture()`: guard `if (isScanning) return`; takePictureAsync → processImage
- `handleGallery()`: launchImageLibraryAsync → processImage
- Permission card (when permission not granted): camera icon + Vietnamese text + PrimaryButton "Cấp quyền Camera" + gallery link
- Overlay: back button (white), title "Quét bữa ăn", subtitle, ScanFrame, "Đang phân tích..." when isScanning, CameraControls

### result.tsx (full implementation)

AI result screen:
- Reads `scanResult` from `useFoodScanStore()`; guard useEffect calls `router.back()` if null
- `handleSave()`: `saveFoodLogApi` with all food fields + totals + aiProvider; `clearScan()` → Alert "Đã lưu bữa ăn!" → push `/(food)/diary`
- `handleRetry()`: `clearScan()` → `router.back()`
- ScrollView with: ScreenHeader, food name (24px/700), tags horizontal ScrollView with FoodTagPill, "Tổng quan dinh dưỡng" heading, NutritionSummaryCard (totals), "Thông tin chi tiết" heading, 4 NutritionDetailRow (Chất xơ #4CAF50, Đường #FFA726, Natri #EF5350, Vitamin C #64B5F6)
- Fixed bottom bar: PrimaryButton "Xác nhận & Lưu" (filled) + PrimaryButton "Chụp lại" (outlined)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Expo Router .expo/types/router.d.ts missing (food)/ routes**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `router.push('/(food)/result')` and `router.push('/(food)/diary')` caused TS2345 errors because the auto-generated `.expo/types/router.d.ts` had not been regenerated after the `(food)/` route group was added in Plan 05. The file is gitignored so it wasn't committed with Plan 05.
- **Fix:** Updated the local `.expo/types/router.d.ts` to include all 4 `(food)/` routes (scan, result, search, diary) in all three union types (hrefInputParams, hrefOutputParams, href). The file remains gitignored — Expo will regenerate it correctly on `expo start`.
- **Files modified:** `mobile/.expo/types/router.d.ts` (gitignored, not committed)
- **Verification:** `npx tsc --noEmit 2>&1 | grep -E "scan\.|result\."` returns zero output

**2. [Rule 2 - Missing critical functionality] null safety in result.tsx firstFood access**
- **Found during:** Task 2 implementation
- **Issue:** Plan specified `firstFood.tags` but firstFood could be undefined if scanResult.foods is empty
- **Fix:** Added null coalescing — `firstFood?.tags`, `firstFood?.fiber ?? 0`, etc. — throughout result.tsx to prevent runtime crashes on edge-case empty AI responses
- **Files modified:** `mobile/src/app/(food)/result.tsx`

## Threat Surface Scan

Implemented all T-04-06 mitigations:
- T-04-06-01 (Tampering — raw photo): `compressImage()` called in both `handleCapture` and `handleGallery` before `scanFoodApi` — IMPLEMENTED
- T-04-06-02 (DoS — rapid taps): `if (isScanning) return` guard at top of `handleCapture` — IMPLEMENTED
- T-04-06-03 (Info disclosure — pendingImageUri): accepted; `clearScan()` called on success/retry — CONFIRMED
- T-04-06-04 (EoP — aiProvider from client): accepted; `aiProvider` comes from `scanResult` (backend response) — CONFIRMED

No new security surface beyond the plan's threat model.

## Known Stubs

None. All 7 files deliver their full implementation.

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` — scan.tsx food errors | PASSED (zero) |
| `npx tsc --noEmit` — result.tsx food errors | PASSED (zero) |
| scan.tsx contains `CameraView` | PASSED |
| scan.tsx contains `manipulateAsync` | PASSED |
| scan.tsx contains `scanFoodApi` | PASSED |
| result.tsx contains `NutritionSummaryCard` | PASSED |
| result.tsx contains `saveFoodLogApi` | PASSED |
| result.tsx contains `clearScan` | PASSED |
| ScanFrame: pure presentational, no props | PASSED |
| CameraControls: accepts all 5 props | PASSED |

## Self-Check: PASSED

- `mobile/src/components/ui/ScanFrame.tsx` — FOUND (commit 46d57fd)
- `mobile/src/components/ui/CameraControls.tsx` — FOUND (commit 46d57fd)
- `mobile/src/components/ui/FoodTagPill.tsx` — FOUND (commit 46d57fd)
- `mobile/src/components/ui/NutritionSummaryCard.tsx` — FOUND (commit 96087ee)
- `mobile/src/components/ui/NutritionDetailRow.tsx` — FOUND (commit 96087ee)
- `mobile/src/app/(food)/scan.tsx` — FOUND, full implementation (commit 96087ee)
- `mobile/src/app/(food)/result.tsx` — FOUND, full implementation (commit 96087ee)
