// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Reports API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser, prisma } from '../setup';
import { generateAdminToken, generateUserToken } from '../helpers';

describe('Reports API', () => {
  let adminToken: string;
  let testOwnerId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create owner for sales report tests
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Report', lastName: 'Owner', phone: '+966500000099' });
    testOwnerId = ownerRes.body.data.id;

    // Create an invoice with items for sales report testing
    const invoiceRes = await request(app)
      .post('/api/invoices')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        ownerId: testOwnerId,
        items: [
          { description: 'Checkup', quantity: 1, unitPrice: 230, priceBeforeTax: 200, taxRate: 15 },
          { description: 'Vaccine', quantity: 2, unitPrice: 115, priceBeforeTax: 100, taxRate: 15, discount: 5 },
        ],
      });

    // Add a payment to the invoice
    if (invoiceRes.body.id) {
      await request(app)
        .post(`/api/invoices/${invoiceRes.body.id}/payments`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ amount: 100, paymentMethod: 'CASH' });
    }
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('GET /api/reports/next-appointments', () => {
    it('should return next appointments report', async () => {
      const res = await request(app)
        .get('/api/reports/next-appointments')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Reports controller returns raw response (no success/data wrapper)
      expect(res.body).toBeDefined();
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/reports/next-appointments').expect(401);
    });
  });

  describe('GET /api/reports/sales', () => {
    it('should return sales report with stats and invoices', async () => {
      const res = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Verify stats structure
      expect(res.body).toHaveProperty('stats');
      expect(res.body.stats).toHaveProperty('totalSales');
      expect(res.body.stats).toHaveProperty('totalPayments');
      expect(res.body.stats).toHaveProperty('outstandingBalance');
      expect(res.body.stats).toHaveProperty('invoiceCount');
      expect(res.body.stats).toHaveProperty('paymentMethodBreakdown');
      expect(typeof res.body.stats.totalSales).toBe('number');
      expect(typeof res.body.stats.totalPayments).toBe('number');
      expect(typeof res.body.stats.outstandingBalance).toBe('number');
      expect(typeof res.body.stats.invoiceCount).toBe('number');
      expect(Array.isArray(res.body.stats.paymentMethodBreakdown)).toBe(true);

      // Verify invoices structure
      expect(res.body).toHaveProperty('invoices');
      expect(res.body.invoices).toHaveProperty('data');
      expect(res.body.invoices).toHaveProperty('total');
      expect(res.body.invoices).toHaveProperty('page');
      expect(res.body.invoices).toHaveProperty('limit');
      expect(res.body.invoices).toHaveProperty('totalPages');
      expect(Array.isArray(res.body.invoices.data)).toBe(true);
    });

    it('should return invoices with items, payments, and owner', async () => {
      const res = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.invoices.data.length).toBeGreaterThan(0);

      const invoice = res.body.invoices.data[0];
      expect(invoice).toHaveProperty('items');
      expect(invoice).toHaveProperty('payments');
      expect(invoice).toHaveProperty('owner');
      expect(invoice.owner).toHaveProperty('firstName');
      expect(invoice.owner).toHaveProperty('lastName');
      expect(invoice.owner).toHaveProperty('phone');
      expect(Array.isArray(invoice.items)).toBe(true);
      expect(Array.isArray(invoice.payments)).toBe(true);
    });

    it('should include payment method breakdown with correct structure', async () => {
      const res = await request(app)
        .get('/api/reports/sales')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.stats.paymentMethodBreakdown.length).toBeGreaterThan(0);
      const breakdown = res.body.stats.paymentMethodBreakdown[0];
      expect(breakdown).toHaveProperty('method');
      expect(breakdown).toHaveProperty('amount');
      expect(breakdown).toHaveProperty('count');
    });

    it('should filter by date range', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const res = await request(app)
        .get('/api/reports/sales')
        .query({
          startDateTime: yesterday.toISOString(),
          endDateTime: tomorrow.toISOString(),
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.invoices.data.length).toBeGreaterThan(0);
    });

    it('should return empty results for future date range', async () => {
      const futureStart = new Date('2099-01-01T00:00:00.000Z');
      const futureEnd = new Date('2099-12-31T23:59:59.999Z');

      const res = await request(app)
        .get('/api/reports/sales')
        .query({
          startDateTime: futureStart.toISOString(),
          endDateTime: futureEnd.toISOString(),
        })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.stats.invoiceCount).toBe(0);
      expect(res.body.stats.totalSales).toBe(0);
      expect(res.body.invoices.data.length).toBe(0);
    });

    it('should filter by invoice status', async () => {
      const res = await request(app)
        .get('/api/reports/sales')
        .query({ status: 'PENDING' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // All returned invoices should be PENDING
      for (const invoice of res.body.invoices.data) {
        expect(invoice.status).toBe('PENDING');
      }
    });

    it('should support pagination', async () => {
      const res = await request(app)
        .get('/api/reports/sales')
        .query({ page: 1, limit: 1 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.invoices.page).toBe(1);
      expect(res.body.invoices.limit).toBe(1);
      expect(res.body.invoices.data.length).toBeLessThanOrEqual(1);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/reports/sales').expect(401);
    });
  });

  // ── Acquisition report: Google-only restriction (marketing role) ──
  describe('GET /api/reports/acquisition — googleOnly restriction', () => {
    let marketingToken: string;

    beforeAll(async () => {
      // Owners across sources (each needs a finalized paid invoice to appear in the report,
      // which uses firstInvoiceOnly by default). Create owner + invoice + payment + finalize.
      const makeOwnerWithInvoice = async (phone: string, source: string) => {
        const o = await prisma.owner.create({
          data: { firstName: 'Src', lastName: source, phone, customerCode: `SRC-${phone}`, referralSource: source },
        });
        const inv = await request(app).post('/api/invoices').set('Authorization', `Bearer ${adminToken}`)
          .send({ ownerId: o.id, items: [{ description: 'x', quantity: 1, unitPrice: 115, priceBeforeTax: 100, taxRate: 15 }] }).expect(201);
        await request(app).post(`/api/invoices/${inv.body.id}/payments`).set('Authorization', `Bearer ${adminToken}`)
          .send({ amount: 115, paymentMethod: 'CASH' }).expect(201);
        await request(app).patch(`/api/invoices/${inv.body.id}/finalize`).set('Authorization', `Bearer ${adminToken}`).expect(200);
        return o.id;
      };
      await makeOwnerWithInvoice('+966510000001', 'GOOGLE_SEARCH');
      await makeOwnerWithInvoice('+966510000002', 'GOOGLE_MAPS');
      await makeOwnerWithInvoice('+966510000003', 'INSTAGRAM');
      await makeOwnerWithInvoice('+966510000004', 'FACEBOOK');

      // Marketing user: a role + the googleOnly permission granted via UserPermission.
      const role = await prisma.role.create({
        data: { name: `MKT_${Date.now()}`, displayNameEn: 'Mkt', displayNameAr: 'تسويق', isSystem: false },
      });
      const perm = await prisma.permission.upsert({
        where: { name: 'acquisitionReport.googleOnly' },
        update: {},
        create: { name: 'acquisitionReport.googleOnly', description: 'x', category: 'acquisitionReport', action: 'googleOnly' },
      });
      const readPerm = await prisma.permission.upsert({
        where: { name: 'screens.acquisitionReport.read' },
        update: {},
        create: { name: 'screens.acquisitionReport.read', description: 'x', category: 'screens', action: 'read' },
      });
      const mktUser = await prisma.user.create({
        data: {
          email: `mkt-${Date.now()}@fluffnwoof.com`, password: 'x', firstName: 'Mkt', lastName: 'User',
          isActive: true, roleId: role.id,
          permissions: { create: [{ permissionId: perm.id }, { permissionId: readPerm.id }] },
        },
      });
      marketingToken = generateUserToken({ id: mktUser.id, email: mktUser.email, role: role.name });
    });

    const sourcesOf = (body: any): string[] =>
      (body.data.bySource || []).map((s: any) => s.source);

    it('ADMIN sees ALL sources (unrestricted)', async () => {
      const res = await request(app).get('/api/reports/acquisition').set('Authorization', `Bearer ${adminToken}`).expect(200);
      const srcs = sourcesOf(res.body);
      expect(srcs).toEqual(expect.arrayContaining(['GOOGLE_SEARCH', 'GOOGLE_MAPS', 'INSTAGRAM', 'FACEBOOK']));
    });

    it('marketing (googleOnly) sees ONLY Google sources — no source param', async () => {
      const res = await request(app).get('/api/reports/acquisition').set('Authorization', `Bearer ${marketingToken}`).expect(200);
      const srcs = sourcesOf(res.body);
      expect(srcs.sort()).toEqual(['GOOGLE_MAPS', 'GOOGLE_SEARCH']);
      expect(srcs).not.toContain('INSTAGRAM');
      expect(srcs).not.toContain('FACEBOOK');
    });

    it('CRITICAL bypass test: marketing passing ?source=INSTAGRAM still gets ONLY Google', async () => {
      const res = await request(app).get('/api/reports/acquisition?source=INSTAGRAM').set('Authorization', `Bearer ${marketingToken}`).expect(200);
      const srcs = sourcesOf(res.body);
      expect(srcs).not.toContain('INSTAGRAM');
      expect(srcs.every((s) => s === 'GOOGLE_SEARCH' || s === 'GOOGLE_MAPS')).toBe(true);
    });

    it('marketing narrowing within the allowed set: ?source=GOOGLE_MAPS → only maps', async () => {
      const res = await request(app).get('/api/reports/acquisition?source=GOOGLE_MAPS').set('Authorization', `Bearer ${marketingToken}`).expect(200);
      expect(sourcesOf(res.body)).toEqual(['GOOGLE_MAPS']);
    });

    it('marketing response strips customer PII (no customer names)', async () => {
      const res = await request(app).get('/api/reports/acquisition').set('Authorization', `Bearer ${marketingToken}`).expect(200);
      expect(res.body.data.customers).toEqual([]);
      for (const s of res.body.data.bySource) {
        expect(s.customers).toEqual([]);
      }
    });

    it('ADMIN response still includes customer detail (not stripped)', async () => {
      const res = await request(app).get('/api/reports/acquisition').set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(Array.isArray(res.body.data.customers)).toBe(true);
      expect(res.body.data.customers.length).toBeGreaterThan(0);
    });
  });
});
