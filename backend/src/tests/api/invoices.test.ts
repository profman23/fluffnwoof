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

  // ════════════════════════════════════════════════════════════
  // Draft invoice number + deferred official serial (gap-free)
  // ════════════════════════════════════════════════════════════
  describe('Draft invoice numbering', () => {
    const officialPattern = /^INV-\d{8}-\d{4}$/;

    const createDraft = async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [{ description: 'Draft Item', quantity: 1, unitPrice: 115, priceBeforeTax: 100, taxRate: 15 }],
        })
        .expect(201);
      return res.body;
    };

    it('a new invoice is a DRAFT and has NOT burned an official serial', async () => {
      const inv = await createDraft();
      expect(inv.invoiceNumber.startsWith('DRAFT-')).toBe(true);
      expect(inv.invoiceNumber).not.toMatch(officialPattern);
      expect(inv.isFinalized).toBe(false);
    });

    it('finalize assigns a sequential official INV number', async () => {
      const first = await createDraft();
      const finalizedFirst = await request(app)
        .patch(`/api/invoices/${first.id}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const firstNumber = finalizedFirst.body.data.invoiceNumber;
      expect(firstNumber).toMatch(officialPattern);

      const second = await createDraft();
      const finalizedSecond = await request(app)
        .patch(`/api/invoices/${second.id}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const secondNumber = finalizedSecond.body.data.invoiceNumber;
      expect(secondNumber).toMatch(officialPattern);

      // Sequential: second serial is exactly first + 1 (same day)
      const seq = (n: string) => parseInt(n.slice(-4), 10);
      expect(seq(secondNumber)).toBe(seq(firstNumber) + 1);
    });

    it('removing a draft does NOT create a gap in official serials', async () => {
      // Create draft A and delete it (no official serial should be consumed)
      const draftA = await createDraft();
      await request(app)
        .delete(`/api/invoices/${draftA.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Two fresh drafts finalized back-to-back must be consecutive
      const b = await createDraft();
      const finalB = await request(app)
        .patch(`/api/invoices/${b.id}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const c = await createDraft();
      const finalC = await request(app)
        .patch(`/api/invoices/${c.id}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const seq = (n: string) => parseInt(n.slice(-4), 10);
      expect(seq(finalC.body.data.invoiceNumber)).toBe(seq(finalB.body.data.invoiceNumber) + 1);
    });

    it('finalizing twice returns 400 and does not change the number', async () => {
      const inv = await createDraft();
      const finalized = await request(app)
        .patch(`/api/invoices/${inv.id}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const official = finalized.body.data.invoiceNumber;

      await request(app)
        .patch(`/api/invoices/${inv.id}/finalize`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      const check = await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(check.body.invoiceNumber).toBe(official);
    });
  });

  // ════════════════════════════════════════════════════════════
  // Empty draft deletion (with payment safety guard)
  // ════════════════════════════════════════════════════════════
  describe('DELETE /api/invoices/:id — empty draft cleanup', () => {
    const createDraft = async () => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [{ description: 'Temp', quantity: 1, unitPrice: 115, priceBeforeTax: 100, taxRate: 15 }],
        })
        .expect(201);
      return res.body;
    };

    it('deletes a draft invoice (no payments)', async () => {
      const inv = await createDraft();
      await request(app)
        .delete(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);
    });

    it('refuses to delete an invoice that has payments (400)', async () => {
      const inv = await createDraft();
      // Attach a partial payment
      await request(app)
        .post(`/api/invoices/${inv.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 50, paymentMethod: 'CASH' })
        .expect(201);

      await request(app)
        .delete(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      // Still exists
      await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
    });
  });

  // ════════════════════════════════════════════════════════════
  // Critical edge cases (pre-staging hardening)
  // ════════════════════════════════════════════════════════════
  describe('Invoice edge cases (pre-staging)', () => {
    const createDraft = async (unitPrice = 115, priceBeforeTax = 100) => {
      const res = await request(app)
        .post('/api/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          ownerId: testOwnerId,
          items: [{ description: 'Edge', quantity: 1, unitPrice, priceBeforeTax, taxRate: 15 }],
        })
        .expect(201);
      return res.body;
    };

    it('concurrent double finalize burns exactly ONE serial (no duplicate)', async () => {
      const inv = await createDraft();

      // Fire two finalize calls at the same time (simulates a double-click race)
      const [r1, r2] = await Promise.all([
        request(app).patch(`/api/invoices/${inv.id}/finalize`).set('Authorization', `Bearer ${adminToken}`),
        request(app).patch(`/api/invoices/${inv.id}/finalize`).set('Authorization', `Bearer ${adminToken}`),
      ]);

      // Exactly one wins (200), the other is rejected (400)
      const statuses = [r1.status, r2.status].sort();
      expect(statuses).toEqual([200, 400]);

      // Final stored number is a single official serial, not a DRAFT
      const check = await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(check.body.invoiceNumber).toMatch(/^INV-\d{8}-\d{4}$/);
      expect(check.body.isFinalized).toBe(true);
    });

    it('draft with a partial payment is NOT deleted, and its items can be edited', async () => {
      const inv = await createDraft();
      // Partial payment attached
      await request(app)
        .post(`/api/invoices/${inv.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 50, paymentMethod: 'CASH' })
        .expect(201);

      // Remove the only item — invoice must survive (it has money attached)
      const itemId = inv.items[0].id;
      await request(app)
        .delete(`/api/invoices/items/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Delete must still be refused (payment present) even with zero items
      await request(app)
        .delete(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(400);

      const check = await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(check.body.items.length).toBe(0);
      expect(check.body.payments.length).toBe(1);
    });

    it('remove-then-readd cycle keeps a usable draft (still DRAFT, no serial burned)', async () => {
      const inv = await createDraft();
      const itemId = inv.items[0].id;

      // Remove the only item
      await request(app)
        .delete(`/api/invoices/items/${itemId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Re-add a new item to the same invoice
      await request(app)
        .post(`/api/invoices/${inv.id}/items`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ description: 'Readded', quantity: 1, unitPrice: 230, priceBeforeTax: 200, taxRate: 15 })
        .expect(201);

      const check = await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      // Still a draft (no official serial burned by add/remove), one item, PENDING
      expect(check.body.invoiceNumber.startsWith('DRAFT-')).toBe(true);
      expect(check.body.items.length).toBe(1);
      expect(check.body.status).toBe('PENDING');
    });
  });
});
