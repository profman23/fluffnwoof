// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Test Setup
// Global test configuration and database connection
// ══════════════════════════════════════════════════════════════

import { beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest';
import { PrismaClient } from '@prisma/client';

// Create test Prisma client
const prisma = new PrismaClient({
  log: ['error'],
});

// Mock environment variables for tests
vi.stubEnv('NODE_ENV', 'test');
vi.stubEnv('JWT_SECRET', 'test-secret-key-for-testing');

beforeAll(async () => {
  try {
    // Connect to test database
    await prisma.$connect();
    console.log('📦 Test database connected');
  } catch (error) {
    console.error('❌ Failed to connect to test database:', error);
    throw error;
  }
});

afterAll(async () => {
  try {
    await prisma.$disconnect();
    console.log('📦 Test database disconnected');
  } catch (error) {
    console.error('❌ Failed to disconnect from test database:', error);
  }
});

beforeEach(async () => {
  // Clean specific tables before each test if needed
  // Add cleanup logic here based on test requirements
});

afterEach(async () => {
  // Cleanup after each test
  // Reset any mocks
  vi.clearAllMocks();
});

// Export prisma client for use in tests
export { prisma };

// Helper function to clean all tables (use with caution)
export async function cleanDatabase() {
  const tablenames = await prisma.$queryRaw<
    Array<{ tablename: string }>
  >`SELECT tablename FROM pg_tables WHERE schemaname='public'`;

  const tables = tablenames
    .map(({ tablename }) => tablename)
    .filter((name) => name !== '_prisma_migrations')
    .map((name) => `"public"."${name}"`)
    .join(', ');

  if (tables.length > 0) {
    try {
      await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${tables} CASCADE;`);
    } catch (error) {
      console.error('Failed to clean database:', error);
    }
  }
}

// Helper function to create a test user
export async function createTestUser(overrides = {}) {
  const bcrypt = await import('bcrypt');
  const hashedPassword = await bcrypt.hash('Test123!@#', 10);

  return prisma.user.create({
    data: {
      email: `test-${Date.now()}@fluffnwoof.com`,
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'User',
      isActive: true,
      ...overrides,
    },
  });
}
