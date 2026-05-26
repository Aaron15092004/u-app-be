# Phase 2: Authentication - Pattern Map

**Mapped:** 2026-05-17
**Files analyzed:** 16 new/modified files
**Analogs found:** 14 / 16

---

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|---|---|---|---|---|
| `mobile/src/app/_layout.tsx` | layout | request-response | `mobile/src/app/_layout.tsx` (existing stub) | modify-in-place |
| `mobile/src/app/(onboarding)/index.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(onboarding)/screen2.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(onboarding)/screen3.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(onboarding)/_layout.tsx` | layout | request-response | `mobile/src/app/(auth)/_layout.tsx` | exact |
| `mobile/src/app/(auth)/_layout.tsx` | layout | request-response | `mobile/src/app/(tabs)/_layout.tsx` | role-match |
| `mobile/src/app/(auth)/login.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(auth)/register.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(auth)/forgot-password.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(auth)/reset-password.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/app/(auth)/complete-profile.tsx` | component | request-response | `mobile/src/app/index.tsx` | role-match |
| `mobile/src/providers/AuthProvider.tsx` | provider | request-response | `mobile/src/providers/ThemeProvider.tsx` | exact |
| `mobile/src/lib/api/client.ts` | utility | request-response | `mobile/src/lib/api/client.ts` (existing stub) | modify-in-place |
| `backend/src/api/auth/auth.routes.ts` | route | request-response | `backend/src/api/notifications/notification.routes.ts` | exact |
| `backend/src/api/auth/auth.controller.ts` | controller | request-response | `backend/src/api/notifications/notification.controller.ts` | exact |
| `backend/src/api/auth/auth.service.ts` | service | CRUD | `backend/src/services/fcm.service.ts` | role-match |
| `backend/src/middleware/auth.middleware.ts` | middleware | request-response | `backend/src/middleware/error.middleware.ts` | role-match |
| `backend/src/models/User.ts` | model | CRUD | `backend/src/models/Exercise.ts` | exact |
| `backend/src/services/email.service.ts` | service | request-response | `backend/src/services/fcm.service.ts` | role-match |

---

## Pattern Assignments

### `mobile/src/app/_layout.tsx` (layout, modify-in-place)

**Analog:** `mobile/src/app/_layout.tsx` (current file — extend, do not rewrite)

**Current file** (lines 1-36) — extend this pattern:
```typescript
import React, { useEffect, useState } from 'react';
import { Slot } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import QueryProvider from '../providers/QueryProvider';
import { AuthProvider } from '../providers/AuthProvider';
import { ThemeProvider } from '../providers/ThemeProvider';

SplashScreen.preventAutoHideAsync();

export default function RootLayout(): React.JSX.Element | null {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ThemeProvider>
      <QueryProvider>
        <AuthProvider>
          <Slot />
        </AuthProvider>
      </QueryProvider>
    </ThemeProvider>
  );
}
```

**Phase 2 changes required:**
- Replace the `loaded` state approach: splash must stay visible until `AuthProvider` finishes its async cold-start (SecureStore read + optional refresh). Move `SplashScreen.hideAsync()` call into `AuthProvider` after the async resolve, not after a trivial `setLoaded(true)`.
- Add route protection inside `RootLayout` using `useAuth()`: after auth resolves, use `router.replace()` to direct to `/(onboarding)`, `/(auth)/login`, `/(auth)/complete-profile`, or `/(tabs)` based on `onboarding_seen` MMKV flag, `isAuthenticated`, and `profileCompleted`.
- Import `useRouter` from `expo-router` and `useMMKVBoolean` from `react-native-mmkv` for the routing logic.

---

### `mobile/src/app/(onboarding)/_layout.tsx` (layout, no-op)

**Analog:** `mobile/src/app/(auth)/_layout.tsx` (lines 1-7)

