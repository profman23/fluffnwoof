// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Medical Records API Tests
// Tests for medical record management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Medical Records API', () => {
  let adminToken: string;
  let testVetId: string;
  let testPetId: string;
  let testOwnerId: string;
  let testAppointmentId: string;
  let createdRecordId: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create admin/vet user
    const user = await createTestUser({ isBookable: true });
    testVetId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create owner
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Medical', lastName: 'Owner', phone: '+966500000050' });
    testOwnerId = ownerRes.body.data.id;

    // Create pet
    const petRes = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'MedPet', species: 'DOG', gender: 'MALE', ownerId: testOwnerId });
    testPetId = petRes.body.data.id;

    // Create appointment
    const today = new Date().toISOString().split('T')[0];
    const apptRes = await request(app)
      .post('/api/appointments')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        petId: testPetId,
        vetId: testVetId,
        appointmentDate: today,
        appointmentTime: '09:00',
        duration: 30,
        visitType: 'GENERAL_CHECKUP',
      });
    testAppointmentId = apptRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // POST /api/medical-records
  // ═══════════════════════════════════════════
  describe('POST /api/medical-records', () => {
    it('should create a new medical record', async () => {
      const res = await request(app)
        .post('/api/medical-records')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentId: testAppointmentId,
          chiefComplaint: 'Limping on left leg',
          diagnosis: 'Mild sprain',
          treatment: 'Rest and anti-inflammatory',
          weight: 15.5,
          temperature: 38.5,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.petId).toBe(testPetId);
      expect(res.body.data.vetId).toBe(testVetId);
      createdRecordId = res.body.data.id;
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/medical-records')
        .send({ petId: testPetId, vetId: testVetId })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // POST /api/medical-records/appointment/:appointmentId
  // ═══════════════════════════════════════════
  describe('POST /api/medical-records/appointment/:appointmentId', () => {
    it('should return existing record for appointment', async () => {
      const res = await request(app)
        .post(`/api/medical-records/appointment/${testAppointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('should create record for new appointment', async () => {
      // Create a fresh appointment
      const today = new Date().toISOString().split('T')[0];
      const apptRes = await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentDate: today,
          appointmentTime: '11:00',
          duration: 30,
          visitType: 'GENERAL_CHECKUP',
        });

      const newApptId = apptRes.body.data.id;

      const res = await request(app)
        .post(`/api/medical-records/appointment/${newApptId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 201]).toContain(res.status);
      expect(res.body.data).toHaveProperty('id');
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/medical-records
  // ═══════════════════════════════════════════
  describe('GET /api/medical-records', () => {
    it('should return list of records', async () => {
      const res = await request(app)
        .get('/api/medical-records')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/medical-records').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/medical-records/:id
  // ═══════════════════════════════════════════
  describe('GET /api/medical-records/:id', () => {
    it('should return specific record', async () => {
      const res = await request(app)
        .get(`/api/medical-records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdRecordId);
    });

    it('should return 404 for non-existent record', async () => {
      const res = await request(app)
        .get('/api/medical-records/00000000-0000-0000-0000-000000000000')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/medical-records/pet/:petId
  // ═══════════════════════════════════════════
  describe('GET /api/medical-records/pet/:petId', () => {
    it('should return records for specific pet', async () => {
      const res = await request(app)
        .get(`/api/medical-records/pet/${testPetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/medical-records/appointment/:appointmentId
  // ═══════════════════════════════════════════
  describe('GET /api/medical-records/appointment/:appointmentId', () => {
    it('should return record for specific appointment', async () => {
      const res = await request(app)
        .get(`/api/medical-records/appointment/${testAppointmentId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // PATCH /api/medical-records/:id
  // ═══════════════════════════════════════════
  describe('PATCH /api/medical-records/:id', () => {
    it('should update medical record', async () => {
      const res = await request(app)
        .patch(`/api/medical-records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          diagnosis: 'Updated diagnosis - Severe sprain',
          treatment: 'Updated treatment plan',
          weight: 16.0,
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.diagnosis).toBe('Updated diagnosis - Severe sprain');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .patch(`/api/medical-records/${createdRecordId}`)
        .send({ diagnosis: 'No Auth' })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // PATCH /api/medical-records/:id/close & reopen
  // ═══════════════════════════════════════════
  describe('PATCH /api/medical-records/:id/close & reopen', () => {
    it('should close medical record', async () => {
      const res = await request(app)
        .patch(`/api/medical-records/${createdRecordId}/close`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isClosed).toBe(true);
    });

    it('should reject closing already-closed record', async () => {
      const res = await request(app)
        .patch(`/api/medical-records/${createdRecordId}/close`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should reopen closed record', async () => {
      const res = await request(app)
        .patch(`/api/medical-records/${createdRecordId}/reopen`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isClosed).toBe(false);
    });

    it('should reject reopening non-closed record', async () => {
      const res = await request(app)
        .patch(`/api/medical-records/${createdRecordId}/reopen`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });
  });

  // ═══════════════════════════════════════════
  // GET /api/medical-records/:id/audit
  // ═══════════════════════════════════════════
  describe('GET /api/medical-records/:id/audit', () => {
    it('should return audit history', async () => {
      const res = await request(app)
        .get(`/api/medical-records/${createdRecordId}/audit`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // DELETE /api/medical-records/:id
  // ═══════════════════════════════════════════
  describe('DELETE /api/medical-records/:id', () => {
    it('should delete medical record', async () => {
      const res = await request(app)
        .delete(`/api/medical-records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should return 404 after deletion', async () => {
      const res = await request(app)
        .get(`/api/medical-records/${createdRecordId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect([404, 500]).toContain(res.status);
    });
  });
});
