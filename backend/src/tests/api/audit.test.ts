// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Audit API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Audit API', () => {
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    userId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create some activity to generate audit logs
    await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Audit', lastName: 'Test', phone: '+966500000070' });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/audit', () => {
    it('should return audit logs', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Audit controller returns { message, data } format
      expect(res.body).toHaveProperty('data');
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/audit').expect(401);
    });
  });

  describe('GET /api/audit/recent', () => {
    it('should return recent activity', async () => {
      const res = await request(app)
        .get('/api/audit/recent')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /api/audit/statistics', () => {
    it('should return audit statistics', async () => {
      const res = await request(app)
        .get('/api/audit/statistics')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('GET /api/audit/user/:userId', () => {
    it('should return user activity', async () => {
      const res = await request(app)
        .get(`/api/audit/user/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });
});
