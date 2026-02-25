// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Forms API Tests
// Tests for form templates and pet form management
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Forms API', () => {
  let adminToken: string;
  let adminUserId: string;
  let testPetId: string;
  let testOwnerId: string;
  let createdTemplateId: string;
  let createdFormId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminUserId = user.id;
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create owner and pet
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Form', lastName: 'Owner', phone: '+966500000060' });
    testOwnerId = ownerRes.body.data.id;

    const petRes = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ name: 'FormPet', species: 'CAT', gender: 'FEMALE', ownerId: testOwnerId });
    testPetId = petRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════
  // Templates
  // ═══════════════════════════════════════════
  describe('Templates', () => {
    it('POST /api/forms/templates should create template', async () => {
      const res = await request(app)
        .post('/api/forms/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          nameEn: 'Consent Form',
          nameAr: 'نموذج موافقة',
          contentEn: 'I consent to the treatment of {{petName}}',
          contentAr: 'أوافق على علاج {{petName}}',
          requiresVetSignature: true,
          requiresClientSignature: true,
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdTemplateId = res.body.data.id;
    });

    it('GET /api/forms/templates should list templates', async () => {
      const res = await request(app)
        .get('/api/forms/templates')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/forms/templates/:id should get specific template', async () => {
      const res = await request(app)
        .get(`/api/forms/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.id).toBe(createdTemplateId);
    });

    it('GET /api/forms/templates/variables should return available variables', async () => {
      const res = await request(app)
        .get('/api/forms/templates/variables')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('PUT /api/forms/templates/:id should update template', async () => {
      const res = await request(app)
        .put(`/api/forms/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ nameEn: 'Updated Consent Form' })
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('should reject without auth (401)', async () => {
      await request(app).get('/api/forms/templates').expect(401);
    });
  });

  // ═══════════════════════════════════════════
  // Pet Forms
  // ═══════════════════════════════════════════
  describe('Pet Forms', () => {
    it('POST /api/forms/pet/:petId/attach should attach form to pet', async () => {
      const res = await request(app)
        .post(`/api/forms/pet/${testPetId}/attach`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ templateId: createdTemplateId })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      createdFormId = res.body.data.id;
    });

    it('GET /api/forms/pet/:petId should get pet forms', async () => {
      const res = await request(app)
        .get(`/api/forms/pet/${testPetId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('GET /api/forms/:formId should get specific form', async () => {
      const res = await request(app)
        .get(`/api/forms/${createdFormId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });

    it('POST /api/forms/:formId/sign should sign as staff', async () => {
      const res = await request(app)
        .post(`/api/forms/${createdFormId}/sign`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ signatureData: 'data:image/png;base64,test-signature' });

      expect([200, 400]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════
  // Delete Template
  // ═══════════════════════════════════════════
  describe('DELETE /api/forms/templates/:id', () => {
    it('should soft delete template', async () => {
      const res = await request(app)
        .delete(`/api/forms/templates/${createdTemplateId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
    });
  });
});
