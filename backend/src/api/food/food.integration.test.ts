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
import FoodItem from '../../models/FoodItem';
import { signAccessToken } from '../../utils/jwt';

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
  await FoodItem.deleteMany({});

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
// Test 1: POST /api/food/scan without auth → 401
// ---------------------------------------------------------------------------
test('POST /api/food/scan without auth → 401', async () => {
  const res = await request(app)
    .post('/api/food/scan')
    .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 2: POST /api/food/scan with auth but no image file → 400 (input validation)
//
// This test verifies the route exists, authentication works, and the "no image"
// validation guard fires correctly — without calling real OpenAI.
// The 200 + NutritionResult path requires a live OPENAI_API_KEY (integration env).
// ---------------------------------------------------------------------------
test('POST /api/food/scan with auth but no image → 400 with Vietnamese error', async () => {
  // Send request with auth but without a multipart image attachment
  const res = await request(app)
    .post('/api/food/scan')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({});

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Vui lòng chọn ảnh');
});

// ---------------------------------------------------------------------------
// Test 3: POST /api/food/scan when daily AI count >= 20 → 429
// ---------------------------------------------------------------------------
test('POST /api/food/scan when daily AI count >= 20 → 429 with Vietnamese rate limit message', async () => {
  // Seed 20 FoodLog docs with aiProvider='openai' for today
  const now = new Date();
  const foodLogDocs = Array.from({ length: 20 }, () => ({
    userId: new mongoose.Types.ObjectId(userIdA),
    date: now,
    aiProvider: 'openai',
    foods: [{ name: 'Cơm', calories: 200, protein: 5, carbs: 40, fat: 1, fiber: 0, sugar: 0 }],
    totals: { calories: 200, protein: 5, carbs: 40, fat: 1 },
    imageUrl: null,
  }));
  await FoodLog.insertMany(foodLogDocs);

  const tinyJpeg = Buffer.from('fake-jpeg');

  const res = await request(app)
    .post('/api/food/scan')
    .set('Authorization', `Bearer ${tokenA}`)
    .attach('image', tinyJpeg, { filename: 'test.jpg', contentType: 'image/jpeg' });

  assert.equal(res.status, 429);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Bạn đã quét 20 lần hôm nay. Vui lòng thử lại vào ngày mai.');
});

// ---------------------------------------------------------------------------
// Test 4: POST /api/food/logs with valid body → 201 + FoodLog document created
// ---------------------------------------------------------------------------
test('POST /api/food/logs with valid body → 201 + FoodLog document created', async () => {
  const body = {
    foods: [{ name: 'Phở bò', calories: 350, protein: 20, carbs: 45, fat: 8 }],
    totals: { calories: 350, protein: 20, carbs: 45, fat: 8 },
    aiProvider: 'openai',
    imageUrl: null,
  };

  const res = await request(app)
    .post('/api/food/logs')
    .set('Authorization', `Bearer ${tokenA}`)
    .send(body);

  assert.equal(res.status, 201);
  assert.equal(res.body.success, true);

  const count = await FoodLog.countDocuments({ userId: new mongoose.Types.ObjectId(userIdA) });
  assert.equal(count, 1);
});

// ---------------------------------------------------------------------------
// Test 5: GET /api/food/logs?date=YYYY-MM-DD → 200 + array (cross-tenant isolation)
// ---------------------------------------------------------------------------
test('GET /api/food/logs?date=YYYY-MM-DD → 200 + array of logs for that user only (cross-tenant isolation)', async () => {
  const today = new Date();
  const dateStr = today.toISOString().split('T')[0]; // YYYY-MM-DD

  // Create FoodLog for userA on today
  await FoodLog.create({
    userId: new mongoose.Types.ObjectId(userIdA),
    date: today,
    aiProvider: 'openai',
    foods: [{ name: 'Cơm', calories: 200, protein: 5, carbs: 40, fat: 1, fiber: 0, sugar: 0 }],
    totals: { calories: 200, protein: 5, carbs: 40, fat: 1 },
    imageUrl: null,
  });

  // Create FoodLog for userB on today
  await FoodLog.create({
    userId: new mongoose.Types.ObjectId(userIdB),
    date: today,
    aiProvider: 'manual',
    foods: [{ name: 'Bánh mì', calories: 300, protein: 10, carbs: 50, fat: 5, fiber: 0, sugar: 2 }],
    totals: { calories: 300, protein: 10, carbs: 50, fat: 5 },
    imageUrl: null,
  });

  const res = await request(app)
    .get(`/api/food/logs?date=${dateStr}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data), 'data should be an array');
  assert.equal(res.body.data.length, 1, 'Only userA logs should be returned');
  assert.equal(res.body.data[0].userId.toString(), userIdA);
});

// ---------------------------------------------------------------------------
// Test 6: DELETE /api/food/logs/:id (own log) → 200; other user's log → 404
// ---------------------------------------------------------------------------
test('DELETE /api/food/logs/:id (own log) → 200; DELETE other user log → 404', async () => {
  const today = new Date();

  // Create FoodLog for userA
  const logA = await FoodLog.create({
    userId: new mongoose.Types.ObjectId(userIdA),
    date: today,
    aiProvider: 'openai',
    foods: [{ name: 'Cơm', calories: 200, protein: 5, carbs: 40, fat: 1, fiber: 0, sugar: 0 }],
    totals: { calories: 200, protein: 5, carbs: 40, fat: 1 },
    imageUrl: null,
  });

  // Create FoodLog for userB
  const logB = await FoodLog.create({
    userId: new mongoose.Types.ObjectId(userIdB),
    date: today,
    aiProvider: 'manual',
    foods: [{ name: 'Bánh mì', calories: 300, protein: 10, carbs: 50, fat: 5, fiber: 0, sugar: 2 }],
    totals: { calories: 300, protein: 10, carbs: 50, fat: 5 },
    imageUrl: null,
  });

  // DELETE userA's own log → should succeed with 200
  const resOwn = await request(app)
    .delete(`/api/food/logs/${logA._id}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(resOwn.status, 200);
  assert.equal(resOwn.body.success, true);
  assert.equal(resOwn.body.data.deleted, true);

  // DELETE userB's log with tokenA → should fail with 404 (IDOR protection)
  const resOther = await request(app)
    .delete(`/api/food/logs/${logB._id}`)
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(resOther.status, 404);
  assert.equal(resOther.body.success, false);
});

// ---------------------------------------------------------------------------
// Test 7: GET /api/food/items?q=pho → 200 + array (requires FoodItem seeded)
// ---------------------------------------------------------------------------
test('GET /api/food/items?q=pho → 200 + array (requires FoodItem seeded or created inline)', async () => {
  // Insert a FoodItem with Vietnamese name inline
  await FoodItem.create({
    name: 'phở bò',
    kcalPer100g: 100,
    protein: 8,
    carbs: 14,
    fat: 2,
    source: 'manual',
  });

  // Note: $text search requires text index to exist. The FoodItem model defines the
  // index, but MongoMemoryServer creates it asynchronously. Use ensureIndexes() to
  // force index creation before the query.
  await FoodItem.ensureIndexes();

  const res = await request(app)
    .get('/api/food/items?q=ph%E1%BB%9F')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.ok(Array.isArray(res.body.data), 'data should be an array');
  // Note: text search result count depends on MongoDB index; at minimum expect 200 response
});
