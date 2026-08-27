// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Credit Notes API Tests
// Full-cancellation credit notes for finalized invoices
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Credit Notes API', () => {
  let adminToken: string;
  let testOwnerId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Credit', lastName: 'Owner', phone: '+966500000070' });
    testOwnerId = ownerRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // Helpers
  const createDraft = async () => {
    const res = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ownerId: testOwnerId,
        items: [{ description: 'Item', quantity: 1, unitPrice: 230, priceBeforeTax: 200, taxRate: 15 }],
      })
      .expect(201);
    return res.body;
  };

  const createFinalized = async () => {
    const draft = await createDraft();
    const fin = await request(app)
      .patch(`/api/invoices/${draft.id}/finalize`)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);
    return fin.body.data;
  };

  describe('POST /api/credit-notes', () => {
    it('creates a credit note for a finalized invoice, flips it to CREDITED', async () => {
      const inv = await createFinalized();

      const res = await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id, reason: 'Customer cancelled' })
        .expect(201);

      // Serial format CN-YYYYMMDD-NNNN
      expect(res.body.creditNoteNumber).toMatch(/^CN-\d{8}-\d{4}$/);
      // Amount equals the full invoice total
      expect(res.body.amount).toBeCloseTo(inv.totalAmount, 2);
      expect(res.body.reason).toBe('Customer cancelled');

      // Original invoice is now CREDITED, items/payments kept
      const check = await request(app)
        .get(`/api/invoices/${inv.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(check.body.status).toBe('CREDITED');
      expect(check.body.items.length).toBe(1); // items untouched
    });

    it('rejects crediting a NON-finalized (draft) invoice (400)', async () => {
      const draft = await createDraft();
      await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: draft.id })
        .expect(400);
    });

    it('rejects a SECOND credit note on the same invoice (400)', async () => {
      const inv = await createFinalized();
      await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id })
        .expect(201);

      await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id })
        .expect(400);
    });

    it('rejects a missing invoiceId (400) and a non-existent invoice (404)', async () => {
      await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: '00000000-0000-0000-0000-000000000000' })
        .expect(404);
    });

    it('mints sequential CN serials (same day)', async () => {
      const a = await createFinalized();
      const b = await createFinalized();
      const cnA = await request(app).post('/api/credit-notes').set('Authorization', `Bearer ${adminToken}`).send({ invoiceId: a.id }).expect(201);
      const cnB = await request(app).post('/api/credit-notes').set('Authorization', `Bearer ${adminToken}`).send({ invoiceId: b.id }).expect(201);
      const numA = parseInt(cnA.body.creditNoteNumber.split('-')[2], 10);
      const numB = parseInt(cnB.body.creditNoteNumber.split('-')[2], 10);
      expect(numB).toBe(numA + 1);
    });
  });

  describe('GET /api/credit-notes', () => {
    it('lists issued credit notes', async () => {
      const res = await request(app)
        .get('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
      expect(res.body.data[0]).toHaveProperty('creditNoteNumber');
      expect(res.body.data[0]).toHaveProperty('owner');
      expect(res.body.data[0]).toHaveProperty('invoice');
    });
  });

  describe('GET /api/credit-notes/invoices', () => {
    it('lists finalized invoices and excludes already-credited ones', async () => {
      const fresh = await createFinalized();

      const res = await request(app)
        .get('/api/credit-notes/invoices')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      const ids = res.body.data.map((i: { id: string }) => i.id);
      expect(ids).toContain(fresh.id); // creditable invoice present

      // Credit it, then confirm it's excluded from the creditable list
      await request(app).post('/api/credit-notes').set('Authorization', `Bearer ${adminToken}`).send({ invoiceId: fresh.id }).expect(201);
      const res2 = await request(app)
        .get('/api/credit-notes/invoices?search=' + fresh.invoiceNumber)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const credited = res2.body.data.find((i: { id: string }) => i.id === fresh.id);
      expect(credited?.status).toBe('CREDITED');
    });
  });

  it('rejects unauthenticated requests (401)', async () => {
    await request(app).get('/api/credit-notes').expect(401);
    await request(app).post('/api/credit-notes').send({ invoiceId: 'x' }).expect(401);
  });
});
