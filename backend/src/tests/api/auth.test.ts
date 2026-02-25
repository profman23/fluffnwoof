// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Auth API Tests
// Tests for authentication endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Auth API', () => {
  let testUser: any;

  beforeAll(async () => {
    await cleanDatabase();
    testUser = await createTestUser({
      email: 'auth-test@fluffnwoof.com',
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/auth/login', () => {
    it('should login successfully with valid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'auth-test@fluffnwoof.com', password: 'Test123!@#' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('token');
      expect(res.body.data).toHaveProperty('user');
      expect(res.body.data.user.email).toBe('auth-test@fluffnwoof.com');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'auth-test@fluffnwoof.com', password: 'WrongPassword' });

      expect([400, 401]).toContain(res.status);
    });

    it('should reject login with non-existent email', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'nonexistent@fluffnwoof.com', password: 'Test123!@#' });

      expect([400, 401, 404]).toContain(res.status);
    });

    it('should reject login with missing fields', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({});

      expect([400, 422]).toContain(res.status);
    });
  });

  describe('GET /api/auth/profile', () => {
    it('should return profile with valid token', async () => {
      const token = generateAdminToken({ id: testUser.id, email: testUser.email });

      const res = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('email');
    });

    it('should reject without token (401)', async () => {
      await request(app)
        .get('/api/auth/profile')
        .expect(401);
    });

    it('should reject with invalid token (401)', async () => {
      await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);
    });
  });
});
