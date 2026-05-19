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
import FoodLog from '../../models/FoodLog';
import WaterLog from '../../models/WaterLog';
import WorkoutLog from '../../models/WorkoutLog';
import BMIRecord from '../../models/BMIRecord';
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
  await FoodLog.deleteMany({});
  await WaterLog.deleteMany({});
  await WorkoutLog.deleteMany({});
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
// HOME-02, HOME-05, HOME-06 tests (7 tests total)
// ---------------------------------------------------------------------------

// Test 1: GET /api/home/today-summary without auth → 401
test('GET /api/home/today-summary without auth returns 401', async () => {
  const res = await request(app).get('/api/home/today-summary');
  assert.equal(res.status, 401);
});

// Test 2: Empty data → all zeros, bmi: null, waterGoal: 8
test('GET /api/home/today-summary with no data returns all zeros and bmi null', async () => {
  const res = await request(app)
    .get('/api/home/today-summary')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  const d = res.body.data;
  assert.equal(d.kcalConsumed, 0);
  assert.deepEqual(d.macros, { protein: 0, carbs: 0, fat: 0 });
  assert.equal(d.waterGlasses, 0);
  assert.equal(d.waterGoal, 8);
  assert.equal(d.workoutMinutes, 0);
  assert.equal(d.bmi, null);
});

// Test 3: Seed data → aggregated correctly
test('GET /api/home/today-summary aggregates kcal, macros, water, workout, BMI correctly', async () => {
  const todayStart = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userIdA);

  // Seed FoodLog
  await FoodLog.create({
    userId: userObjId,
    date: todayStart,
    aiProvider: 'manual',
    foods: [{ name: 'Test food', calories: 500, protein: 30, carbs: 50, fat: 20, fiber: 0, sugar: 0 }],
    totals: { calories: 500, protein: 30, carbs: 50, fat: 20 },
  });

  // Seed 2 WaterLogs
  const waterTime = new Date(todayStart.getTime() + 3600000); // +1 hour
  await WaterLog.create({ userId: userObjId, loggedAt: waterTime });
  await WaterLog.create({ userId: userObjId, loggedAt: new Date(waterTime.getTime() + 3600000) });

  // Seed WorkoutLog with date = todayStart bucket
  await WorkoutLog.create({
    userId: userObjId,
    exerciseName: 'Chạy bộ',
    date: todayStart,
    durationMinutes: 30,
    caloriesBurned: 200,
    completedAt: new Date(),
  });

  // Seed BMIRecord
  await BMIRecord.create({
    userId: userObjId,
    heightCm: 170,
    weightKg: 65,
    bmi: 22.5,
    category: 'normal',
    recordedAt: new Date(),
  });

  // Update waterGoal
  await User.findByIdAndUpdate(userIdA, { 'profile.waterGoal': 10 });

  const res = await request(app)
    .get('/api/home/today-summary')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  const d = res.body.data;
  assert.equal(d.kcalConsumed, 500);
  assert.deepEqual(d.macros, { protein: 30, carbs: 50, fat: 20 });
  assert.equal(d.waterGlasses, 2);
  assert.equal(d.waterGoal, 10);
  assert.equal(d.workoutMinutes, 30);
  assert.ok(d.bmi);
  assert.equal(d.bmi.value, 22.5);
  assert.equal(d.bmi.category, 'normal');
});

// Test 4: Per-user scoping — userB sees all zeros
test('GET /api/home/today-summary with userB token after userA seed returns all zeros', async () => {
  const todayStart = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userIdA);

  // Seed data for userA only
  await FoodLog.create({
    userId: userObjId,
    date: todayStart,
    aiProvider: 'manual',
    foods: [{ name: 'Test', calories: 300, protein: 10, carbs: 30, fat: 10, fiber: 0, sugar: 0 }],
    totals: { calories: 300, protein: 10, carbs: 30, fat: 10 },
  });

  // userB should see nothing
  const res = await request(app)
    .get('/api/home/today-summary')
    .set('Authorization', `Bearer ${tokenB}`);

  assert.equal(res.status, 200);
  const d = res.body.data;
  assert.equal(d.kcalConsumed, 0);
  assert.equal(d.waterGlasses, 0);
  assert.equal(d.workoutMinutes, 0);
  assert.equal(d.bmi, null);
});

// Test 5: UTC+7 boundary — yesterday log excluded
test('GET /api/home/today-summary excludes WaterLog from yesterday (UTC+7 boundary)', async () => {
  const todayStart = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userIdA);

  // WaterLog from yesterday (1ms before today start)
  await WaterLog.create({
    userId: userObjId,
    loggedAt: new Date(todayStart.getTime() - 1),
  });

  const res = await request(app)
    .get('/api/home/today-summary')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.waterGlasses, 0);
});

// Test 6: BMI latest — returns most recent record
test('GET /api/home/today-summary returns latest BMI when multiple records exist', async () => {
  const userObjId = new mongoose.Types.ObjectId(userIdA);
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86400000);

  // Older record
  await BMIRecord.create({
    userId: userObjId,
    heightCm: 170,
    weightKg: 70,
    bmi: 24.2,
    category: 'normal',
    recordedAt: sevenDaysAgo,
  });

  // Newer record
  await BMIRecord.create({
    userId: userObjId,
    heightCm: 170,
    weightKg: 65,
    bmi: 22.5,
    category: 'normal',
    recordedAt: now,
  });

  const res = await request(app)
    .get('/api/home/today-summary')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.ok(res.body.data.bmi);
  assert.equal(res.body.data.bmi.value, 22.5);
});

// Test 7: GET /api/config/shop-url → env var value
test('GET /api/config/shop-url returns SHOP_URL env var value', async () => {
  const savedShopUrl = process.env.SHOP_URL;
  process.env.SHOP_URL = 'https://test-shop.example.com';

  try {
    const res = await request(app).get('/api/config/shop-url');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.url, 'https://test-shop.example.com');
  } finally {
    if (savedShopUrl === undefined) {
      delete process.env.SHOP_URL;
    } else {
      process.env.SHOP_URL = savedShopUrl;
    }
  }
});
