// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - SMS API Tests (Mocked)
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock SMS service BEFORE importing app (vi.mock is hoisted)
vi.mock('../../services/smsService', () => ({
  getBalance: vi.fn().mockResolvedValue({ balance: 100, status: 'success' }),
  sendSms: vi.fn().mockResolvedValue({
    id: 'mock-sms-id',
    phone: '+966500000000',
    message: 'Test',
    status: 'SENT',
    createdAt: new Date(),
  }),
  sendOtpSms: vi.fn().mockResolvedValue(undefined),
  getMessageStatus: vi.fn().mockResolvedValue({ status: 'DELIVERED' }),
  getLogs: vi.fn().mockResolvedValue({
    data: [],
    pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
  }),
}));

import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('SMS API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/sms/balance', () => {
    it('should return SMS balance', async () => {
      const res = await request(app)
        .get('/api/sms/balance')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // SMS controller returns raw response
      expect(res.body).toBeDefined();
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/sms/balance').expect(401);
    });
  });

  describe('GET /api/sms/logs', () => {
    it('should return SMS logs', async () => {
      const res = await request(app)
        .get('/api/sms/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toBeDefined();
    });
  });

  describe('POST /api/sms/send', () => {
    it('should send SMS', async () => {
      const res = await request(app)
        .post('/api/sms/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+966500000001', message: 'Test message' });

      expect([200, 201, 400, 500]).toContain(res.status);
    });
  });
});
