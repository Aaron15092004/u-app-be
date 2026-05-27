// Set env vars before module-level fail-fast check in jwt.ts
process.env.JWT_ACCESS_SECRET = process.env.JWT_ACCESS_SECRET ?? 'test-access-secret';
process.env.JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET ?? 'test-refresh-secret';

import { test } from 'node:test';
import assert from 'node:assert/strict';

import { authenticate } from './auth.middleware';
import { signAccessToken } from '../utils/jwt';

// ---- minimal mock helpers ----

function makeMockReq(authHeader?: string): any {
  return {
    headers: authHeader ? { authorization: authHeader } : {},
  } as any;
}

function makeMockRes(): { res: any; state: { statusCode: number | null; body: any } } {
  const state: { statusCode: number | null; body: any } = { statusCode: null, body: null };
  const res: any = {
    status(code: number) {
      state.statusCode = code;
      return res;
    },
    json(body: any) {
      state.body = body;
      return res;
    },
  };
  return { res, state };
}

// ---- authenticate tests ----

test('authenticate: missing Authorization header returns 401', () => {
  const req = makeMockReq();
  const { res, state } = makeMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(state.statusCode, 401);
  assert.equal(nextCalled, false);
  assert.equal(state.body?.error, 'Token không hợp lệ hoặc đã hết hạn');
});

test('authenticate: malformed header (no Bearer prefix) returns 401', () => {
  const req = makeMockReq('Basic some-token');
  const { res, state } = makeMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(state.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('authenticate: invalid token returns 401', () => {
  const req = makeMockReq('Bearer not.valid.token');
  const { res, state } = makeMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(state.statusCode, 401);
  assert.equal(nextCalled, false);
});

test('authenticate: valid token calls next and sets req.user', () => {
  const token = signAccessToken({ sub: 'user-id-123', role: 'user' });
  const req = makeMockReq(`Bearer ${token}`);
  const { res } = makeMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user?.id, 'user-id-123');
  assert.equal(req.user?.role, 'user');
});

test('authenticate: admin role is preserved in req.user', () => {
  const token = signAccessToken({ sub: 'admin-99', role: 'admin' });
  const req = makeMockReq(`Bearer ${token}`);
  const { res } = makeMockRes();
  let nextCalled = false;

  authenticate(req, res, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
  assert.equal(req.user?.role, 'admin');
});
