// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - AI Doctor Assist API Tests (Mocked)
// The Anthropic service is mocked — NO real API calls / no credits used.
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import request from 'supertest';

// Mock the AI service BEFORE importing app (vi.mock is hoisted).
const mockResult = {
  differentials: [
    { name: 'Gastroenteritis', likelihood: 'high', reasoning: 'Vomiting + lethargy.' },
  ],
  recommendedTests: [{ name: 'CBC', reason: 'Assess infection/anemia.' }],
  questionsForVet: ['How long has the vomiting lasted?'],
  missingDataNote: null,
  disclaimer: "AI-generated supportive suggestions. Final decision is the vet's.",
};

vi.mock('../../services/aiDiagnosisService', () => {
  const svc = {
    assess: vi.fn(async (input: any) => {
      // Mimic the real "final round" behaviour: when answers are provided,
      // return no further questions.
      if (input?.answers && input.answers.length > 0) {
        return { success: true, data: { ...mockResult, questionsForVet: [] } };
      }
      return { success: true, data: mockResult };
    }),
  };
  return { aiDiagnosisService: svc };
});

import app from '../../app';
import prisma from '../../config/database';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken, generateUserToken } from '../helpers';

describe('AI Doctor Assist API', () => {
  let adminToken: string;
  let userToken: string;
  let petId: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
    // A non-admin user on TestRole with NO aiDiagnosis permission.
    userToken = generateUserToken({ id: user.id, email: user.email, role: 'TestRole' });

    // Create owner + pet via API so codes are generated correctly.
    const ownerRes = await request(app)
      .post('/api/owners')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ firstName: 'AI', lastName: 'Owner', phone: '+966500009001' });
    const ownerId = ownerRes.body.data.id;

    const pet = await prisma.pet.create({
      data: {
        name: 'Rex',
        species: 'DOG',
        gender: 'MALE',
        breed: 'Golden Retriever',
        ownerId,
        petCode: `PET-AITEST-${Date.now()}`,
      },
    });
    petId = pet.id;
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/ai-diagnosis/assess', () => {
    it('should return a structured assessment for ADMIN', async () => {
      const res = await request(app)
        .post('/api/ai-diagnosis/assess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId,
          lang: 'en',
          visit: { chiefComplaint: 'Vomiting', temperature: 39, heartRate: 120 },
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(Array.isArray(res.body.data.differentials)).toBe(true);
      expect(res.body.data.differentials.length).toBeGreaterThan(0);
      expect(res.body.data).toHaveProperty('recommendedTests');
      expect(res.body.data).toHaveProperty('questionsForVet');
      expect(res.body.data).toHaveProperty('disclaimer');
    });

    it('should return NO further questions on the final round (with answers)', async () => {
      const res = await request(app)
        .post('/api/ai-diagnosis/assess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          petId,
          lang: 'en',
          visit: { chiefComplaint: 'Vomiting' },
          answers: [{ question: 'How long?', answer: '2 days' }],
        })
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data.questionsForVet).toEqual([]);
    });

    it('should reject without petId (400)', async () => {
      await request(app)
        .post('/api/ai-diagnosis/assess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ lang: 'en', visit: {} })
        .expect(400);
    });

    it('should return 404 for a non-existent pet', async () => {
      await request(app)
        .post('/api/ai-diagnosis/assess')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ petId: '00000000-0000-0000-0000-000000000000', lang: 'en', visit: {} })
        .expect(404);
    });

    it('should reject without auth (401)', async () => {
      await request(app)
        .post('/api/ai-diagnosis/assess')
        .send({ petId, lang: 'en', visit: {} })
        .expect(401);
    });

    it('should reject a user without aiDiagnosis permission (403)', async () => {
      await request(app)
        .post('/api/ai-diagnosis/assess')
        .set('Authorization', `Bearer ${userToken}`)
        .send({ petId, lang: 'en', visit: {} })
        .expect(403);
    });
  });
});
