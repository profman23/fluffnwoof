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
    it('should create a new invoice with tax fields', async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [
            { description: 'General Checkup', quantity: 1, unitPrice: 230, priceBeforeTax: 200, taxRate: 15 },
            { description: 'Vaccination', quantity: 1, unitPrice: 172.5, priceBeforeTax: 150, taxRate: 15, discount: 10 },
          ],
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body).toHaveProperty('invoiceNumber');
      expect(res.body.ownerId).toBe(testOwnerId);
      expect(res.body.status).toBe('PENDING');
      expect(res.body.isFinalized).toBe(false);
      expect(res.body.items.length).toBe(2);

      // Verify tax fields are stored
      const item1 = res.body.items.find((i: { description: string }) => i.description === 'General Checkup');
      expect(item1.priceBeforeTax).toBe(200);
      expect(item1.taxRate).toBe(15);

      createdInvoiceId = res.body.id;
    });

    it('should calculate discount before tax correctly', async () => {
      // Price: 100, Tax: 15%, Discount: 10%
      // Expected: (100 * 0.90) * 1.15 = 103.50
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [
            { description: 'Test Discount Before Tax', quantity: 1, unitPrice: 115, priceBeforeTax: 100, taxRate: 15, discount: 10 },
          ],
        })
        .expect(201);

      const item = res.body.items[0];
      expect(item.priceBeforeTax).toBe(100);
      expect(item.taxRate).toBe(15);
      expect(item.discount).toBe(10);
      // (100 * 0.90) * 1.15 = 103.50
      expect(item.totalPrice).toBeCloseTo(103.50, 2);
      expect(res.body.totalAmount).toBeCloseTo(103.50, 2);
    });

    it('should calculate no-discount item correctly', async () => {
      // Price: 200, Tax: 15%, Discount: 0%
      // Expected: 200 * 1.15 = 230.00
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [
            { description: 'No Discount Item', quantity: 1, unitPrice: 230, priceBeforeTax: 200, taxRate: 15, discount: 0 },
          ],
        })
        .expect(201);

      const item = res.body.items[0];
      expect(item.totalPrice).toBeCloseTo(230.00, 2);
    });

    it('should handle quantity with discount before tax', async () => {
      // Price: 50, Tax: 15%, Discount: 20%, Qty: 3
      // Expected: 3 * (50 * 0.80) * 1.15 = 3 * 46 = 138.00
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [
            { description: 'Qty Test', quantity: 3, unitPrice: 57.5, priceBeforeTax: 50, taxRate: 15, discount: 20 },
          ],
        })
        .expect(201);

      const item = res.body.items[0];
      expect(item.totalPrice).toBeCloseTo(138.00, 2);
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

    it('should fallback when priceBeforeTax not provided (backward compat)', async () => {
      // When priceBeforeTax is not sent, it falls back to unitPrice
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [
            { description: 'Legacy Item', quantity: 1, unitPrice: 100 },
          ],
        })
        .expect(201);

      const item = res.body.items[0];
      expect(item.priceBeforeTax).toBe(100);
      expect(item.taxRate).toBe(15);
      // 100 * 1.15 = 115
      expect(item.totalPrice).toBeCloseTo(115.00, 2);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/invoices')
        .send({ ownerId: testOwnerId })
        .expect(401);
    });
  });

  describe('GET /api/invoices/:id', () => {
    it('should return invoice by id with tax fields', async () => {
      const res = await request(app)
        .get(`/api/invoices/${createdInvoiceId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body).toHaveProperty('id');
      expect(res.body.id).toBe(createdInvoiceId);
      expect(res.body).toHaveProperty('items');
      expect(res.body).toHaveProperty('payments');
      // Verify tax fields are returned
      expect(res.body.items[0]).toHaveProperty('priceBeforeTax');
      expect(res.body.items[0]).toHaveProperty('taxRate');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get(`/api/invoices/${createdInvoiceId}`)
        .expect(401);
    });
  });

  describe('POST /api/invoices/:id/items', () => {
    it('should add item with tax fields to existing invoice', async () => {
      const res = await request(app)
        .post(`/api/invoices/${createdInvoiceId}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          description: 'X-Ray',
          quantity: 1,
          unitPrice: 345,
          priceBeforeTax: 300,
          taxRate: 15,
        })
        .expect(201);

      expect(res.body).toHaveProperty('id');
      expect(res.body.description).toBe('X-Ray');
      expect(res.body.priceBeforeTax).toBe(300);
      expect(res.body.taxRate).toBe(15);
      // 300 * 1.15 = 345
      expect(res.body.totalPrice).toBeCloseTo(345.00, 2);
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
