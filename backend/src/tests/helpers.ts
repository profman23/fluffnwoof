// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Test Helpers
// JWT token generation and utility functions for tests
// ══════════════════════════════════════════════════════════════

import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const TEST_JWT_SECRET = 'test-secret-key-for-testing';

interface TestUserPayload {
  id: string;
  email: string;
  role: string;
  firstName: string;
  lastName: string;
}

interface TestCustomerPayload {
  id: string;
  email: string;
}

/**
 * Generate a JWT token for an admin user (bypasses all permission checks)
 */
export function generateAdminToken(user?: Partial<TestUserPayload>): string {
  return jwt.sign(
    {
      id: user?.id || 'test-admin-id',
      email: user?.email || 'admin@test.com',
      role: 'ADMIN',
      firstName: user?.firstName || 'Test',
      lastName: user?.lastName || 'Admin',
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate a JWT token for a regular user (subject to permission checks)
 */
export function generateUserToken(user: Partial<TestUserPayload>): string {
  return jwt.sign(
    {
      id: user.id || 'test-user-id',
      email: user.email || 'user@test.com',
      role: user.role || 'TestRole',
      firstName: user.firstName || 'Test',
      lastName: user.lastName || 'User',
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Generate a JWT token for a customer portal user (type: 'customer')
 */
export function generateCustomerToken(customer?: Partial<TestCustomerPayload>): string {
  return jwt.sign(
    {
      id: customer?.id || 'test-customer-id',
      email: customer?.email || 'customer@test.com',
      type: 'customer',
    },
    TEST_JWT_SECRET,
    { expiresIn: '1h' }
  );
}

/**
 * Create an owner with portal access for customer auth tests
 */
export async function createTestOwnerWithPortal(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {}
) {
  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  const ts = Date.now().toString().slice(-6);
  return prisma.owner.create({
    data: {
      firstName: 'Portal',
      lastName: 'Customer',
      phone: `+966500${ts}`,
      email: `portal-${ts}@test.com`,
      customerCode: `CT${ts}`,
      isVerified: true,
      portalEnabled: true,
      passwordHash: hashedPassword,
      ...overrides,
    },
  });
}

/**
 * Create a visit type for testing
 */
export async function createTestVisitType(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {}
) {
  return prisma.visitType.create({
    data: {
      nameEn: 'General Checkup',
      nameAr: 'فحص عام',
      color: '#4CAF50',
      duration: 30,
      isActive: true,
      sortOrder: 1,
      ...overrides,
    },
  });
}

/**
 * Create a service product category for testing
 */
export async function createTestCategory(
  prisma: PrismaClient,
  overrides: Record<string, unknown> = {}
) {
  return prisma.serviceCategory.create({
    data: {
      nameEn: 'Test Category',
      nameAr: 'فئة اختبار',
      ...overrides,
    },
  });
}
