// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Reports API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Reports API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/reports/next-appointments', () => {
    it('should return next appointments report', async () => {
      const res = await request(app)
        .get('/api/reports/next-appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Reports controller returns raw response (no success/data wrapper)
      expect(res.body).toBeDefined();
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/reports/next-appointments').expect(401);
    });
  });
});
