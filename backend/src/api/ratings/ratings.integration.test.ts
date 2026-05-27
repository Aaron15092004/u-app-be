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
import AppRating from '../../models/AppRating';
import FeedbackPromptState from '../../models/FeedbackPromptState';
import { signAccessToken } from '../../utils/jwt';

let mongoServer: MongoMemoryServer;
let userToken: string;
let adminToken: string;

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
  await AppRating.deleteMany({});
  await FeedbackPromptState.deleteMany({});
  const user = await User.create({ email: 'rating@test.com', passwordHash: 'hash', name: 'Rating User' });
  const admin = await User.create({ email: 'rating-admin@test.com', passwordHash: 'hash', name: 'Admin', role: 'admin' });
  userToken = signAccessToken({ sub: String(user._id), role: 'user' });
  adminToken = signAccessToken({ sub: String(admin._id), role: 'admin' });
});

test('user submits internal rating and admin can list it', async () => {
  const submitted = await request(app)
    .post('/api/ratings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      stars: 5,
      trigger: 'manual',
      platform: 'unknown',
      comment: 'Redeem ok',
    });

  assert.equal(submitted.status, 201);
  assert.equal(submitted.body.data.stars, 5);

  const prompt = await request(app)
    .get('/api/ratings/status')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(prompt.body.data.status, 'cooldown');
  assert.ok(prompt.body.data.cooldownUntil);
  assert.equal(submitted.body.data.storeReviewEligible, true);

  const adminList = await request(app)
    .get('/api/admin/ratings')
    .set('Authorization', `Bearer ${adminToken}`);
  assert.equal(adminList.status, 200);
  assert.equal(adminList.body.data.total, 1);
  assert.equal(adminList.body.data.items[0].comment, 'Redeem ok');
});

test('dismissing rating prompt sets a 14-day cooldown', async () => {
  const dismissed = await request(app)
    .post('/api/ratings/dismiss')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ trigger: 'food_scan_saved' });

  assert.equal(dismissed.status, 200);
  assert.equal(dismissed.body.data.status, 'dismissed');
  assert.ok(dismissed.body.data.cooldownUntil);

  const prompt = await request(app)
    .get('/api/ratings/status')
    .set('Authorization', `Bearer ${userToken}`);

  assert.equal(prompt.status, 200);
  assert.equal(prompt.body.data.status, 'cooldown');
});

test('store review eligibility is only returned for positive internal ratings', async () => {
  const low = await request(app)
    .post('/api/ratings')
    .set('Authorization', `Bearer ${userToken}`)
    .send({
      stars: 3,
      trigger: 'manual',
      platform: 'unknown',
    });

  assert.equal(low.status, 201);
  assert.equal(low.body.data.storeReviewEligible, false);
});
