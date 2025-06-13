import '@testing-library/jest-dom';
import 'jest-fetch-mock';

/**
 * @jest-environment jsdom
 */

// Configure fetch mock
global.fetch = require('jest-fetch-mock');
require('jest-fetch-mock').enableMocks();

// Mock de localStorage
const storage = new Map();
const localStorageMock = {
  getItem: (key: string) => storage.get(key) || null,
  setItem: (key: string, value: string) => storage.set(key, value),
  removeItem: (key: string) => storage.delete(key),
  clear: () => storage.clear(),
  length: 0,
  key: () => null,
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// Mock de navigator.onLine
Object.defineProperty(window.navigator, 'onLine', {
  configurable: true,
  value: true,
});

// Long running async tests
jest.setTimeout(30000);

// Reset fetch mocks before each test
beforeEach(() => {
  fetchMock.resetMocks();
});
