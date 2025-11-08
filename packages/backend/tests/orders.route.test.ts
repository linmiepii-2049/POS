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

describe('Orders API Routes', () => {
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

  describe('GET /api/orders', () => {
    it('應該回傳訂單列表', async () => {
      // Mock 資料庫查詢結果
      const mockOrders = [
        {
          id: 1,
          order_number: 'ORD-1234567890-ABC123',
          user_id: 1,
          subtotal_twd: 10000,
          discount_twd: 1000,
          total_twd: 9000,
          status: 'confirmed',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // 設定 mock 行為
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ total: 1 }),
        all: vi.fn().mockResolvedValue({ results: mockOrders }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toHaveLength(1);
      expect(data.data[0]).toMatchObject({
        id: 1,
        order_number: 'ORD-1234567890-ABC123',
        user_id: 1,
        subtotal_twd: 10000,
        discount_twd: 1000,
        total_twd: 9000,
        status: 'confirmed',
      });
      expect(data.pagination).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        total_pages: 1,
      });
    });
  });

  describe('GET /api/orders/:id', () => {
    it('應該回傳指定訂單的詳細資訊', async () => {
      const mockOrder = {
        id: 1,
        order_number: 'ORD-1234567890-ABC123',
        user_id: 1,
        subtotal_twd: 10000,
        discount_twd: 1000,
        total_twd: 9000,
        status: 'confirmed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockOrderItems = [
        {
          id: 1,
          order_id: 1,
          product_id: 1,
          product_name_snapshot: '測試產品',
          quantity: 2,
          unit_price_twd: 5000,
          total_twd: 10000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockCouponRedemptions = [
        {
          id: 1,
          order_id: 1,
          coupon_id: 1,
          coupon_code_id: 1,
          user_id: 1,
          redeemed_at: '2024-01-01T00:00:00Z',
          amount_applied_twd: 1000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockOrder),
        all: vi.fn()
          .mockResolvedValueOnce({ results: mockOrderItems })
          .mockResolvedValueOnce({ results: mockCouponRedemptions }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders/1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 1,
        order_number: 'ORD-1234567890-ABC123',
        user_id: 1,
        subtotal_twd: 10000,
        discount_twd: 1000,
        total_twd: 9000,
        status: 'confirmed',
        order_items: mockOrderItems,
        coupon_redemptions: mockCouponRedemptions,
      });
    });

    it('應該回傳 404 當訂單不存在時', async () => {
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders/999', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('訂單不存在');
    });
  });

  describe('POST /api/orders', () => {
    it('應該成功建立新訂單（無優惠券）', async () => {
      const newOrder = {
        user_id: 1,
        items: [
          { product_id: 1, quantity: 2 },
          { product_id: 2, quantity: 1 },
        ],
      };

      const mockProducts = [
        { id: 1, name: '產品1', unit_price_twd: 5000, is_active: 1 },
        { id: 2, name: '產品2', unit_price_twd: 3000, is_active: 1 },
      ];

      const mockOrder = {
        id: 1,
        order_number: 'ORD-1234567890-ABC123',
        user_id: 1,
        subtotal_twd: 13000,
        discount_twd: 0,
        total_twd: 13000,
        status: 'confirmed',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockOrderItems = [
        {
          id: 1,
          order_id: 1,
          product_id: 1,
          product_name_snapshot: '產品1',
          quantity: 2,
          unit_price_twd: 5000,
          total_twd: 10000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
        {
          id: 2,
          order_id: 1,
          product_id: 2,
          product_name_snapshot: '產品2',
          quantity: 1,
          unit_price_twd: 3000,
          total_twd: 3000,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce({ count: 1 }) // 檢查使用者
          .mockResolvedValueOnce(mockProducts[0]) // 檢查產品1
          .mockResolvedValueOnce(mockProducts[1]) // 檢查產品2
          .mockResolvedValueOnce(mockOrder) // 取得訂單
          .mockResolvedValueOnce(mockOrderItems[0]) // 取得訂單項目1
          .mockResolvedValueOnce(mockOrderItems[1]), // 取得訂單項目2
        all: vi.fn()
          .mockResolvedValueOnce({ results: mockOrderItems }) // 取得訂單項目列表
          .mockResolvedValueOnce({ results: [] }), // 取得優惠券兌換紀錄（空）
        run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      }, mockEnv);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 1,
        order_number: expect.stringMatching(/^ORD-/),
        user_id: 1,
        subtotal_twd: 13000,
        discount_twd: 0,
        total_twd: 13000,
        status: 'confirmed',
        order_items: expect.arrayContaining([
          expect.objectContaining({
            product_id: 1,
            quantity: 2,
            unit_price_twd: 5000,
            total_twd: 10000,
          }),
          expect.objectContaining({
            product_id: 2,
            quantity: 1,
            unit_price_twd: 3000,
            total_twd: 3000,
          }),
        ]),
        coupon_redemptions: [],
      });
    });

    it('應該回傳 404 當使用者不存在時', async () => {
      const newOrder = {
        user_id: 999,
        items: [{ product_id: 1, quantity: 1 }],
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ count: 0 }), // 使用者不存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在或已停用');
    });

    it('應該回傳 404 當產品不存在時', async () => {
      const newOrder = {
        user_id: 1,
        items: [{ product_id: 999, quantity: 1 }],
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce({ count: 1 }) // 檢查使用者
          .mockResolvedValueOnce(null), // 產品不存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('產品 ID 999 不存在或已停用');
    });

    it('應該回傳 409 當同一訂單包含重複商品時', async () => {
      const newOrder = {
        user_id: 1,
        items: [
          { product_id: 1, quantity: 1 },
          { product_id: 1, quantity: 2 }, // 重複商品
        ],
      };

      const mockProduct = { id: 1, name: '產品1', unit_price_twd: 5000, is_active: 1 };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce({ count: 1 }) // 檢查使用者
          .mockResolvedValueOnce(mockProduct), // 檢查產品
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newOrder),
      }, mockEnv);

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('同一訂單不能包含重複商品');
    });
  });
});