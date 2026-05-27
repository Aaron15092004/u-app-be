// IMPORTANT: Set ALL required env vars before any require/import resolution
// tsx/cjs compiles this to CJS — process.env assignments execute before
// module-level code of imported modules is evaluated.
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.NODE_ENV = 'test';
// Stub out required env vars so config/index.ts doesn't throw at import time
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/test-stub';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'test';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? 'test';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? 'test';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'test';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? 'test-key';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import { _emailDeps, _googleClient, _appleSigninDeps } from '../../api/auth/auth.service';
import User from '../../models/User';

// Monkey-patch email sending through the mutable indirection object exported
// from auth.service. This avoids fighting tsx/CJS's sealed namespace exports.
let capturedResetEmail: string = '';
let capturedResetToken: string = '';
_emailDeps.sendPasswordResetEmail = async (toEmail: string, rawToken: string): Promise<void> => {
  capturedResetEmail = toEmail;
  capturedResetToken = rawToken;
};

let mongoServer: MongoMemoryServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  // Override the connection with the in-memory URI
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ---------------------------------------------------------------------------
// Test 1: POST /register — valid payload → 201, profileCompleted=false
// ---------------------------------------------------------------------------
test('POST /api/auth/register - valid → 201 + profileCompleted=false', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'test1@example.com', password: 'password123' });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.user.profileCompleted, false);
  assert.ok(res.body.data.accessToken);
  assert.ok(res.body.data.refreshToken);
});

// ---------------------------------------------------------------------------
// Test 2: POST /register — duplicate email → 409 + Vietnamese error
// ---------------------------------------------------------------------------
test('POST /api/auth/register - duplicate email → 409 + Vietnamese error', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'duplicate@example.com', password: 'password123' });

  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'duplicate@example.com', password: 'password123' });

  assert.equal(res.status, 409);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.includes('Email này đã được sử dụng'));
});

// ---------------------------------------------------------------------------
// Test 3: POST /register — short password → 400
// ---------------------------------------------------------------------------
test('POST /api/auth/register - short password → 400', async () => {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'short@example.com', password: 'abc' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 4: POST /login — wrong password → 401
// ---------------------------------------------------------------------------
test('POST /api/auth/login - wrong password → 401', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'wrongpass@example.com', password: 'correctpassword' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'wrongpass@example.com', password: 'wrongpassword' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 5: POST /login — correct credentials → 200 + tokens
// ---------------------------------------------------------------------------
test('POST /api/auth/login - correct credentials → 200 + tokens', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'login@example.com', password: 'correctpassword' });

  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'login@example.com', password: 'correctpassword' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.accessToken);
  assert.ok(res.body.data.refreshToken);
});

// ---------------------------------------------------------------------------
// Test 6: POST /refresh — fresh token → 200 + new tokens
// ---------------------------------------------------------------------------
test('POST /api/auth/refresh - fresh token → 200 + new tokens', async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'refresh@example.com', password: 'password123' });

  const { refreshToken: originalToken } = regRes.body.data;

  const res = await request(app)
    .post('/api/auth/refresh')
    .send({ refreshToken: originalToken });

  assert.equal(res.status, 200);
  assert.ok(res.body.data.accessToken);
  assert.ok(res.body.data.refreshToken);
  // New refresh token should differ from original
  assert.notEqual(res.body.data.refreshToken, originalToken);
});

// ---------------------------------------------------------------------------
// Test 7: POST /refresh — old token (after rotation) → 401
// ---------------------------------------------------------------------------
test('POST /api/auth/refresh - old token after rotation → 401', async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'rotation@example.com', password: 'password123' });

  const { refreshToken: originalToken } = regRes.body.data;

  // First rotation consumes the original token
  await request(app)
    .post('/api/auth/refresh')
    .send({ refreshToken: originalToken });

  // Second use of the old token should fail
  const res = await request(app)
    .post('/api/auth/refresh')
    .send({ refreshToken: originalToken });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 8: POST /logout — with bearer → 204
// ---------------------------------------------------------------------------
test('POST /api/auth/logout - with bearer → 204', async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'logout@example.com', password: 'password123' });

  const { accessToken } = regRes.body.data;

  const res = await request(app)
    .post('/api/auth/logout')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 204);
});

// ---------------------------------------------------------------------------
// Test 9: PATCH /complete-profile — with bearer + valid body → 200 + profileCompleted=true
// ---------------------------------------------------------------------------
test('PATCH /api/auth/complete-profile - valid → 200 + profileCompleted=true', async () => {
  const regRes = await request(app)
    .post('/api/auth/register')
    .send({ email: 'profile@example.com', password: 'password123' });

  const { accessToken } = regRes.body.data;

  const res = await request(app)
    .patch('/api/auth/complete-profile')
    .set('Authorization', `Bearer ${accessToken}`)
    .send({
      name: 'Nguyen Van A',
      age: 25,
      heightCm: 170,
      weightKg: 65,
      goalType: 'maintain',
    });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.profileCompleted, true);
  assert.equal(res.body.data.name, 'Nguyen Van A');
});

