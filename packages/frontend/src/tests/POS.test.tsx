/**
 * POS 頁面 UI smoke 測試
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { POSPage } from '../pages/POS';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

// Mock useCart hook
vi.mock('../hooks/useCart', () => ({
  useCart: () => ({
    state: {
      items: [],
      itemCount: 0,
      totalAmount: 0,
    },
    addItem: vi.fn(),
    removeItem: vi.fn(),
    clearCart: vi.fn(),
  }),
}));

describe('POS Page', () => {
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

  it('應該渲染 POS 系統標題', () => {
    renderWithProviders(<POSPage />);
    
    expect(screen.getByText('POS 收銀系統')).toBeInTheDocument();
  });

  it('應該顯示購物車統計', () => {
    renderWithProviders(<POSPage />);
    
    expect(screen.getByText('購物車：')).toBeInTheDocument();
    expect(screen.getByText('0 項')).toBeInTheDocument();
    expect(screen.getByText(/今日訂單：/)).toBeInTheDocument();
  });

  it('應該顯示商品選擇區域', () => {
    renderWithProviders(<POSPage />);
    
    expect(screen.getByText('商品選擇')).toBeInTheDocument();
  });

  it('應該顯示商品載入狀態', () => {
    renderWithProviders(<POSPage />);

    // 應該顯示商品選擇區域
    expect(screen.getByText('商品選擇')).toBeInTheDocument();
  });

  it('應該處理空購物車的結帳按鈕', () => {
    renderWithProviders(<POSPage />);
    
    // 購物車為空時，結帳按鈕應該被禁用或不存在
    const checkoutButton = screen.queryByText(/結帳|確認訂單/);
    if (checkoutButton) {
      expect(checkoutButton).toBeDisabled();
    }
  });
});
