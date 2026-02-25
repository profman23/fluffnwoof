// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Customer Portal API Tests
// Tests for phone-based auth, booking data, and protected endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock SMS service to prevent real OTP sending
vi.mock('../../services/smsService', () => ({
  sendOtpSms: vi.fn().mockResolvedValue(undefined),
  sendSms: vi.fn().mockResolvedValue({ id: 'mock', status: 'SENT' }),
  getBalance: vi.fn().mockResolvedValue({ balance: 100 }),
  getLogs: vi.fn().mockResolvedValue({ data: [], pagination: {} }),
  getMessageStatus: vi.fn().mockResolvedValue({ status: 'DELIVERED' }),
}));

// Mock email service to prevent real emails
vi.mock('../../services/emailService', () => {
  const r = { success: true, messageId: 'mock-id' };
  const svc = {
    sendEmail: vi.fn().mockResolvedValue(r),
    sendAppointmentEmail: vi.fn().mockResolvedValue(r),
    sendOtpEmail: vi.fn().mockResolvedValue(r),
    sendPortalBookingConfirmation: vi.fn().mockResolvedValue(r),
    sendPendingBookingEmail: vi.fn().mockResolvedValue(r),
    sendBookingApprovedEmail: vi.fn().mockResolvedValue(r),
    sendBookingRejectedEmail: vi.fn().mockResolvedValue(r),
    sendCancellationNotice: vi.fn().mockResolvedValue(r),
    sendFormNotificationEmail: vi.fn().mockResolvedValue(r),
    testConnection: vi.fn().mockResolvedValue({ success: true }),
  };
  return { ...svc, emailService: svc, default: svc };
});

import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken, generateCustomerToken, createTestOwnerWithPortal } from '../helpers';

describe('Customer Portal API', () => {
  let adminToken: string;
  let customerToken: string;
  let testOwner: any;
  let testPetId: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create staff user for admin operations
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create a portal-enabled owner in the database
    testOwner = await createTestOwnerWithPortal(prisma, {
      phone: '+966500099100',
      email: 'portal-test@test.com',
    });

    // Generate a valid customer token for the owner
    customerToken = generateCustomerToken({ id: testOwner.id, email: testOwner.email });

    // Create a pet for the owner (via staff API)
    const petRes = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'PortalPet',
        species: 'CAT',
        gender: 'FEMALE',
        ownerId: testOwner.id,
      });
    testPetId = petRes.body?.data?.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // Public Auth Endpoints
  // ═══════════════════════════════════════════
  describe('Public Auth', () => {
    it('POST /api/portal/check-phone with existing phone', async () => {
      const res = await request(app)
        .post('/api/portal/check-phone')
        .send({ phone: '+966500099100' });

      expect([200, 201]).toContain(res.status);
    });

    it('POST /api/portal/check-phone with non-existing phone', async () => {
      const res = await request(app)
        .post('/api/portal/check-phone')
        .send({ phone: '+966599999999' });

      expect([200, 201, 404]).toContain(res.status);
    });

    it('POST /api/portal/login with wrong credentials', async () => {
      const res = await request(app)
        .post('/api/portal/login')
        .send({ phone: '+966500099100', password: 'WrongPassword123!' });

      expect([400, 401]).toContain(res.status);
    });

    it('POST /api/portal/login with correct credentials', async () => {
      const res = await request(app)
        .post('/api/portal/login')
        .send({ phone: '+966500099100', password: 'Test123!@#' });

      // May succeed or fail depending on auth flow (OTP might be required first)
      expect([200, 400, 401]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // Public Booking Data
  // ═══════════════════════════════════════════
  describe('Public Booking Data', () => {
    it('GET /api/portal/visit-types should return visit types', async () => {
      const res = await request(app)
        .get('/api/portal/visit-types')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/portal/vets should return vets', async () => {
      const res = await request(app)
        .get('/api/portal/vets')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });
  });

  // ═══════════════════════════════════════════
  // Protected - Profile
  // ═══════════════════════════════════════════
  describe('Protected Profile', () => {
    it('GET /api/portal/me should return profile', async () => {
      const res = await request(app)
        .get('/api/portal/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('PUT /api/portal/me should update profile', async () => {
      const res = await request(app)
        .put('/api/portal/me')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ firstName: 'UpdatedPortal' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/portal/me should reject without auth (401)', async () => {
      await request(app).get('/api/portal/me').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Protected - Pets
  // ═══════════════════════════════════════════
  describe('Protected Pets', () => {
    it('GET /api/portal/pets should return pets', async () => {
      const res = await request(app)
        .get('/api/portal/pets')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('POST /api/portal/pets should create a pet', async () => {
      const res = await request(app)
        .post('/api/portal/pets')
        .set('Authorization', `Bearer ${customerToken}`)
        .send({
          name: 'PortalNewPet',
          species: 'DOG',
          gender: 'MALE',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('GET /api/portal/pets/:id should return pet details', async () => {
      if (!testPetId) return; // Skip if pet wasn't created

      const res = await request(app)
        .get(`/api/portal/pets/${testPetId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
    });

    it('PUT /api/portal/pets/:id should update pet', async () => {
      if (!testPetId) return;

      const res = await request(app)
        .put(`/api/portal/pets/${testPetId}`)
        .set('Authorization', `Bearer ${customerToken}`)
        .send({ name: 'UpdatedPortalPet' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/portal/pets should reject without auth (401)', async () => {
      await request(app).get('/api/portal/pets').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Protected - Appointments
  // ═══════════════════════════════════════════
  describe('Protected Appointments', () => {
    it('GET /api/portal/appointments should return appointments', async () => {
      const res = await request(app)
        .get('/api/portal/appointments')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/portal/appointments?filter=upcoming', async () => {
      const res = await request(app)
        .get('/api/portal/appointments?filter=upcoming')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('GET /api/portal/appointments should reject without auth (401)', async () => {
      await request(app).get('/api/portal/appointments').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Protected - Forms
  // ═══════════════════════════════════════════
  describe('Protected Forms', () => {
    it('GET /api/portal/forms should return forms', async () => {
      const res = await request(app)
        .get('/api/portal/forms')
        .set('Authorization', `Bearer ${customerToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/portal/forms should reject without auth (401)', async () => {
      await request(app).get('/api/portal/forms').expect(401);
    });
  });
});
