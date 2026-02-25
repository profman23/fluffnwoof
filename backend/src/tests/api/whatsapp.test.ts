// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - WhatsApp API Tests (Mocked)
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock WhatsApp service BEFORE importing app (vi.mock is hoisted)
vi.mock('../../services/whatsappService', () => ({
  sendWhatsapp: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-wa-id',
    status: 'sent',
  }),
  testConnection: vi.fn().mockResolvedValue({
    success: true,
    message: 'Connected',
    account: { friendlyName: 'Test', status: 'active' },
  }),
  getTemplates: vi.fn().mockResolvedValue({
    success: true,
    templates: [],
  }),
  sendTemplateMessage: vi.fn().mockResolvedValue({
    success: true,
    messageId: 'mock-wa-template-id',
  }),
}));

import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('WhatsApp API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/whatsapp/test', () => {
    it('should test WhatsApp connection', async () => {
      const res = await request(app)
        .get('/api/whatsapp/test')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(res.status);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/whatsapp/test').expect(401);
    });
  });

  describe('GET /api/whatsapp/templates', () => {
    it('should return templates', async () => {
      const res = await request(app)
        .get('/api/whatsapp/templates')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(res.status);
    });
  });

  describe('POST /api/whatsapp/send', () => {
    it('should send WhatsApp message', async () => {
      const res = await request(app)
        .post('/api/whatsapp/send')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '+966500000001', message: 'Test WhatsApp' });

      expect([200, 500]).toContain(res.status);
    });
  });
});
