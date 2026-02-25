// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Pets API Tests
// Tests for pet management endpoints
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Pets API', () => {
  let adminToken: string;
  let testOwnerId: string;
  let createdPetId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });

    // Create an owner for pet tests
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Pet', lastName: 'Owner', phone: '+966500000010' });

    testOwnerId = ownerRes.body.data.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/pets', () => {
    it('should create a new pet', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Buddy',
          species: 'DOG',
          gender: 'MALE',
          ownerId: testOwnerId,
          breed: 'Golden Retriever',
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Buddy');
      expect(res.body.data.species).toBe('DOG');
      expect(res.body.data).toHaveProperty('petCode');
      createdPetId = res.body.data.id;
    });

    it('should reject missing required fields', async () => {
      const res = await request(app)
        .post('/api/pets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ name: 'Only Name' });

      expect([400, 422]).toContain(res.status);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/pets')
        .send({ name: 'NoAuth', species: 'CAT', gender: 'FEMALE', ownerId: testOwnerId })
        .expect(401);
    });
  });

  describe('POST /api/pets/with-owner', () => {
    it('should create owner and pet atomically', async () => {
      const res = await request(app)
        .post('/api/pets/with-owner')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          owner: { firstName: 'New', lastName: 'Client', phone: '+966500000020' },
          pet: { name: 'Kitty', species: 'CAT', gender: 'FEMALE' },
        })
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Kitty');
      expect(res.body.data.owner).toHaveProperty('id');
    });
  });

  describe('GET /api/pets', () => {
    it('should return list of pets', async () => {
      const res = await request(app)
        .get('/api/pets')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data)).toBe(true);
      expect(res.body.data.length).toBeGreaterThan(0);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .get('/api/pets')
        .expect(401);
    });
  });
});
