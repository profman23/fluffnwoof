// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Boarding API Tests
// Tests for boarding configuration endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Boarding API', () => {
  let adminToken: string;
  let createdConfigId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/boarding/config', () => {
    it('should create a new boarding config', async () => {
      const res = await request(app)
        .post('/api/boarding/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'Standard Dog Room',
          nameAr: 'غرفة كلاب عادية',
          type: 'BOARDING',
          species: 'DOG',
          totalSlots: 10,
          pricePerDay: 150,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.nameEn).toBe('Standard Dog Room');
      expect(res.body.data.nameAr).toBe('غرفة كلاب عادية');
      expect(res.body.data.type).toBe('BOARDING');
      expect(res.body.data.species).toBe('DOG');
      expect(res.body.data.totalSlots).toBe(10);
      expect(res.body.data.isActive).toBe(true);
      createdConfigId = res.body.data.id;
    });

    it('should create a second config with same type+species (no unique constraint)', async () => {
      const res = await request(app)
        .post('/api/boarding/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'VIP Dog Room',
          nameAr: 'غرفة VIP للكلاب',
          type: 'BOARDING',
          species: 'DOG',
          totalSlots: 5,
          pricePerDay: 300,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nameEn).toBe('VIP Dog Room');
    });

    it('should create ICU config', async () => {
      const res = await request(app)
        .post('/api/boarding/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'Cat ICU',
          nameAr: 'عناية مركزة للقطط',
          type: 'ICU',
          species: 'CAT',
          totalSlots: 3,
        })
        .expect(201);

      expect(res.body.data.type).toBe('ICU');
      expect(res.body.data.species).toBe('CAT');
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/boarding/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nameEn: 'Only Name' });

      expect(res.status).toBe(400);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/boarding/config')
        .send({ nameEn: 'Test', nameAr: 'تست', type: 'BOARDING', species: 'DOG', totalSlots: 5 })
        .expect(401);
    });
  });

  describe('GET /api/boarding/config', () => {
    it('should return all configs', async () => {
      const res = await request(app)
        .get('/api/boarding/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter by type', async () => {
      const res = await request(app)
        .get('/api/boarding/config?type=ICU')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((c: any) => c.type === 'ICU')).toBe(true);
    });

    it('should filter by species', async () => {
      const res = await request(app)
        .get('/api/boarding/config?species=DOG')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.every((c: any) => c.species === 'DOG')).toBe(true);
    });

    it('should include availableSlots and occupiedSlots', async () => {
      const res = await request(app)
        .get('/api/boarding/config')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const config = res.body.data[0];
      expect(config).toHaveProperty('availableSlots');
      expect(config).toHaveProperty('occupiedSlots');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get('/api/boarding/config')
        .expect(401);
    });
  });

  describe('PUT /api/boarding/config/:id', () => {
    it('should update a boarding config', async () => {
      const res = await request(app)
        .put(`/api/boarding/config/${createdConfigId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'Updated Room Name',
          totalSlots: 15,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.nameEn).toBe('Updated Room Name');
      expect(res.body.data.totalSlots).toBe(15);
    });

    it('should deactivate a config', async () => {
      const res = await request(app)
        .put(`/api/boarding/config/${createdConfigId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isActive: false })
        .expect(200);

      expect(res.body.data.isActive).toBe(false);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .put(`/api/boarding/config/${createdConfigId}`)
        .send({ nameEn: 'No Auth' })
        .expect(401);
    });
  });
});
