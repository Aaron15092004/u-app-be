# Phase 2 Plan 05 — Auth Vertical Slice Summary

**Scope:** AUTH-02, AUTH-03, AUTH-07 — Full email/password auth slice (login, register, complete-profile)
**Date:** 2026-05-18
**TSC result:** `exit 0` (clean)
**Structural check:** PASS

---

## Files Created

| File | Purpose |
|------|---------|
| `mobile/src/lib/api/auth.api.ts` | Typed wrappers: `registerApi`, `loginApi`, `refreshApi`, `logoutApi`, `completeProfileApi` |
| `mobile/src/components/ui/GoalCard.tsx` | Goal selector card (lose / maintain / gain), selected state with green border + tinted bg |
| `mobile/src/app/(auth)/login.tsx` | Login screen — email/password, forgot-password link, Google/Apple placeholders |
| `mobile/src/app/(auth)/register.tsx` | Register screen — email + password + confirm, terms checkbox, no name field (D-32) |
| `mobile/src/app/(auth)/complete-profile.tsx` | Profile completion — name, age, height, weight, 3 GoalCards; Android back blocked (D-30) |

## Files Modified

| File | Change |
|------|--------|
| `mobile/src/lib/api/client.ts` | Full rewrite: removed SecureStore access-token read; added Zustand-based auth header; 401 refresh-and-retry interceptor with queue pattern; `authEvents` simple event bus |
| `mobile/src/providers/AuthProvider.tsx` | Full rewrite: cold-start silent refresh; session-expired event subscription; login / register / logout / completeProfile / refreshAccessToken actions; SplashScreen.hideAsync in finally block (D-38) |
| `mobile/src/lib/storage/mmkv.ts` | Added `setCachedUser`, `getCachedUser`, `clearCachedUser` |
| `mobile/src/app/_layout.tsx` | Full rewrite: RouteGate component handles onboarding → auth → complete-profile → tabs routing; no SplashScreen.hideAsync here (D-38) |
| `mobile/src/app/index.tsx` | Simplified to `<Redirect href="/(tabs)/" />` |
| `mobile/src/app/(tabs)/index.tsx` | Fixed broken redirect (was `href="/"`); now renders placeholder tab home screen |
| `mobile/package.json` | Removed non-existent `babel-plugin-nativewind` devDep; npm install ran successfully |

---

## AuthProvider API (exported)

```typescript
export interface AuthContextValue {
  isLoading: boolean;           // true until cold-start refresh resolves
  isAuthenticated: boolean;     // derived from Zustand user !== null
  user: IAuthUser | null;       // from Zustand store (reactive)
  login(email, password): Promise<IAuthUser>;
  register(email, password): Promise<IAuthUser>;
  logout(): Promise<void>;
  refreshAccessToken(): Promise<string | null>;
  completeProfile(body: CompleteProfileRequest): Promise<IAuthUser>;
  sessionExpired: boolean;      // set by 401 interceptor event
  acknowledgeSessionExpired(): void;
}
```

---

## Refresh Interceptor Design Decisions

- **Queue pattern** for concurrent 401s — queued requests wait for a single refresh, then replay with new token.
- **Infinite-loop guard #1**: never retry if URL contains `/api/auth/refresh`.
- **Infinite-loop guard #2**: never retry if `__isRetry` already set on config.
- **Access token source**: `useAuthStore.getState().accessToken` (Zustand in-memory, D-22) — NOT SecureStore.
- **Session-expired propagation**: `authEvents.emit()` → AuthProvider subscribes via `authEvents.on()` → sets `sessionExpired: true` state.
- **Event bus**: plain array of callbacks (no Node.js `events` module — unsafe in Metro bundler).

---

## Root Layout Routing Logic (RouteGate)

```
isLoading → render null (splash still visible)

!onboardingSeen && !inOnboarding  → replace /(onboarding)/
onboardingSeen && !authenticated && !inAuth → replace /(auth)/login
authenticated && !profileCompleted && segment[1] !== complete-profile → replace /(auth)/complete-profile
authenticated && profileCompleted && (inAuth || inOnboarding) → replace /(tabs)/
```

---

## Cached User Decision (no /me endpoint)

There is no `/me` endpoint in the backend API design. On cold-start, after a successful silent refresh, the user object is restored from MMKV (`auth_user` key). The user object is written to MMKV on login, register, and completeProfile. It is cleared on logout and on session-expired events.

---

## Key Constraints Verified

- **D-22**: Access token in Zustand only — `getAccessToken()` from SecureStore removed from client.ts request interceptor.
- **D-37**: `onboarding_seen` NOT cleared on logout (only `auth_user` key is cleared).
- **D-38**: `SplashScreen.hideAsync()` called in `AuthProvider` (in finally block of cold-start effect), NOT in `_layout.tsx`.
- **D-30**: No back button on complete-profile; Android hardware back blocked via `BackHandler`.
- **D-31**: All 5 fields (name, age, height, weight, goal) required before "Bắt đầu" is enabled.
- **D-32**: No name field at register — name captured at complete-profile only.
- No `AsyncStorage` anywhere.

---

## Structural Check Results

```
node structural-check → OK
tsc --noEmit       → exit 0 (clean)
```

---

## Device Checkpoint — DEFERRED

Task 4 (human device verification) requires a running Expo build. This cannot be executed in the current environment (no node_modules pre-installed, no connected device/simulator). All code is structurally and type-correct. Device verification should be performed after `npx expo start` on a physical device or simulator.
