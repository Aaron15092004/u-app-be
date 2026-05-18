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
import Exercise from '../../models/Exercise';

let mongoServer: MongoMemoryServer;
let accessToken: string;
let yogaId: string;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());

  // Register a user and capture the access token
  const res = await request(app)
    .post('/api/auth/register')
    .send({ email: 'exercises-test@example.com', password: 'password123' });

  accessToken = res.body.data.accessToken;

  // Seed 4 exercises (1 per category, isActive=true) + 1 isActive=false
  const yoga = await Exercise.create({
    name: 'Tư thế ngọn núi test',
    category: 'yoga',
    difficulty: 'easy',
    durationMinutes: 5,
    caloriesBurned: 30,
    imageUrl: null,
    steps: [
      { order: 1, instruction: 'Bước 1 yoga test', durationSeconds: 10 },
      { order: 2, instruction: 'Bước 2 yoga test', durationSeconds: 10 },
      { order: 3, instruction: 'Bước 3 yoga test', durationSeconds: 30 },
    ],
    isActive: true,
  });
  yogaId = (yoga._id as mongoose.Types.ObjectId).toString();

  await Exercise.create({
    name: 'Chạy bộ tại chỗ test',
    category: 'cardio',
    difficulty: 'easy',
    durationMinutes: 10,
    caloriesBurned: 80,
    imageUrl: null,
    steps: [
      { order: 1, instruction: 'Bước 1 cardio test', durationSeconds: 10 },
      { order: 2, instruction: 'Bước 2 cardio test', durationSeconds: 30 },
      { order: 3, instruction: 'Bước 3 cardio test', durationSeconds: 60 },
    ],
    isActive: true,
  });

  await Exercise.create({
    name: 'Squat tạ đơn test',
    category: 'weights',
    difficulty: 'medium',
    durationMinutes: 12,
    caloriesBurned: 120,
    imageUrl: null,
    steps: [
      { order: 1, instruction: 'Bước 1 weights test', durationSeconds: 10 },
      { order: 2, instruction: 'Bước 2 weights test', durationSeconds: 10 },
      { order: 3, instruction: 'Bước 3 weights test', durationSeconds: 60 },
    ],
    isActive: true,
  });

  await Exercise.create({
    name: 'Giãn cơ gân kheo test',
    category: 'stretching',
    difficulty: 'easy',
    durationMinutes: 5,
    caloriesBurned: 30,
    imageUrl: null,
    steps: [
      { order: 1, instruction: 'Bước 1 stretching test', durationSeconds: 10 },
      { order: 2, instruction: 'Bước 2 stretching test', durationSeconds: 30 },
      { order: 3, instruction: 'Bước 3 stretching test', durationSeconds: 30 },
    ],
    isActive: true,
  });

  // Inactive exercise — should NOT appear in list results
  await Exercise.create({
    name: 'Bài tập ẩn test',
    category: 'yoga',
    difficulty: 'easy',
    durationMinutes: 5,
    caloriesBurned: 25,
    imageUrl: null,
    steps: [
      { order: 1, instruction: 'Bước ẩn 1', durationSeconds: 10 },
      { order: 2, instruction: 'Bước ẩn 2', durationSeconds: 10 },
      { order: 3, instruction: 'Bước ẩn 3', durationSeconds: 10 },
    ],
    isActive: false,
  });
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

// ---------------------------------------------------------------------------
// Test 1: GET /api/exercises without Authorization → 401
// ---------------------------------------------------------------------------
test('GET /api/exercises - no token → 401 "Token không hợp lệ hoặc đã hết hạn"', async () => {
  const res = await request(app).get('/api/exercises');

  assert.equal(res.status, 401);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Token không hợp lệ hoặc đã hết hạn');
});

// ---------------------------------------------------------------------------
// Test 2: GET /api/exercises with valid token → 200, returns 4 active exercises
// ---------------------------------------------------------------------------
test('GET /api/exercises - valid token → 200, body.data.length === 4 (isActive=false excluded)', async () => {
  const res = await request(app)
    .get('/api/exercises')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 4);
});

// ---------------------------------------------------------------------------
// Test 3: GET /api/exercises?category=yoga → 200, returns 1 yoga exercise
// ---------------------------------------------------------------------------
test('GET /api/exercises?category=yoga - valid token → 200, body.data.length === 1', async () => {
  const res = await request(app)
    .get('/api/exercises?category=yoga')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data.length, 1);
  assert.equal(res.body.data[0].category, 'yoga');
});

// ---------------------------------------------------------------------------
// Test 4: GET /api/exercises?category=invalid → 400 "Danh mục không hợp lệ"
// ---------------------------------------------------------------------------
test('GET /api/exercises?category=invalid → 400 "Danh mục không hợp lệ"', async () => {
  const res = await request(app)
    .get('/api/exercises?category=invalid')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Danh mục không hợp lệ');
});

// ---------------------------------------------------------------------------
// Test 5: GET /api/exercises/:id (valid yoga id) → 200, body.data._id matches
// ---------------------------------------------------------------------------
test('GET /api/exercises/:id - valid yoga id → 200, body.data._id matches', async () => {
  const res = await request(app)
    .get(`/api/exercises/${yogaId}`)
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.equal(res.body.data._id.toString(), yogaId);
});

// ---------------------------------------------------------------------------
// Test 6: GET /api/exercises/notanid → 400 "ID bài tập không hợp lệ"
// ---------------------------------------------------------------------------
test('GET /api/exercises/notanid → 400 "ID bài tập không hợp lệ"', async () => {
  const res = await request(app)
    .get('/api/exercises/notanid')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'ID bài tập không hợp lệ');
});

// ---------------------------------------------------------------------------
// Test 7: GET /api/exercises/000000000000000000000000 → 404 "Bài tập không tồn tại"
// ---------------------------------------------------------------------------
test('GET /api/exercises/000000000000000000000000 (valid ObjectId, not in DB) → 404 "Bài tập không tồn tại"', async () => {
  const res = await request(app)
    .get('/api/exercises/000000000000000000000000')
    .set('Authorization', `Bearer ${accessToken}`);

  assert.equal(res.status, 404);
  assert.equal(res.body.success, false);
  assert.equal(res.body.error, 'Bài tập không tồn tại');
});