**Copy exactly — already correct:**
```typescript
import React from 'react';
import { Stack } from 'expo-router';

export default function OnboardingLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

No changes needed. The skeleton already exists and matches the pattern.

---

### `mobile/src/app/(auth)/_layout.tsx` (layout, no-op)

**Analog:** `mobile/src/app/(auth)/_layout.tsx` (lines 1-7)

**Copy exactly — already correct:**
```typescript
import React from 'react';
import { Stack } from 'expo-router';

export default function AuthLayout(): React.JSX.Element {
  return <Stack screenOptions={{ headerShown: false }} />;
}
```

No changes needed. The skeleton already exists and matches the pattern.

---

### `mobile/src/app/(onboarding)/index.tsx`, `screen2.tsx`, `screen3.tsx` (component, request-response)

**Analog:** `mobile/src/app/index.tsx`

**Screen component structure** (lines 1-12 + 77-112 of analog):
```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { PRIMARY, BACKGROUND, TEXT } from '../../constants/colors';

export default function OnboardingScreen1(): React.JSX.Element {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* illustration / logo */}
      <Text style={styles.title}>...</Text>
      <Text style={styles.subtitle}>...</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.push('/(onboarding)/screen2')}>
        <Text style={styles.buttonText}>Tiếp tục</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: '700', color: TEXT, marginBottom: 12 },
  subtitle: { fontSize: 16, color: '#757575', textAlign: 'center', marginBottom: 40 },
  button: { backgroundColor: PRIMARY, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
```

**Screen 3 specifics:**
- Button label: `"Bắt đầu"` (not `"Tiếp tục"`)
- `onPress`: save MMKV key `onboarding_seen = true` then `router.replace('/(auth)/login')`
- Import MMKV storage from project's mmkv instance (create `mobile/src/lib/storage/mmkv.ts` if not exists)

**MMKV usage pattern** (based on D-34):
```typescript
import { MMKV } from 'react-native-mmkv';
const storage = new MMKV();

// Write (Screen 3 onPress):
storage.set('onboarding_seen', true);
router.replace('/(auth)/login');

// Read (root layout routing):
const onboardingSeen = storage.getBoolean('onboarding_seen') ?? false;
```

---

### `mobile/src/providers/AuthProvider.tsx` (provider, full rewrite)

**Analog:** `mobile/src/providers/ThemeProvider.tsx` (lines 1-64) — context + hook pattern

**Context + hook shell to follow** (ThemeProvider pattern lines 52-64):
```typescript
// Pattern: createContext → Provider component → named hook export
const ThemeContext = createContext<Theme>(theme);

export function ThemeProvider({ children }: Props): React.JSX.Element {
  return <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>;
}

export function useTheme(): Theme {
  return useContext(ThemeContext);
}
```

**Phase 2 AuthProvider must expand the existing stub** (`mobile/src/providers/AuthProvider.tsx` lines 1-32):
```typescript
// Current stub shape — keep the hook export and context, expand the value type:
interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: null;   // Phase 2: replace null with IAuthUser type
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
```

**Phase 2 expanded AuthContextValue shape:**
```typescript
interface IAuthUser {
  id: string;
  email: string;
  name: string | null;
  role: 'user' | 'admin';
  profileCompleted: boolean;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: IAuthUser | null;
  // Actions:
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithApple: () => Promise<void>;
  logout: () => Promise<void>;
  refreshAccessToken: () => Promise<string | null>;
  setUser: (user: IAuthUser) => void;
}
```

**Cold-start pattern** (D-38: SecureStore read + SplashScreen):
```typescript
// Inside AuthProvider useEffect on mount:
useEffect(() => {
  (async () => {
    try {
      const refreshToken = await getRefreshToken(); // from mobile/src/lib/auth/token-storage.ts
      if (refreshToken) {
        // call POST /api/auth/refresh, store new access token in-memory (Zustand)
        // if 401 → clearTokens() + show expired toast (D-39)
      }
    } finally {
      setIsLoading(false);
      SplashScreen.hideAsync(); // D-38: hide after resolve
    }
  })();
}, []);
```

**Logout pattern** (D-40):
```typescript
async function logout() {
  await clearTokens();            // from token-storage.ts — clears SecureStore
  setUser(null);                  // clear Zustand store
  queryClient.clear();            // from mobile/src/lib/query/query-client.ts
  // MMKV onboarding_seen is NOT cleared (D-37)
}
```

**Token storage** — use existing `mobile/src/lib/auth/token-storage.ts` directly:
```typescript
// Already implemented — import and use:
import {
  saveAccessToken,
  getAccessToken,
  saveRefreshToken,
  getRefreshToken,
  clearTokens,
} from '../lib/auth/token-storage';
```

---

### `mobile/src/app/(auth)/login.tsx` (component, request-response)

**Analog:** `mobile/src/app/index.tsx` — screen component structure + apiClient usage

**Imports pattern** (analog lines 1-13):
```typescript
import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/api/client';
import { useAuth } from '../../providers/AuthProvider';
import { PRIMARY, BACKGROUND, TEXT, TEXT_SECONDARY } from '../../constants/colors';
```

**TanStack Query mutation pattern** (for all auth form screens):
```typescript
const loginMutation = useMutation({
  mutationFn: async (data: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<LoginResponse>>('/api/auth/login', data);
    return res.data.data;
  },
  onSuccess: (data) => {
    // save tokens, set user in AuthProvider, navigate
    auth.setUser(data.user);
    router.replace('/(tabs)');
  },
  onError: (err) => {
    // display inline error
  },
});
```

**StyleSheet pattern** (analog lines 77-112) — use `PRIMARY = '#4CAF50'`, `BACKGROUND = '#F5F5F5'`, `TEXT = '#212121'` from `mobile/src/constants/colors.ts`.

---

### `mobile/src/app/(auth)/register.tsx` (component, request-response)

Same imports and mutation pattern as `login.tsx`. Additional fields: confirm password, Terms checkbox. On success: `router.replace('/(auth)/complete-profile')` (D-30).

---

### `mobile/src/app/(auth)/forgot-password.tsx` + `reset-password.tsx` (component, request-response)

Same screen component pattern. `reset-password.tsx` receives token via deep-link query param:
```typescript
import { useLocalSearchParams } from 'expo-router';
const { token } = useLocalSearchParams<{ token: string }>();
```

---

### `mobile/src/app/(auth)/complete-profile.tsx` (component, request-response)

**Same structure as register.tsx.** Fields: name, age (derive DOB or store age → dateOfBirth), height (cm), weight (kg), goal (`lose`/`maintain`/`gain`). All required (D-31). On success: `router.replace('/(tabs)')`. No skip button (D-30).

---

### `mobile/src/lib/api/client.ts` (utility, modify-in-place)

**Analog:** `mobile/src/lib/api/client.ts` (lines 1-32) — existing file, extend the 401 interceptor

**Current skeleton** (lines 1-32):
```typescript
import axios from 'axios';
import { getAccessToken } from '../auth/token-storage';

const apiClient = axios.create({
  baseURL: process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
});

apiClient.interceptors.request.use(async (requestConfig) => {
  const token = await getAccessToken();
  if (token && requestConfig.headers) {
    requestConfig.headers.Authorization = `Bearer ${token}`;
  }
  return requestConfig;
});

apiClient.interceptors.response.use(
  (response) => response,
  (err) => {
    if (axios.isAxiosError(err) && err.response?.status === 401) {
      // TODO Phase 2: implement token refresh interceptor
      console.warn('401 received — token refresh needed (Phase 2)');
    }
    return Promise.reject(err);
  }
);
```

**Phase 2 — replace the TODO block** with a refresh-and-retry interceptor. The pattern must:
1. Call `POST /api/auth/refresh` with the stored refresh token
2. On success: store new tokens, retry the original request with new `Authorization` header
3. On failure (refresh 401): call `clearTokens()`, dispatch "session expired" event consumed by AuthProvider

**Note:** Access token is stored in-memory (Zustand store, D-22). The request interceptor reads from the Zustand store directly (not SecureStore) for the access token. SecureStore is only used for the refresh token.

---

### `backend/src/api/auth/auth.routes.ts` (route, request-response)

**Analog:** `backend/src/api/notifications/notification.routes.ts` (lines 1-9)

**Copy this pattern exactly:**
```typescript
import { Router } from 'express';
import * as authController from './auth.controller';

const router = Router();

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', authController.logout);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);
router.patch('/complete-profile', authController.completeProfile);   // protected
router.post('/google', authController.googleOAuth);
router.post('/apple', authController.appleSignIn);

export default router;
```

**Mount in `backend/src/app.ts`** (line 8-14 pattern):
```typescript
import authRouter from './api/auth/auth.routes';
// ...
app.use('/api/auth', authRouter);
```

---

### `backend/src/api/auth/auth.controller.ts` (controller, request-response)

**Analog:** `backend/src/api/notifications/notification.controller.ts` (lines 1-21)

**Import + response pattern** (analog lines 1-4):
```typescript
import { Request, Response } from 'express';
import * as authService from './auth.service';
import { success, error } from '../../utils/response';
```

**Controller function shape** (analog lines 5-21 — note Express 5 async, no try/catch needed at controller layer):
```typescript
export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body as { email?: string; password?: string };

  if (!email || !password) {
    error(res, 'email and password are required', 400);
    return;
  }

  const result = await authService.loginWithEmail(email, password);
  success(res, result, 200);
}
```

**Key points:**
- Express 5 propagates thrown errors to `errorMiddleware` automatically — no try/catch in controllers.
- Manual validation guards (`if (!field)`) return early with `error(res, msg, 400)`.
- Delegate all business logic to `authService`.
- Use `success(res, data)` and `error(res, msg, statusCode)` from `../../utils/response`.

**Protected route handler (complete-profile):**
```typescript
export async function completeProfile(req: Request, res: Response): Promise<void> {
  // req.user injected by auth.middleware.ts
  const userId = (req as AuthRequest).user.id;
  const result = await authService.completeProfile(userId, req.body);
  success(res, result);
}
```

---

### `backend/src/api/auth/auth.service.ts` (service, CRUD)

**Analog:** `backend/src/services/fcm.service.ts` (lines 1-36) — service with model interaction

**Import pattern** (analog lines 1-2):
```typescript
import User from '../../models/User';
import { IUser } from '../../models/User';
```

**Service function shape** (analog lines 26-36 — `findOneAndUpdate` upsert pattern):
```typescript
export async function loginWithEmail(
  email: string,
  password: string
): Promise<{ user: SafeUser; accessToken: string; refreshToken: string }> {
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user || !user.passwordHash) {
    throw Object.assign(new Error('Email hoặc mật khẩu không đúng'), { statusCode: 401 });
  }
  // bcrypt compare, JWT sign, refresh token hash+save...
}
```

**Error throwing convention** (for Express 5 propagation to errorMiddleware):
```typescript
// Attach statusCode to error — errorMiddleware reads it (or use a custom AppError class)
const err = new Error('message');
(err as any).statusCode = 401;
throw err;
```

**JWT sign pattern** (D-22: 15min access, 7d refresh):
```typescript
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

