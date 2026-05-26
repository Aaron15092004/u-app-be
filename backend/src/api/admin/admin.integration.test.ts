import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import supertest from 'supertest';
import app from '../../app';
import User from '../../models/User';
import Exercise from '../../models/Exercise';
import FoodItem from '../../models/FoodItem';

let mongod: MongoMemoryServer;
let adminToken: string;
let userToken: string;

before(async () => {
  mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  // Seed admin user
  const adminHash = await bcrypt.hash('adminpass123', 10);
  await User.create({
    email: 'admin@test.com',
    passwordHash: adminHash,
    name: 'Admin',
    role: 'admin',
    isActive: true,
    profileCompleted: true,
  });

  // Seed regular user
  const userHash = await bcrypt.hash('userpass123', 10);
  await User.create({
    email: 'user@test.com',
    passwordHash: userHash,
    name: 'User',
    role: 'user',
    isActive: true,
    profileCompleted: true,
  });

  // Login as admin
  const adminRes = await supertest(app)
    .post('/api/auth/login')
    .send({ email: 'admin@test.com', password: 'adminpass123' });
  adminToken = adminRes.body.data.accessToken;

  // Login as regular user
  const userRes = await supertest(app)
    .post('/api/auth/login')
    .send({ email: 'user@test.com', password: 'userpass123' });
  userToken = userRes.body.data.accessToken;
});

after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

// ------- requireAdmin guard -------

describe('requireAdmin guard', () => {
  it('returns 403 when regular user calls admin endpoint', async () => {
    const res = await supertest(app)
      .get('/api/admin/exercises')
      .set('Authorization', `Bearer ${userToken}`);
    assert.equal(res.status, 403);
  });

  it('returns 401 when no token provided', async () => {
    const res = await supertest(app).get('/api/admin/exercises');
    assert.equal(res.status, 401);
  });

  it('keeps v2 campaign, rating, and media scaffolds behind requireAdmin', async () => {
    const guardedEndpoints = [
      ['get', '/api/admin/campaigns'],
      ['post', '/api/admin/campaigns'],
      ['post', '/api/admin/campaigns/000000000000000000000000/codes/generate'],
      ['get', '/api/admin/ratings'],
      ['get', '/api/admin/media-assets'],
      ['post', '/api/admin/media-assets/upload'],
    ] as const;

    for (const [method, path] of guardedEndpoints) {
      const noToken = await supertest(app)[method](path);
      assert.equal(noToken.status, 401, `${method.toUpperCase()} ${path} should require auth`);

      const nonAdmin = await supertest(app)[method](path)
        .set('Authorization', `Bearer ${userToken}`);
      assert.equal(nonAdmin.status, 403, `${method.toUpperCase()} ${path} should require admin`);
    }
  });

  it('allows admin users to reach real campaign list responses', async () => {
    const res = await supertest(app)
      .get('/api/admin/campaigns')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data.items));
  });
});

// ------- isActive ban check -------

describe('isActive ban check', () => {
  it('returns 401 when banned user tries to access any endpoint', async () => {
    const bannedHash = await bcrypt.hash('pass123456', 10);
    const banned = await User.create({
      email: 'banned@test.com',
      passwordHash: bannedHash,
      name: 'Banned',
      role: 'user',
      isActive: true,
      profileCompleted: true,
    });

    // Get token while still active
    const loginRes = await supertest(app)
      .post('/api/auth/login')
      .send({ email: 'banned@test.com', password: 'pass123456' });
    const bannedToken = loginRes.body.data.accessToken;

    // Ban the user
    await User.findByIdAndUpdate(banned._id, { isActive: false });

    // Try to access a protected endpoint
    const res = await supertest(app)
      .get('/api/exercises')
      .set('Authorization', `Bearer ${bannedToken}`);
    assert.equal(res.status, 401);
    assert.equal(res.body.error, 'Tài khoản đã bị khóa');
  });
});

// ------- Admin exercise CRUD -------

describe('POST /api/admin/exercises', () => {
  it('creates exercise with valid data', async () => {
    const res = await supertest(app)
      .post('/api/admin/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Test Exercise',
        category: 'yoga',
        difficulty: 'easy',
        durationMinutes: 10,
        caloriesBurned: 50,
        steps: [{ order: 1, instruction: 'Step 1', durationSeconds: 30 }],
      });
    assert.equal(res.status, 201);
    assert.ok(res.body.data._id);
  });

  it('returns 400 when required field missing', async () => {
    const res = await supertest(app)
      .post('/api/admin/exercises')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'No Category' });
    assert.equal(res.status, 400);
  });
});

