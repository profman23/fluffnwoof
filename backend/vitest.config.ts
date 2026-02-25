// ══════════════════════════════════════════════════════════════
// FluffNwoof Backend - Vitest Configuration
// Testing framework configuration with coverage thresholds
// ══════════════════════════════════════════════════════════════

import { defineConfig } from 'vitest/config';
import path from 'path';

export default defineConfig({
  test: {
    // Use globals for describe, it, expect without imports
    globals: true,

    // Node environment for backend tests
    environment: 'node',

    // Setup file for test database connection
    setupFiles: ['./src/tests/setup.ts'],

    // Test file patterns
    include: ['src/**/*.test.ts', 'src/**/*.spec.ts'],
    exclude: ['node_modules', 'dist'],

    // Coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/**',
        'dist/**',
        'prisma/**',
        '**/*.d.ts',
        'src/tests/**',
        'src/types/**',
      ],
      // Coverage thresholds - CI fails if coverage drops below these values
      // Current: ~47% stmts, ~52% branch, ~58% funcs - set floor slightly below
      // Target: 85% (increase as more unit tests are added)
      thresholds: {
        lines: 40,
        functions: 45,
        branches: 40,
        statements: 40,
      },
    },

    // Timeouts (60s for load tests with concurrent DB operations)
    testTimeout: 60000,
    hookTimeout: 60000,

    // Reporter configuration
    reporters: ['default'],

    // Run test files sequentially (required for shared database)
    fileParallelism: false,

    // Pool configuration for database tests
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true, // Use single fork for database tests
      },
    },
  },

  // Path aliases
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
