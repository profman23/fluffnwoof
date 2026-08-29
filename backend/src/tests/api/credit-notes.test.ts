// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Credit Notes API Tests
// Full-cancellation credit notes for finalized invoices
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser, prisma } from '../setup';
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

  // ── Refund (outgoing payment) behaviour ──
  describe('Refunds on credit note', () => {
    const addPayment = async (invoiceId: string, amount: number, method = 'CASH') =>
      request(app)
        .post(`/api/invoices/${invoiceId}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount, paymentMethod: method })
        .expect(201);

    const outgoingFor = (invoiceId: string) =>
      prisma.payment.findMany({ where: { invoiceId, direction: 'OUTGOING' } });
    const incomingFor = (invoiceId: string) =>
      prisma.payment.findMany({ where: { invoiceId, direction: 'INCOMING' } });

    it('fully paid invoice → one OUTGOING refund mirroring the payment; refundedAmount = paid', async () => {
      const inv = await createFinalized(); // total 230
      await addPayment(inv.id, inv.totalAmount, 'MADA');

      const res = await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id })
        .expect(201);

      expect(res.body.refundedAmount).toBeCloseTo(inv.totalAmount, 2);

      const out = await outgoingFor(inv.id);
      expect(out.length).toBe(1);
      expect(out[0].amount).toBeCloseTo(inv.totalAmount, 2);
      expect(out[0].paymentMethod).toBe('MADA');
      expect(out[0].creditNoteId).toBe(res.body.id);

      // paidAmount (incoming) is untouched
      const check = await request(app).get(`/api/invoices/${inv.id}`).set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(check.body.paidAmount).toBeCloseTo(inv.totalAmount, 2);
      expect(check.body.status).toBe('CREDITED');
    });

    it('partially paid → refund equals the PAID amount only, not the total', async () => {
      const inv = await createFinalized(); // total 230
      await addPayment(inv.id, 100, 'CASH'); // paid 100 of 230

      const res = await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id })
        .expect(201);

      expect(res.body.refundedAmount).toBeCloseTo(100, 2);
      const out = await outgoingFor(inv.id);
      expect(out.length).toBe(1);
      expect(out[0].amount).toBeCloseTo(100, 2);
    });

    it('multiple methods → one OUTGOING per incoming payment, mirroring method + amount', async () => {
      const inv = await createFinalized(); // total 230
      await addPayment(inv.id, 130, 'CASH');
      await addPayment(inv.id, 100, 'CARD');

      const res = await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id })
        .expect(201);

      expect(res.body.refundedAmount).toBeCloseTo(230, 2);
      const out = await outgoingFor(inv.id);
      expect(out.length).toBe(2);
      const byMethod = Object.fromEntries(out.map((p) => [p.paymentMethod, p.amount]));
      expect(byMethod.CASH).toBeCloseTo(130, 2);
      expect(byMethod.CARD).toBeCloseTo(100, 2);
    });

    it('unpaid finalized invoice → zero refunds, refundedAmount 0', async () => {
      const inv = await createFinalized();
      const res = await request(app)
        .post('/api/credit-notes')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ invoiceId: inv.id })
        .expect(201);

      expect(res.body.refundedAmount).toBe(0);
      const out = await outgoingFor(inv.id);
      expect(out.length).toBe(0);
    });

    it('regression: removePayment recomputes paidAmount from INCOMING only (ignores refunds)', async () => {
      const inv = await createFinalized(); // total 230
      const p1 = await addPayment(inv.id, 130, 'CASH');
      await addPayment(inv.id, 100, 'CARD');

      // Credit → creates 2 OUTGOING refunds
      await request(app).post('/api/credit-notes').set('Authorization', `Bearer ${adminToken}`).send({ invoiceId: inv.id }).expect(201);
      expect((await outgoingFor(inv.id)).length).toBe(2);

      // Remove one incoming payment → paidAmount must re-aggregate INCOMING only (100 left),
      // NOT be corrupted by the 230 of OUTGOING refunds.
      await request(app)
        .delete(`/api/invoices/payments/${p1.body.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      const invRow = await prisma.invoice.findUnique({ where: { id: inv.id } });
      expect(invRow?.paidAmount).toBeCloseTo(100, 2); // 230 − 130, refunds ignored
      expect((await incomingFor(inv.id)).length).toBe(1);
    });
  });

  it('rejects unauthenticated requests (401)', async () => {
    await request(app).get('/api/credit-notes').expect(401);
    await request(app).post('/api/credit-notes').send({ invoiceId: 'x' }).expect(401);
  });
});
