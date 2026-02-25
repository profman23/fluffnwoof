// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Users API Tests
// Tests for user management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Users API', () => {
  let adminToken: string;
  let adminUserId: string;
  let createdUserId: string;
  let testRoleId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminUserId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Get test role for creating users
    const role = await prisma.role.findFirst({ where: { name: 'TestRole' } });
    testRoleId = role!.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // POST /api/users
  // ═══════════════════════════════════════════
  describe('POST /api/users', () => {
    it('should create a new user', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          firstName: 'New',
          lastName: 'User',
          roleId: testRoleId,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.email).toBe('newuser@test.com');
      expect(res.body.data.firstName).toBe('New');
      expect(res.body.data.isActive).toBe(true);
      createdUserId = res.body.data.id;
    });

    it('should reject duplicate email', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'newuser@test.com',
          password: 'Password123!',
          firstName: 'Dup',
          lastName: 'User',
          roleId: testRoleId,
        });

      expect([400, 409]).toContain(res.status);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ email: 'only-email@test.com' });

      expect([400, 422, 500]).toContain(res.status);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/users')
        .send({
          email: 'noauth@test.com',
          password: 'Password123!',
          firstName: 'No',
          lastName: 'Auth',
          roleId: testRoleId,
        })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/users
  // ═══════════════════════════════════════════
  describe('GET /api/users', () => {
    it('should return list of users', async () => {
      const res = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('users');
      expect(Array.isArray(res.body.data.users)).toBe(true);
      expect(res.body.data.users.length).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('total');
    });

    it('should support search', async () => {
      const res = await request(app)
        .get('/api/users?search=newuser')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.users.length).toBeGreaterThanOrEqual(1);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/users').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/users/:id
  // ═══════════════════════════════════════════
  describe('GET /api/users/:id', () => {
    it('should return specific user', async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.id).toBe(createdUserId);
      expect(res.body.data.email).toBe('newuser@test.com');
      expect(res.body.data).toHaveProperty('role');
    });

    it('should return 404 for non-existent user', async () => {
      const res = await request(app)
        .get('/api/users/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/users/statistics
  // ═══════════════════════════════════════════
  describe('GET /api/users/statistics', () => {
    it('should return user statistics', async () => {
      const res = await request(app)
        .get('/api/users/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('total');
      expect(res.body.data).toHaveProperty('active');
      expect(res.body.data.total).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/users/permissions
  // ═══════════════════════════════════════════
  describe('GET /api/users/permissions', () => {
    it('should return all permissions', async () => {
      const res = await request(app)
        .get('/api/users/permissions/all')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should return permissions by category', async () => {
      const res = await request(app)
        .get('/api/users/permissions/by-category')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(typeof res.body.data).toBe('object');
    });
  });

  // ═══════════════════════════════════════════
  // PUT /api/users/:id
  // ═══════════════════════════════════════════
  describe('PUT /api/users/:id', () => {
    it('should update user', async () => {
      const res = await request(app)
        .put(`/api/users/${createdUserId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated', lastName: 'Name' })
        .expect(200);

      expect(res.body.data.firstName).toBe('Updated');
      expect(res.body.data.lastName).toBe('Name');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .put(`/api/users/${createdUserId}`)
        .send({ firstName: 'NoAuth' })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // PATCH /api/users/:id/deactivate & reactivate
  // ═══════════════════════════════════════════
  describe('PATCH /api/users/:id/deactivate & reactivate', () => {
    it('should deactivate user', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/deactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();
    });

    it('should reactivate user', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/reactivate`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.message).toBeDefined();
    });
  });

  // ═══════════════════════════════════════════
  // PATCH /api/users/:id/password
  // ═══════════════════════════════════════════
  describe('PATCH /api/users/:id/password', () => {
    it('should change password', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: 'NewPassword123!' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject short password', async () => {
      const res = await request(app)
        .patch(`/api/users/${createdUserId}/password`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ newPassword: '123' });

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════
  // User Permissions (grant/revoke)
  // ═══════════════════════════════════════════
  describe('User Permissions', () => {
    it('should get user permissions', async () => {
      const res = await request(app)
        .get(`/api/users/${createdUserId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('permissions');
    });
  });
});