const accessToken = jwt.sign(
  { sub: user._id.toString(), role: user.role },
  process.env.JWT_SECRET!,
  { expiresIn: '15m' }
);

const refreshTokenRaw = crypto.randomUUID();
const refreshTokenHash = await bcrypt.hash(refreshTokenRaw, 10);
// save hash to user document, return raw token to client
```

---

### `backend/src/middleware/auth.middleware.ts` (middleware, request-response)

**Analog:** `backend/src/middleware/error.middleware.ts` (lines 1-36) — Express middleware signature

**Middleware function signature** (analog lines 13-18):
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { error } from '../utils/response';

export interface AuthRequest extends Request {
  user: { id: string; role: 'user' | 'admin' };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    error(res, 'Unauthorized', 401);
    return;
  }

  const token = authHeader.slice(7);
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { sub: string; role: 'user' | 'admin' };
    (req as AuthRequest).user = { id: payload.sub, role: payload.role };
    next();
  } catch {
    error(res, 'Token không hợp lệ hoặc đã hết hạn', 401);
  }
}
```

**Profile-completed guard** (D-33):
```typescript
export async function requireProfile(req: Request, res: Response, next: NextFunction): Promise<void> {
  const userId = (req as AuthRequest).user.id;
  const user = await User.findById(userId).select('profile');
  if (!user?.profile?.heightCm) {
    error(res, 'Vui lòng hoàn thiện hồ sơ', 403);
    return;
  }
  next();
}
```

