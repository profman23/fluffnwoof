// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Lost Customers Report API Tests
// ══════════════════════════════════════════════════════════════

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { prisma, cleanDatabase, createTestUser } from '../setup';
import { generateAdminToken, generateUserToken } from '../helpers';

describe('Lost Customers Report API', () => {
  let adminToken: string;
  let vetMandourId: string;
  let vetOtherId: string;

  // Pets we will assert on
  let petInRangeMandour: string; // last visit Feb (Mandour) — should appear
  let petInRangeOther: string;   // last visit Mar (Other vet)  — should appear (no vet filter)
  let petReturned: string;       // visited Feb but returned in June — should NOT appear

  beforeAll(async () => {
    await cleanDatabase();
    const admin = await createTestUser();
    adminToken = generateAdminToken({ id: admin.id, email: admin.email });

    // Two vets reuse the same TestRole created by createTestUser
    const role = await prisma.role.findFirstOrThrow({ where: { name: 'TestRole' } });
    const vetMandour = await prisma.user.create({
      data: {
        email: `mandour-${Date.now()}@test.com`,
        password: 'x',
        firstName: 'Ahmed',
        lastName: 'Mandour',
        roleId: role.id,
      },
    });
    const vetOther = await prisma.user.create({
      data: {
        email: `other-${Date.now()}@test.com`,
        password: 'x',
        firstName: 'Other',
        lastName: 'Vet',
        roleId: role.id,
      },
    });
    vetMandourId = vetMandour.id;
    vetOtherId = vetOther.id;

    // One owner, several pets
    const owner = await prisma.owner.create({
      data: {
        firstName: 'Lost',
        lastName: 'Owner',
        phone: `+9665001${Date.now().toString().slice(-5)}`,
        customerCode: `LC${Date.now().toString().slice(-6)}`,
      },
    });

    const mkPet = async (suffix: string) =>
      prisma.pet.create({
        data: {
          name: `Pet-${suffix}`,
          species: 'DOG',
          gender: 'MALE',
          ownerId: owner.id,
          petCode: `P-${suffix}-${Date.now().toString().slice(-5)}`,
        },
      });

    const p1 = await mkPet('mandour');
    const p2 = await mkPet('other');
    const p3 = await mkPet('returned');
    petInRangeMandour = p1.id;
    petInRangeOther = p2.id;
    petReturned = p3.id;

    // p1: last visit Feb 2026 with Mandour (also an earlier Jan visit)
    await prisma.medicalRecord.createMany({
      data: [
        { petId: p1.id, vetId: vetMandourId, visitDate: new Date('2026-01-10T10:00:00.000Z') },
        { petId: p1.id, vetId: vetMandourId, visitDate: new Date('2026-02-15T10:00:00.000Z') },
      ],
    });

    // p2: single visit Mar 2026 with Other vet
    await prisma.medicalRecord.create({
      data: { petId: p2.id, vetId: vetOtherId, visitDate: new Date('2026-03-05T10:00:00.000Z') },
    });

    // p3: visited Feb 2026 but RETURNED in June 2026 -> last visit out of range
    await prisma.medicalRecord.createMany({
      data: [
        { petId: p3.id, vetId: vetMandourId, visitDate: new Date('2026-02-20T10:00:00.000Z') },
        { petId: p3.id, vetId: vetMandourId, visitDate: new Date('2026-06-01T10:00:00.000Z') },
      ],
    });
  });

  afterAll(async () => {
    await cleanDatabase();
  });

  const baseRange = { startDate: '2026-01-01', endDate: '2026-04-30' };

  it('returns pets whose LAST visit falls inside the range and excludes returned pets', async () => {
    const res = await request(app)
      .get('/api/reports/lost-customers')
      .query(baseRange)
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body).toHaveProperty('success', true);
    expect(res.body.data).toHaveProperty('data');
    const ids = res.body.data.data.map((r: any) => r.petId);

    expect(ids).toContain(petInRangeMandour);
    expect(ids).toContain(petInRangeOther);
    expect(ids).not.toContain(petReturned); // returned in June -> excluded
    expect(res.body.data.total).toBe(2);
  });

  it('filters by vet — only pets whose LAST visit was with that vet', async () => {
    const res = await request(app)
      .get('/api/reports/lost-customers')
      .query({ ...baseRange, vetId: vetMandourId })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    const ids = res.body.data.data.map((r: any) => r.petId);
    expect(ids).toContain(petInRangeMandour);
    expect(ids).not.toContain(petInRangeOther);   // last visit was Other vet
    expect(ids).not.toContain(petReturned);
    expect(res.body.data.total).toBe(1);

    const row = res.body.data.data.find((r: any) => r.petId === petInRangeMandour);
    expect(row.lastVetName).toBe('Ahmed Mandour');
    expect(row.totalVisits).toBe(2);
    expect(row).toHaveProperty('customerCode');
    expect(row).toHaveProperty('phone');
  });

  it('returns empty for a range with no last-visits', async () => {
    const res = await request(app)
      .get('/api/reports/lost-customers')
      .query({ startDate: '2099-01-01', endDate: '2099-12-31' })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.total).toBe(0);
    expect(res.body.data.data.length).toBe(0);
  });

  it('supports pagination', async () => {
    const res = await request(app)
      .get('/api/reports/lost-customers')
      .query({ ...baseRange, page: 1, limit: 1 })
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(200);

    expect(res.body.data.page).toBe(1);
    expect(res.body.data.limit).toBe(1);
    expect(res.body.data.data.length).toBe(1);
    expect(res.body.data.total).toBe(2);
    expect(res.body.data.totalPages).toBe(2);
  });

  it('rejects without auth (401)', async () => {
    await request(app).get('/api/reports/lost-customers').expect(401);
  });

  it('rejects a user without the screen permission (403)', async () => {
    const user = await createTestUser({ email: `noperm-${Date.now()}@test.com` });
    const userToken = generateUserToken({ id: user.id, email: user.email, role: 'TestRole' });

    await request(app)
      .get('/api/reports/lost-customers')
      .query(baseRange)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(403);
  });
});
