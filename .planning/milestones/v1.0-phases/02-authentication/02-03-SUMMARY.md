# Phase 2 — Plan 03 Summary: Onboarding Flow (AUTH-01)

## Status: COMPLETE

---

## Files Delivered

| File | Action |
|------|--------|
| `mobile/src/app/(onboarding)/_layout.tsx` | Modified |
| `mobile/src/app/(onboarding)/index.tsx` | Created |
| `mobile/src/app/(onboarding)/screen-2.tsx` | Created |
| `mobile/src/app/(onboarding)/screen-3.tsx` | Created |

---

## Screen Summary

### Screen 1 — `/(onboarding)/` (index.tsx)
- **Title**: "Chào mừng đến với Ủ"
- **Subtitle**: "Ứng dụng quản lý sức khỏe toàn diện với dinh dưỡng từ thực vật"
- **Hero**: Ionicons `leaf-outline` (96px, green) in circular bg (logo.png not present)
- **Dots**: `OnboardingDots total={3} current={0}`
- **CTA**: `PrimaryButton label="Tiếp tục"` → `router.push('/(onboarding)/screen-2')`
- **Skip button**: absent (D-35 compliant)

### Screen 2 — `/(onboarding)/screen-2.tsx`
- **Title**: "Theo dõi sức khỏe hàng ngày"
- **Subtitle**: "Phân tích bữa ăn, theo dõi BMI, và quản lý lịch tập luyện một cách dễ dàng"
- **Feature tiles**: 3 × (64×64, borderRadius 16, rgba(76,175,80,0.15) bg): `nutrition-outline`, `trending-up-outline`, `calendar-outline` (28px, #4CAF50)
- **Dots**: `OnboardingDots total={3} current={1}`
- **CTA**: `PrimaryButton label="Tiếp tục"` → `router.push('/(onboarding)/screen-3')`
- **Skip button**: absent (D-35 compliant)

### Screen 3 — `/(onboarding)/screen-3.tsx`
- **Title**: "Bắt đầu hành trình khỏe mạnh"
- **Subtitle**: "Xây dựng thói quen lành mạnh và đạt được mục tiêu sức khỏe của bạn"
- **Hero**: 180×180 green circle with white `heart` icon (72px)
- **Dots**: `OnboardingDots total={3} current={2}`
- **CTA 1** (filled): `PrimaryButton label="Tạo tài khoản"` → `setOnboardingSeen(true)` then `router.replace('/(auth)/register')`
- **CTA 2** (outlined): `PrimaryButton label="Đăng nhập"` → `setOnboardingSeen(true)` then `router.replace('/(auth)/login')`
- **Skip button**: absent (D-35 compliant)

---

## Design Rules Compliance

| Rule | Status |
|------|--------|
| D-35: No "Bỏ qua" skip button on any screen | PASS — structural check confirmed |
| D-34: `setOnboardingSeen(true)` called BEFORE navigation on Screen 3 | PASS — 2 handler calls (handleRegister + handleLogin) both call it before `router.replace` |
| D-36: Screen 3 has TWO CTAs (register + login) | PASS — "Tạo tài khoản" (filled) + "Đăng nhập" (outlined) |
| gestureEnabled=false on entire onboarding stack | PASS — `_layout.tsx` has `gestureEnabled: false` in Stack screenOptions |

---

## Verification Results

### Structural Check (node script)
```
OK: 3 setOnboardingSeen calls   (2 in handlers + 1 in file-level comment)
```
All 4 validation assertions: PASS

### TypeScript Check
- `node_modules` not installed (dependencies not yet installed in this environment)
- TSC cannot run without `npm install` first
- All files pass brace-balance static check (opens === closes for all files)
- All imports reference only existing files:
  - `../../components/ui/PrimaryButton` — confirmed exists
  - `../../components/ui/OnboardingDots` — confirmed exists
  - `../../lib/storage/mmkv` (exports `setOnboardingSeen`) — confirmed exists
  - `../../constants/colors` (exports PRIMARY, BACKGROUND, TEXT, TEXT_SECONDARY) — confirmed exists

### Visual Verification
**DEFERRED** — requires device/simulator run. Cannot be completed in this context.
Run `npx expo start` in `mobile/` and navigate through the 3 onboarding screens to verify:
- Layout renders correctly on iOS and Android
- Dot progression matches screen index
- Both CTAs on Screen 3 navigate to correct auth routes
- Back gesture is disabled throughout

---

## Navigation Routes

```
/(onboarding)/          ─ "Tiếp tục" ──► /(onboarding)/screen-2
/(onboarding)/screen-2  ─ "Tiếp tục" ──► /(onboarding)/screen-3
/(onboarding)/screen-3  ─ "Tạo tài khoản" ──► /(auth)/register   [replace]
/(onboarding)/screen-3  ─ "Đăng nhập"     ──► /(auth)/login       [replace]
```
