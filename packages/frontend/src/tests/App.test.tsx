/**
 * App 元件 UI smoke 測試
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from '../App';
import { useGetHealth, useGetVersion } from '../api/mockClient';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

describe('App', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
        mutations: { retry: false },
      },
    });
  });

  const renderWithProviders = (component: React.ReactElement) => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          {component}
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('應該渲染主要標題', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('POS 系統前端')).toBeInTheDocument();
  });

  it('應該渲染重新載入按鈕', () => {
    renderWithProviders(<App />);
    
    const reloadButton = screen.getByRole('button', { name: /載入中\.\.\.|重新載入/ });
    expect(reloadButton).toBeInTheDocument();
  });

  it('應該顯示健康檢查和版本資訊區塊', () => {
    renderWithProviders(<App />);
    
    expect(screen.getByText('健康檢查')).toBeInTheDocument();
    expect(screen.getByText('版本資訊')).toBeInTheDocument();
  });

  it('應該處理 API 錯誤', async () => {
    // Mock fetch 回傳錯誤
    (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    renderWithProviders(<App />);

    await waitFor(() => {
      expect(screen.getByText('無法載入健康檢查資料')).toBeInTheDocument();
      expect(screen.getByText('無法載入版本資訊')).toBeInTheDocument();
    });
  });

  it('應該處理成功的 API 回應', async () => {
    // Mock orval hooks 返回包裝後的響應資料
    const mockHealthResponse = {
      data: {
        ok: true,
        timestamp: '2024-01-01T00:00:00Z',
        timezone: 'Asia/Taipei',
        localTime: '2024-01-01 08:00:00',
      },
      status: 200,
      headers: {},
    };

    const mockVersionResponse = {
      data: {
        version: '1.0.0',
        name: 'pos-system',
      },
      status: 200,
      headers: {},
    };

    // Mock hooks 返回成功資料
    (useGetHealth as any).mockReturnValue({
      data: mockHealthResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    (useGetVersion as any).mockReturnValue({
      data: mockVersionResponse,
      isLoading: false,
      error: null,
      refetch: vi.fn(),
    });

    renderWithProviders(<App />);

    expect(screen.getByText('正常')).toBeInTheDocument();
    expect(screen.getByText('1.0.0')).toBeInTheDocument();
  });
});
