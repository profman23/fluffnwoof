// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Profile API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Profile API', () => {
  let adminToken: string;
  let userId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    userId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/profile', () => {
    it('should return my profile', async () => {
      const res = await request(app)
        .get('/api/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Profile controller returns { message, data } format
      expect(res.body).toHaveProperty('data');
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.id).toBe(userId);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/profile').expect(401);
    });
  });

  describe('PUT /api/profile', () => {
    it('should update my profile', async () => {
      const res = await request(app)
        .put('/api/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Updated', lastName: 'Profile' })
        .expect(200);

      expect(res.body).toHaveProperty('data');
      expect(res.body.data.firstName).toBe('Updated');
    });
  });

  describe('GET /api/profile/preferences', () => {
    it('should return preferences', async () => {
      const res = await request(app)
        .get('/api/profile/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('PUT /api/profile/preferences', () => {
    it('should update preferences', async () => {
      const res = await request(app)
        .put('/api/profile/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ language: 'ar', theme: 'dark' })
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });

  describe('DELETE /api/profile/preferences', () => {
    it('should reset preferences', async () => {
      const res = await request(app)
        .delete('/api/profile/preferences')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('data');
    });
  });
});
