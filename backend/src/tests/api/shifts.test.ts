// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Shifts API Tests
// Tests for shift scheduling, days off, breaks, periods
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Shifts API', () => {
  let adminToken: string;
  let testVetId: string;
  let createdDayOffId: string;
  let createdBreakId: string;
  let createdPeriodId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser({ isBookable: true });
    testVetId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // Schedules
  // ═══════════════════════════════════════════
  describe('Schedules', () => {
    it('GET /api/shifts/vets should list vets with schedules', async () => {
      const res = await request(app)
        .get('/api/shifts/vets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/shifts/schedules/:vetId should get vet schedules', async () => {
      const res = await request(app)
        .get(`/api/shifts/schedules/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('PUT /api/shifts/schedules/:vetId/bulk should update schedules', async () => {
      const res = await request(app)
        .put(`/api/shifts/schedules/${testVetId}/bulk`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          schedules: [
            { dayOfWeek: 'SUNDAY', startTime: '09:00', endTime: '17:00', isWorking: true },
            { dayOfWeek: 'MONDAY', startTime: '09:00', endTime: '17:00', isWorking: true },
          ],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/shifts/vets').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Days Off
  // ═══════════════════════════════════════════
  describe('Days Off', () => {
    it('POST /api/shifts/days-off/:vetId should add a day off', async () => {
      const res = await request(app)
        .post(`/api/shifts/days-off/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ date: '2026-06-15', reason: 'Vacation' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdDayOffId = res.body.data.id;
    });

    it('GET /api/shifts/days-off/:vetId should list days off', async () => {
      const res = await request(app)
        .get(`/api/shifts/days-off/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('DELETE /api/shifts/days-off/:id should remove day off', async () => {
      const res = await request(app)
        .delete(`/api/shifts/days-off/${createdDayOffId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // Breaks
  // ═══════════════════════════════════════════
  describe('Breaks', () => {
    it('POST /api/shifts/breaks/:vetId should add a break', async () => {
      const res = await request(app)
        .post(`/api/shifts/breaks/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          dayOfWeek: 'SUNDAY',
          startTime: '12:00',
          endTime: '13:00',
          description: 'Lunch break',
          isRecurring: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdBreakId = res.body.data.id;
    });

    it('GET /api/shifts/breaks/:vetId should list breaks', async () => {
      const res = await request(app)
        .get(`/api/shifts/breaks/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('PUT /api/shifts/breaks/:id should update break', async () => {
      const res = await request(app)
        .put(`/api/shifts/breaks/${createdBreakId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Updated lunch break' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/shifts/breaks/:id should remove break', async () => {
      const res = await request(app)
        .delete(`/api/shifts/breaks/${createdBreakId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // Schedule Periods
  // ═══════════════════════════════════════════
  describe('Schedule Periods', () => {
    it('GET /api/shifts/periods/vets should list vets with periods', async () => {
      const res = await request(app)
        .get('/api/shifts/periods/vets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/shifts/periods/:vetId should create period', async () => {
      const res = await request(app)
        .post(`/api/shifts/periods/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          startDate: '2026-03-01',
          endDate: '2026-06-30',
          workingDays: ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY'],
          workStartTime: '09:00',
          workEndTime: '17:00',
          breakStartTime: '12:00',
          breakEndTime: '13:00',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdPeriodId = res.body.data.id;
    });

    it('GET /api/shifts/periods/:vetId should get periods', async () => {
      const res = await request(app)
        .get(`/api/shifts/periods/${testVetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PUT /api/shifts/periods/:id should update period', async () => {
      const res = await request(app)
        .put(`/api/shifts/periods/${createdPeriodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ workStartTime: '08:00' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('DELETE /api/shifts/periods/:id should delete period', async () => {
      const res = await request(app)
        .delete(`/api/shifts/periods/${createdPeriodId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // Availability
  // ═══════════════════════════════════════════
  describe('Availability', () => {
    it('GET /api/shifts/availability/:vetId should get slots', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/shifts/availability/${testVetId}?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('slots');
    });

    it('GET /api/shifts/availability-v2/:vetId should get period-based slots', async () => {
      const today = new Date().toISOString().split('T')[0];
      const res = await request(app)
        .get(`/api/shifts/availability-v2/${testVetId}?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('slots');
    });
  });
});
