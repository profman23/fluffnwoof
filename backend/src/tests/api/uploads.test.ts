// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Uploads API Tests
// Tests for file upload endpoints (user avatar, pet photo, medical attachments)
// Cloudinary is mocked to prevent real uploads during testing
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock Cloudinary BEFORE importing app (must be hoisted)
vi.mock('../../config/cloudinary', () => {
  const memoryStorage = { _handleFile: vi.fn(), _removeFile: vi.fn() };
  return {
    userAvatarStorage: memoryStorage,
    petPhotoStorage: memoryStorage,
    medicalAttachmentStorage: memoryStorage,
    clinicLogoStorage: memoryStorage,
    default: {
      uploader: {
        destroy: vi.fn().mockResolvedValue({ result: 'ok' }),
        upload: vi.fn().mockResolvedValue({
          secure_url: 'https://mock.cloudinary.com/test.jpg',
          public_id: 'mock-id',
        }),
      },
      config: vi.fn(),
    },
  };
});

import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Uploads API', () => {
  let adminToken: string;
  let testUser: any;
  let testPetId: string;
  let testOwnerId: string;

  beforeAll(async () => {
    await cleanDatabase();

    // Create a test user and generate an admin token tied to that user
    testUser = await createTestUser();
    adminToken = generateAdminToken({ id: testUser.id, email: testUser.email });

    // Create an owner for pet-related upload tests
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'Upload', lastName: 'TestOwner', phone: '+966500099001' });

    testOwnerId = ownerRes.body?.data?.id || ownerRes.body?.id;

    // Create a pet for pet photo upload tests
    const petRes = await request(app)
      .post('/api/pets')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({
        name: 'UploadTestPet',
        species: 'DOG',
        gender: 'MALE',
        ownerId: testOwnerId,
      });

    testPetId = petRes.body?.data?.id || petRes.body?.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  // ═══════════════════════════════════════════════════════════
  // Authentication rejection tests
  // ═══════════════════════════════════════════════════════════

  describe('Authentication', () => {
    it('should reject POST /api/upload/user-avatar without auth', async () => {
      const res = await request(app)
        .post('/api/upload/user-avatar');

      // Multer middleware may run before auth, so we get 400 or 401
      expect([400, 401]).toContain(res.status);
    });

    it('should reject DELETE /api/upload/user-avatar without auth (401)', async () => {
      const res = await request(app)
        .delete('/api/upload/user-avatar');

      expect(res.status).toBe(401);
    });

    it('should reject POST /api/upload/pet/:petId/photo without auth', async () => {
      const res = await request(app)
        .post(`/api/upload/pet/${testPetId || 'some-pet-id'}/photo`);

      // Multer middleware may run before auth, so we get 400 or 401
      expect([400, 401]).toContain(res.status);
    });
  });

  // ═══════════════════════════════════════════════════════════
  // User Avatar routes
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/upload/user-avatar', () => {
    it('should return 400 when no file is uploaded', async () => {
      const res = await request(app)
        .post('/api/upload/user-avatar')
        .set('Authorization', `Bearer ${adminToken}`);

      // Without a file, the controller should respond with 400
      // The multer mock storage won't process anything, so req.file will be undefined
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/no file/i);
    });
  });

  describe('DELETE /api/upload/user-avatar', () => {
    it('should handle avatar removal gracefully (200)', async () => {
      const res = await request(app)
        .delete('/api/upload/user-avatar')
        .set('Authorization', `Bearer ${adminToken}`);

      // Should succeed even if the user has no avatar - sets avatarUrl to null
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
      expect(res.body.avatarUrl).toBeNull();
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Pet Photo routes
  // ═══════════════════════════════════════════════════════════

  describe('POST /api/upload/pet/:petId/photo', () => {
    it('should return 400 when no file is uploaded', async () => {
      const res = await request(app)
        .post(`/api/upload/pet/${testPetId}/photo`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Without a file, the controller responds with 400 "No file uploaded"
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('message');
      expect(res.body.message).toMatch(/no file/i);
    });
  });

  describe('DELETE /api/upload/pet/:petId/photo', () => {
    it('should handle pet photo removal gracefully (200)', async () => {
      const res = await request(app)
        .delete(`/api/upload/pet/${testPetId}/photo`)
        .set('Authorization', `Bearer ${adminToken}`);

      // Should succeed even if the pet has no photo - sets photoUrl to null
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('id');
    });
  });

  // ═══════════════════════════════════════════════════════════
  // Medical Attachment routes
  // ═══════════════════════════════════════════════════════════

  describe('GET /api/upload/medical/:recordId/attachments', () => {
    it('should return 200 with empty array for non-existent record', async () => {
      const nonExistentId = '00000000-0000-0000-0000-000000000000';

      const res = await request(app)
        .get(`/api/upload/medical/${nonExistentId}/attachments`)
        .set('Authorization', `Bearer ${adminToken}`);

      // The service does a findMany which returns [] for non-existent records
      expect([200, 404]).toContain(res.status);
      if (res.status === 200) {
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body).toHaveLength(0);
      }
    });
  });
});
