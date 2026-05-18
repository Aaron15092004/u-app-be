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

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import BMIRecord from '../../models/BMIRecord';
import { computeBMI, categorizeBMI } from './bmi.service';
import { signAccessToken } from '../../utils/jwt';

// ---------------------------------------------------------------------------
// Pure function tests — no DB needed
// ---------------------------------------------------------------------------

describe('computeBMI pure function', () => {
  test('computeBMI(170, 65) === 22.5', () => {
    assert.equal(computeBMI(170, 65), 22.5);
  });

  test('computeBMI(180, 100) === 30.9', () => {
    assert.equal(computeBMI(180, 100), 30.9);
  });
});

describe('categorizeBMI pure function', () => {
  test('categorizeBMI(17) === underweight', () => {
    assert.equal(categorizeBMI(17), 'underweight');
  });

  test('categorizeBMI(18.5) === normal (boundary — exactly 18.5 is normal)', () => {
    assert.equal(categorizeBMI(18.5), 'normal');
  });

  test('categorizeBMI(24.9) === normal', () => {
    assert.equal(categorizeBMI(24.9), 'normal');
  });

  test('categorizeBMI(25) === overweight (boundary — exactly 25 is overweight)', () => {
    assert.equal(categorizeBMI(25), 'overweight');
  });

  test('categorizeBMI(30) === obese (boundary — exactly 30 is obese)', () => {
    assert.equal(categorizeBMI(30), 'obese');
  });
});

// ---------------------------------------------------------------------------
// HTTP integration tests — MongoMemoryServer
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
  // Clean DB state before each HTTP test
  await User.deleteMany({});
  await BMIRecord.deleteMany({});

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
// Test 8: PATCH /api/bmi without auth → 401
// ---------------------------------------------------------------------------
test('PATCH /api/bmi without auth → 401', async () => {
  const res = await request(app)
    .patch('/api/bmi')
    .send({ heightCm: 170, weightKg: 65 });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 9: PATCH /api/bmi valid payload → 200 + correct BMI fields
// ---------------------------------------------------------------------------
test('PATCH /api/bmi valid → 200 + bmi===22.5 + category===normal + user.heightCm===170', async () => {
  const res = await request(app)
    .patch('/api/bmi')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ heightCm: 170, weightKg: 65 });

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.bmiRecord.bmi, 22.5);
  assert.equal(res.body.data.bmiRecord.category, 'normal');
  assert.equal(res.body.data.user.heightCm, 170);
});

// ---------------------------------------------------------------------------
// Test 10: After PATCH → User.profile.heightCm updated in DB (D-54 atomic)
// ---------------------------------------------------------------------------
test('PATCH /api/bmi → User.profile.heightCm updated in DB (D-54)', async () => {
  await request(app)
    .patch('/api/bmi')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ heightCm: 170, weightKg: 65 });

  const user = await User.findById(userIdA).select('profile');
  assert.ok(user, 'User not found');
  assert.equal(user!.profile.heightCm, 170);
});

// ---------------------------------------------------------------------------
// Test 11: PATCH with heightCm=99 → 400 Vietnamese error
// ---------------------------------------------------------------------------
test('PATCH /api/bmi heightCm=99 → 400 validation error', async () => {
  const res = await request(app)
    .patch('/api/bmi')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ heightCm: 99, weightKg: 65 });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.ok(
    res.body.error.includes('Chiều cao phải từ 100 đến 220 cm'),
    `Expected Vietnamese error, got: ${res.body.error}`,
  );
});

// ---------------------------------------------------------------------------
// Test 12: PATCH with weightKg=201 → 400
// ---------------------------------------------------------------------------
test('PATCH /api/bmi weightKg=201 → 400 validation error', async () => {
  const res = await request(app)
    .patch('/api/bmi')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ heightCm: 170, weightKg: 201 });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 13: PATCH with extra field userId → 400 strict() rejection
// ---------------------------------------------------------------------------
test('PATCH /api/bmi extra field userId → 400 strict() rejection', async () => {
  const res = await request(app)
    .patch('/api/bmi')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ heightCm: 170, weightKg: 65, userId: 'aaa000000000000000000000' });

  // .strict() should reject unknown fields
  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 14: GET /api/bmi/history for user with no records → 200, data===[]
// ---------------------------------------------------------------------------
test('GET /api/bmi/history no records → 200, data===[]', async () => {
  const res = await request(app)
    .get('/api/bmi/history')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(res.body.data, []);
});

// ---------------------------------------------------------------------------
// Test 15: 3 BMIRecords for user A on 3 distinct days, 1 for user B
// GET /history with tokenA → length===3, user B not included
// ---------------------------------------------------------------------------
test('GET /api/bmi/history cross-tenant isolation: user A sees only own 3 records', async () => {
  const userObjA = new mongoose.Types.ObjectId(userIdA);
  const userObjB = new mongoose.Types.ObjectId(userIdB);

  await BMIRecord.create([
    { userId: userObjA, heightCm: 170, weightKg: 60, bmi: 20.8, category: 'normal', recordedAt: new Date('2026-05-13T10:00:00.000Z') },
    { userId: userObjA, heightCm: 170, weightKg: 65, bmi: 22.5, category: 'normal', recordedAt: new Date('2026-05-14T10:00:00.000Z') },
    { userId: userObjA, heightCm: 170, weightKg: 70, bmi: 24.2, category: 'normal', recordedAt: new Date('2026-05-15T10:00:00.000Z') },
    { userId: userObjB, heightCm: 160, weightKg: 55, bmi: 21.5, category: 'normal', recordedAt: new Date('2026-05-13T10:00:00.000Z') },
  ]);

  const res = await request(app)
    .get('/api/bmi/history')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 3, `Expected 3 records, got ${res.body.data.length}`);

  // Verify oldest-first ordering
  const dates = res.body.data.map((r: { date: string }) => r.date);
  const sorted = [...dates].sort();
  assert.deepEqual(dates, sorted, 'Records should be oldest-first');
});

// ---------------------------------------------------------------------------
// Test 16: 3 records on SAME day — only latest wins (D-55)
// ---------------------------------------------------------------------------
test('GET /api/bmi/history same-day dedup: only latest record returned', async () => {
  const userObjA = new mongoose.Types.ObjectId(userIdA);
  const base = new Date('2026-05-15T10:00:00.000Z');

  await BMIRecord.create([
    { userId: userObjA, heightCm: 170, weightKg: 60, bmi: 20.8, category: 'normal', recordedAt: base },
    { userId: userObjA, heightCm: 170, weightKg: 65, bmi: 22.5, category: 'normal', recordedAt: new Date(base.getTime() + 60000) },
    { userId: userObjA, heightCm: 170, weightKg: 70, bmi: 24.2, category: 'normal', recordedAt: new Date(base.getTime() + 120000) }, // LATEST wins
  ]);

  const res = await request(app)
    .get('/api/bmi/history')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 1, `Expected 1 deduplicated entry, got ${res.body.data.length}`);
  assert.equal(res.body.data[0].bmi, 24.2, `Expected bmi 24.2 (latest), got ${res.body.data[0].bmi}`);
});
