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

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import HabitLog from '../../models/HabitLog';
import { vietnamDayStart } from '../../utils/date';
import { signAccessToken } from '../../utils/jwt';

let mongoServer: MongoMemoryServer;

// ---- Helper to create a user and return a valid JWT ----
async function createUserAndToken(email: string): Promise<{ userId: string; token: string }> {
  const user = await User.create({
    email,
    passwordHash: '$2b$10$placeholder',
    profileCompleted: false,
  });
  const userId = (user._id as mongoose.Types.ObjectId).toString();
  const token = signAccessToken({ sub: userId, role: 'user' });
  return { userId, token };
}

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean between tests so they are fully isolated
  await HabitLog.deleteMany({});
  await User.deleteMany({});
});

// ---------------------------------------------------------------------------
// Test 1: POST /check-in without auth → 401
// ---------------------------------------------------------------------------
test('POST /api/habits/check-in - no auth → 401', async () => {
  const res = await request(app)
    .post('/api/habits/check-in')
    .send({ habitId: 'water' });
  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 2: POST /check-in with valid body { habitId: 'water' } → 200
// ---------------------------------------------------------------------------
test('POST /api/habits/check-in - valid habitId water → 200 + data.habitId === water', async () => {
  const { token } = await createUserAndToken('t2@example.com');
  const res = await request(app)
    .post('/api/habits/check-in')
    .set('Authorization', `Bearer ${token}`)
    .send({ habitId: 'water' });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.habitId, 'water');
  assert.ok(res.body.data.checkedAt);
});

// ---------------------------------------------------------------------------
// Test 3: POST /check-in with invalid habitId → 400 Vietnamese message
// ---------------------------------------------------------------------------
test('POST /api/habits/check-in - invalid habitId → 400 "Thói quen không hợp lệ"', async () => {
  const { token } = await createUserAndToken('t3@example.com');
  const res = await request(app)
    .post('/api/habits/check-in')
    .set('Authorization', `Bearer ${token}`)
    .send({ habitId: 'invalid' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(res.body.error.includes('Thói quen không hợp lệ'));
});

// ---------------------------------------------------------------------------
// Test 4: POST /check-in twice same habitId same day → both 200, idempotent (1 doc, same checkedAt)
// ---------------------------------------------------------------------------
test('POST /api/habits/check-in - duplicate same day → idempotent (1 doc, same checkedAt)', async () => {
  const { userId, token } = await createUserAndToken('t4@example.com');
  const userObjId = new mongoose.Types.ObjectId(userId);
  const today = vietnamDayStart(new Date());

  const res1 = await request(app)
    .post('/api/habits/check-in')
    .set('Authorization', `Bearer ${token}`)
    .send({ habitId: 'water' });

  assert.equal(res1.status, 200);
  const firstCheckedAt = new Date(res1.body.data.checkedAt).getTime();

  // Wait a tiny bit to confirm timestamp is NOT bumped
  await new Promise((r) => setTimeout(r, 50));

  const res2 = await request(app)
    .post('/api/habits/check-in')
    .set('Authorization', `Bearer ${token}`)
    .send({ habitId: 'water' });

  assert.equal(res2.status, 200);
  const secondCheckedAt = new Date(res2.body.data.checkedAt).getTime();

  // Exactly 1 document in DB
  const count = await HabitLog.countDocuments({ userId: userObjId, date: today, habitId: 'water' });
  assert.equal(count, 1);

  // checkedAt preserved (within 100ms of first check)
  assert.ok(Math.abs(secondCheckedAt - firstCheckedAt) < 100);
});

// ---------------------------------------------------------------------------
// Test 5: POST /check-in with extra field userId in body → 400 (strict schema)
// ---------------------------------------------------------------------------
test('POST /api/habits/check-in - extra field userId in body → 400 (strict)', async () => {
  const { token } = await createUserAndToken('t5@example.com');
  const res = await request(app)
    .post('/api/habits/check-in')
    .set('Authorization', `Bearer ${token}`)
    .send({ habitId: 'water', userId: 'aaa111aaa111aaa111aaa111' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 6: GET /today after 3 check-ins → completed.length===3, percent===50
// ---------------------------------------------------------------------------
test('GET /api/habits/today - after 3 check-ins → count=3 percent=50', async () => {
  const { token } = await createUserAndToken('t6@example.com');

  for (const habitId of ['water', 'vegetables', 'exercise']) {
    await request(app)
      .post('/api/habits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId });
  }

  const res = await request(app)
    .get('/api/habits/today')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.completed.length, 3);
  assert.equal(res.body.data.progress.count, 3);
  assert.equal(res.body.data.progress.percent, 50);
});

// ---------------------------------------------------------------------------
// Test 7: GET /today for new user → completed===[], progress==={count:0,percent:0}
// ---------------------------------------------------------------------------
test('GET /api/habits/today - new user → empty completed, zero progress', async () => {
  const { token } = await createUserAndToken('t7@example.com');
  const res = await request(app)
    .get('/api/habits/today')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.deepEqual(res.body.data.completed, []);
  assert.deepEqual(res.body.data.progress, { count: 0, percent: 0 });
});

// ---------------------------------------------------------------------------
// Test 8: GET /weekly returns exactly 7 entries, today+yesterday qualified=true
// ---------------------------------------------------------------------------
test('GET /api/habits/weekly - 7 entries, today+yesterday qualified', async () => {
  const { userId, token } = await createUserAndToken('t8@example.com');
  const userObjId = new mongoose.Types.ObjectId(userId);
  const today = vietnamDayStart(new Date());
  const yesterday = new Date(today.getTime() - 86400000);

  // 3 habits today
  for (const habitId of ['water', 'vegetables', 'exercise']) {
    await request(app)
      .post('/api/habits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId });
  }

  // 3 habits yesterday via direct insert
  await HabitLog.create([
    { userId: userObjId, habitId: 'water', date: yesterday, checkedAt: yesterday },
    { userId: userObjId, habitId: 'vegetables', date: yesterday, checkedAt: yesterday },
    { userId: userObjId, habitId: 'exercise', date: yesterday, checkedAt: yesterday },
  ]);

  const res = await request(app)
    .get('/api/habits/weekly')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  const entries: { date: string; qualified: boolean }[] = res.body.data;
  assert.equal(entries.length, 7);

  const todayStr = today.toISOString().slice(0, 10);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  const todayEntry = entries.find((e) => e.date === todayStr);
  const yesterdayEntry = entries.find((e) => e.date === yesterdayStr);

  assert.ok(todayEntry, 'today entry should exist');
  assert.equal(todayEntry!.qualified, true);
  assert.ok(yesterdayEntry, 'yesterday entry should exist');
  assert.equal(yesterdayEntry!.qualified, true);

  // All other days not qualified
  const otherEntries = entries.filter((e) => e.date !== todayStr && e.date !== yesterdayStr);
  for (const e of otherEntries) {
    assert.equal(e.qualified, false, `${e.date} should not be qualified`);
  }
});

// ---------------------------------------------------------------------------
// Test 9: GET /streak with 3 distinct habits today → streakDays===1
// ---------------------------------------------------------------------------
test('GET /api/habits/streak - 3 habits today → streakDays=1', async () => {
  const { token } = await createUserAndToken('t9@example.com');

  for (const habitId of ['water', 'vegetables', 'exercise']) {
    await request(app)
      .post('/api/habits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId });
  }

  const res = await request(app)
    .get('/api/habits/streak')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.streakDays, 1);
});

// ---------------------------------------------------------------------------
// Test 10: GET /streak 3 habits today+yesterday+two-days-ago → streakDays===3
// ---------------------------------------------------------------------------
test('GET /api/habits/streak - 3 days of qualified habits → streakDays=3', async () => {
  const { userId, token } = await createUserAndToken('t10@example.com');
  const userObjId = new mongoose.Types.ObjectId(userId);
  const today = vietnamDayStart(new Date());
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 86400000);

  // Today: 3 habits via API
  for (const habitId of ['water', 'vegetables', 'exercise']) {
    await request(app)
      .post('/api/habits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId });
  }

  // Yesterday: 3 habits via direct insert
  await HabitLog.create([
    { userId: userObjId, habitId: 'water', date: yesterday, checkedAt: yesterday },
    { userId: userObjId, habitId: 'vegetables', date: yesterday, checkedAt: yesterday },
    { userId: userObjId, habitId: 'exercise', date: yesterday, checkedAt: yesterday },
  ]);

  // Two days ago: 3 habits via direct insert
  await HabitLog.create([
    { userId: userObjId, habitId: 'water', date: twoDaysAgo, checkedAt: twoDaysAgo },
    { userId: userObjId, habitId: 'vegetables', date: twoDaysAgo, checkedAt: twoDaysAgo },
    { userId: userObjId, habitId: 'exercise', date: twoDaysAgo, checkedAt: twoDaysAgo },
  ]);

  const res = await request(app)
    .get('/api/habits/streak')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.streakDays, 3);
});

// ---------------------------------------------------------------------------
// Test 11: GET /streak 2 habits today (in-progress) + 3 yesterday + 3 two-days-ago → streakDays===2
// ---------------------------------------------------------------------------
test('GET /api/habits/streak - today in-progress (2 habits) → streakDays=2 (today skipped)', async () => {
  const { userId, token } = await createUserAndToken('t11@example.com');
  const userObjId = new mongoose.Types.ObjectId(userId);
  const today = vietnamDayStart(new Date());
  const yesterday = new Date(today.getTime() - 86400000);
  const twoDaysAgo = new Date(today.getTime() - 2 * 86400000);

  // Today: only 2 habits (in-progress, not qualifying)
  for (const habitId of ['water', 'vegetables']) {
    await request(app)
      .post('/api/habits/check-in')
      .set('Authorization', `Bearer ${token}`)
      .send({ habitId });
  }

  // Yesterday: 3 habits
  await HabitLog.create([
    { userId: userObjId, habitId: 'water', date: yesterday, checkedAt: yesterday },
    { userId: userObjId, habitId: 'vegetables', date: yesterday, checkedAt: yesterday },
    { userId: userObjId, habitId: 'exercise', date: yesterday, checkedAt: yesterday },
  ]);

  // Two days ago: 3 habits
  await HabitLog.create([
    { userId: userObjId, habitId: 'water', date: twoDaysAgo, checkedAt: twoDaysAgo },
    { userId: userObjId, habitId: 'vegetables', date: twoDaysAgo, checkedAt: twoDaysAgo },
    { userId: userObjId, habitId: 'exercise', date: twoDaysAgo, checkedAt: twoDaysAgo },
  ]);

  const res = await request(app)
    .get('/api/habits/streak')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  // Today is skipped (in-progress), streak = yesterday + two-days-ago = 2
  assert.equal(res.body.data.streakDays, 2);
});

// ---------------------------------------------------------------------------
// Test 12: Cross-tenant — User B check-ins do NOT appear in User A's data
// ---------------------------------------------------------------------------
test('Cross-tenant: User B check-ins NOT visible to User A', async () => {
  const { token: tokenA } = await createUserAndToken('userA@example.com');
  const { userId: userBId, token: tokenB } = await createUserAndToken('userB@example.com');
  const userBObjId = new mongoose.Types.ObjectId(userBId);
  const today = vietnamDayStart(new Date());

  // User B checks in 3 habits
  for (const habitId of ['water', 'vegetables', 'exercise']) {
    await request(app)
      .post('/api/habits/check-in')
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ habitId });
  }

  // User A has no check-ins — verify /today is empty
  const todayRes = await request(app)
    .get('/api/habits/today')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(todayRes.status, 200);
  assert.deepEqual(todayRes.body.data.completed, []);

  // User A /weekly — all qualified=false
  const weeklyRes = await request(app)
    .get('/api/habits/weekly')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(weeklyRes.status, 200);
  const entries: { date: string; qualified: boolean }[] = weeklyRes.body.data;
  assert.equal(entries.length, 7);
  for (const e of entries) {
    assert.equal(e.qualified, false, `User A should see no qualified day but got ${e.date}=${e.qualified}`);
  }

  // User A /streak — 0
  const streakRes = await request(app)
    .get('/api/habits/streak')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(streakRes.status, 200);
  assert.equal(streakRes.body.data.streakDays, 0);
});
