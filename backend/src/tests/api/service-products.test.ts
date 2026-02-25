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
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Rabies Vaccine');
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
        .send({ name: 'Updated Rabies Vaccine', priceBeforeTax: 120 })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('Updated Rabies Vaccine');
    });

    it('GET /api/service-products?search=Rabies should filter by search', async () => {
      const res = await request(app)
        .get('/api/service-products?search=Rabies')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.data.length).toBeGreaterThanOrEqual(1);
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
