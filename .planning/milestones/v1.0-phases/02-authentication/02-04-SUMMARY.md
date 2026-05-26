# Phase 02-04 Summary — Email/Password Auth Endpoints

## Status: COMPLETE
- TypeScript: 0 errors (`tsc --noEmit`)
- Integration tests: 10/10 pass

---

## Endpoints Delivered

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| POST | `/api/auth/register` | None | Register new user with email + password |
| POST | `/api/auth/login` | None | Login, receive token pair |
| POST | `/api/auth/refresh` | None | Rotate refresh token |
| POST | `/api/auth/logout` | Bearer | Revoke refresh token |
| PATCH | `/api/auth/complete-profile` | Bearer | Set name, age, height, weight, goalType |

### Request / Response Shapes

**POST /api/auth/register**
```json
// Request
{ "email": "user@example.com", "password": "password123" }
// Response 201
{ "success": true, "data": { "user": { "id": "...", "email": "...", "name": "", "role": "user", "profileCompleted": false }, "accessToken": "...", "refreshToken": "..." } }
```

**POST /api/auth/login**
```json
// Request
{ "email": "user@example.com", "password": "password123" }
// Response 200 — same shape as register
```

**POST /api/auth/refresh**
```json
// Request
{ "refreshToken": "..." }
// Response 200
{ "success": true, "data": { "accessToken": "...", "refreshToken": "..." } }
```

**POST /api/auth/logout**
```
Authorization: Bearer <accessToken>
// Response 204 — no body
```

**PATCH /api/auth/complete-profile**
```json
// Request + Authorization: Bearer <accessToken>
{ "name": "Nguyen Van A", "age": 25, "heightCm": 170, "weightKg": 65, "goalType": "maintain" }
// Response 200
{ "success": true, "data": { "id": "...", "email": "...", "name": "Nguyen Van A", "role": "user", "profileCompleted": true } }
```

---

## Error Codes

| Status | Trigger |
|--------|---------|
| 400 | Validation failure (short password, invalid email, missing fields) |
| 401 | Wrong credentials, expired/invalid/reused refresh token, missing Bearer |
| 404 | User not found during profile update |
| 409 | Duplicate email on register |

---

## Age → dateOfBirth Conversion Note

MVP simplification: `age` integer is accepted instead of a full date of birth. The `dateOfBirth` field is derived by subtracting `age` years from `new Date()` at write time. This means the stored date is approximate (does not account for birth month/day within the current year). Acceptable for MVP — can be refined when a full date picker is added.

---

## Critical Bug Found & Fixed: bcrypt 72-byte Truncation

bcrypt truncates input to **72 bytes**. JWT tokens are ~225 chars but share identical first 72 bytes (same header + payload prefix up to the jti field). This caused `compareTokenHash(oldToken, hash(newToken))` to return `true`, completely defeating token rotation.

**Fix**: SHA-256 pre-hash the JWT string before bcrypt in `auth.service.ts`:
```typescript
function sha256(input: string): string {
  return crypto.createHash('sha256').update(input).digest('hex');
}
// Usage:
const hash = await hashToken(sha256(refreshToken));         // store
const valid = await compareTokenHash(sha256(rawToken), storedHash); // verify
```
The SHA-256 output is always 64 hex chars — well within bcrypt's 72-byte limit and unique per token.

---

## error.middleware.ts Patch

Added `statusCode` support **before** the existing Mongoose/Mongo error handlers:
```typescript
const status = (err as { statusCode?: number }).statusCode;
if (typeof status === 'number') {
  res.status(status).json({ success: false, error: err.message });
  return;
}
```
This allows service functions to throw plain `Error` objects with a `statusCode` property that Express 5's async error propagation delivers to the middleware.

---

## New devDependencies Added

```json
"supertest": "^7.0.0",
"@types/supertest": "^6.0.0",
"mongodb-memory-server": "^10.0.0"
```

mongodb-memory-server downloads MongoDB 7.0.24 (~600 MB) on first run — this is cached in `~/.cache/mongodb-binaries` for subsequent runs.

### Running Tests

```bash
# Set required env vars (only JWT secrets matter for auth logic):
MONGODB_URI=mongodb://test \
JWT_ACCESS_SECRET=test-access \
JWT_REFRESH_SECRET=test-refresh \
CLOUDINARY_CLOUD_NAME=test \
CLOUDINARY_API_KEY=test \
CLOUDINARY_API_SECRET=test \
FIREBASE_PROJECT_ID=test \
FIREBASE_CLIENT_EMAIL=test@test \
FIREBASE_PRIVATE_KEY=test \
node --require tsx/cjs --test src/api/auth/auth.integration.test.ts
```

Or use the npm script: `npm run test:auth` (requires env vars in shell).

---

## Integration Test Results

```
TAP version 13
ok 1  - POST /api/auth/register - valid → 201 + profileCompleted=false        (844ms)
ok 2  - POST /api/auth/register - duplicate email → 409 + Vietnamese error     (277ms)
ok 3  - POST /api/auth/register - short password → 400                         (14ms)
ok 4  - POST /api/auth/login - wrong password → 401                            (341ms)
ok 5  - POST /api/auth/login - correct credentials → 200 + tokens              (344ms)
ok 6  - POST /api/auth/refresh - fresh token → 200 + new tokens                (358ms)
ok 7  - POST /api/auth/refresh - old token after rotation → 401                (374ms)
ok 8  - POST /api/auth/logout - with bearer → 204                              (142ms)
ok 9  - PATCH /api/auth/complete-profile - valid → 200 + profileCompleted=true (147ms)
ok 10 - PATCH /api/auth/complete-profile - without bearer → 401                (3ms)

# tests 10 | pass 10 | fail 0 | duration_ms 4200ms
```

---

## Files Created / Modified

| File | Action |
|------|--------|
| `backend/src/api/auth/auth.validation.ts` | Created — Zod schemas |
| `backend/src/api/auth/auth.service.ts` | Created — business logic (register, login, refresh, logout, complete-profile) |
| `backend/src/api/auth/auth.controller.ts` | Created — Express controllers |
| `backend/src/api/auth/auth.routes.ts` | Created — Express router |
| `backend/src/api/auth/auth.integration.test.ts` | Created — 10 Supertest integration tests |
| `backend/src/app.ts` | Patched — mount authRouter at /api/auth |
| `backend/src/middleware/error.middleware.ts` | Patched — statusCode support |
| `backend/package.json` | Patched — supertest, @types/supertest, mongodb-memory-server devDeps + test:auth script |
