// Set env vars BEFORE importing the module so the fail-fast check passes
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';

import { test } from 'node:test';
import assert from 'node:assert/strict';
import jwt from 'jsonwebtoken';

// Direct import is safe because env vars are set above before any module code runs
import { signAccessToken, verifyAccessToken, signRefreshToken, verifyRefreshToken } from './jwt';

test('signAccessToken produces a valid JWT (3 parts)', () => {
  const token = signAccessToken({ sub: 'user123', role: 'user' });
  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3, 'should be a JWT with 3 parts');
});

test('verifyAccessToken round-trips payload', () => {
  const payload = { sub: 'user456', role: 'admin' as const };
  const token = signAccessToken(payload);
  const decoded = verifyAccessToken(token);
  assert.equal(decoded.sub, payload.sub);
  assert.equal(decoded.role, payload.role);
});

test('signRefreshToken produces a valid JWT (3 parts)', () => {
  const token = signRefreshToken({ sub: 'user123', jti: 'abc-def' });
  assert.equal(typeof token, 'string');
  assert.ok(token.split('.').length === 3, 'should be a JWT with 3 parts');
});

test('verifyRefreshToken round-trips payload', () => {
  const payload = { sub: 'user789', jti: 'jti-xyz' };
  const token = signRefreshToken(payload);
  const decoded = verifyRefreshToken(token);
  assert.equal(decoded.sub, payload.sub);
  assert.equal(decoded.jti, payload.jti);
});

test('verifyAccessToken throws on invalid token', () => {
  assert.throws(() => verifyAccessToken('not.a.valid.token'));
});

test('verifyAccessToken throws on wrong secret', () => {
  const token = jwt.sign({ sub: 'x', role: 'user' }, 'wrong-secret', { expiresIn: '15m' });
  assert.throws(() => verifyAccessToken(token));
});
