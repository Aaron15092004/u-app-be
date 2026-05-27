import { test } from 'node:test';
import assert from 'node:assert/strict';

import { hashPassword, comparePassword, hashToken, compareTokenHash } from './password.js';

test('hashPassword returns a non-empty string different from input', async () => {
  const hash = await hashPassword('my-secret-123');
  assert.equal(typeof hash, 'string');
  assert.ok(hash.length > 0);
  assert.notEqual(hash, 'my-secret-123');
});

test('comparePassword returns true for correct password', async () => {
  const hash = await hashPassword('correct-horse');
  const result = await comparePassword('correct-horse', hash);
  assert.equal(result, true);
});

test('comparePassword returns false for wrong password', async () => {
  const hash = await hashPassword('correct-horse');
  const result = await comparePassword('wrong-horse', hash);
  assert.equal(result, false);
});

test('hashToken returns a non-empty string different from input', async () => {
  const hash = await hashToken('raw-token-value');
  assert.equal(typeof hash, 'string');
  assert.ok(hash.length > 0);
  assert.notEqual(hash, 'raw-token-value');
});

test('compareTokenHash returns true for matching raw token', async () => {
  const raw = 'some-reset-token';
  const hash = await hashToken(raw);
  const result = await compareTokenHash(raw, hash);
  assert.equal(result, true);
});

test('compareTokenHash returns false for non-matching raw token', async () => {
  const hash = await hashToken('correct-token');
  const result = await compareTokenHash('wrong-token', hash);
  assert.equal(result, false);
});

test('two hashes of the same password are different (bcrypt salts)', async () => {
  const hash1 = await hashPassword('same-input');
  const hash2 = await hashPassword('same-input');
  assert.notEqual(hash1, hash2);
});
