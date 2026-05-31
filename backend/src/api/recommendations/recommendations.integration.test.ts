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
import NutMilkPreference from '../../models/NutMilkPreference';
import { signAccessToken } from '../../utils/jwt';

let mongoServer: MongoMemoryServer;
let token: string;

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
  await NutMilkPreference.deleteMany({});
  const user = await User.create({ email: 'milk@test.com', passwordHash: 'hash', name: 'Milk User' });
  token = signAccessToken({ sub: String(user._id), role: 'user' });
});

test('nut milk recommendations return static options and non-medical disclaimer', async () => {
  const res = await request(app)
    .get('/api/recommendations/nut-milk?bmi=22')
    .set('Authorization', `Bearer ${token}`);

  assert.equal(res.status, 200);
  assert.equal(res.body.data.bmiRule, 'range_18_5_22_9');
  assert.equal(res.body.data.flavors.length, 7);
  assert.ok(
    res.body.data.flavors.some(
      (flavor: { flavorId: string }) => flavor.flavorId === 'cafe_dua_hat_dieu_dau_nanh',
    ),
  );
  assert.match(res.body.data.disclaimer, /không phải chẩn đoán/i);
});

test('nut milk selection persists one current preference per user', async () => {
  const saved = await request(app)
    .post('/api/recommendations/nut-milk/selection')
    .set('Authorization', `Bearer ${token}`)
    .send({
      selectedFlavorId: 'gao_lut_me_den_hat_sen',
      bmi: 22,
      source: 'manual_profile',
    });

  assert.equal(saved.status, 201);
  assert.equal(saved.body.data.selectedFlavorId, 'gao_lut_me_den_hat_sen');

  const read = await request(app)
    .get('/api/recommendations/nut-milk?bmi=22')
    .set('Authorization', `Bearer ${token}`);
  assert.equal(read.body.data.currentPreference.selectedFlavorId, 'gao_lut_me_den_hat_sen');
});
