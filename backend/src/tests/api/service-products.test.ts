// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Service Products API Tests
// Tests for service products and categories
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Service Products API', () => {
  let adminToken: string;
  let createdCategoryId: string;
  let createdProductId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // Categories
  // ═══════════════════════════════════════════
  describe('Categories', () => {
    it('POST /api/service-products/categories should create category', async () => {
      const res = await request(app)
        .post('/api/service-products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Vaccinations' })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Vaccinations');
      createdCategoryId = res.body.data.id;
    });

    it('GET /api/service-products/categories should list categories', async () => {
      const res = await request(app)
        .get('/api/service-products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('PUT /api/service-products/categories/:id should update category', async () => {
      const res = await request(app)
        .put(`/api/service-products/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Vaccinations' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Vaccinations');
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get('/api/service-products/categories')
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Products
  // ═══════════════════════════════════════════
  describe('Products', () => {
    it('POST /api/service-products should create product', async () => {
      const res = await request(app)
        .post('/api/service-products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Rabies Vaccine',
          categoryId: createdCategoryId,
          priceBeforeTax: 100,
          taxRate: 15,
          priceAfterTax: 115,
          daftraCode: 'DF-TEST-001',
          barcode: '6281234567890',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Rabies Vaccine');
      expect(res.body.data.daftraCode).toBe('DF-TEST-001');
      expect(res.body.data.barcode).toBe('6281234567890');
      createdProductId = res.body.data.id;
    });

    it('GET /api/service-products should list products', async () => {
      const res = await request(app)
        .get('/api/service-products')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('GET /api/service-products/:id should return specific product', async () => {
      const res = await request(app)
        .get(`/api/service-products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdProductId);
    });

    it('PUT /api/service-products/:id should update product', async () => {
      const res = await request(app)
        .put(`/api/service-products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Updated Rabies Vaccine', priceBeforeTax: 120, daftraCode: 'DF-UPDATED', barcode: '6281234567899' })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Rabies Vaccine');
      expect(res.body.data.daftraCode).toBe('DF-UPDATED');
      expect(res.body.data.barcode).toBe('6281234567899');
    });

    it('GET /api/service-products?search=Rabies should filter by name', async () => {
      const res = await request(app)
        .get('/api/service-products?search=Rabies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
    });

    it('GET /api/service-products?search=DF-UPDATED should filter by daftraCode', async () => {
      const res = await request(app)
        .get('/api/service-products?search=DF-UPDATED')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].daftraCode).toBe('DF-UPDATED');
    });

    it('GET /api/service-products?search=6281234567899 should filter by barcode', async () => {
      const res = await request(app)
        .get('/api/service-products?search=6281234567899')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data[0].barcode).toBe('6281234567899');
    });

    it('DELETE /api/service-products/:id should delete product', async () => {
      const res = await request(app)
        .delete(`/api/service-products/${createdProductId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/service-products').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Bulk Delete
  // ═══════════════════════════════════════════
  describe('Bulk Delete', () => {
    let bulkProductIds: string[];

    beforeAll(async () => {
      // Create a category for bulk delete products
      const catRes = await request(app)
        .post('/api/service-products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Bulk Test Category' });

      const catId = catRes.body.data.id;
      bulkProductIds = [];

      for (let i = 0; i < 3; i++) {
        const res = await request(app)
          .post('/api/service-products')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: `Bulk Test Product ${i}`,
            categoryId: catId,
            priceBeforeTax: 100,
            taxRate: 15,
            priceAfterTax: 115,
          });
        bulkProductIds.push(res.body.data.id);
      }
    });

    it('POST /api/service-products/bulk-delete should delete multiple products', async () => {
      const res = await request(app)
        .post('/api/service-products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: bulkProductIds })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.deletedCount).toBe(3);
    });

    it('should reject empty ids array', async () => {
      await request(app)
        .post('/api/service-products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: [] })
        .expect(400);
    });

    it('should reject non-array ids', async () => {
      await request(app)
        .post('/api/service-products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: 'not-an-array' })
        .expect(400);
    });

    it('should reject invalid UUID format', async () => {
      await request(app)
        .post('/api/service-products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['not-a-uuid'] })
        .expect(400);
    });

    it('should reject when some ids not found', async () => {
      await request(app)
        .post('/api/service-products/bulk-delete')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ ids: ['00000000-0000-0000-0000-000000000000'] })
        .expect(400);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/service-products/bulk-delete')
        .send({ ids: ['00000000-0000-0000-0000-000000000000'] })
        .expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Delete Category
  // ═══════════════════════════════════════════
  describe('Delete Category', () => {
    it('should reject deleting category with existing items', async () => {
      const res = await request(app)
        .delete(`/api/service-products/categories/${createdCategoryId}`)
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(400);
    });

    it('should delete empty category', async () => {
      // Create a fresh empty category
      const catRes = await request(app)
        .post('/api/service-products/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Empty Category' });

      const res = await request(app)
        .delete(`/api/service-products/categories/${catRes.body.data.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
