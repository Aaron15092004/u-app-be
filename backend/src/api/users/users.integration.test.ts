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
// The real key is only in backend/.env (gitignored).
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? 'test-key';

import { test, before, after, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../app';
import User from '../../models/User';
import HabitLog from '../../models/HabitLog';
import WorkoutLog from '../../models/WorkoutLog';
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
  await HabitLog.deleteMany({});
  await WorkoutLog.deleteMany({});

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
// Test 1: GET /api/users/profile/stats without auth → 401
// ---------------------------------------------------------------------------

test('Test 1: GET /api/users/profile/stats without auth returns 401', async () => {
  const res = await request(app).get('/api/users/profile/stats');
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// Test 2: GET /api/users/profile/stats with userA — empty data → defaults
// ---------------------------------------------------------------------------

test('Test 2: GET /api/users/profile/stats with no logs returns defaults', async () => {
  const res = await request(app)
    .get('/api/users/profile/stats')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.streakDays, 0);
  assert.equal(res.body.data.totalWorkouts, 0);
  assert.equal(res.body.data.totalKcalBurned, 0);
  // Notifications defaults from D-79
  assert.equal(res.body.data.notifications.waterReminder, true);
  assert.equal(res.body.data.notifications.workoutReminder, true);
  assert.equal(res.body.data.notifications.nutMilkReminder, true);
  assert.equal(res.body.data.notifications.waterReminderTime, '08:00');
  assert.deepEqual(res.body.data.notifications.waterReminderTimes, [
    '08:00',
    '10:00',
    '12:00',
    '14:00',
    '16:00',
    '18:00',
    '20:00',
    '22:00',
  ]);
  assert.equal(res.body.data.notifications.workoutReminderTime, '07:00');
  assert.equal(res.body.data.notifications.nutMilkReminderTime, '20:00');
});

// ---------------------------------------------------------------------------
// Test 3: GET stats with seeded data (3 HabitLogs + 2 WorkoutLogs)
// ---------------------------------------------------------------------------

test('Test 3: GET stats with seeded habits and workouts returns correct aggregates', async () => {
  const todayBucket = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userIdA);

  // Seed 3 HabitLogs for today (water, vegetables, exercise) — qualifies streak
  await HabitLog.insertMany([
    { userId: userObjId, habitId: 'water', date: todayBucket, checkedAt: new Date() },
    { userId: userObjId, habitId: 'vegetables', date: todayBucket, checkedAt: new Date() },
    { userId: userObjId, habitId: 'exercise', date: todayBucket, checkedAt: new Date() },
  ]);

  // Seed 2 WorkoutLogs
  await WorkoutLog.insertMany([
    {
      userId: userObjId,
      exerciseName: 'Running',
      date: todayBucket,
      durationMinutes: 20,
      caloriesBurned: 150,
      completedAt: new Date(),
    },
    {
      userId: userObjId,
      exerciseName: 'Cycling',
      date: todayBucket,
      durationMinutes: 30,
      caloriesBurned: 200,
      completedAt: new Date(),
    },
  ]);

  const res = await request(app)
    .get('/api/users/profile/stats')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.streakDays, 1);
  assert.equal(res.body.data.totalWorkouts, 2);
  assert.equal(res.body.data.totalKcalBurned, 350);
  assert.ok(res.body.data.notifications);
});

// ---------------------------------------------------------------------------
// Test 4 (IDOR): userB token after userA's seed → all zeros
// ---------------------------------------------------------------------------

test('Test 4 (IDOR): userB sees only their own data (zero) after userA seed', async () => {
  const todayBucket = vietnamDayStart(new Date());
  const userObjId = new mongoose.Types.ObjectId(userIdA);

  // Seed data for userA
  await HabitLog.insertMany([
    { userId: userObjId, habitId: 'water', date: todayBucket, checkedAt: new Date() },
    { userId: userObjId, habitId: 'vegetables', date: todayBucket, checkedAt: new Date() },
    { userId: userObjId, habitId: 'exercise', date: todayBucket, checkedAt: new Date() },
  ]);
  await WorkoutLog.create({
    userId: userObjId,
    exerciseName: 'Running',
    date: todayBucket,
    durationMinutes: 30,
    caloriesBurned: 200,
    completedAt: new Date(),
  });

  // UserB should see no data
  const res = await request(app)
    .get('/api/users/profile/stats')
    .set('Authorization', `Bearer ${tokenB}`);
  assert.equal(res.status, 200);
  assert.equal(res.body.data.streakDays, 0);
  assert.equal(res.body.data.totalWorkouts, 0);
  assert.equal(res.body.data.totalKcalBurned, 0);
});

// ---------------------------------------------------------------------------
// Test 5: PATCH /api/users/profile without auth → 401
// ---------------------------------------------------------------------------

test('Test 5: PATCH /api/users/profile without auth returns 401', async () => {
  const res = await request(app).patch('/api/users/profile').send({ name: 'X' });
  assert.equal(res.status, 401);
});

// ---------------------------------------------------------------------------
// Test 6: PATCH /api/users/profile with valid data → 200, DB updated
// ---------------------------------------------------------------------------

test('Test 6: PATCH /api/users/profile with valid fields updates correctly', async () => {
  const res = await request(app)
    .patch('/api/users/profile')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'Aaron', heightCm: 175, weightKg: 70, goalType: 'maintain', waterGoal: 10 });

  assert.equal(res.status, 200);

  // Verify in DB
  const user = await User.findById(userIdA).lean();
  assert.equal(user?.name, 'Aaron');
  assert.equal(user?.profile.heightCm, 175);
  assert.equal(user?.profile.weightKg, 70);
  assert.equal(user?.profile.goalType, 'maintain');
  assert.equal(user?.profile.waterGoal, 10);
});

