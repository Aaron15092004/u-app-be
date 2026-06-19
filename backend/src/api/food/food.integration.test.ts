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
// IMPORTANT: Use a literal test key — NEVER the real GEMINI_API_KEY.
// This prevents API key errors when food service is imported.
// The real key is only in backend/.env (gitignored). Tests must mock analyzeImage()
// and never call the real Gemini API.
process.env.GEMINI_API_KEY = 'test-key';
process.env.GEMINI_PRIMARY_MODEL = 'gemini-primary-test';
process.env.GEMINI_FALLBACK_MODEL = 'gemini-fallback-test';
process.env.GEMINI_REQUEST_TIMEOUT_MS = '1000';
process.env.GEMINI_RETRY_DELAY_MS = '0';

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import FoodLog from '../../models/FoodLog';
import FoodItem from '../../models/FoodItem';
import FoodScanAttempt from '../../models/FoodScanAttempt';
import UserScanEntitlement from '../../models/UserScanEntitlement';
import { signAccessToken } from '../../utils/jwt';
import { barcodeParamSchema, barcodeSaveMinimumNutritionSchema } from './food.validation';
import { lookupBarcodeProduct } from './barcode-provider.service';

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
  await FoodScanAttempt.deleteMany({});
  await UserScanEntitlement.deleteMany({});

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
// The 200 + NutritionResult path requires a live GEMINI_API_KEY (integration env).
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
// Test 3: POST /api/food/scan when daily AI count >= 2 → 429
// ---------------------------------------------------------------------------
test('POST /api/food/scan when daily AI count >= 2 → 429 with Vietnamese rate limit message', async () => {
  // Seed 2 scan attempts for today. The rate limiter counts AI attempts,
  // not saved FoodLog documents.
  const now = new Date();
  const attemptDocs = Array.from({ length: 2 }, () => ({
    userId: new mongoose.Types.ObjectId(userIdA),
    createdAt: now,
  }));
  await FoodScanAttempt.insertMany(attemptDocs);

  const tinyJpeg = Buffer.from('fake-jpeg');

  const res = await request(app)
    .post('/api/food/scan')
    .set('Authorization', `Bearer ${tokenA}`)
    .attach('image', tinyJpeg, { filename: 'test.jpg', contentType: 'image/jpeg' });

  assert.equal(res.status, 429);
  assert.equal(res.body.success, false);
  assert.match(res.body.error, /Bạn đã dùng hết 2 lượt quét hôm nay/);
  assert.equal(res.body.usedToday, 2);
  assert.equal(res.body.limit, 2);
});

// ---------------------------------------------------------------------------
// Test 4: POST /api/food/logs with valid body → 201 + FoodLog document created
// ---------------------------------------------------------------------------
test('POST /api/food/logs with valid body → 201 + FoodLog document created', async () => {
  const body = {
    foods: [{ name: 'Phở bò', calories: 350, protein: 20, carbs: 45, fat: 8 }],
    totals: { calories: 350, protein: 20, carbs: 45, fat: 8 },
    aiProvider: 'gemini',
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
    aiProvider: 'gemini',
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
  assert.ok(res.body.data.length <= 1, 'Only userA logs should be returned');
  if (res.body.data.length === 1) {
    assert.equal(res.body.data[0].userId.toString(), userIdA);
  }
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
    aiProvider: 'gemini',
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

test('barcode validation preserves leading-zero digit strings and rejects invalid params', () => {
  const valid = barcodeParamSchema.safeParse({ barcode: '0123456789012' });
  assert.equal(valid.success, true);
  if (valid.success) {
    assert.equal(valid.data.barcode, '0123456789012');
  }

  assert.equal(barcodeParamSchema.safeParse({ barcode: 'ABC123' }).success, false);
  assert.equal(barcodeParamSchema.safeParse({ barcode: '12345' }).success, false);
});

test('barcode minimum nutrition validation requires name, calories, and macros', () => {
  const complete = barcodeSaveMinimumNutritionSchema.safeParse({
    name: 'Sua hat dong chai',
    calories: 120,
    protein: 4,
    carbs: 18,
    fat: 3,
  });
  assert.equal(complete.success, true);

  const missingFat = barcodeSaveMinimumNutritionSchema.safeParse({
    name: 'Sua hat dong chai',
    calories: 120,
    protein: 4,
    carbs: 18,
  });
  assert.equal(missingFat.success, false);
});

test('GET /api/food/items/barcode/:barcode accepts leading-zero string route contract', async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () => ({
    ok: true,
    json: async () => ({
      status: 1,
      product: {
        product_name: 'Sua hat U',
        brands: 'U',
        quantity: '300 ml',
        nutriments: {
          'energy-kcal_100g': 120,
          proteins_100g: 4,
          carbohydrates_100g: 18,
          fat_100g: 3,
        },
      },
    }),
  })) as unknown as typeof fetch;

  const res = await request(app)
    .get('/api/food/items/barcode/0123456789012')
    .set('Authorization', `Bearer ${tokenA}`);

  global.fetch = originalFetch;

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.barcode, '0123456789012');
  assert.equal(res.body.data.source, 'open_food_facts');
  assert.equal(res.body.data.isSaveReady, true);
  assert.equal(res.body.data.minimumNutrition.calories, 120);

  const cached = await FoodItem.findOne({ barcodes: '0123456789012' }).lean();
  assert.ok(cached);
  assert.equal(cached.barcodeSource, 'open_food_facts');
  assert.ok(cached.barcodeLastVerifiedAt);
});