// ---------------------------------------------------------------------------
// Test 10: PATCH /complete-profile — without bearer → 401
// ---------------------------------------------------------------------------
test('PATCH /api/auth/complete-profile - without bearer → 401', async () => {
  const res = await request(app)
    .patch('/api/auth/complete-profile')
    .send({
      name: 'No Auth',
      age: 25,
      heightCm: 170,
      weightKg: 65,
      goalType: 'maintain',
    });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Password reset tests (AUTH-04)
// Uses the monkey-patched emailService stub at the top of this file.
// ---------------------------------------------------------------------------

// Test 11: POST /forgot-password — known email → 200, same success message
test('POST /api/auth/forgot-password - known email → 200 + success message', async () => {
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'reset-user@example.com', password: 'OldPassword1!' });

  capturedResetToken = '';
  capturedResetEmail = '';

  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'reset-user@example.com' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.message.includes('Email đặt lại mật khẩu đã được gửi'));
  assert.equal(capturedResetEmail, 'reset-user@example.com');
  assert.ok(capturedResetToken.length > 0);
});

// Test 12: POST /forgot-password — unknown email → 200, same message (enumeration prevention)
test('POST /api/auth/forgot-password - unknown email → 200 same message', async () => {
  const res = await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'nobody@example.com' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.message.includes('Email đặt lại mật khẩu đã được gửi'));
});

// Test 13: POST /reset-password — valid captured token → 200, password updated
test('POST /api/auth/reset-password - valid token → 200 + success message', async () => {
  // Trigger a fresh reset so capturedResetToken is populated
  capturedResetToken = '';
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'reset-user@example.com' });

  const token = capturedResetToken;
  assert.ok(token.length > 0, 'stub should have captured a token');

  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token, password: 'NewPassword1!' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.message.includes('Đặt lại mật khẩu thành công'));
});

// Test 14: POST /reset-password — same token again → 401 (single-use)
test('POST /api/auth/reset-password - reuse token → 401', async () => {
  // Issue a new reset so we have a fresh token
  capturedResetToken = '';
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'reset-user@example.com' });

  const token = capturedResetToken;

  // First use — consumes the token
  await request(app)
    .post('/api/auth/reset-password')
    .send({ token, password: 'AnotherPassword1!' });

  // Second use — token is gone
  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token, password: 'AnotherPassword2!' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// Test 15: POST /reset-password — tampered token → 401
test('POST /api/auth/reset-password - tampered token → 401', async () => {
  capturedResetToken = '';
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'reset-user@example.com' });

  const tamperedToken = capturedResetToken.slice(0, -4) + 'xxxx';

  const res = await request(app)
    .post('/api/auth/reset-password')
    .send({ token: tamperedToken, password: 'NewPassword1!' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// Test 16: Login with OLD password after reset → 401
test('POST /api/auth/login - old password after reset → 401', async () => {
  // Register a dedicated user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'oldpass-test@example.com', password: 'OriginalPass1!' });

  // Issue reset and consume it
  capturedResetToken = '';
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'oldpass-test@example.com' });
  await request(app)
    .post('/api/auth/reset-password')
    .send({ token: capturedResetToken, password: 'BrandNewPass1!' });

  // Old password must now be rejected
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'oldpass-test@example.com', password: 'OriginalPass1!' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// Test 17: Login with NEW password after reset → 200
test('POST /api/auth/login - new password after reset → 200', async () => {
  // Register a dedicated user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'newpass-test@example.com', password: 'OriginalPass1!' });

  // Issue reset and consume it
  capturedResetToken = '';
  await request(app)
    .post('/api/auth/forgot-password')
    .send({ email: 'newpass-test@example.com' });
  await request(app)
    .post('/api/auth/reset-password')
    .send({ token: capturedResetToken, password: 'BrandNewPass1!' });

  // New password must work
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email: 'newpass-test@example.com', password: 'BrandNewPass1!' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.accessToken);
});

// ---------------------------------------------------------------------------
// Google OAuth tests (AUTH-05)
// ---------------------------------------------------------------------------

// Helper: install a mock Google verifier
function mockGoogleVerifier(overridePayload?: Partial<{ sub: string; email: string; name: string; picture: string | null }> | null): void {
  const payload = overridePayload !== null
    ? { sub: 'g-123', email: 'google-user@example.com', name: 'Google User', picture: null, ...overridePayload }
    : null;
  (_googleClient as any).verifyIdToken = async () => ({
    getPayload: () => payload,
  });
}

function mockGoogleVerifierThrows(): void {
  (_googleClient as any).verifyIdToken = async () => {
    throw new Error('Token invalid');
  };
}

// Helper: install a mock Apple verifier
function mockAppleVerifier(overridePayload?: Partial<{ sub: string; email: string }>): void {
  const payload = { sub: 'a-456', email: 'apple-user@privaterelay.appleid.com', ...overridePayload };
  _appleSigninDeps.verifyIdToken = async () => payload;
}

function mockAppleVerifierThrows(): void {
  _appleSigninDeps.verifyIdToken = async () => {
    throw new Error('Token invalid');
  };
}

// Test 18: POST /api/auth/google — new user created with authProvider google
test('POST /api/auth/google - new user → 200 + authProvider google', async () => {
  mockGoogleVerifier({ sub: 'g-new-1', email: 'google-new-1@example.com' });

  const res = await request(app)
    .post('/api/auth/google')
    .send({ idToken: 'fake-google-token' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.accessToken);
  assert.ok(res.body.data.refreshToken);
  assert.equal(res.body.data.user.email, 'google-new-1@example.com');

  // Verify authProvider was persisted
  const dbUser = await User.findOne({ email: 'google-new-1@example.com' });
  assert.ok(dbUser);
  assert.ok(dbUser!.authProviders.some((p: { provider: string; providerId: string }) => p.provider === 'google' && p.providerId === 'g-new-1'));
});

// Test 19: POST /api/auth/google same token again → 200, same user (no duplicate)
test('POST /api/auth/google - same providerId → 200, no duplicate user', async () => {
  mockGoogleVerifier({ sub: 'g-same-1', email: 'google-same-1@example.com' });

  await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });
  const res = await request(app).post('/api/auth/google').send({ idToken: 'fake-token' });

  assert.equal(res.status, 200);
  const count = await User.countDocuments({ email: 'google-same-1@example.com' });
  assert.equal(count, 1, 'should not create a duplicate user');
});

