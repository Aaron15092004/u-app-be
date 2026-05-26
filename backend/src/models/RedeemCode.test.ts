import { after, before, beforeEach, test } from 'node:test';
import assert from 'node:assert/strict';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';

import RedeemCode from './RedeemCode';
import { hashRedeemCode } from '../services/redeem-code.service';

let mongoServer: MongoMemoryServer;

before(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  await RedeemCode.ensureIndexes();
});

after(async () => {
  await mongoose.disconnect();
  await mongoServer.stop();
});

beforeEach(async () => {
  await RedeemCode.deleteMany({});
});

test('RedeemCode schema persists hash and metadata only', async () => {
  const forbiddenPaths = ['code', 'rawCode', 'plainCode'];

  for (const path of forbiddenPaths) {
    assert.equal(
      RedeemCode.schema.path(path),
      undefined,
      `RedeemCode must not persist plaintext field "${path}"`,
    );
  }

  const doc = await RedeemCode.create({
    campaignId: new mongoose.Types.ObjectId(),
    batchId: 'batch-001',
    codeHash: hashRedeemCode('MILK-2026-AB', 'test-pepper'),
    codePrefix: 'MILK',
    codeLength: 10,
    expiresAt: null,
  });

  const serialized = doc.toObject();
  assert.equal(serialized.codeHash.length, 64);
  assert.equal(serialized.codePrefix, 'MILK');
  assert.equal(serialized.status, 'unused');

  for (const path of forbiddenPaths) {
    assert.equal(Object.hasOwn(serialized, path), false);
  }
});

test('RedeemCode unique codeHash index rejects duplicate lookup hashes', async () => {
  const codeHash = hashRedeemCode('MILK-2026-UNIQUE', 'test-pepper');

  await RedeemCode.create({
    campaignId: new mongoose.Types.ObjectId(),
    batchId: 'batch-001',
    codeHash,
    codePrefix: 'MILK',
    codeLength: 14,
    expiresAt: null,
  });

  await assert.rejects(
    () =>
      RedeemCode.create({
        campaignId: new mongoose.Types.ObjectId(),
        batchId: 'batch-002',
        codeHash,
        codePrefix: 'MILK',
        codeLength: 14,
        expiresAt: null,
      }),
    /E11000/,
  );
});