---

### `backend/src/models/User.ts` (model, CRUD — modify-in-place)

**Analog:** `backend/src/models/Exercise.ts` (lines 1-46) — Mongoose schema pattern with interface

**Current file** (`backend/src/models/User.ts` lines 26-52) — apply targeted changes:

Line 30 change — `name` field from required to optional (D-33):
```typescript
// BEFORE:
name: { type: String, required: true, trim: true },

// AFTER:
name: { type: String, default: '', trim: true },
```

Add `profileCompleted` field (D-33):
```typescript
// Add after notifications field:
profileCompleted: { type: Boolean, default: false },
refreshTokenHash: { type: String, default: null },
refreshTokenExpiry: { type: Date, default: null },
passwordResetTokenHash: { type: String, default: null },
passwordResetTokenExpiry: { type: Date, default: null },
```

Update `IUser` interface to match:
```typescript
export interface IUser extends Document {
  // ...existing fields...
  name: string;            // no longer required in TS either — keep as string, default ''
  profileCompleted: boolean;
  refreshTokenHash: string | null;
  refreshTokenExpiry: Date | null;
  passwordResetTokenHash: string | null;
  passwordResetTokenExpiry: Date | null;
}
```

**Schema pattern to follow** (Exercise.ts lines 22-46):
```typescript
const ExerciseSchema = new Schema<IExercise>(
  { /* fields */ },
  { timestamps: true }   // always use timestamps: true
);
ExerciseSchema.index({ category: 1, isActive: 1 });
export default mongoose.model<IExercise>('Exercise', ExerciseSchema);
```