describe('GET /api/admin/exercises', () => {
  it('returns paginated exercise list', async () => {
    const res = await supertest(app)
      .get('/api/admin/exercises')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
    assert.ok(typeof res.body.data.total === 'number');
  });
});

describe('PATCH /api/admin/exercises/:id', () => {
  it('updates exercise name', async () => {
    const exercise = await Exercise.create({
      name: 'Old Name',
      category: 'cardio',
      difficulty: 'medium',
      durationMinutes: 20,
      caloriesBurned: 100,
      steps: [],
      isActive: true,
    });

    const res = await supertest(app)
      .patch(`/api/admin/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'New Name' });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.name, 'New Name');
  });

  it('returns 404 for non-existent exercise', async () => {
    const res = await supertest(app)
      .patch('/api/admin/exercises/000000000000000000000000')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'X' });
    assert.equal(res.status, 404);
  });
});

describe('DELETE /api/admin/exercises/:id', () => {
  it('deletes an exercise', async () => {
    const exercise = await Exercise.create({
      name: 'To Delete',
      category: 'cardio',
      difficulty: 'easy',
      durationMinutes: 5,
      caloriesBurned: 30,
      steps: [],
      isActive: true,
    });

    const res = await supertest(app)
      .delete(`/api/admin/exercises/${exercise._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
  });
});

// ------- Admin food CRUD -------

describe('POST /api/admin/food-items', () => {
  it('creates food item', async () => {
    const res = await supertest(app)
      .post('/api/admin/food-items')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'Cơm trắng test',
        kcalPer100g: 130,
        protein: 2.7,
        carbs: 28,
        fat: 0.3,
      });
    assert.equal(res.status, 201);
    assert.ok(res.body.data._id);
  });
});

describe('PATCH /api/admin/food-items/:id', () => {
  it('updates food item kcal', async () => {
    const food = await FoodItem.create({
      name: 'Test Food',
      kcalPer100g: 100,
      source: 'manual',
    });

    const res = await supertest(app)
      .patch(`/api/admin/food-items/${food._id}`)
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ kcalPer100g: 120 });
    assert.equal(res.status, 200);
    assert.equal(res.body.data.kcalPer100g, 120);
  });
});

describe('DELETE /api/admin/food-items/:id', () => {
  it('deletes food item', async () => {
    const food = await FoodItem.create({
      name: 'Delete Food',
      kcalPer100g: 50,
      source: 'manual',
    });

    const res = await supertest(app)
      .delete(`/api/admin/food-items/${food._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
  });
});

// ------- Admin user management -------

describe('GET /api/admin/users', () => {
  it('returns paginated user list', async () => {
    const res = await supertest(app)
      .get('/api/admin/users')
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.ok(Array.isArray(res.body.data.items));
  });
});

describe('PATCH /api/admin/users/:id/ban', () => {
  it('bans a user by setting isActive=false', async () => {
    const targetHash = await bcrypt.hash('targetpass123', 10);
    const target = await User.create({
      email: 'target@test.com',
      passwordHash: targetHash,
      name: 'Target',
      role: 'user',
      isActive: true,
      profileCompleted: true,
    });

    const res = await supertest(app)
      .patch(`/api/admin/users/${target._id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.data.isActive, false);
  });

  it('returns 403 when trying to ban another admin', async () => {
    const anotherAdminHash = await bcrypt.hash('adminpass999', 10);
    const anotherAdmin = await User.create({
      email: 'admin2@test.com',
      passwordHash: anotherAdminHash,
      name: 'Admin2',
      role: 'admin',
      isActive: true,
      profileCompleted: true,
    });

    const res = await supertest(app)
      .patch(`/api/admin/users/${anotherAdmin._id}/ban`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 403);
  });
});

describe('DELETE /api/admin/users/:id', () => {
  it('deletes a regular user', async () => {
    const delHash = await bcrypt.hash('delpass123', 10);
    const delUser = await User.create({
      email: 'delete-me@test.com',
      passwordHash: delHash,
      name: 'Delete Me',
      role: 'user',
      isActive: true,
      profileCompleted: false,
    });

    const res = await supertest(app)
      .delete(`/api/admin/users/${delUser._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 200);
  });

  it('refuses to delete an admin account', async () => {
    const protectedHash = await bcrypt.hash('protectedpass123', 10);
    const protectedAdmin = await User.create({
      email: 'protected-admin@test.com',
      passwordHash: protectedHash,
      name: 'Protected',
      role: 'admin',
      isActive: true,
      profileCompleted: true,
    });

    const res = await supertest(app)
      .delete(`/api/admin/users/${protectedAdmin._id}`)
      .set('Authorization', `Bearer ${adminToken}`);
    assert.equal(res.status, 403);
  });
});
