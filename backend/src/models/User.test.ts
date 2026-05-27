import { test } from 'node:test';
import assert from 'node:assert/strict';

// Import the model (Mongoose schema doesn't require a live DB connection for schema introspection)
import User from './User.js';

test('profileCompleted defaults to false', () => {
  const path = User.schema.path('profileCompleted') as any;
  assert.equal(path.defaultValue, false);
});

test('name field is no longer required', () => {
  const path = User.schema.path('name') as any;
  assert.equal(path.isRequired, undefined);
});

test('refreshTokenHash defaults to null', () => {
  const path = User.schema.path('refreshTokenHash') as any;
  assert.equal(path.defaultValue, null);
});

test('refreshTokenExpiry defaults to null', () => {
  const path = User.schema.path('refreshTokenExpiry') as any;
  assert.equal(path.defaultValue, null);
});

test('passwordResetTokenHash defaults to null', () => {
  const path = User.schema.path('passwordResetTokenHash') as any;
  assert.equal(path.defaultValue, null);
});

test('passwordResetTokenExpiry defaults to null', () => {
  const path = User.schema.path('passwordResetTokenExpiry') as any;
  assert.equal(path.defaultValue, null);
});