---

### `backend/src/services/email.service.ts` (service, request-response)

**Analog:** `backend/src/services/fcm.service.ts` (lines 1-37) — external SDK wrapper service

**Import pattern** (analog lines 1-2):
```typescript
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY!);
```

**Service function shape** (analog lines 4-24 — try/catch per-operation, non-fatal logging):
```typescript
export async function sendPasswordResetEmail(
  toEmail: string,
  resetToken: string
): Promise<void> {
  const resetUrl = `${process.env.APP_DEEP_LINK_BASE}/reset-password?token=${resetToken}`;

  await resend.emails.send({
    from: 'Ủ App <no-reply@uapp.health>',
    to: toEmail,
    subject: 'Khôi phục mật khẩu Ủ App',   // D-28
    html: `<p>Nhấn vào link để đặt lại mật khẩu: <a href="${resetUrl}">${resetUrl}</a></p><p>Link hết hạn sau 1 giờ.</p>`,
    text: `Nhấn vào link để đặt lại mật khẩu: ${resetUrl}\nLink hết hạn sau 1 giờ.`,
  });
}
```

**Error pattern** (analog lines 12-14 — log and let error propagate to Express 5):
```typescript
} catch (err) {
  console.error('Resend email send failed:', err);
  throw err;  // propagates to errorMiddleware
}
```

---

## Shared Patterns

### Response Utility
**Source:** `backend/src/utils/response.ts` (lines 1-9)
**Apply to:** All controller files in `backend/src/api/auth/`
```typescript
import { success, error } from '../../utils/response';

// Success:
success(res, { user, accessToken }, 200);   // wraps as { success: true, data: ... }
// Error (manual guard):
error(res, 'Email đã tồn tại', 409);        // wraps as { success: false, error: ... }
// Express 5 async errors: throw — propagates to errorMiddleware automatically
```

