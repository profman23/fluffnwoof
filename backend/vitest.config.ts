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
      // Coverage thresholds - will fail CI if not met
      // Start with 0 and gradually increase as tests are added
      thresholds: {
        lines: 0,
        functions: 0,
        branches: 0,
        statements: 0,
      },
    },

    // Timeouts
    testTimeout: 30000,
    hookTimeout: 30000,

    // Reporter configuration
    reporters: ['default'],

    // Pool configuration for parallel tests
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: true, // Use single thread for database tests
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