// Test 20: POST /api/auth/google verifier throws → 401
test('POST /api/auth/google - verifier throws → 401 Vietnamese error', async () => {
  mockGoogleVerifierThrows();

  const res = await request(app)
    .post('/api/auth/google')
    .send({ idToken: 'bad-token' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.includes('Đăng nhập Google thất bại'));
});

// Test 21: POST /api/auth/apple — new user created with authProvider apple
test('POST /api/auth/apple - new user → 200 + authProvider apple', async () => {
  mockAppleVerifier({ sub: 'a-new-1', email: 'apple-new-1@privaterelay.appleid.com' });

  const res = await request(app)
    .post('/api/auth/apple')
    .send({ identityToken: 'fake-apple-token' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data.accessToken);
  assert.ok(res.body.data.refreshToken);

  const dbUser = await User.findOne({ email: 'apple-new-1@privaterelay.appleid.com' });
  assert.ok(dbUser);
  assert.ok(dbUser!.authProviders.some((p: { provider: string; providerId: string }) => p.provider === 'apple' && p.providerId === 'a-new-1'));
});

// Test 22: POST /api/auth/apple same token → 200, same user
test('POST /api/auth/apple - same providerId → 200, no duplicate user', async () => {
  mockAppleVerifier({ sub: 'a-same-1', email: 'apple-same-1@privaterelay.appleid.com' });

  await request(app).post('/api/auth/apple').send({ identityToken: 'fake-apple-token' });
  const res = await request(app).post('/api/auth/apple').send({ identityToken: 'fake-apple-token' });

  assert.equal(res.status, 200);
  const count = await User.countDocuments({ email: 'apple-same-1@privaterelay.appleid.com' });
  assert.equal(count, 1, 'should not create a duplicate user');
});

// Test 23: POST /api/auth/apple verifier throws → 401
test('POST /api/auth/apple - verifier throws → 401 Vietnamese error', async () => {
  mockAppleVerifierThrows();

  const res = await request(app)
    .post('/api/auth/apple')
    .send({ identityToken: 'bad-token' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.includes('Đăng nhập Apple thất bại'));
});

// Test 24: POST /api/auth/google email matches existing email/password user → account linking
test('POST /api/auth/google - email matches existing user → 200, authProvider appended', async () => {
  // Register a regular email/password user
  await request(app)
    .post('/api/auth/register')
    .send({ email: 'link-test@example.com', password: 'password123' });

  // Now sign in with Google using the same email
  mockGoogleVerifier({ sub: 'g-link-1', email: 'link-test@example.com' });

  const res = await request(app)
    .post('/api/auth/google')
    .send({ idToken: 'fake-google-token' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  // Only one user should exist and should have both email/password and google provider
  const count = await User.countDocuments({ email: 'link-test@example.com' });
  assert.equal(count, 1, 'should not create a duplicate user');

  const dbUser = await User.findOne({ email: 'link-test@example.com' });
  assert.ok(dbUser!.authProviders.some((p: { provider: string; providerId: string }) => p.provider === 'google' && p.providerId === 'g-link-1'));
  assert.ok(dbUser!.passwordHash, 'original password hash should still be present');
});
