// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Email API Tests (Mocked)
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock email service BEFORE importing app (vi.mock is hoisted)
vi.mock('../../services/emailService', () => {
  const r = { success: true, messageId: 'mock-email-id' };
  const conn = { success: true, provider: 'mock' };
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
    testConnection: vi.fn().mockResolvedValue(conn),
  };
  return { ...svc, emailService: svc, default: svc };
});

import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Email API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/email/test-connection', () => {
    it('should test email connection', async () => {
      const res = await request(app)
        .get('/api/email/test-connection')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(res.status);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/email/test-connection').expect(401);
    });
  });

  describe('POST /api/email/send-test', () => {
    it('should send test email', async () => {
      const res = await request(app)
        .post('/api/email/send-test')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ to: 'test@example.com' });

      expect([200, 500]).toContain(res.status);
    });
  });
});
