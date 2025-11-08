import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createApp } from '../src/app.js';
import type { Env } from '../src/env.d.js';

/**
 * Mock R2Bucket 實作
 */
const createMockR2Bucket = () => ({
  put: vi.fn().mockResolvedValue({}),
  get: vi.fn().mockResolvedValue(null),
  head: vi.fn().mockResolvedValue(null),
  delete: vi.fn().mockResolvedValue({}),
});

/**
 * Mock D1Database 實作
 */
const createMockD1Database = () => ({
  prepare: vi.fn().mockReturnValue({
    bind: vi.fn().mockReturnValue({
      first: vi.fn().mockResolvedValue(null),
      all: vi.fn().mockResolvedValue({ results: [] }),
      run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
    }),
  }),
});

describe('Coupons API Routes', () => {
  let app: ReturnType<typeof createApp>;
  let mockEnv: Env;

  beforeEach(() => {
    vi.clearAllMocks();
    
    // 建立 mock 環境
    mockEnv = {
      DB: createMockD1Database() as any,
      ASSETS: createMockR2Bucket() as any,
      NODE_ENV: 'development',
    };

    // 建立應用程式
    app = createApp();
  });

  describe('GET /api/coupons', () => {
    it('應該回傳優惠券列表', async () => {
      // Mock 資料庫查詢結果
      const mockCoupons = [
        {
          id: 1,
          name: '測試優惠券',
          discount_type: 'PERCENT',
          percent_off_bps: 1000,
          amount_off_twd: null,
          min_order_twd: 1000,
          max_uses_total: 100,
          starts_at: '2024-01-01T00:00:00Z',
          ends_at: '2024-12-31T23:59:59Z',
          is_active: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          total_redemptions: 5,
          remaining_uses: 95,
          starts_at_taipei: '2024-01-01T08:00:00Z',
          ends_at_taipei: '2025-01-01T07:59:59Z',
          created_at_taipei: '2024-01-01T08:00:00Z',
          updated_at_taipei: '2024-01-01T08:00:00Z',
          is_valid: true,
          is_expired: false,
          is_not_started: false,
          is_fully_redeemed: false,
        },
      ];

      // 設定 mock 行為
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ total: 1 }),
        all: vi.fn().mockResolvedValue({ results: mockCoupons }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCoupons);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });

    it('應該支援搜尋參數', async () => {
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ total: 0 }),
        all: vi.fn().mockResolvedValue({ results: [] }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons?search=測試&discount_type=PERCENT&is_active=1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE')
      );
    });
  });

  describe('GET /api/coupons/:id', () => {
    it('應該回傳指定優惠券的詳細資訊', async () => {
      const mockCoupon = {
        id: 1,
        name: '測試優惠券',
        discount_type: 'PERCENT',
        percent_off_bps: 1000,
        amount_off_twd: null,
        min_order_twd: 1000,
        max_uses_total: 100,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 5,
        remaining_uses: 95,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2025-01-01T07:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockCoupon),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCoupon);
    });

    it('應該回傳 404 當優惠券不存在時', async () => {
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/999', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('優惠券不存在');
    });
  });

  describe('POST /api/coupons', () => {
    it('應該成功建立新優惠券（百分比折扣）', async () => {
      const newCoupon = {
        name: '新優惠券',
        discount_type: 'PERCENT',
        percent_off_bps: 1500,
        min_order_twd: 2000,
        max_uses_total: 50,
        starts_at: '2024-01-01T08:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
      };

      const createdCoupon = {
        id: 1,
        ...newCoupon,
        amount_off_twd: null,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T15:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 0,
        remaining_uses: 50,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2024-12-31T23:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(createdCoupon),
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCoupon),
      }, mockEnv);

      expect(response.status).toBe(201);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdCoupon);
    });

    it('應該成功建立新優惠券（固定金額折扣）', async () => {
      const newCoupon = {
        name: '固定折扣優惠券',
        discount_type: 'FIXED',
        amount_off_twd: 5000,
        min_order_twd: 10000,
        is_active: 1,
      };

      const createdCoupon = {
        id: 1,
        ...newCoupon,
        percent_off_bps: null,
        max_uses_total: null,
        starts_at: null,
        ends_at: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 0,
        remaining_uses: null,
        starts_at_taipei: null,
        ends_at_taipei: null,
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(createdCoupon),
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCoupon),
      }, mockEnv);

      expect(response.status).toBe(201);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdCoupon);
    });
  });

  describe('PUT /api/coupons/:id', () => {
    it('應該成功更新優惠券', async () => {
      const updateData = {
        name: '更新優惠券名稱',
        max_uses_total: 200,
      };

      const existingCoupon = {
        id: 1,
        name: '測試優惠券',
        discount_type: 'PERCENT',
        percent_off_bps: 1000,
        amount_off_twd: null,
        min_order_twd: 1000,
        max_uses_total: 100,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 5,
        remaining_uses: 95,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2025-01-01T07:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const updatedCoupon = {
        ...existingCoupon,
        ...updateData,
        updated_at: '2024-01-02T00:00:00Z',
        updated_at_taipei: '2024-01-02T08:00:00Z',
        remaining_uses: 195,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingCoupon) // 檢查優惠券存在
          .mockResolvedValueOnce(updatedCoupon), // 取得更新後優惠券
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedCoupon);
    });

    it('應該回傳 404 當優惠券不存在時', async () => {
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null), // 優惠券不存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '更新名稱' }),
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('優惠券不存在');
    });
  });

  describe('DELETE /api/coupons/:id', () => {
    it('應該成功刪除優惠券', async () => {
      const existingCoupon = {
        id: 1,
        name: '測試優惠券',
        discount_type: 'PERCENT',
        percent_off_bps: 1000,
        amount_off_twd: null,
        min_order_twd: 1000,
        max_uses_total: 100,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 5,
        remaining_uses: 95,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2025-01-01T07:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingCoupon) // 檢查優惠券存在
          .mockResolvedValueOnce({ count: 0 }) // 檢查優惠券代碼
          .mockResolvedValueOnce({ count: 0 }), // 檢查兌換記錄
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toBe('優惠券已成功刪除');
    });

    it('應該回傳 409 當優惠券有代碼或兌換記錄時', async () => {
      const existingCoupon = {
        id: 1,
        name: '測試優惠券',
        discount_type: 'PERCENT',
        percent_off_bps: 1000,
        amount_off_twd: null,
        min_order_twd: 1000,
        max_uses_total: 100,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 5,
        remaining_uses: 95,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2025-01-01T07:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingCoupon) // 檢查優惠券存在
          .mockResolvedValueOnce({ count: 1 }), // 有優惠券代碼
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(409);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('無法刪除有優惠券代碼的優惠券');
    });
  });

  describe('GET /api/coupons/codes', () => {
    it('應該回傳優惠券代碼列表', async () => {
      const mockCouponCodes = [
        {
          id: 1,
          coupon_id: 1,
          code: 'TESTCODE001',
          max_redemptions: 50,
          starts_at: '2024-01-01T00:00:00Z',
          ends_at: '2024-12-31T23:59:59Z',
          is_active: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
          total_redemptions: 10,
          remaining_uses: 40,
          starts_at_taipei: '2024-01-01T08:00:00Z',
          ends_at_taipei: '2025-01-01T07:59:59Z',
          created_at_taipei: '2024-01-01T08:00:00Z',
          updated_at_taipei: '2024-01-01T08:00:00Z',
          is_valid: true,
          is_expired: false,
          is_not_started: false,
          is_fully_redeemed: false,
        },
      ];

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ total: 1 }),
        all: vi.fn().mockResolvedValue({ results: mockCouponCodes }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/codes', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCouponCodes);
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });
  });

  describe('POST /api/coupons/codes', () => {
    it('應該成功建立新優惠券代碼', async () => {
      const newCouponCode = {
        coupon_id: 1,
        code: 'NEWCODE001',
        max_redemptions: 100,
        starts_at: '2024-01-01T08:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
      };

      const createdCouponCode = {
        id: 1,
        ...newCouponCode,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T15:59:59Z',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 0,
        remaining_uses: 100,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2024-12-31T23:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(createdCouponCode) // 檢查優惠券存在
          .mockResolvedValueOnce(null) // 檢查代碼不存在
          .mockResolvedValueOnce(createdCouponCode), // 取得新建代碼
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCouponCode),
      }, mockEnv);

      expect(response.status).toBe(201);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdCouponCode);
    });

    it('應該回傳 404 當優惠券不存在時', async () => {
      const newCouponCode = {
        coupon_id: 999,
        code: 'TESTCODE001',
        is_active: 1,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null), // 優惠券不存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCouponCode),
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('優惠券不存在');
    });

    it('應該回傳 409 當代碼已存在時', async () => {
      const newCouponCode = {
        coupon_id: 1,
        code: 'EXISTINGCODE',
        is_active: 1,
      };

      const existingCouponCode = {
        id: 1,
        coupon_id: 1,
        code: 'EXISTINGCODE',
        max_redemptions: null,
        starts_at: null,
        ends_at: null,
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 0,
        remaining_uses: null,
        starts_at_taipei: null,
        ends_at_taipei: null,
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingCouponCode) // 檢查優惠券存在
          .mockResolvedValueOnce(existingCouponCode), // 代碼已存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/codes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCouponCode),
      }, mockEnv);

      expect(response.status).toBe(409);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toBe('優惠券代碼已存在');
    });
  });

  describe('DELETE /api/coupons/codes/:id', () => {
    it('應該成功刪除優惠券代碼', async () => {
      const existingCouponCode = {
        id: 1,
        coupon_id: 1,
        code: 'TESTCODE001',
        max_redemptions: 50,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 10,
        remaining_uses: 40,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2025-01-01T07:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingCouponCode) // 檢查優惠券代碼存在
          .mockResolvedValueOnce({ count: 0 }) // 檢查兌換記錄
          .mockResolvedValueOnce({ count: 0 }), // 檢查授權記錄
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/codes/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json() as any;
      expect(data.success).toBe(true);
      expect(data.message).toBe('優惠券代碼已成功刪除');
    });

    it('應該回傳 409 當優惠券代碼有兌換記錄或授權記錄時', async () => {
      const existingCouponCode = {
        id: 1,
        coupon_id: 1,
        code: 'TESTCODE001',
        max_redemptions: 50,
        starts_at: '2024-01-01T00:00:00Z',
        ends_at: '2024-12-31T23:59:59Z',
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
        total_redemptions: 10,
        remaining_uses: 40,
        starts_at_taipei: '2024-01-01T08:00:00Z',
        ends_at_taipei: '2025-01-01T07:59:59Z',
        created_at_taipei: '2024-01-01T08:00:00Z',
        updated_at_taipei: '2024-01-01T08:00:00Z',
        is_valid: true,
        is_expired: false,
        is_not_started: false,
        is_fully_redeemed: false,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingCouponCode) // 檢查優惠券代碼存在
          .mockResolvedValueOnce({ count: 1 }), // 有兌換記錄
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/coupons/codes/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(409);
      
      const data = await response.json() as any;
      expect(data.success).toBe(false);
      expect(data.error).toContain('無法刪除有兌換記錄的優惠券代碼');
    });
  });
});
