import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterEach, beforeEach, vi } from 'vitest';

// Mock localStorage for tests
const localStorageMock = {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};

Object.defineProperty(globalThis, 'localStorage', {
    value: localStorageMock,
    writable: true,
});

// Reset mocks before each test
beforeEach(() => {
    vi.clearAllMocks();
});

// Cleanup after each test case (e.g. clearing jsdom)
afterEach(() => {
    cleanup();
});
