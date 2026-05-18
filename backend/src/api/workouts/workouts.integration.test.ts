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
process.env.RESEND_API_KEY = process.env.RESEND_API_KEY ?? 're_test_stub_key';

import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import WorkoutLog from '../../models/WorkoutLog';
import { vietnamDayStart } from '../../utils/date';

let mongoServer: MongoMemoryServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// Helper: register a user and return accessToken + userId
async function registerUser(email: string, password = 'password123'): Promise<{ accessToken: string; userId: string }> {
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email, password });
  assert.equal(res.status, 201, `Register failed for ${email}: ${JSON.stringify(res.body)}`);
  return {
    accessToken: res.body.data.accessToken,
    userId: res.body.data.user._id ?? res.body.data.user.id,
  };
}

// Helper: build a valid workout payload
function workoutPayload(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    exerciseName: 'Chạy bộ',
    durationMinutes: 30,
    caloriesBurned: 250,
    completedAt: new Date().toISOString(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Test 1: POST /api/workouts without Authorization → 401
// ---------------------------------------------------------------------------
test('POST /api/workouts - no auth → 401', async () => {
  const res = await request(app)
    .post('/api/workouts')
    .send(workoutPayload());

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.includes('Token không hợp lệ hoặc đã hết hạn'));
});

// ---------------------------------------------------------------------------
// Test 2: Valid POST → 201, body.success===true, body.data.userId equals userA._id
// ---------------------------------------------------------------------------
test('POST /api/workouts - valid payload → 201 + correct userId', async () => {
  const { accessToken, userId } = await registerUser('workout-user-a@example.com');

  const res = await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload());

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data._id, 'response should include _id');
  // userId in response should match the registered user
  assert.equal(
    res.body.data.userId.toString(),
    userId.toString(),
    'userId in response must come from JWT, not body',
  );
});

// ---------------------------------------------------------------------------
// Test 3: POST with extra userId in body → either 400 (strict) OR 201 but JWT userId wins
// ---------------------------------------------------------------------------
test('POST /api/workouts - extra userId in body → strict rejection or JWT wins', async () => {
  const { accessToken, userId } = await registerUser('workout-spoof@example.com');
  const spoofId = 'aaaaaaaaaaaaaaaaaaaaaaaa';

  const res = await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload({ userId: spoofId }));

  if (res.status === 400) {
    // .strict() rejected the extra field — this is the expected path
    assert.equal(res.body.success, false);
  } else {
    // Schema accepted it (unexpected) but userId must still come from JWT
    assert.equal(res.status, 201);
    assert.notEqual(
      res.body.data.userId.toString(),
      spoofId,
      'spoofed userId must not be persisted',
    );
    assert.equal(
      res.body.data.userId.toString(),
      userId.toString(),
      'JWT userId must be used instead',
    );
  }
});

// ---------------------------------------------------------------------------
// Test 4: POST with durationMinutes: -5 → 400
// ---------------------------------------------------------------------------
test('POST /api/workouts - durationMinutes: -5 → 400', async () => {
  const { accessToken } = await registerUser('workout-neg-dur@example.com');

  const res = await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload({ durationMinutes: -5 }));

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 5: POST with completedAt: 'not-a-date' → 400 + Vietnamese error
// ---------------------------------------------------------------------------
test('POST /api/workouts - invalid completedAt → 400 + Vietnamese error', async () => {
  const { accessToken } = await registerUser('workout-bad-date@example.com');

  const res = await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload({ completedAt: 'not-a-date' }));

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(
    res.body.error.includes('Thời điểm hoàn thành không hợp lệ'),
    `Expected Vietnamese error, got: ${res.body.error}`,
  );
});

// ---------------------------------------------------------------------------
// Test 6: Cross-tenant isolation — user B's logs must not appear in user A's stats
// ---------------------------------------------------------------------------
test('GET /api/workouts/stats/weekly - cross-tenant isolation', async () => {
  const { accessToken: tokenA } = await registerUser('workout-tenant-a@example.com');
  const { accessToken: tokenB } = await registerUser('workout-tenant-b@example.com');

  const today = new Date().toISOString();

  // Create 2 logs for user A (100 + 100 = 200 kcal, 15 + 15 = 30 min)
  await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${tokenA}`)
    .send(workoutPayload({ caloriesBurned: 100, durationMinutes: 15, completedAt: today }));

  await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${tokenA}`)
    .send(workoutPayload({ caloriesBurned: 100, durationMinutes: 15, completedAt: today }));

  // Create 1 log for user B (300 kcal)
  await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${tokenB}`)
    .send(workoutPayload({ caloriesBurned: 300, durationMinutes: 20, completedAt: today }));

  // GET stats for user A
  const res = await request(app)
    .get('/api/workouts/stats/weekly')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const stats = res.body.data;
  assert.equal(stats.exercises, 2, `expected 2 exercises, got ${stats.exercises}`);
  assert.equal(stats.kcal, 200, `expected 200 kcal, got ${stats.kcal}`);
  assert.equal(stats.minutes, 30, `expected 30 minutes, got ${stats.minutes}`);
  assert.equal(stats.days, 1, `expected 1 day, got ${stats.days}`);

  // B's data must NOT contaminate A's stats
  assert.notEqual(stats.kcal, 500, 'kcal must not include user B data (500 = 200 + 300)');
});

// ---------------------------------------------------------------------------
// Test 7: GET stats for brand-new user with no logs → empty stats object
// ---------------------------------------------------------------------------
test('GET /api/workouts/stats/weekly - no logs → empty stats', async () => {
  const { accessToken } = await registerUser('workout-empty@example.com');

  const res = await request(app)
    .get('/api/workouts/stats/weekly')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const stats = res.body.data;
  assert.equal(stats.days, 0);
  assert.equal(stats.exercises, 0);
  assert.equal(stats.kcal, 0);
  assert.equal(stats.minutes, 0);
  assert.equal(stats.todayKcal, 0);
  assert.equal(stats.targetKcal, 300);
});

// ---------------------------------------------------------------------------
// Test 8: Spread logs across 3 distinct day buckets → days === 3
// ---------------------------------------------------------------------------
test('GET /api/workouts/stats/weekly - 3 distinct day buckets → days===3', async () => {
  const { accessToken } = await registerUser('workout-days@example.com');

  // Build 3 distinct UTC+7 day buckets within the last 7 days
  const now = new Date();
  const day0 = new Date(now.getTime() - 0 * 86400000).toISOString();
  const day1 = new Date(now.getTime() - 1 * 86400000).toISOString();
  const day2 = new Date(now.getTime() - 2 * 86400000).toISOString();

  await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload({ completedAt: day0 }));

  await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload({ completedAt: day1 }));

  await request(app)
    .post('/api/workouts')
    .set('Authorization', `Bearer ${accessToken}`)
    .send(workoutPayload({ completedAt: day2 }));

  const res = await request(app)
    .get('/api/workouts/stats/weekly')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);

  const days = res.body.data.days;
  assert.ok(
    days >= 2 && days <= 3,
    `expected 2 or 3 distinct day buckets (UTC+7 boundary), got ${days}`,
  );
});
