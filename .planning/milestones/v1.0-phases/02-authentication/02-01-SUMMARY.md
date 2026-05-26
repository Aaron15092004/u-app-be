# Phase 02-01 Summary — Backend Foundations

**Executed**: 2026-05-18
**Status**: COMPLETE — all files created, TypeScript clean, 24/24 tests passing

---

## Files Created / Modified

| File | Action |
|------|--------|
| `backend/package.json` | Added `"resend": "^4.0.0"` to dependencies |
| `backend/.env.example` | Added `RESEND_API_KEY=` and `APP_DEEP_LINK_BASE=uapp://` |
| `backend/src/models/User.ts` | Patched — 5 new fields + name made optional + removed duplicate index |
| `backend/src/utils/jwt.ts` | Created |
| `backend/src/utils/password.ts` | Created |
| `backend/src/services/email.service.ts` | Created |
| `backend/src/middleware/auth.middleware.ts` | Created |
| `backend/src/models/User.test.ts` | Created — 6 tests |
| `backend/src/utils/jwt.test.ts` | Created — 6 tests |
| `backend/src/utils/password.test.ts` | Created — 7 tests |
| `backend/src/middleware/auth.middleware.test.ts` | Created — 5 tests |

---

## User Model Diff

### IUser interface additions:
```typescript
profileCompleted: boolean;
refreshTokenHash: string | null;
refreshTokenExpiry: Date | null;
passwordResetTokenHash: string | null;
passwordResetTokenExpiry: Date | null;
```

### Schema changes:
- `name`: `required: true` → `default: ''` (supports OAuth users with no name yet)
- Added 5 new schema fields with correct defaults (`false` / `null`)
- Removed duplicate `UserSchema.index({ email: 1 })` call (index already declared inline via `unique: true`)

---

## JWT Utility — Exported Signatures

File: `backend/src/utils/jwt.ts`

```typescript
export interface AccessTokenPayload { sub: string; role: 'user' | 'admin'; }
export interface RefreshTokenPayload { sub: string; jti: string; }

export function signAccessToken(payload: AccessTokenPayload): string
export function signRefreshToken(payload: RefreshTokenPayload): string
export function verifyAccessToken(token: string): AccessTokenPayload
export function verifyRefreshToken(token: string): RefreshTokenPayload
```

**Behavior**: Secrets resolved lazily via `process.env` — throws `Error` at call time if missing (not at import time, enabling test isolation). Uses `JWT_ACCESS_EXPIRES` / `JWT_REFRESH_EXPIRES` env vars, falling back to `'15m'` / `'7d'`.

---

## Password Utility — Exported Signatures

File: `backend/src/utils/password.ts`

```typescript
export async function hashPassword(plain: string): Promise<string>
export async function comparePassword(plain: string, hash: string): Promise<boolean>
export async function hashToken(rawToken: string): Promise<string>
export async function compareTokenHash(rawToken: string, hash: string): Promise<boolean>
```

**Behavior**: Uses `bcryptjs` with salt rounds = 10.

---

## Email Service

File: `backend/src/services/email.service.ts`

```typescript
export async function sendPasswordResetEmail(toEmail: string, resetToken: string): Promise<void>
```

**Template details**:
- Subject: `'Khôi phục mật khẩu Ủ App'`
- From: `'Ủ App <no-reply@uapp.health>'`
- Reset URL: `${APP_DEEP_LINK_BASE ?? 'uapp://'}reset-password?token=${encodeURIComponent(resetToken)}`
- HTML body: Vietnamese, green (#4CAF50) branded, mobile-friendly
- Text body: Plain Vietnamese fallback
- Error handling: try/catch, `console.error` + re-throw for Express 5 error middleware

**Required env vars**:
- `RESEND_API_KEY` — Resend API key
- `APP_DEEP_LINK_BASE` — defaults to `uapp://`

---

## Auth Middleware — Exported Functions

File: `backend/src/middleware/auth.middleware.ts`

```typescript
export interface AuthRequest extends Request {
  user: { id: string; role: 'user' | 'admin' };
}

export function authenticate(req: Request, res: Response, next: NextFunction): void
export async function requireProfile(req: Request, res: Response, next: NextFunction): Promise<void>
```

**authenticate behavior**:
- Reads `Authorization: Bearer <token>` header
- Missing/non-Bearer header → 401 `'Token không hợp lệ hoặc đã hết hạn'`
- Invalid/expired token → 401 `'Token không hợp lệ hoặc đã hết hạn'`
- Valid token → injects `req.user = { id: payload.sub, role: payload.role }`, calls `next()`

**requireProfile behavior**:
- Reads `req.user.id` (set by `authenticate`)
- Queries `User.findById(id).select('profileCompleted')`
- `profileCompleted !== true` → 403 `'Vui lòng hoàn thiện hồ sơ'`
- `profileCompleted === true` → calls `next()`

---

## Test Results

```
src/models/User.test.ts      — 6/6 pass
src/utils/jwt.test.ts        — 6/6 pass
src/utils/password.test.ts   — 7/7 pass
src/middleware/auth.middleware.test.ts — 5/5 pass

Total: 24/24 passing, 0 failing
```

TypeScript (`npx tsc --noEmit`): no errors.

---

## Unblocked by This Plan

- 02-02: Register/Login routes (can now use `hashPassword`, `signAccessToken`, `signRefreshToken`, `User` model)
- 02-03: Google OAuth (can inject `authProviders`, use `signAccessToken`)
- 02-04: Apple Sign In (same pattern)
- 02-05: Refresh token endpoint (can use `verifyRefreshToken`, `compareTokenHash`, `refreshTokenHash` field)
- 02-06: Password reset flow (can use `sendPasswordResetEmail`, `passwordResetTokenHash` fields)
- 02-07: Profile completion (can use `requireProfile` middleware, `profileCompleted` field)
