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

import { test, describe, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import FoodLog from '../../models/FoodLog';
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
  // TODO: Activate when POST /api/food/scan route is implemented (Phase 4 Plan 02)
  assert.fail('TODO: implement when routes exist');
});

// ---------------------------------------------------------------------------
// Test 2: POST /api/food/scan with auth + mock image → 200 + NutritionResult
//
// MOCK STRATEGY: The test must NOT call real OpenAI. Approach:
//   1. process.env.OPENAI_API_KEY = 'test-key' (set at file top) prevents key error
//   2. Import ai-food.service.ts after mocking openai module
//   3. Stub `analyzeImage` to return a fixed NutritionResult in test body
//   4. POST multipart/form-data with a tiny JPEG buffer as 'image' field
//   5. Assert response has { success: true, data: { foods: [...], totals: {...} } }
// ---------------------------------------------------------------------------
test('POST /api/food/scan with auth + mock image → 200 + NutritionResult with foods array and totals', async () => {
  // TODO: Activate when POST /api/food/scan route is implemented (Phase 4 Plan 02)
  // Implementation note: mock openai module before importing food service;
  // send a tiny JPEG buffer as multipart 'image' field; assert NutritionResult shape
  assert.fail('TODO: implement when routes exist');
});

// ---------------------------------------------------------------------------
// Test 3: POST /api/food/scan when daily AI count >= 20 → 429
// ---------------------------------------------------------------------------
test('POST /api/food/scan when daily AI count >= 20 → 429 with Vietnamese rate limit message', async () => {
  // TODO: Activate when POST /api/food/scan route is implemented (Phase 4 Plan 02)
  // Implementation note: seed 20 FoodLog docs with aiProvider='openai' for today,
  // then send scan request; assert status 429 and Vietnamese error message
  // "Bạn đã quét 20 lần hôm nay. Vui lòng thử lại vào ngày mai."
  assert.fail('TODO: implement when routes exist');
});

// ---------------------------------------------------------------------------
// Test 4: POST /api/food/logs with valid body → 201 + FoodLog document created
// ---------------------------------------------------------------------------
test('POST /api/food/logs with valid body → 201 + FoodLog document created', async () => {
  // TODO: Activate when POST /api/food/logs route is implemented (Phase 4 Plan 02)
  // Implementation note: send { foods: [...], totals: {...}, aiProvider: 'openai', imageUrl: null }
  // assert status 201 and FoodLog.countDocuments({ userId: userIdA }) === 1
  assert.fail('TODO: implement when routes exist');
});

// ---------------------------------------------------------------------------
// Test 5: GET /api/food/logs?date=YYYY-MM-DD → 200 + array (cross-tenant isolation)
// ---------------------------------------------------------------------------
test('GET /api/food/logs?date=YYYY-MM-DD → 200 + array of logs for that user only (cross-tenant isolation)', async () => {
  // TODO: Activate when GET /api/food/logs route is implemented (Phase 4 Plan 02)
  // Implementation note:
  //   1. Create FoodLog docs for userA and userB on the same date
  //   2. GET /api/food/logs?date=YYYY-MM-DD with tokenA
  //   3. Assert only userA's logs returned (userId field matches)
  assert.fail('TODO: implement when routes exist');
});

// ---------------------------------------------------------------------------
// Test 6: DELETE /api/food/logs/:id (own log) → 200; other user's log → 404
// ---------------------------------------------------------------------------
test('DELETE /api/food/logs/:id (own log) → 200; DELETE other user log → 404', async () => {
  // TODO: Activate when DELETE /api/food/logs/:id route is implemented (Phase 4 Plan 02)
  // Implementation note:
  //   1. Create FoodLog for userA → DELETE own → assert 200
  //   2. Create FoodLog for userB → try DELETE with tokenA → assert 404
  //   (FoodLog.deleteOne({ _id: id, userId }) returns null if userId mismatch → 404)
  assert.fail('TODO: implement when routes exist');
});

// ---------------------------------------------------------------------------
// Test 7: GET /api/food/items?q=pho → 200 + array (requires FoodItem seeded)
// ---------------------------------------------------------------------------
test('GET /api/food/items?q=pho → 200 + array (requires FoodItem seeded or created inline)', async () => {
  // TODO: Activate when GET /api/food/items route is implemented (Phase 4 Plan 02/03)
  // Implementation note:
  //   1. Insert a FoodItem doc with name='phở bò' using FoodItem.create() inline
  //   2. GET /api/food/items?q=phở with tokenA
  //   3. Assert status 200 and data array.length >= 1
  //   Note: MongoDB $text search requires text index — ensure FoodItem model has it
  assert.fail('TODO: implement when routes exist');
});
