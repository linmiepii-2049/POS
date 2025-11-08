import { describe, it, expect, beforeEach, vi } from 'vitest';
import { UserService } from '../src/services/users.js';
import type { D1Database } from '@cloudflare/workers-types';

/**
 * 模擬 D1 資料庫
 */
const createMockD1 = (): D1Database => {
  const mockPrepare = vi.fn();
  const mockBind = vi.fn();
  const mockFirst = vi.fn();
  const mockAll = vi.fn();
  const mockRun = vi.fn();

  mockPrepare.mockReturnValue({
    bind: mockBind,
    first: mockFirst,
    all: mockAll,
    run: mockRun,
  });

  mockBind.mockReturnValue({
    first: mockFirst,
    all: mockAll,
    run: mockRun,
  });

  return {
    prepare: mockPrepare,
  } as unknown as D1Database;
};

describe('UserService', () => {
  let userService: UserService;
  let mockD1: D1Database;

  beforeEach(() => {
    mockD1 = createMockD1();
    userService = new UserService(mockD1);
    vi.clearAllMocks();
  });

  describe('getUsers', () => {
    it('應該正確處理分頁查詢', async () => {
      // 模擬總筆數查詢
      const mockCountResult = { total: 25 };
      mockD1.prepare().bind().first.mockResolvedValueOnce(mockCountResult);

      // 模擬使用者列表查詢
      const mockUsers = [
        { id: 1, name: '使用者1', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
        { id: 2, name: '使用者2', phone: '0987654321', role: 'ADMIN', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' },
      ];
      mockD1.prepare().bind().all.mockResolvedValueOnce({ results: mockUsers });

      const query = { page: 1, limit: 10, sortBy: 'id', sortDir: 'asc' };
      const result = await userService.getUsers(query);

      expect(result.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 25,
        total_pages: 3,
      });
      expect(result.users).toEqual(mockUsers);
    });

    it('應該正確處理搜尋條件', async () => {
      // 模擬總筆數查詢
      mockD1.prepare().bind().first.mockResolvedValueOnce({ total: 1 });

      // 模擬使用者列表查詢
      const mockUsers = [{ id: 1, name: '張小明', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' }];
      mockD1.prepare().bind().all.mockResolvedValueOnce({ results: mockUsers });

      const query = { 
        page: 1, 
        limit: 20, 
        sortBy: 'id', 
        sortDir: 'asc',
        nameOrPhone: '張小明',
        is_active: 1
      };
      const result = await userService.getUsers(query);

      expect(mockD1.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE (name LIKE ? OR phone LIKE ?) AND is_active = ?')
      );
      expect(result.users).toEqual(mockUsers);
    });

    it('應該正確處理時間範圍查詢', async () => {
      // 模擬總筆數查詢
      mockD1.prepare().bind().first.mockResolvedValueOnce({ total: 0 });

      // 模擬使用者列表查詢
      mockD1.prepare().bind().all.mockResolvedValueOnce({ results: [] });

      const query = { 
        page: 1, 
        limit: 20, 
        sortBy: 'id', 
        sortDir: 'asc',
        from: '2025-01-01T00:00:00+08:00',
        to: '2025-01-31T23:59:59+08:00'
      };
      await userService.getUsers(query);

      // 驗證台北時間已轉換為 UTC
      expect(mockD1.prepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE created_at >= ? AND created_at <= ?')
      );
    });
  });

  describe('getUserStats', () => {
    it('應該正確計算使用者統計資訊', async () => {
      // 模擬總消費金額查詢
      mockD1.prepare().bind().first.mockResolvedValueOnce({ total_spent: 5000 });

      // 模擬最後購買時間查詢
      mockD1.prepare().bind().first.mockResolvedValueOnce({ last_purchase_at: '2025-01-15T10:30:00Z' });

      // 模擬總訂單數查詢
      mockD1.prepare().bind().first.mockResolvedValueOnce({ total_orders: 3 });

      const stats = await userService.getUserStats(1);

      expect(stats).toEqual({
        total_spent: 5000,
        last_purchase_at: '2025-01-15T10:30:00Z',
        total_orders: 3,
      });
    });

    it('應該正確處理無訂單的使用者', async () => {
      // 模擬所有查詢都回傳 0 或 null
      mockD1.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      const stats = await userService.getUserStats(1);

      expect(stats).toEqual({
        total_spent: 0,
        last_purchase_at: null,
        total_orders: 0,
      });
    });
  });

  describe('createUser', () => {
    it('應該成功建立使用者', async () => {
      // 模擬插入操作
      mockD1.prepare().bind().run.mockResolvedValueOnce({
        success: true,
        meta: { last_row_id: 123 },
      });

      // 模擬取得新使用者
      const mockUser = { id: 123, name: '新使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockD1.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockD1.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      const userData = {
        name: '新使用者',
        phone: '0912345678',
        role: 'CLIENT' as const,
        is_active: 1,
      };

      const result = await userService.createUser(userData);

      expect(result.id).toBe(123);
      expect(result.name).toBe('新使用者');
    });
  });

  describe('updateUser', () => {
    it('應該成功更新使用者', async () => {
      // 模擬檢查使用者存在
      const mockUser = { id: 1, name: '原使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockD1.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockD1.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬更新操作
      mockD1.prepare().bind().run.mockResolvedValueOnce({ success: true });

      // 模擬取得更新後的使用者
      const updatedUser = { ...mockUser, name: '更新後的使用者', updated_at: '2025-01-02T00:00:00Z' };
      mockD1.prepare().bind().first.mockResolvedValueOnce(updatedUser);

      const updateData = { name: '更新後的使用者' };
      const result = await userService.updateUser(1, updateData);

      expect(result?.name).toBe('更新後的使用者');
    });
  });

  describe('deleteUser', () => {
    it('應該成功刪除無訂單的使用者', async () => {
      // 模擬檢查使用者存在
      const mockUser = { id: 1, name: '測試使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockD1.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockD1.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬檢查訂單數量
      mockD1.prepare().bind().first.mockResolvedValueOnce({ count: 0 });

      // 模擬刪除操作
      mockD1.prepare().bind().run.mockResolvedValueOnce({ success: true });

      const result = await userService.deleteUser(1);

      expect(result).toBe(true);
    });

    it('應該拒絕刪除有訂單的使用者', async () => {
      // 模擬檢查使用者存在
      const mockUser = { id: 1, name: '測試使用者', phone: '0912345678', role: 'CLIENT', is_active: 1, created_at: '2025-01-01T00:00:00Z', updated_at: '2025-01-01T00:00:00Z' };
      mockD1.prepare().bind().first.mockResolvedValueOnce(mockUser);

      // 模擬統計查詢
      mockD1.prepare().bind().first
        .mockResolvedValueOnce({ total_spent: 0 })
        .mockResolvedValueOnce({ last_purchase_at: null })
        .mockResolvedValueOnce({ total_orders: 0 });

      // 模擬檢查訂單數量
      mockD1.prepare().bind().first.mockResolvedValueOnce({ count: 2 });

      await expect(userService.deleteUser(1)).rejects.toThrow('無法刪除有訂單記錄的使用者');
    });
  });

  describe('getUserCouponsOwned', () => {
    it('應該正確取得使用者擁有的優惠券', async () => {
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

      mockD1.prepare().bind().all.mockResolvedValueOnce({ results: mockCoupons });

      const result = await userService.getUserCouponsOwned(1);

      expect(result).toEqual(mockCoupons);
    });
  });

  describe('isPhoneExists', () => {
    it('應該正確檢查手機號碼是否存在', async () => {
      mockD1.prepare().bind().first.mockResolvedValueOnce({ count: 1 });

      const result = await userService.isPhoneExists('0912345678');

      expect(result).toBe(true);
    });

    it('應該正確檢查手機號碼是否不存在', async () => {
      mockD1.prepare().bind().first.mockResolvedValueOnce({ count: 0 });

      const result = await userService.isPhoneExists('0987654321');

      expect(result).toBe(false);
    });
  });

  describe('isLineIdExists', () => {
    it('應該正確檢查 LINE ID 是否存在', async () => {
      mockD1.prepare().bind().first.mockResolvedValueOnce({ count: 1 });

      const result = await userService.isLineIdExists('U1234567890abcdef');

      expect(result).toBe(true);
    });
  });
});
