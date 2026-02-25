// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Roles API Tests
// Tests for role and permission management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Roles API', () => {
  let adminToken: string;
  let createdRoleId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // POST /api/roles
  // ═══════════════════════════════════════════
  describe('POST /api/roles', () => {
    it('should create a new role', async () => {
      const res = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'CUSTOM_ROLE',
          displayNameEn: 'Custom Role',
          displayNameAr: 'دور مخصص',
          description: 'A test custom role',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('CUSTOM_ROLE');
      createdRoleId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'ONLY_NAME' });

      expect(res.status).toBe(400);
    });

    it('should reject duplicate role name', async () => {
      const res = await request(app)
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'CUSTOM_ROLE',
          displayNameEn: 'Duplicate',
          displayNameAr: 'مكرر',
        });

      expect([400, 409]).toContain(res.status);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/roles')
        .send({ name: 'NO_AUTH', displayNameEn: 'Test', displayNameAr: 'تست' })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/roles
  // ═══════════════════════════════════════════
  describe('GET /api/roles', () => {
    it('should list all roles', async () => {
      const res = await request(app)
        .get('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/roles').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/roles/:roleId/permissions
  // ═══════════════════════════════════════════
  describe('GET /api/roles/:roleId/permissions', () => {
    it('should return role permissions', async () => {
      const res = await request(app)
        .get(`/api/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('role');
      expect(res.body.data).toHaveProperty('screens');
    });

    it('should return 400 for invalid role', async () => {
      const res = await request(app)
        .get('/api/roles/00000000-0000-0000-0000-000000000000/permissions')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([400, 404]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // PUT /api/roles/:roleId/permissions
  // ═══════════════════════════════════════════
  describe('PUT /api/roles/:roleId/permissions', () => {
    it('should update role permissions', async () => {
      const res = await request(app)
        .put(`/api/roles/${createdRoleId}/permissions`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          screenPermissions: {
            owners: 'read',
            pets: 'full',
          },
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
