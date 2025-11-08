/**
 * Admin 頁面 UI smoke 測試
 */
import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { AdminProducts } from '../pages/Admin/AdminProducts';
import { AdminOrders } from '../pages/Admin/AdminOrders';
import { AdminUsers } from '../pages/Admin/AdminUsers';

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

describe('Admin Pages', () => {
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

  describe('AdminProducts', () => {
    it('應該渲染商品管理頁面', () => {
      renderWithProviders(<AdminProducts />);
      
      expect(screen.getByText('商品管理')).toBeInTheDocument();
      expect(screen.getByText('管理系統商品資料')).toBeInTheDocument();
    });

    it('應該顯示新增商品按鈕', () => {
      renderWithProviders(<AdminProducts />);
      
      expect(screen.getByText('新增商品')).toBeInTheDocument();
    });

    it('應該顯示篩選條件', () => {
      renderWithProviders(<AdminProducts />);
      
      expect(screen.getByPlaceholderText('搜尋 SKU 或商品名稱')).toBeInTheDocument();
      expect(screen.getByDisplayValue('全部分類')).toBeInTheDocument();
    });

    it('應該處理商品載入錯誤', async () => {
           (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch products'));

      renderWithProviders(<AdminProducts />);

      await waitFor(() => {
        expect(screen.getByText(/暫無商品資料|載入失敗/)).toBeInTheDocument();
      });
    });
  });

  describe('AdminOrders', () => {
    it('應該渲染訂單管理頁面', () => {
      renderWithProviders(<AdminOrders />);
      
      expect(screen.getByText('訂單管理')).toBeInTheDocument();
      expect(screen.getByText('管理系統訂單資料')).toBeInTheDocument();
    });

    it('應該顯示訂單篩選條件', () => {
      renderWithProviders(<AdminOrders />);
      
      expect(screen.getByDisplayValue('全部狀態')).toBeInTheDocument();
    });

    it('應該處理訂單載入錯誤', async () => {
           (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch orders'));

      renderWithProviders(<AdminOrders />);

      await waitFor(() => {
        expect(screen.getByText(/暫無訂單資料|載入失敗/)).toBeInTheDocument();
      });
    });
  });

  describe('AdminUsers', () => {
    it('應該渲染用戶管理頁面', () => {
      renderWithProviders(<AdminUsers />);
      
      expect(screen.getByText('用戶管理')).toBeInTheDocument();
      expect(screen.getByText('管理系統用戶資料')).toBeInTheDocument();
    });

    it('應該顯示新增用戶按鈕', () => {
      renderWithProviders(<AdminUsers />);
      
      expect(screen.getByText('新增用戶')).toBeInTheDocument();
    });

    it('應該處理用戶載入錯誤', async () => {
           (globalThis as any).fetch = vi.fn().mockRejectedValue(new Error('Failed to fetch users'));

      renderWithProviders(<AdminUsers />);

      await waitFor(() => {
        expect(screen.getByText(/暫無用戶資料|載入失敗/)).toBeInTheDocument();
      });
    });
  });
});
