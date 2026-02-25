// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Import API Tests
// NOTE: Import routes are NOT currently mounted in app.ts
// These tests verify 404 until the route is mounted
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken } from '../helpers';

describe('Import API', () => {
  let adminToken: string;

  beforeAll(async () => {
    await cleanDatabase();
    const user = await createTestUser();
    adminToken = generateAdminToken({ id: user.id, email: user.email });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  describe('POST /api/import/clients-pets', () => {
    it('should return 404 (route not mounted)', async () => {
      // Import routes exist but are not currently mounted in app.ts
      const res = await request(app)
        .post('/api/import/clients-pets')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          rows: [
            {
              ownerFirstName: 'Import',
              ownerLastName: 'Test',
              phone: '+966500000080',
              petName: 'Imported Pet',
              species: 'DOG',
              gender: 'MALE',
            },
          ],
        });

      expect(res.status).toBe(404);
    });
  });
});
