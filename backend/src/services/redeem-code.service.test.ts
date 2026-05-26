import { test } from 'node:test';
import assert from 'node:assert/strict';

import {
  HIGH_QUOTA_DAILY_LIMIT,
  SCAN_QUOTA_POLICY_MODE,
  buildRedeemHttpsUrl,
  hashRedeemCode,
  normalizeRedeemCode,
} from './redeem-code.service.js';

test('normalizeRedeemCode trims, uppercases, and removes spaces and hyphens', () => {
  assert.equal(normalizeRedeemCode('  abcd-1234 ef  '), 'ABCD1234EF');
  assert.equal(normalizeRedeemCode('AB CD-1234-EF'), 'ABCD1234EF');
});

test('hashRedeemCode hashes normalized code variants without returning code material', () => {
  const pepper = 'test-redeem-code-pepper';
  const hashA = hashRedeemCode(' milk-2026 ab ', pepper);
  const hashB = hashRedeemCode('MILK2026AB', pepper);

  assert.equal(hashA, hashB);
  assert.match(hashA, /^[a-f0-9]{64}$/);
  assert.notEqual(hashA, ' milk-2026 ab ');
  assert.notEqual(hashA, 'MILK2026AB');
});

test('hashRedeemCode changes when the pepper changes', () => {
  const code = 'MILK-2026-AB';

  assert.notEqual(
    hashRedeemCode(code, 'first-test-pepper'),
    hashRedeemCode(code, 'second-test-pepper'),
  );
});

test('hashRedeemCode rejects missing pepper with a clear error', () => {
  const previousPepper = process.env.REDEEM_CODE_PEPPER;
  delete process.env.REDEEM_CODE_PEPPER;

  try {
    assert.throws(
      () => hashRedeemCode('MILK-2026-AB'),
      /REDEEM_CODE_PEPPER is required/,
    );
  } finally {
    if (previousPepper === undefined) {
      delete process.env.REDEEM_CODE_PEPPER;
    } else {
      process.env.REDEEM_CODE_PEPPER = previousPepper;
    }
  }
});

test('buildRedeemHttpsUrl builds an HTTPS redeem URL with raw code in query only', () => {
  const redeemUrl = buildRedeemHttpsUrl('https://u.example/redeem', 'Milk 2026-AB');
  const parsed = new URL(redeemUrl);

  assert.equal(parsed.protocol, 'https:');
  assert.equal(parsed.hostname, 'u.example');
  assert.equal(parsed.pathname, '/redeem');
  assert.equal(parsed.searchParams.get('code'), 'Milk 2026-AB');
});

test('buildRedeemHttpsUrl rejects non-HTTPS base URLs', () => {
  assert.throws(
    () => buildRedeemHttpsUrl('http://u.example/redeem', 'MILK-2026-AB'),
    /HTTPS base URL/,
  );
});

test('high quota constants are finite and do not model an unbounded bypass', () => {
  assert.equal(SCAN_QUOTA_POLICY_MODE, 'high_daily_quota');
  assert.equal(Number.isFinite(HIGH_QUOTA_DAILY_LIMIT), true);
  assert.equal(Number.isInteger(HIGH_QUOTA_DAILY_LIMIT), true);
  assert.ok(HIGH_QUOTA_DAILY_LIMIT > 20);
});
