import { resolve } from 'path';

import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup/test-setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'dist/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.test.*',
        '**/*.spec.*',
        '**/index.ts',
        'src/interfaces/dto/',
        'examples/',
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 90,
          lines: 85,
          statements: 85,
        },
        'src/domain/': {
          branches: 90,
          functions: 95,
          lines: 90,
          statements: 90,
        },
      },
    },
    include: [
      'tests/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'node_modules',
      'dist',
      '.idea',
      '.git',
      '.cache',
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@/domain': resolve(__dirname, 'src/domain'),
      '@/application': resolve(__dirname, 'src/application'),
      '@/infrastructure': resolve(__dirname, 'src/infrastructure'),
      '@/interfaces': resolve(__dirname, 'src/interfaces'),
    },
  },
});
