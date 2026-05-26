process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';
process.env.NODE_ENV = 'test';
process.env.MONGODB_URI = process.env.MONGODB_URI ?? 'mongodb://localhost:27017/test-stub';
process.env.CLOUDINARY_CLOUD_NAME = process.env.CLOUDINARY_CLOUD_NAME ?? 'test';
process.env.CLOUDINARY_API_KEY = process.env.CLOUDINARY_API_KEY ?? 'test';
process.env.CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET ?? 'test';
process.env.FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID ?? 'test';
process.env.FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL ?? 'test@test.com';
process.env.FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY ?? 'test-key';
process.env.GEMINI_API_KEY = process.env.GEMINI_API_KEY ?? 'test-key';

import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../app';
import User from '../../models/User';
import { signAccessToken } from '../../utils/jwt';

let mongoServer: MongoMemoryServer;
let userToken: string;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await User.deleteMany({});

  const user = await User.create({
    email: 'campaign-user@example.com',
    passwordHash: 'hash',
    name: 'Campaign User',
    isActive: true,
  });
  userToken = signAccessToken({ sub: String(user._id), role: 'user' });
});

test('POST /api/campaigns/redeem rejects unauthenticated requests', async () => {
  const res = await request(app)
    .post('/api/campaigns/redeem')
    .send({ code: 'MILK-2026-AB', source: 'manual' });

  assert.equal(res.status, 401);
});

test('POST /api/campaigns/redeem validates code shape before Phase 2 workflow', async () => {
  const res = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: 'bad!*', source: 'manual' });

  assert.equal(res.status, 400);
  assert.equal(res.body.success, false);
});

test('POST /api/campaigns/redeem returns explicit Phase 2 scaffold for valid requests', async () => {
  const res = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: 'MILK-2026-AB', source: 'qr' });

  assert.equal(res.status, 501);
  assert.equal(res.body.success, false);
});

test('GET /api/campaigns/me/entitlements is authenticated and returns status contract', async () => {
  const res = await request(app)
    .get('/api/campaigns/me/entitlements')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.success, true);
  assert.deepEqual(Object.keys(res.body.data).sort(), [
    'activeUntil',
    'hasActiveEntitlement',
    'message',
    'quotaPolicy',
  ]);
});
