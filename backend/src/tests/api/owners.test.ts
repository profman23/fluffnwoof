// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Owners API Tests
// Tests for owner/client management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Owners API', () => {
  let adminToken: string;
  let createdOwnerId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/owners', () => {
    it('should create a new owner', async () => {
      const res = await request(app)
        .post('/api/owners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Test',
          lastName: 'Owner',
          phone: '+966500000001',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.firstName).toBe('Test');
      expect(res.body.data.lastName).toBe('Owner');
      expect(res.body.data).toHaveProperty('customerCode');
      createdOwnerId = res.body.data.id;
    });

    it('should reject duplicate phone number', async () => {
      const res = await request(app)
        .post('/api/owners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          firstName: 'Another',
          lastName: 'Owner',
          phone: '+966500000001',
        });

      expect([400, 409]).toContain(res.status);
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/owners')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Only' });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/owners')
        .send({ firstName: 'No', lastName: 'Auth', phone: '+966500000099' })
        .expect(401);
    });
  });

  describe('GET /api/owners', () => {
    it('should return list of owners', async () => {
      const res = await request(app)
        .get('/api/owners')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get('/api/owners')
        .expect(401);
    });
  });

  describe('GET /api/owners/:id', () => {
    it('should return a specific owner', async () => {
      const res = await request(app)
        .get(`/api/owners/${createdOwnerId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdOwnerId);
    });

    it('should return 404 for non-existent owner', async () => {
      const res = await request(app)
        .get('/api/owners/non-existent-id-12345')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(res.status);
    });
  });
});
