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
process.env.REDEEM_CODE_PEPPER = process.env.REDEEM_CODE_PEPPER ?? 'test-pepper';

import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import app from '../../app';
import Campaign from '../../models/Campaign';
import RedeemCode from '../../models/RedeemCode';
import User from '../../models/User';
import UserScanEntitlement from '../../models/UserScanEntitlement';
import { signAccessToken } from '../../utils/jwt';
import { hashRedeemCode } from '../../services/redeem-code.service';
import { clearRedeemAttemptLimitForTests } from './campaigns.service';

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
  await Campaign.deleteMany({});
  await RedeemCode.deleteMany({});
  await UserScanEntitlement.deleteMany({});
  clearRedeemAttemptLimitForTests();

  const user = await User.create({
    email: 'campaign-user@example.com',
    passwordHash: 'hash',
    name: 'Campaign User',
    isActive: true,
  });
  const admin = await User.create({
    email: 'campaign-admin@example.com',
    passwordHash: 'hash',
    name: 'Campaign Admin',
    role: 'admin',
    isActive: true,
  });
  userToken = signAccessToken({ sub: String(user._id), role: 'user' });
  adminToken = signAccessToken({ sub: String(admin._id), role: 'admin' });
});

async function createActiveCampaign() {
  const startsAt = new Date(Date.now() - 60_000).toISOString();
  const endsAt = new Date(Date.now() + 86400000).toISOString();
  const res = await request(app)
    .post('/api/admin/campaigns')
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      name: 'Sua U bottle launch',
      status: 'active',
      startsAt,
      endsAt,
      entitlementDurationDays: 14,
      highQuotaDailyLimit: 30,
    });
  assert.equal(res.status, 201);
  return res.body.data as { _id: string };
}

test('admin creates campaign, generates transient CSV codes, and raw code is not persisted', async () => {
  const campaign = await createActiveCampaign();
  const res = await request(app)
    .post(`/api/admin/campaigns/${campaign._id}/codes/generate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({
      quantity: 2,
      codeLength: 10,
      redeemBaseUrl: 'https://u-app.vn/redeem',
    });

  assert.equal(res.status, 201);
  assert.equal(res.body.data.quantity, 2);
  assert.match(res.body.data.csv, /rawCode,redeemUrl/);
  assert.match(res.body.data.rows[0].redeemUrl, /^https:\/\/u-app\.vn\/redeem\?code=/);

  const persisted = await RedeemCode.findOne({ campaignId: campaign._id }).lean();
  assert.ok(persisted);
  assert.equal('rawCode' in persisted, false);
  assert.ok(persisted.codeHash);
});

test('manual redeem creates a 30/day entitlement and rejects duplicate use', async () => {
  const campaign = await createActiveCampaign();
  const generate = await request(app)
    .post(`/api/admin/campaigns/${campaign._id}/codes/generate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: 1, codeLength: 12 });
  const rawCode = generate.body.data.rows[0].rawCode;

  const redeemed = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: rawCode, source: 'manual' });

  assert.equal(redeemed.status, 200);
  assert.equal(redeemed.body.data.status, 'success');
  assert.equal(redeemed.body.data.entitlement.quotaPolicy.dailyLimit, 30);

  const status = await request(app)
    .get('/api/campaigns/me/entitlements')
    .set('Authorization', `Bearer ${userToken}`);
  assert.equal(status.status, 200);
  assert.equal(status.body.data.hasActiveEntitlement, true);
  assert.equal(status.body.data.quotaPolicy.dailyLimit, 30);
  assert.ok(status.body.data.activeUntil);

  const duplicate = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: rawCode, source: 'manual' });
  assert.equal(duplicate.status, 409);
  assert.equal(duplicate.body.code, 'ALREADY_USED');
  assert.match(duplicate.body.error, /da duoc su dung/);
});

test('manual redeem returns status-specific invalid, revoked, and expired errors', async () => {
  const campaign = await createActiveCampaign();
  const generate = await request(app)
    .post(`/api/admin/campaigns/${campaign._id}/codes/generate`)
    .set('Authorization', `Bearer ${adminToken}`)
    .send({ quantity: 2, codeLength: 12 });
  const revokedCode = generate.body.data.rows[0].rawCode;
  const expiredCode = generate.body.data.rows[1].rawCode;

  const invalid = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: 'NOTAREALCODE', source: 'manual' });
  assert.equal(invalid.status, 404);
  assert.equal(invalid.body.code, 'INVALID_CODE');

  const persistedRevoked = await RedeemCode.findOne({ codeHash: hashRedeemCode(revokedCode) });
  assert.ok(persistedRevoked);
  await RedeemCode.updateOne({ _id: persistedRevoked._id }, { $set: { status: 'revoked' } });

  const revoked = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: revokedCode, source: 'manual' });
  assert.equal(revoked.status, 410);
  assert.equal(revoked.body.code, 'REVOKED');

  const persistedExpired = await RedeemCode.findOne({ codeHash: hashRedeemCode(expiredCode) });
  assert.ok(persistedExpired);
  await RedeemCode.updateOne(
    { _id: persistedExpired._id },
    { $set: { expiresAt: new Date(Date.now() - 1000) } },
  );

  const expired = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: expiredCode, source: 'manual' });
  assert.equal(expired.status, 410);
  assert.equal(expired.body.code, 'EXPIRED');
});

test('manual redeem attempts are rate-limited by user and IP', async () => {
  for (let i = 0; i < 8; i += 1) {
    const res = await request(app)
      .post('/api/campaigns/redeem')
      .set('Authorization', `Bearer ${userToken}`)
      .send({ code: `BADCODE${i}`, source: 'manual' });
    assert.equal(res.status, 404);
  }

  const limited = await request(app)
    .post('/api/campaigns/redeem')
    .set('Authorization', `Bearer ${userToken}`)
    .send({ code: 'BADCODE9', source: 'manual' });

  assert.equal(limited.status, 429);
  assert.equal(limited.body.code, 'RATE_LIMITED');
});

test('campaign APIs stay admin-only', async () => {
  const res = await request(app)
    .post('/api/admin/campaigns')
    .set('Authorization', `Bearer ${userToken}`)
    .send({});
  assert.equal(res.status, 403);
});
