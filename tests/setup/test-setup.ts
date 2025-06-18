// Global test setup
import { afterAll, beforeAll } from 'vitest';

// Global test configuration
beforeAll(() => {
  // Setup global test environment
  console.log('Setting up test environment...');
});

afterAll(() => {
  // Cleanup global test environment
  console.log('Cleaning up test environment...');
});

// Mock console methods for cleaner test output
const originalConsole = { ...console };

// Restore console after each test
afterAll(() => {
  Object.assign(console, originalConsole);
});