// ---------------------------------------------------------------------------
// Test 7 (mass-assignment defence): role/email/passwordHash cannot be changed
// ---------------------------------------------------------------------------

test('Test 7 (mass-assignment): role/email/passwordHash rejected by .strict() schema', async () => {
  const res = await request(app)
    .patch('/api/users/profile')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ name: 'X', role: 'admin', email: 'evil@x.com', passwordHash: 'pwned' });

  // .strict() schema should return 400 for unknown keys
  assert.equal(res.status, 400);

  // Verify DB is unchanged regardless
  const user = await User.findById(userIdA).lean();
  assert.equal(user?.role, 'user');
  assert.equal(user?.email, 'usera@example.com');
  assert.notEqual(user?.passwordHash, 'pwned');
});

// ---------------------------------------------------------------------------
// Test 8 (HH:MM regex): Invalid time format → 400 with Vietnamese message
// ---------------------------------------------------------------------------

test('Test 8 (HH:MM regex): invalid time format returns 400', async () => {
  const res = await request(app)
    .patch('/api/users/notifications')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ waterReminderTime: '25:99' });

  assert.equal(res.status, 400);
  // Should contain Vietnamese error message
  assert.ok(
    res.body.error && (res.body.error as string).includes('HH:MM') ||
    res.body.error && (res.body.error as string).includes('Giờ'),
    `Expected Vietnamese error message, got: ${JSON.stringify(res.body)}`,
  );
});

// ---------------------------------------------------------------------------
// Test 9: PATCH /api/users/notifications with valid data → 200, DB updated
// ---------------------------------------------------------------------------

test('Test 9: PATCH /api/users/notifications with valid data updates correctly', async () => {
  const res = await request(app)
    .patch('/api/users/notifications')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({
      waterReminder: false,
      workoutReminder: true,
      nutMilkReminder: true,
      waterReminderTime: '09:30',
      waterReminderTimes: ['08:30', '10:30', '12:30', '14:30', '16:30', '18:30', '20:30', '22:30'],
      workoutReminderTime: '06:00',
      nutMilkReminderTime: '20:30',
    });

  assert.equal(res.status, 200);

  const user = await User.findById(userIdA).lean();
  assert.equal(user?.notifications.waterReminder, false);
  assert.equal(user?.notifications.workoutReminder, true);
  assert.equal(user?.notifications.nutMilkReminder, true);
  assert.equal(user?.notifications.waterReminderTime, '08:30');
  assert.deepEqual(user?.notifications.waterReminderTimes, ['08:30', '10:30', '12:30', '14:30', '16:30', '18:30', '20:30', '22:30']);
  assert.equal(user?.notifications.workoutReminderTime, '06:00');
  assert.equal(user?.notifications.nutMilkReminderTime, '20:30');
});

// ---------------------------------------------------------------------------
// Test 10 (partial update): Only waterReminderTime updated, others unchanged
// ---------------------------------------------------------------------------

test('Test 10 (partial update): PATCH notifications only updates provided fields', async () => {
  // First set known state
  await User.findByIdAndUpdate(userIdA, {
    'notifications.waterReminder': false,
    'notifications.workoutReminder': false,
    'notifications.nutMilkReminder': false,
    'notifications.waterReminderTime': '09:00',
    'notifications.waterReminderTimes': ['09:00', '11:00'],
    'notifications.workoutReminderTime': '08:00',
    'notifications.nutMilkReminderTime': '20:00',
  });

  const res = await request(app)
    .patch('/api/users/notifications')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ waterReminderTime: '10:15' });

  assert.equal(res.status, 200);

  const user = await User.findById(userIdA).lean();
  assert.equal(user?.notifications.waterReminderTime, '10:15');
  assert.deepEqual(user?.notifications.waterReminderTimes, ['09:00', '11:00']);
  // Other fields must not change
  assert.equal(user?.notifications.waterReminder, false);
  assert.equal(user?.notifications.workoutReminder, false);
  assert.equal(user?.notifications.nutMilkReminder, false);
  assert.equal(user?.notifications.workoutReminderTime, '08:00');
  assert.equal(user?.notifications.nutMilkReminderTime, '20:00');
});

// ---------------------------------------------------------------------------
// Test 11 (waterGoal range): waterGoal=100 → 400 (exceeds max 20)
// ---------------------------------------------------------------------------

test('Test 11 (waterGoal range): waterGoal=100 rejected (max 20)', async () => {
  const res = await request(app)
    .patch('/api/users/profile')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ waterGoal: 100 });

  assert.equal(res.status, 400);
});

// ---------------------------------------------------------------------------
// Test 12 (notifications round-trip): PATCH then GET stats → notifications updated
// ---------------------------------------------------------------------------

test('Test 12 (notifications round-trip): PATCH then GET stats shows updated notifications', async () => {
  // PATCH waterReminderTime
  const patchRes = await request(app)
    .patch('/api/users/notifications')
    .set('Authorization', `Bearer ${tokenA}`)
    .send({ waterReminderTime: '11:11' });
  assert.equal(patchRes.status, 200);

  // GET stats — notifications must reflect the change (form-init for mobile Plan 07)
  const statsRes = await request(app)
    .get('/api/users/profile/stats')
    .set('Authorization', `Bearer ${tokenA}`);
  assert.equal(statsRes.status, 200);
  assert.equal(statsRes.body.data.notifications.waterReminderTime, '11:11');
  assert.deepEqual(statsRes.body.data.notifications.waterReminderTimes, [
    '08:00',
    '10:00',
    '12:00',
    '14:00',
    '16:00',
    '18:00',
    '20:00',
    '22:00',
  ]);
  assert.equal(statsRes.body.data.notifications.nutMilkReminderTime, '20:00');
});
