import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { Env } from '../src/env.d.js';

/**
 * 模擬 D1 資料庫
 */
const createMockD1 = () => {
  const mockPrepare = vi.fn();
  const mockBind = vi.fn();
  const mockFirst = vi.fn();
  const mockAll = vi.fn();
  const mockRun = vi.fn();

  // 每次 prepare 都回傳新的物件
  mockPrepare.mockImplementation(() => ({
    bind: vi.fn().mockReturnValue({
      first: mockFirst,
      all: mockAll,
      run: mockRun,
    }),
  }));

  return {
    prepare: mockPrepare,
  };
};

/**
 * 模擬環境變數
 */
const createMockEnv = (): Env => ({
  DB: createMockD1() as any,
  NODE_ENV: 'test',
});

describe('Users Routes', () => {
  let app: ReturnType<typeof createApp>;
  let mockEnv: Env;

  beforeEach(() => {
    mockEnv = createMockEnv();
    app = createApp();
    vi.clearAllMocks();
  });

  describe('GET /api/users', () => {
    it('應該成功取得使用者列表', async () => {
      // 模擬資料庫查詢
      const mockUsers = [
        { id: 1, name: '使用者1', phone: '0912345678', role: 'CLIENT', is_active: 1, points: 0, points_yuan_equivalent: 0, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
        { id: 2, name: '使用者2', phone: '0987654321', role: 'ADMIN', is_active: 1, points: 0, points_yuan_equivalent: 0, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      ];

      // 模擬總筆數查詢
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({ total: 2 });

      // 模擬使用者列表查詢
      mockEnv.DB.prepare().bind().all.mockResolvedValueOnce({ results: mockUsers });

      const response = await app.request('/api/users?page=1&limit=10', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockUsers);
      expect(data.pagination.total).toBe(2);
    });

    it('應該正確處理查詢參數', async () => {
      // 模擬資料庫查詢
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({ total: 1 });
      mockEnv.DB.prepare().bind().all.mockResolvedValueOnce({ results: [] });

      const response = await app.request('/api/users?page=2&limit=5&sortBy=name&sortDir=desc&nameOrPhone=張&is_active=1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      expect(mockEnv.DB.prepare).toHaveBeenCalled();
    });
  });

  describe('GET /api/users/:id', () => {
    it('應該成功取得使用者詳細資訊', async () => {
      const mockUser = { 
        id: 1, 
        name: '使用者1', 
        phone: '0912345678', 
        role: 'CLIENT', 
        is_active: 1, 
        created_at: '2025-01-01T00:00:00Z', 
        updated_at: '2025-01-01T00:00:00Z' 
      };

      // 模擬取得使用者基本資訊
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 5000 })
        .mockResolvedValueOnce({ last_purchase_at: '2025-01-15T10:30:00Z' })
        .mockResolvedValueOnce({ total_orders: 3 });

      const response = await app.request('/api/users/1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(1);
      expect(data.data.stats.total_spent).toBe(5000);
    });

    it('應該回傳 404 當使用者不存在', async () => {
      // 模擬使用者不存在
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(null);

      const response = await app.request('/api/users/999', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在');
    });
  });

  describe('POST /api/users', () => {
    it('應該成功建立使用者', async () => {
      const userData = {
        name: '新使用者',
        phone: '0912345678',
        role: 'CLIENT',
        is_active: 1,
      };

      // 模擬檢查手機號碼不存在
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({ count: 0 });

      // 模擬建立使用者
      mockEnv.DB.prepare().bind().run.mockResolvedValueOnce({
        success: true,
        meta: { last_row_id: 123 },
      });

      // 模擬取得新使用者
      const mockUser = { id: 123, ...userData, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      const response = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }, mockEnv);

      expect(response.status).toBe(201);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('新使用者');
    });

    it('應該回傳 409 當手機號碼已存在', async () => {
      const userData = {
        name: '新使用者',
        phone: '0912345678',
        role: 'CLIENT',
      };

      // 模擬手機號碼已存在
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({ count: 1 });

      const response = await app.request('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData),
      }, mockEnv);

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('手機號碼已存在');
    });
  });

  describe('PUT /api/users/:id', () => {
    it.skip('應該成功更新使用者', async () => {
      const updateData = { name: '更新後的使用者' };

      // 模擬檢查使用者存在（第一次 getUserById）
      const mockUser = { id: 1, name: '原使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬第一次統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬更新操作 - 需要確保 run 方法回傳成功
      mockEnv.DB.prepare().bind().run.mockResolvedValueOnce({ success: true });

      // 模擬取得更新後的使用者（第二次 getUserById）
      const updatedUser = { ...mockUser, name: '更新後的使用者', updated_at: '2025-01-02T00:00:00Z' };
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(updatedUser);

      // 模擬第二次統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      const response = await app.request('/api/users/1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data.name).toBe('更新後的使用者');
    });

    it('應該回傳 404 當使用者不存在', async () => {
      const updateData = { name: '更新後的使用者' };

      // 模擬使用者不存在
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(null);

      const response = await app.request('/api/users/999', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      }, mockEnv);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('應該成功刪除無訂單的使用者', async () => {
      // 模擬檢查使用者存在
      const mockUser = { id: 1, name: '測試使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬檢查訂單數量
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({ count: 0 });

      // 模擬刪除操作
      mockEnv.DB.prepare().bind().run.mockResolvedValueOnce({ success: true });

      const response = await app.request('/api/users/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('使用者已成功刪除');
    });

    it('應該回傳 409 當使用者有訂單記錄', async () => {
      // 模擬檢查使用者存在
      const mockUser = { id: 1, name: '測試使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬檢查訂單數量
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce({ count: 2 });

      const response = await app.request('/api/users/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(409);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('無法刪除有訂單記錄的使用者');
    });
  });

  describe('GET /api/users/:id/coupons/owned', () => {
    it('應該成功取得使用者擁有的優惠券', async () => {
      const mockCoupons = [
        {
          grant_id: 1,
          coupon_id: 1,
          coupon_code_id: 1,
          coupon_name: '新客戶折扣',
          coupon_code: 'WELCOME10',
          discount_type: 'PERCENT',
          percent_off_bps: 1000,
          amount_off_twd: null,
          min_order_twd: 1000,
          allowed_uses: 1,
          used_count: 0,
          remaining_uses: 1,
          granted_at: '2025-01-01T00:00:00Z',
          expires_at: '2025-12-31T23:59:59Z',
          is_active: 1,
        },
      ];

      // 模擬檢查使用者存在
      const mockUser = { id: 1, name: '使用者1', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬取得優惠券
      mockEnv.DB.prepare().bind().all.mockResolvedValueOnce({ results: mockCoupons });

      const response = await app.request('/api/users/1/coupons/owned', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCoupons);
    });

    it('應該回傳 404 當使用者不存在', async () => {
      // 模擬使用者不存在
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(null);

      const response = await app.request('/api/users/999/coupons/owned', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在');
    });
  });

  describe('GET /api/users/by-line-id/:lineId', () => {
    it('應該成功根據 LINE ID 取得使用者資訊', async () => {
      const mockUser = {
        id: 1,
        line_id: 'test-line-id',
        name: '測試使用者',
        phone: '0912345678',
        role: 'CLIENT',
        is_active: 1,
        points: 100,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
        last_purchase_at: null,
        current_month_spending: 0,
        last_month_spending: 0,
      };

      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(mockUser);

      const response = await app.request('/api/users/by-line-id/test-line-id', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 1,
        name: '測試使用者',
        points: 100,
        points_yuan_equivalent: 5,
      });
    });

    it('應該回傳 404 當 LINE ID 不存在', async () => {
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(null);

      const response = await app.request('/api/users/by-line-id/nonexistent', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找不到此 LINE ID 對應的使用者');
    });
  });

  describe('GET /api/users/:id/points-history', () => {
    it('應該成功取得使用者點數交易歷史', async () => {
      const mockUser = {
        id: 1,
        name: '使用者1',
        phone: '0912345678',
        role: 'CLIENT',
        is_active: 1,
        points: 100,
        created_at: '2025-01-01T00:00:00Z',
        updated_at: '2025-01-01T00:00:00Z',
      };

      const mockTransactions = [
        {
          id: 1,
          user_id: 1,
          order_id: 100,
          points_change: 50,
          transaction_type: 'EARN',
          balance_after: 150,
          created_at: '2025-01-02T00:00:00Z',
        },
        {
          id: 2,
          user_id: 1,
          order_id: 101,
          points_change: -20,
          transaction_type: 'REDEEM',
          balance_after: 100,
          created_at: '2025-01-01T00:00:00Z',
        },
      ];

      // 模擬檢查使用者存在
      mockEnv.DB.prepare().bind().first
        .mockResolvedValueOnce(mockUser)
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 })
        .mockResolvedValueOnce({ total: 2 }); // count query

      // 模擬取得交易記錄
      mockEnv.DB.prepare().bind().all.mockResolvedValueOnce({ results: mockTransactions });

      const response = await app.request('/api/users/1/points-history', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);

      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(2);
      expect(data.pagination).toMatchObject({
        page: 1,
        limit: 20,
        total: 2,
        total_pages: 1,
      });
    });

    it('應該回傳 404 當使用者不存在', async () => {
      mockEnv.DB.prepare().bind().first.mockResolvedValueOnce(null);

      const response = await app.request('/api/users/999/points-history', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);

      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在');
    });
  });
});