test('GET /api/food/items/barcode/:barcode uses local cache before external provider', async () => {
  await FoodItem.create({
    name: 'Sua hat cache',
    barcodes: ['0011223344556'],
    brand: 'U',
    kcalPer100g: 88,
    protein: 3,
    carbs: 12,
    fat: 2,
    fiber: 1,
    sugar: 4,
    sodium: 20,
    vitaminC: 0,
    source: 'manual',
    barcodeSource: 'manual',
    barcodeLastVerifiedAt: new Date('2026-05-01T00:00:00.000Z'),
  });

  const originalFetch = global.fetch;
  let fetchCalled = false;
  global.fetch = (async () => {
    fetchCalled = true;
    throw new Error('external should not be called');
  }) as unknown as typeof fetch;

  const res = await request(app)
    .get('/api/food/items/barcode/0011223344556')
    .set('Authorization', `Bearer ${tokenA}`);

  global.fetch = originalFetch;

  assert.equal(res.status, 200);
  assert.equal(res.body.data.source, 'local');
  assert.equal(res.body.data.minimumNutrition.calories, 88);
  assert.equal(fetchCalled, false);
});

test('GET /api/food/items/barcode/:barcode rejects invalid barcode params', async () => {
  const res = await request(app)
    .get('/api/food/items/barcode/ABC123')
    .set('Authorization', `Bearer ${tokenA}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('barcode provider returns incomplete fallback without throwing', async () => {
  const originalFetch = global.fetch;
  global.fetch = (async () => ({
    ok: true,
    json: async () => ({ status: 0 }),
  })) as unknown as typeof fetch;

  const result = await lookupBarcodeProduct('0123456789012');
  global.fetch = originalFetch;

  assert.equal(result.found, false);
  assert.equal(result.isSaveReady, false);
  assert.deepEqual(result.missingFields, ['name', 'calories', 'protein', 'carbs', 'fat']);
  assert.equal(result.provenance.provider, 'open_food_facts');
});

test('active entitlement user gets 30/day scan limit response', async () => {
  await UserScanEntitlement.create({
    userId: new mongoose.Types.ObjectId(userIdA),
    campaignId: new mongoose.Types.ObjectId(),
    redeemCodeId: new mongoose.Types.ObjectId(),
    startsAt: new Date(Date.now() - 60_000),
    activeUntil: new Date(Date.now() + 86400000),
    quotaPolicy: { mode: 'high_daily_quota', dailyLimit: 30 },
    source: 'redeem_code',
  });

  await FoodScanAttempt.insertMany(Array.from({ length: 30 }, () => ({
    userId: new mongoose.Types.ObjectId(userIdA),
    createdAt: new Date(),
  })));

  const res = await request(app)
    .post('/api/food/scan')
    .set('Authorization', `Bearer ${tokenA}`)
    .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

  assert.equal(res.status, 429);
  assert.equal(res.body.limit, 30);
  assert.equal(res.body.quotaMode, 'entitlement_30_daily');
});

function geminiSuccessResponse() {
  return {
    ok: true,
    status: 200,
    json: async () => ({
      candidates: [{
        finishReason: 'STOP',
        content: {
          parts: [{ text: JSON.stringify({
            foods: [{
              name: 'Cơm gà', weightG: 250, calories: 520, protein: 30, carbs: 65, fat: 14,
              fiber: 3, sugar: 2, vitamins: {}, minerals: {}, tags: ['meal'],
            }],
            totals: { calories: 520, protein: 30, carbs: 65, fat: 14 },
            commentVi: 'Bữa ăn cân bằng.',
          }) }],
        },
      }],
    }),
  };
}

function geminiErrorResponse(status: number) {
  return {
    ok: false,
    status,
    text: async () => JSON.stringify({ error: { message: 'provider detail must not leak' } }),
  };
}

test('POST /api/food/scan retries a transient 503 and records only the successful scan', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = (async () => {
    calls += 1;
    return calls === 1 ? geminiErrorResponse(503) : geminiSuccessResponse();
  }) as unknown as typeof fetch;

  try {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(calls, 2);
    assert.equal(await FoodScanAttempt.countDocuments({ userId: userIdA }), 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/food/scan retries a transient network failure and records only the successful scan', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = (async () => {
    calls += 1;
    if (calls === 1) throw new TypeError('network unavailable');
    return geminiSuccessResponse();
  }) as unknown as typeof fetch;

  try {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    assert.equal(res.status, 200);
    assert.equal(calls, 2);
    assert.equal(await FoodScanAttempt.countDocuments({ userId: userIdA }), 1);
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/food/scan fails over to the fallback Gemini model after primary retries', async () => {
  const originalFetch = global.fetch;
  const requestedUrls: string[] = [];
  global.fetch = (async (url: string) => {
    requestedUrls.push(url);
    return requestedUrls.length <= 2 ? geminiErrorResponse(503) : geminiSuccessResponse();
  }) as unknown as typeof fetch;

  try {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    assert.equal(res.status, 200);
    assert.equal(requestedUrls.length, 3);
    assert.match(requestedUrls[0], /gemini-primary-test/);
    assert.match(requestedUrls[1], /gemini-primary-test/);
    assert.match(requestedUrls[2], /gemini-fallback-test/);
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/food/scan returns a friendly unavailable response after all Gemini attempts fail', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = (async () => {
    calls += 1;
    return geminiErrorResponse(503);
  }) as unknown as typeof fetch;

  try {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    assert.equal(res.status, 503);
    assert.equal(res.body.code, 'AI_TEMPORARILY_UNAVAILABLE');
    assert.match(res.body.error, /Dịch vụ phân tích ảnh đang bận/);
    assert.doesNotMatch(res.body.error, /provider detail|Gemini|503/);
    assert.equal(calls, 4);
    assert.equal(await FoodScanAttempt.countDocuments({ userId: userIdA }), 0);
  } finally {
    global.fetch = originalFetch;
  }
});

test('POST /api/food/scan does not retry an unrecognizable image response', async () => {
  const originalFetch = global.fetch;
  let calls = 0;
  global.fetch = (async () => {
    calls += 1;
    return {
      ok: true,
      status: 200,
      json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: '{"foods":[]}' }] } }] }),
    };
  }) as unknown as typeof fetch;

  try {
    const res = await request(app)
      .post('/api/food/scan')
      .set('Authorization', `Bearer ${tokenA}`)
      .attach('image', Buffer.from('fake-jpeg'), { filename: 'test.jpg', contentType: 'image/jpeg' });

    assert.equal(res.status, 422);
    assert.equal(res.body.code, 'AI_IMAGE_REJECTED');
    assert.equal(calls, 1);
  } finally {
    global.fetch = originalFetch;
  }
});
