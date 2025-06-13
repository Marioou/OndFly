/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFilesAfterEnv: [
    '@testing-library/jest-dom',
    '<rootDir>/tests/jest.setup.ts'
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(@firebase|firebase|node-fetch)/)',
  ],
  testTimeout: 60000, // Increased timeout to 60 seconds for long-running tests
  testEnvironmentOptions: {
    url: 'http://localhost/'
  },
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json'
    }
  }
};
