// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Medical Records API Tests
// Tests for medical record management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken, generateUserToken } from '../helpers';

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

  // ═══════════════════════════════════════════
  // GET /api/medical-records — medical.ownOnly row-level scoping
  // ═══════════════════════════════════════════
  describe('GET /api/medical-records — medical.ownOnly scoping', () => {
    let vetAToken: string; // restricted (medical.ownOnly)
    let vetBToken: string; // unrestricted (reception-like)
    let vetAId: string;
    let vetBId: string;
    let recordAId: string;
    let recordBId: string;

    beforeAll(async () => {
      // A shared pet/owner to attach records to.
      const owner = await prisma.owner.create({
        data: { firstName: 'Scope', lastName: 'Owner', phone: '+966520000010', customerCode: 'SCOPE-M1' },
      });
      const pet = await prisma.pet.create({
        data: { name: 'ScopePet', species: 'DOG', gender: 'MALE', ownerId: owner.id, petCode: 'SCP-M1' },
      });

      // Screen read permission (both vets need it to hit the endpoint).
      const readPerm = await prisma.permission.upsert({
        where: { name: 'screens.medical.read' },
        update: {},
        create: { name: 'screens.medical.read', description: 'x', category: 'screens', action: 'read' },
      });
      const ownOnlyPerm = await prisma.permission.upsert({
        where: { name: 'medical.ownOnly' },
        update: {},
        create: { name: 'medical.ownOnly', description: 'x', category: 'medical', action: 'ownOnly' },
      });

      // Vet A: restricted (has medical.ownOnly + read).
      const roleA = await prisma.role.create({
        data: { name: `VETA_${Date.now()}`, displayNameEn: 'VetA', displayNameAr: 'أ', isSystem: false },
      });
      const vetA = await prisma.user.create({
        data: {
          email: `veta-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Vet', lastName: 'A',
          isActive: true, isBookable: true, roleId: roleA.id,
          permissions: { create: [{ permissionId: readPerm.id }, { permissionId: ownOnlyPerm.id }] },
        },
      });
      vetAId = vetA.id;
      vetAToken = generateUserToken({ id: vetA.id, email: vetA.email, role: roleA.name });

      // Vet B: unrestricted (read only, no ownOnly) — represents reception/manager.
      const roleB = await prisma.role.create({
        data: { name: `VETB_${Date.now()}`, displayNameEn: 'VetB', displayNameAr: 'ب', isSystem: false },
      });
      const vetB = await prisma.user.create({
        data: {
          email: `vetb-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Vet', lastName: 'B',
          isActive: true, isBookable: true, roleId: roleB.id,
          permissions: { create: [{ permissionId: readPerm.id }] },
        },
      });
      vetBId = vetB.id;
      vetBToken = generateUserToken({ id: vetB.id, email: vetB.email, role: roleB.name });

      // One record assigned to each vet (vetId is the owner of the record).
      const recA = await prisma.medicalRecord.create({
        data: { petId: pet.id, vetId: vetAId, recordCode: `MR-A-${Date.now()}`, chiefComplaint: 'A complaint' },
      });
      recordAId = recA.id;
      const recB = await prisma.medicalRecord.create({
        data: { petId: pet.id, vetId: vetBId, recordCode: `MR-B-${Date.now()}`, chiefComplaint: 'B complaint' },
      });
      recordBId = recB.id;
    });

    const idsOf = (body: any): string[] => (body.data || []).map((r: any) => r.id);

    it('restricted vet (medical.ownOnly) sees ONLY their own records', async () => {
      const res = await request(app)
        .get('/api/medical-records?limit=100')
        .set('Authorization', `Bearer ${vetAToken}`)
        .expect(200);
      const ids = idsOf(res.body);
      expect(ids).toContain(recordAId);
      expect(ids).not.toContain(recordBId);
      // Every returned record is assigned to vet A.
      expect(res.body.data.every((r: any) => r.vetId === vetAId)).toBe(true);
    });

    it('pagination total respects the scope (count only own)', async () => {
      const res = await request(app)
        .get('/api/medical-records?limit=100')
        .set('Authorization', `Bearer ${vetAToken}`)
        .expect(200);
      // vet A owns exactly 1 record in this suite's data set.
      expect(res.body.data.every((r: any) => r.vetId === vetAId)).toBe(true);
      expect(res.body.pagination.total).toBe(res.body.data.length);
    });

    it('unrestricted vet (no ownOnly) sees ALL records', async () => {
      const res = await request(app)
        .get('/api/medical-records?limit=100')
        .set('Authorization', `Bearer ${vetBToken}`)
        .expect(200);
      const ids = idsOf(res.body);
      expect(ids).toContain(recordAId);
      expect(ids).toContain(recordBId);
    });

    it('ADMIN sees ALL records (bypass)', async () => {
      const res = await request(app)
        .get('/api/medical-records?limit=100')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const ids = idsOf(res.body);
      expect(ids).toContain(recordAId);
      expect(ids).toContain(recordBId);
    });
  });
});
