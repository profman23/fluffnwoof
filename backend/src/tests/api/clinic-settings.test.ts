// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Clinic Settings API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Clinic Settings API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/clinic-settings/forms', () => {
    it('should return form settings', async () => {
      const res = await request(app)
        .get('/api/clinic-settings/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/clinic-settings/forms').expect(401);
    });
  });

  describe('PUT /api/clinic-settings/forms', () => {
    it('should update form settings', async () => {
      const res = await request(app)
        .put('/api/clinic-settings/forms')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          clinicNameEn: 'Fluff N Woof Clinic',
          clinicNameAr: 'عيادة فلاف ان ووف',
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('POST /api/clinic-settings/forms/logo', () => {
    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/clinic-settings/forms/logo')
        .expect(401);
    });
  });

  describe('DELETE /api/clinic-settings/forms/logo', () => {
    it('should handle logo removal (even if none exists)', async () => {
      const res = await request(app)
        .delete('/api/clinic-settings/forms/logo')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 404]).toContain(res.status);
    });
  });
});
