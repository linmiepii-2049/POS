/**
 * 測試環境設定
 */
import { beforeAll, afterEach, afterAll, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import { QueryClient } from '@tanstack/react-query';
import '@testing-library/jest-dom';

// 建立測試用的 QueryClient
export const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      gcTime: 0,
    },
    mutations: {
      retry: false,
    },
  },
});

// 清理 DOM 和 React Testing Library 的副作用
afterEach(() => {
  cleanup();
});

// Mock fetch API
(globalThis as any).fetch = vi.fn();

beforeAll(() => {
  // 設定全域的 fetch mock
  Object.defineProperty((globalThis as any).window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

afterAll(() => {
  vi.restoreAllMocks();
});
