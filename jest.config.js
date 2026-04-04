/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.js'],
  // Load env variables from .env.local
  setupFiles: ['./jest.setup.js'],
  // Timeout for API tests (30 seconds for network requests)
  testTimeout: 30000,
  // Verbose output for better debugging
  verbose: true,
  // JSON reporter for programmatic consumption
  reporters: [
    'default',
    ['./jest-json-reporter.js', {}]
  ],
};

module.exports = config;
