// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Dashboard API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken, generateUserToken } from '../helpers';

describe('Dashboard API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard data', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body).toHaveProperty('data');
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/dashboard').expect(401);
    });
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return stats', async () => {
      const res = await request(app)
        .get('/api/dashboard/stats')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/appointments', () => {
    it('should return upcoming appointments', async () => {
      const res = await request(app)
        .get('/api/dashboard/appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/vaccinations', () => {
    it('should return upcoming vaccinations', async () => {
      const res = await request(app)
        .get('/api/dashboard/vaccinations')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/vet-performance', () => {
    it('should return vet performance', async () => {
      const res = await request(app)
        .get('/api/dashboard/vet-performance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  describe('GET /api/dashboard/analytics', () => {
    it('should return analytics with date range', async () => {
      const res = await request(app)
        .get('/api/dashboard/analytics?from=2026-01-01&to=2026-12-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // dashboard.ownOnly row-level scoping
  // ═══════════════════════════════════════════
  describe('dashboard.ownOnly scoping', () => {
    let vetAToken: string; // restricted (dashboard.ownOnly)
    let vetBToken: string; // unrestricted (manager-like)
    let vetAId: string;
    let vetBId: string;
    // Analytics range covering "today" so appointment counts are deterministic
    const range = () => {
      const today = new Date();
      const start = new Date(today.getFullYear(), today.getMonth(), 1)
        .toISOString()
        .split('T')[0];
      const end = new Date(today.getFullYear(), today.getMonth() + 1, 0)
        .toISOString()
        .split('T')[0];
      return `startDate=${start}&endDate=${end}`;
    };

    beforeAll(async () => {
      const owner = await prisma.owner.create({
        data: { firstName: 'Scope', lastName: 'Owner', phone: '+966520000090', customerCode: 'SCOPE-D1' },
      });
      const pet = await prisma.pet.create({
        data: { name: 'ScopeDashPet', species: 'DOG', gender: 'MALE', ownerId: owner.id, petCode: 'SCP-D1' },
      });

      const ownOnlyPerm = await prisma.permission.upsert({
        where: { name: 'dashboard.ownOnly' },
        update: {},
        create: { name: 'dashboard.ownOnly', description: 'x', category: 'dashboard', action: 'ownOnly' },
      });

      // Vet A: restricted (dashboard.ownOnly). Dashboard screen is always accessible, so no read perm needed.
      const roleA = await prisma.role.create({
        data: { name: `DASHA_${Date.now()}`, displayNameEn: 'DashA', displayNameAr: 'أ', isSystem: false },
      });
      const vetA = await prisma.user.create({
        data: {
          email: `dasha-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Dash', lastName: 'A',
          isActive: true, isBookable: true, roleId: roleA.id,
          permissions: { create: [{ permissionId: ownOnlyPerm.id }] },
        },
      });
      vetAId = vetA.id;
      vetAToken = generateUserToken({ id: vetA.id, email: vetA.email, role: roleA.name });

      // Vet B: unrestricted (no ownOnly) — represents a manager.
      const roleB = await prisma.role.create({
        data: { name: `DASHB_${Date.now()}`, displayNameEn: 'DashB', displayNameAr: 'ب', isSystem: false },
      });
      const vetB = await prisma.user.create({
        data: {
          email: `dashb-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Dash', lastName: 'B',
          isActive: true, isBookable: true, roleId: roleB.id,
        },
      });
      vetBId = vetB.id;
      vetBToken = generateUserToken({ id: vetB.id, email: vetB.email, role: roleB.name });

      // Today's appointments: 1 for vet A, 2 for vet B.
      const today = new Date();
      today.setHours(12, 0, 0, 0);
      await prisma.appointment.createMany({
        data: [
          { petId: pet.id, vetId: vetAId, appointmentDate: today, appointmentTime: '10:00', visitType: 'GENERAL_CHECKUP' },
          { petId: pet.id, vetId: vetBId, appointmentDate: today, appointmentTime: '11:00', visitType: 'GENERAL_CHECKUP' },
          { petId: pet.id, vetId: vetBId, appointmentDate: today, appointmentTime: '12:00', visitType: 'GENERAL_CHECKUP' },
        ],
      });
    });

    it('restricted vet sees ONLY their own appointment counts', async () => {
      const res = await request(app)
        .get(`/api/dashboard/analytics?${range()}`)
        .set('Authorization', `Bearer ${vetAToken}`)
        .expect(200);
      expect(res.body.data.appointments.total).toBe(1); // only vet A's appointment
    });

    it('restricted vet gets general (non-vet) fields hidden as null', async () => {
      const [dataRes, analyticsRes] = await Promise.all([
        request(app).get('/api/dashboard').set('Authorization', `Bearer ${vetAToken}`).expect(200),
        request(app).get(`/api/dashboard/analytics?${range()}`).set('Authorization', `Bearer ${vetAToken}`).expect(200),
      ]);
      expect(dataRes.body.data.stats.registeredPets).toBeNull();
      expect(dataRes.body.data.stats.registeredOwners).toBeNull();
      expect(dataRes.body.data.stats.pendingInvoices).toBeNull();
      expect(analyticsRes.body.data.patients).toBeNull();
    });

    it('restricted vet cannot escape scope via ?staffId (ignored)', async () => {
      const res = await request(app)
        .get(`/api/dashboard/analytics?${range()}&staffId=${vetBId}`)
        .set('Authorization', `Bearer ${vetAToken}`)
        .expect(200);
      // Still only vet A's appointment — staffId is ignored for own-only users.
      expect(res.body.data.appointments.total).toBe(1);
    });

    it('unrestricted manager sees ALL appointments and general fields', async () => {
      const [dataRes, analyticsRes] = await Promise.all([
        request(app).get('/api/dashboard').set('Authorization', `Bearer ${vetBToken}`).expect(200),
        request(app).get(`/api/dashboard/analytics?${range()}`).set('Authorization', `Bearer ${vetBToken}`).expect(200),
      ]);
      expect(analyticsRes.body.data.appointments.total).toBeGreaterThanOrEqual(3);
      expect(dataRes.body.data.stats.registeredPets).not.toBeNull();
      expect(analyticsRes.body.data.patients).not.toBeNull();
    });

    it('manager can filter by staffId', async () => {
      const res = await request(app)
        .get(`/api/dashboard/analytics?${range()}&staffId=${vetBId}`)
        .set('Authorization', `Bearer ${vetBToken}`)
        .expect(200);
      expect(res.body.data.appointments.total).toBe(2); // only vet B's appointments
      // Filtering by a vet also hides the non-vet patient block.
      expect(res.body.data.patients).toBeNull();
    });

    it('ADMIN sees everything (bypass)', async () => {
      const res = await request(app)
        .get(`/api/dashboard/analytics?${range()}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.data.appointments.total).toBeGreaterThanOrEqual(3);
      expect(res.body.data.patients).not.toBeNull();
    });
  });
});
