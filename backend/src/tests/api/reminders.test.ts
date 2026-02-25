// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Reminders API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Reminders API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/reminders/settings', () => {
    it('should return reminder settings', async () => {
      const res = await request(app)
        .get('/api/reminders/settings')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Reminders controller returns raw response (no success/data wrapper)
      expect(res.body).toBeDefined();
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/reminders/settings').expect(401);
    });
  });

  describe('GET /api/reminders/logs', () => {
    it('should return reminder logs', async () => {
      const res = await request(app)
        .get('/api/reminders/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('GET /api/reminders/stats', () => {
    it('should return reminder statistics', async () => {
      const res = await request(app)
        .get('/api/reminders/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('GET /api/reminders/templates', () => {
    it('should return message templates', async () => {
      const res = await request(app)
        .get('/api/reminders/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });
});
