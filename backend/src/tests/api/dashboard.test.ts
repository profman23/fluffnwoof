// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Dashboard API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Dashboard API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/dashboard').expect(401);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/appointments', () => {
    it('should return upcoming appointments', async () => {
      const res = await request(app)
        .get('/api/dashboard/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/vaccinations', () => {
    it('should return upcoming vaccinations', async () => {
      const res = await request(app)
        .get('/api/dashboard/vaccinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/vet-performance', () => {
    it('should return vet performance', async () => {
      const res = await request(app)
        .get('/api/dashboard/vet-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/analytics', () => {
    it('should return analytics with date range', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics?from=2026-01-01&to=2026-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
