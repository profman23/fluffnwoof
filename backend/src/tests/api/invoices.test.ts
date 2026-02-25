// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Invoices API Tests
// Tests for invoice management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Invoices API', () => {
  let adminToken: string;
  let testOwnerId: string;
  let createdInvoiceId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create owner for invoice tests
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Invoice', lastName: 'Owner', phone: '+966500000050' });

    testOwnerId = ownerRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/invoices', () => {
    it('should create a new invoice', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [
            { description: 'General Checkup', quantity: 1, unitPrice: 200 },
            { description: 'Vaccination', quantity: 1, unitPrice: 150, discount: 10 },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('invoiceNumber');
      expect(res.body.ownerId).toBe(testOwnerId);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.isFinalized).toBe(false);
      expect(res.body.items.length).toBe(2);
      createdInvoiceId = res.body.id;
    });

    it('should create invoice without items', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ownerId: testOwnerId })
        .expect(201);

      expect(res.body).toHaveProperty('invoiceNumber');
      expect(res.body.items.length).toBe(0);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/invoices')
        .send({ ownerId: testOwnerId })
        .expect(401);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should return invoice by id', async () => {
      const res = await request(app)
        .get(`/api/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe(createdInvoiceId);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('payments');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get(`/api/invoices/${createdInvoiceId}`)
        .expect(401);
    });
  });

  describe('POST /api/invoices/:id/items', () => {
    it('should add item to existing invoice', async () => {
      const res = await request(app)
        .post(`/api/invoices/${createdInvoiceId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'X-Ray',
          quantity: 1,
          unitPrice: 300,
        })
        .expect(201);

      // addItem returns the created item
      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('description');
      expect(res.body.description).toBe('X-Ray');
    });
  });

  describe('PATCH /api/invoices/:id/finalize', () => {
    it('should finalize an invoice', async () => {
      const res = await request(app)
        .patch(`/api/invoices/${createdInvoiceId}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.isFinalized).toBe(true);
    });
  });
});
