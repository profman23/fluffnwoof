// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Appointments API Tests
// Tests for appointments and FlowBoard endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken, generateUserToken } from '../helpers';

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

    it('should return appointments for date range using startDate and endDate', async () => {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];

      // Create appointment for tomorrow
      await request(app)
        .post('/api/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId: testPetId,
          vetId: testVetId,
          appointmentDate: tomorrow,
          appointmentTime: '09:00',
          duration: 30,
        });

      // Query with date range covering both days
      const res = await request(app)
        .get(`/api/appointments/flow-board?startDate=${today}&endDate=${tomorrow}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      const allAppointments = [
        ...res.body.data.scheduled,
        ...res.body.data.checkIn,
        ...res.body.data.inProgress,
        ...res.body.data.completed,
      ];
      // Should include appointments from both days
      expect(allAppointments.length).toBeGreaterThanOrEqual(2);
    });

    it('should default to today when no dates provided', async () => {
      const res = await request(app)
        .get('/api/appointments/flow-board')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scheduled');
    });

    it('should support backward compatible single date parameter', async () => {
      const today = new Date().toISOString().split('T')[0];

      const res = await request(app)
        .get(`/api/appointments/flow-board?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('scheduled');
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

  // ═══════════════════════════════════════════
  // GET /api/appointments/flow-board — flowBoard.ownOnly row-level scoping
  // ═══════════════════════════════════════════
  describe('GET /api/appointments/flow-board — flowBoard.ownOnly scoping', () => {
    let vetAToken: string; // restricted (flowBoard.ownOnly)
    let vetBToken: string; // unrestricted (reception-like)
    let vetAId: string;
    let vetBId: string;
    let apptAId: string;
    let apptBId: string;
    const today = new Date().toISOString().split('T')[0];

    beforeAll(async () => {
      const readPerm = await prisma.permission.upsert({
        where: { name: 'screens.flowBoard.read' },
        update: {},
        create: { name: 'screens.flowBoard.read', description: 'x', category: 'screens', action: 'read' },
      });
      const ownOnlyPerm = await prisma.permission.upsert({
        where: { name: 'flowBoard.ownOnly' },
        update: {},
        create: { name: 'flowBoard.ownOnly', description: 'x', category: 'flowBoard', action: 'ownOnly' },
      });

      // Vet A: restricted (flowBoard.ownOnly + read).
      const roleA = await prisma.role.create({
        data: { name: `FBA_${Date.now()}`, displayNameEn: 'FbA', displayNameAr: 'أ', isSystem: false },
      });
      const vetA = await prisma.user.create({
        data: {
          email: `fba-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Fb', lastName: 'A',
          isActive: true, isBookable: true, roleId: roleA.id,
          permissions: { create: [{ permissionId: readPerm.id }, { permissionId: ownOnlyPerm.id }] },
        },
      });
      vetAId = vetA.id;
      vetAToken = generateUserToken({ id: vetA.id, email: vetA.email, role: roleA.name });

      // Vet B: unrestricted (read only) — reception/manager.
      const roleB = await prisma.role.create({
        data: { name: `FBB_${Date.now()}`, displayNameEn: 'FbB', displayNameAr: 'ب', isSystem: false },
      });
      const vetB = await prisma.user.create({
        data: {
          email: `fbb-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Fb', lastName: 'B',
          isActive: true, isBookable: true, roleId: roleB.id,
          permissions: { create: [{ permissionId: readPerm.id }] },
        },
      });
      vetBId = vetB.id;
      vetBToken = generateUserToken({ id: vetB.id, email: vetB.email, role: roleB.name });

      // One appointment assigned to each vet, same day.
      const a = await request(app).post('/api/appointments').set('Authorization', `Bearer ${adminToken}`)
        .send({ petId: testPetId, vetId: vetAId, appointmentDate: today, appointmentTime: '08:00', duration: 30, visitType: 'GENERAL_CHECKUP' });
      apptAId = a.body.data.id;
      const b = await request(app).post('/api/appointments').set('Authorization', `Bearer ${adminToken}`)
        .send({ petId: testPetId, vetId: vetBId, appointmentDate: today, appointmentTime: '08:30', duration: 30, visitType: 'GENERAL_CHECKUP' });
      apptBId = b.body.data.id;
    });

    // Flatten all cards across every status column into one array.
    const allCards = (body: any): any[] => Object.values(body.data || {}).flat() as any[];
    const idsOf = (body: any): string[] => allCards(body).map((c) => c.id);

    it('restricted vet (flowBoard.ownOnly) sees ONLY their own cards', async () => {
      const res = await request(app)
        .get(`/api/appointments/flow-board?date=${today}`)
        .set('Authorization', `Bearer ${vetAToken}`)
        .expect(200);
      const ids = idsOf(res.body);
      expect(ids).toContain(apptAId);
      expect(ids).not.toContain(apptBId);
      // Every card returned is assigned to vet A.
      expect(allCards(res.body).every((c) => c.vet?.id === vetAId)).toBe(true);
    });

    it('unrestricted vet (no ownOnly) sees ALL cards', async () => {
      const res = await request(app)
        .get(`/api/appointments/flow-board?date=${today}`)
        .set('Authorization', `Bearer ${vetBToken}`)
        .expect(200);
      const ids = idsOf(res.body);
      expect(ids).toContain(apptAId);
      expect(ids).toContain(apptBId);
    });

    it('ADMIN sees ALL cards (bypass)', async () => {
      const res = await request(app)
        .get(`/api/appointments/flow-board?date=${today}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const ids = idsOf(res.body);
      expect(ids).toContain(apptAId);
      expect(ids).toContain(apptBId);
    });
  });
});
