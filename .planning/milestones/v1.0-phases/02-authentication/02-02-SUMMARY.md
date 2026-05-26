# Phase 02-02 Summary — Mobile Primitives (Wave 1)

**Status**: Complete  
**Date**: 2026-05-18

---

## Files Created (8 total)

### 1. `mobile/src/lib/storage/mmkv.ts`

**MMKV Singleton API**

| Export | Signature | Description |
|--------|-----------|-------------|
| `storage` | `MMKV` | Singleton MMKV instance (default config) |
| `getOnboardingSeen()` | `() => boolean` | Returns `true` if onboarding has been seen; defaults to `false` |
| `setOnboardingSeen(value)` | `(value: boolean) => void` | Persists onboarding_seen flag to MMKV |

Key constant: `ONBOARDING_SEEN_KEY = 'onboarding_seen'`

---

### 2. `mobile/src/lib/auth/auth-store.ts`

**Zustand Auth Store API**

```typescript
interface AuthState {
  user: IAuthUser | null;
  accessToken: string | null;  // in-memory ONLY — never persisted (D-22)
  setUser: (user: IAuthUser | null) => void;
  setAccessToken: (token: string | null) => void;
  clear: () => void;
}
```

**D-22 Compliance Confirmed**: No `zustand/middleware/persist`, no `SecureStore`, no `AsyncStorage` imports. Access token lives in Zustand memory only and is lost on app restart (by design — refresh token handles re-hydration).

Re-exports: `IAuthUser` type.

---

### 3. `mobile/src/lib/api/types.ts`

**All Type Exports**

| Type | Direction |
|------|-----------|
| `IAuthUser` | Shared user shape (id, email, name, role, profileCompleted) |
| `LoginRequest` | `{ email, password }` |
| `LoginResponse` | `{ user, accessToken, refreshToken }` |
| `RegisterRequest` | `{ email, password }` |
| `RegisterResponse` | `{ user, accessToken, refreshToken }` |
| `RefreshRequest` | `{ refreshToken }` |
| `RefreshResponse` | `{ accessToken, refreshToken }` |
| `ForgotPasswordRequest` | `{ email }` |
| `ResetPasswordRequest` | `{ token, password }` |
| `GoogleSignInRequest` | `{ idToken }` |
| `AppleSignInRequest` | `{ identityToken, nonce? }` |
| `CompleteProfileRequest` | `{ name, age, heightCm, weightKg, goalType }` |
| `CompleteProfileResponse` | `{ user }` |

---

### 4. `mobile/src/components/ui/AuthInput.tsx`

**Props**
```typescript
interface AuthInputProps {
  label: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  error?: string;
  leftIcon?: string;           // Ionicons glyph name
  secureTextEntry?: boolean;
  keyboardType?: TextInputProps['keyboardType'];
  unitLabel?: string;
  autoCapitalize?: TextInputProps['autoCapitalize'];
}
```

Key behaviors: focus border (primary green, 2px), error border (red-700), eye toggle for password fields, unitLabel overlay.

---

### 5. `mobile/src/components/ui/PrimaryButton.tsx`

**Props**
```typescript
interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'filled' | 'outlined';
}
```

Key behaviors: filled default (#4CAF50 bg, white text), outlined (white bg, green border/text), loading shows ActivityIndicator and disables press, disabled at 0.5 opacity.

---

### 6. `mobile/src/components/ui/OnboardingDots.tsx`

**Props**
```typescript
interface OnboardingDotsProps {
  total: number;
  current: number; // 0-indexed
}
```

Key behaviors: active dot is 20×8 pill (#4CAF50), inactive is 8×8 circle (#BDBDBD), gap 8, `current` clamped to `[0, total-1]`.

---

### 7. `mobile/src/components/ui/FormErrorText.tsx`

**Props**
```typescript
interface FormErrorTextProps {
  message: string;
}
```

Key behaviors: returns `null` when `message` is falsy, otherwise renders `Animated.Text` with `FadeInDown.duration(100)` entering animation (react-native-reanimated), color `#B71C1C`, fontSize 12, marginTop 4.

---

### 8. `mobile/src/components/ui/ScreenHeader.tsx`

**Props**
```typescript
interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
}
```

Key behaviors: back chevron shown only when `showBack && router.canGoBack()`, onPress calls `onBack?.() ?? router.back()`, title at fontSize 24 / fontWeight 700, subtitle at fontSize 16 / color #757575.

---

## TypeScript Verification

`npx tsc --noEmit` could not execute because `node_modules` is not installed in the mobile directory (packages managed at monorepo level or installed separately). Static review confirms:

- All imports reference packages listed in `package.json`
- No implicit `any` usage (all props are explicitly typed)
- All function signatures match specifications exactly
- `@expo/vector-icons` is available via Expo SDK
- `react-native-reanimated` imports use named exports (`Animated`, `FadeInDown`)

## D-22 Compliance

```
grep "persist|SecureStore|AsyncStorage" mobile/src/lib/auth/auth-store.ts
```
Result: only the inline comment `// in-memory ONLY — never persist (D-22)` — no actual imports or middleware usage. **COMPLIANT.**
