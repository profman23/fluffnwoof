// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Appointments API Tests
// Tests for appointments and FlowBoard endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Appointments API', () => {
  let adminToken: string;
  let testVetId: string;
  let testPetId: string;
  let testOwnerId: string;
  let createdAppointmentId: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create admin user (also acts as vet)
    const user = await createTestUser({ isBookable: true });
    testVetId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create owner
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Appt', lastName: 'Owner', phone: '+966500000030' });
    testOwnerId = ownerRes.body.data.id;

    // Create pet
    const petRes = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'TestPet', species: 'DOG', gender: 'MALE', ownerId: testOwnerId });
    testPetId = petRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/appointments', () => {
    it('should create a new appointment', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentDate: today,
          appointmentTime: '10:00',
          duration: 30,
          visitType: 'GENERAL_CHECKUP',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.status).toBe('SCHEDULED');
      expect(res.body.data.isConfirmed).toBe(false);
      createdAppointmentId = res.body.data.id;
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/appointments')
        .send({ petId: testPetId, vetId: testVetId, appointmentDate: '2026-03-01', appointmentTime: '10:00' })
        .expect(401);
    });
  });

  describe('GET /api/appointments/flow-board', () => {
    it('should return flow board data with correct structure', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/appointments/flow-board?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scheduled');
      expect(res.body.data).toHaveProperty('checkIn');
      expect(res.body.data).toHaveProperty('inProgress');
      expect(res.body.data).toHaveProperty('hospitalized');
      expect(res.body.data).toHaveProperty('completed');
      expect(Array.isArray(res.body.data.scheduled)).toBe(true);
    });

    it('should include the created appointment in scheduled column', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/appointments/flow-board?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const scheduled = res.body.data.scheduled;
      const found = scheduled.find((a: any) => a.id === createdAppointmentId);
      expect(found).toBeDefined();
      expect(found.status).toBe('SCHEDULED');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get('/api/appointments/flow-board')
        .expect(401);
    });
  });

  describe('PATCH /api/appointments/:id/status', () => {
    it('should update status to CHECK_IN and auto-confirm', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CHECK_IN' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('CHECK_IN');
      // Auto-confirm: isConfirmed should be true when checking in
      expect(res.body.data.isConfirmed).toBe(true);
    });

    it('should update status to IN_PROGRESS', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'IN_PROGRESS' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('IN_PROGRESS');
    });

    it('should update status to COMPLETED', async () => {
      const res = await request(app)
        .patch(`/api/appointments/${createdAppointmentId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'COMPLETED' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('COMPLETED');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .patch(`/api/appointments/${createdAppointmentId}/status`)
        .send({ status: 'CHECK_IN' })
        .expect(401);
    });
  });

  describe('PATCH /api/appointments/:id/confirmation', () => {
    it('should toggle confirmation to true', async () => {
      // Create a fresh appointment for confirmation test
      const today = new Date().toISOString().split('T')[0];
      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentDate: today,
          appointmentTime: '14:00',
        });

      const apptId = apptRes.body.data.id;

      const res = await request(app)
        .patch(`/api/appointments/${apptId}/confirmation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isConfirmed: true })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isConfirmed).toBe(true);
    });

    it('should toggle confirmation to false', async () => {
      // Create another appointment
      const today = new Date().toISOString().split('T')[0];
      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentDate: today,
          appointmentTime: '15:00',
        });

      const apptId = apptRes.body.data.id;

      // First confirm
      await request(app)
        .patch(`/api/appointments/${apptId}/confirmation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isConfirmed: true });

      // Then unconfirm
      const res = await request(app)
        .patch(`/api/appointments/${apptId}/confirmation`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ isConfirmed: false })
        .expect(200);

      expect(res.body.data.isConfirmed).toBe(false);
    });
  });

  describe('Status transitions (full lifecycle)', () => {
    it('should handle SCHEDULED → CANCELLED', async () => {
      const today = new Date().toISOString().split('T')[0];
      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentDate: today,
          appointmentTime: '16:00',
        });

      const apptId = apptRes.body.data.id;

      const res = await request(app)
        .patch(`/api/appointments/${apptId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'CANCELLED' })
        .expect(200);

      expect(res.body.data.status).toBe('CANCELLED');
    });
  });
});
