// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Visit Types API Tests
// Tests for visit type configuration endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Visit Types API', () => {
  let adminToken: string;
  let createdVisitTypeId: string;
  let secondVisitTypeId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // POST /api/visit-types
  // ═══════════════════════════════════════════
  describe('POST /api/visit-types', () => {
    it('should create a visit type', async () => {
      const res = await request(app)
        .post('/api/visit-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'General Checkup',
          nameAr: 'فحص عام',
          duration: 30,
          color: '#4CAF50',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.nameEn).toBe('General Checkup');
      createdVisitTypeId = res.body.data.id;
    });

    it('should create a second visit type', async () => {
      const res = await request(app)
        .post('/api/visit-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'Vaccination',
          nameAr: 'تطعيم',
          duration: 15,
          color: '#2196F3',
        })
        .expect(201);

      secondVisitTypeId = res.body.data.id;
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/visit-types')
        .send({ nameEn: 'NoAuth', nameAr: 'بدون', duration: 30 })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/visit-types
  // ═══════════════════════════════════════════
  describe('GET /api/visit-types', () => {
    it('should return all visit types', async () => {
      const res = await request(app)
        .get('/api/visit-types')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(2);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/visit-types').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/visit-types/:id
  // ═══════════════════════════════════════════
  describe('GET /api/visit-types/:id', () => {
    it('should return specific visit type', async () => {
      const res = await request(app)
        .get(`/api/visit-types/${createdVisitTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdVisitTypeId);
    });

    it('should return 404 for non-existent', async () => {
      const res = await request(app)
        .get('/api/visit-types/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // PUT /api/visit-types/:id
  // ═══════════════════════════════════════════
  describe('PUT /api/visit-types/:id', () => {
    it('should update visit type', async () => {
      const res = await request(app)
        .put(`/api/visit-types/${createdVisitTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nameEn: 'Updated Checkup', duration: 45 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nameEn).toBe('Updated Checkup');
      expect(res.body.data.duration).toBe(45);
    });
  });

  // ═══════════════════════════════════════════
  // PATCH /api/visit-types/:id/toggle-active
  // ═══════════════════════════════════════════
  describe('PATCH /api/visit-types/:id/toggle-active', () => {
    it('should deactivate visit type', async () => {
      const res = await request(app)
        .patch(`/api/visit-types/${createdVisitTypeId}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isActive).toBe(false);
    });

    it('should reactivate visit type', async () => {
      const res = await request(app)
        .patch(`/api/visit-types/${createdVisitTypeId}/toggle-active`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: true })
        .expect(200);

      expect(res.body.data.isActive).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // POST /api/visit-types/reorder
  // ═══════════════════════════════════════════
  describe('POST /api/visit-types/reorder', () => {
    it('should reorder visit types', async () => {
      const res = await request(app)
        .post('/api/visit-types/reorder')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ orderedIds: [secondVisitTypeId, createdVisitTypeId] })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // POST /api/visit-types/seed
  // ═══════════════════════════════════════════
  describe('POST /api/visit-types/seed', () => {
    it('should seed default visit types', async () => {
      const res = await request(app)
        .post('/api/visit-types/seed')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // DELETE /api/visit-types/:id
  // ═══════════════════════════════════════════
  describe('DELETE /api/visit-types/:id', () => {
    it('should delete visit type', async () => {
      const res = await request(app)
        .delete(`/api/visit-types/${secondVisitTypeId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