### Error Middleware (existing, no changes)
**Source:** `backend/src/middleware/error.middleware.ts` (lines 13-36)
**Apply to:** Thrown errors from `auth.service.ts` propagate here automatically (Express 5).
```typescript
// Handles:
// - Mongoose ValidationError → 400
// - MongoDB duplicate key (code 11000) → 409
// - Generic Error → 500 (dev: with stack, prod: generic message)
// Auth service must throw plain Errors with statusCode property for other cases
```

### Colors / Design System
**Source:** `mobile/src/constants/colors.ts` (lines 1-8)
**Apply to:** All mobile screen components
```typescript
import { PRIMARY, PRIMARY_DARK, BACKGROUND, SURFACE, TEXT, TEXT_SECONDARY } from '../../constants/colors';
// PRIMARY = '#4CAF50' (green — buttons, active states)
// BACKGROUND = '#F5F5F5', SURFACE = '#FFFFFF', TEXT = '#212121'
```

### TanStack Query + apiClient Pattern
**Source:** `mobile/src/app/index.tsx` (lines 1-25) + `mobile/src/lib/api/client.ts` (lines 1-32)
**Apply to:** All auth screen components that call the backend
```typescript
import { useMutation } from '@tanstack/react-query';
import apiClient from '../../lib/api/client';
import type { ApiResponse } from '../../types/api.types';

// Mutation (POST forms):
const mutation = useMutation({
  mutationFn: (body: TInput) =>
    apiClient.post<ApiResponse<TOutput>>('/api/auth/...', body).then(r => r.data.data),
  onSuccess: (data) => { /* navigate, setUser */ },
  onError: (err) => { /* show inline error */ },
});
```

### React Native Screen StyleSheet
**Source:** `mobile/src/app/index.tsx` (lines 77-112)
**Apply to:** All onboarding and auth screen components
```typescript
const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24, backgroundColor: BACKGROUND },
  title: { fontSize: 24, fontWeight: '700', color: TEXT, marginBottom: 12 },
  button: { backgroundColor: PRIMARY, paddingHorizontal: 48, paddingVertical: 14, borderRadius: 8 },
  buttonText: { color: '#FFFFFF', fontWeight: '600', fontSize: 16 },
});
```

### Mongoose Model Pattern
**Source:** `backend/src/models/Exercise.ts` (lines 1-46)
**Apply to:** Any new models (none this phase, but User.ts modifications follow this pattern)
```typescript
import mongoose, { Document, Schema } from 'mongoose';

export interface IFoo extends Document { /* typed fields */ }

const FooSchema = new Schema<IFoo>(
  { /* fields with type/required/default/enum */ },
  { timestamps: true }
);

FooSchema.index({ fieldA: 1, fieldB: -1 });

export default mongoose.model<IFoo>('Foo', FooSchema);
```

### Token Storage (SecureStore)
**Source:** `mobile/src/lib/auth/token-storage.ts` (lines 1-26) — do not modify, just import
**Apply to:** `AuthProvider.tsx`, `api/client.ts` (refresh interceptor)
```typescript
import {
  saveAccessToken, getAccessToken,
  saveRefreshToken, getRefreshToken,
  clearTokens,
} from '../lib/auth/token-storage';
// Keys: 'access_token', 'refresh_token' — already defined in the file
```

---

## No Analog Found

| File | Role | Data Flow | Reason |
|---|---|---|---|
| `mobile/src/lib/storage/mmkv.ts` | utility | — | No MMKV singleton exists yet — create new. Pattern: `import { MMKV } from 'react-native-mmkv'; export const storage = new MMKV();` |
| `mobile/src/hooks/useAuth.ts` (if extracted) | hook | — | Thin re-export of `useAuth` from `AuthProvider.tsx`. May not be a separate file — defer to planner. |

---

## Metadata

**Analog search scope:** `mobile/src/`, `backend/src/` (all subdirectories)
**Files scanned:** 26
**Pattern extraction date:** 2026-05-17
