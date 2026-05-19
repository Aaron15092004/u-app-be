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
// IMPORTANT: Use a literal test key — NEVER the real OPENAI_API_KEY.
// This prevents "OpenAI API key is required" error when food service is imported.
// The real key is only in backend/.env (gitignored). Tests must mock analyzeImage()
// and never call the real OpenAI API.
process.env.OPENAI_API_KEY = process.env.OPENAI_API_KEY ?? 'test-key';

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import WaterLog from '../../models/WaterLog';
import { signAccessToken } from '../../utils/jwt';
import { vietnamDayStart } from '../../utils/date';

// ---------------------------------------------------------------------------
// MongoMemoryServer + test user setup
// ---------------------------------------------------------------------------

let mongoServer: MongoMemoryServer;
let tokenA: string;
let tokenB: string;
let userIdA: string;
let userIdB: string;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  // Clean DB state before each test
  await User.deleteMany({});
  await WaterLog.deleteMany({});

  // Create user A
  const userA = await User.create({
    email: 'usera@example.com',
    passwordHash: 'hash',
    name: 'User A',
  });
  userIdA = (userA._id as mongoose.Types.ObjectId).toString();
  tokenA = signAccessToken({ sub: userIdA, role: 'user' });

  // Create user B
  const userB = await User.create({
    email: 'userb@example.com',
    passwordHash: 'hash',
    name: 'User B',
  });
  userIdB = (userB._id as mongoose.Types.ObjectId).toString();
  tokenB = signAccessToken({ sub: userIdB, role: 'user' });
});

// ---------------------------------------------------------------------------
// D-73 WaterLog CRUD + count tests (9 tests total)
// ---------------------------------------------------------------------------

// Test 1: POST /api/water without auth → 401
test('POST /api/water without Authorization header returns 401', async () => {
  const res = await request(app).post('/api/water').send({});
  assert.equal(res.status, 401);
});

// Test 2: POST /api/water with userA token (empty body) → 201 + creates WaterLog
test('POST /api/water with userA token creates WaterLog (userId from JWT, loggedAt auto-set)', async () => {
  const res = await request(app)
    .post('/api/water')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({});

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  assert.ok(res.body.data);
  assert.equal(res.body.data.userId.toString(), userIdA);
  assert.ok(res.body.data.loggedAt);
});

// Test 3: POST with explicit loggedAt; POST with userId in body → userId ignored
test('POST /api/water with explicit loggedAt uses that timestamp; userId in body is ignored', async () => {
  const explicitTime = new Date('2026-05-19T08:00:00.000Z').toISOString();
  const fakeUserId = new mongoose.Types.ObjectId().toString();

  const res = await request(app)
    .post('/api/water')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ loggedAt: explicitTime, userId: fakeUserId });

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);
  // loggedAt matches the explicit timestamp
  assert.equal(new Date(res.body.data.loggedAt).toISOString(), explicitTime);
  // userId must be from JWT (userA), not from body
  assert.equal(res.body.data.userId.toString(), userIdA);
  assert.notEqual(res.body.data.userId.toString(), fakeUserId);
});

// Test 4: GET /api/water/today with userA after 3 POSTs → { logs: [3], count: 3, waterGoal: 8 }
test('GET /api/water/today after 3 POSTs returns count=3, logs sorted desc, waterGoal=8', async () => {
  // Create 3 water logs
  for (let i = 0; i < 3; i++) {
    await request(app)
      .post('/api/water')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});
  }

  const res = await request(app)
    .get('/api/water/today')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.count, 3);
  assert.equal(res.body.data.logs.length, 3);
  assert.equal(res.body.data.waterGoal, 8);

  // Check sorted desc by loggedAt
  const logs = res.body.data.logs as Array<{ loggedAt: string }>;
  if (logs.length >= 2) {
    assert.ok(new Date(logs[0].loggedAt) >= new Date(logs[1].loggedAt));
  }
});

// Test 5: GET /api/water/today with userB after userA POSTs → { logs: [], count: 0, waterGoal: 8 }
test('GET /api/water/today with userB returns empty (per-user scoping)', async () => {
  // userA creates 3 logs
  for (let i = 0; i < 3; i++) {
    await request(app)
      .post('/api/water')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({});
  }

  // userB should see no logs
  const res = await request(app)
    .get('/api/water/today')
    .set('Authorization', `Bearer ${tokenB}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.count, 0);
  assert.equal(res.body.data.logs.length, 0);
  assert.equal(res.body.data.waterGoal, 8);
});

// Test 6: DELETE /api/water/:id with userA token deleting own log → 200
test('DELETE /api/water/:id with owner token deletes the log successfully', async () => {
  const postRes = await request(app)
    .post('/api/water')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({});
  const logId = postRes.body.data._id;

  const delRes = await request(app)
    .delete(`/api/water/${logId}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(delRes.status, 200);
  assert.equal(delRes.body.data.deleted, true);

  // Verify log is gone
  const found = await WaterLog.findById(logId);
  assert.equal(found, null);
});

// Test 7 (IDOR): DELETE with userB token on userA's log → 404; log still present
test('DELETE /api/water/:id IDOR: userB cannot delete userA log (returns 404, log still present)', async () => {
  const postRes = await request(app)
    .post('/api/water')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({});
  const logId = postRes.body.data._id;

  const delRes = await request(app)
    .delete(`/api/water/${logId}`)
    .set('Authorization', `Bearer ${tokenB}`);

  assert.equal(delRes.status, 404);

  // Verify userA's log still exists (IDOR protection)
  const found = await WaterLog.findById(logId);
  assert.notEqual(found, null);
});

// Test 8: Yesterday log outside UTC+7 today boundary → count=0
test('GET /api/water/today excludes logs from yesterday (UTC+7 boundary)', async () => {
  const todayStart = vietnamDayStart(new Date());
  const yesterdayLoggedAt = new Date(todayStart.getTime() - 1000); // 1 second before today start

  // Insert directly bypassing route to set exact loggedAt
  await WaterLog.create({
    userId: new mongoose.Types.ObjectId(userIdA),
    loggedAt: yesterdayLoggedAt,
  });

  const res = await request(app)
    .get('/api/water/today')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.count, 0);
  assert.equal(res.body.data.waterGoal, 8);
});

// Test 9 (waterGoal embedding — WARNING 4 fix): Update waterGoal, verify returned in /today
test('GET /api/water/today returns user-specific waterGoal (WARNING 4 fix)', async () => {
  // Update userA's waterGoal to 12
  await User.findByIdAndUpdate(userIdA, { 'profile.waterGoal': 12 });

  const res = await request(app)
    .get('/api/water/today')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.waterGoal, 12);
  // Verify it's userA's custom value, not the default 8
  assert.notEqual(res.body.data.waterGoal, 8);
  assert.notEqual(res.body.data.waterGoal, 10);
});
