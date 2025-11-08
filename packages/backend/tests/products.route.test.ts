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

describe('Products API Routes', () => {
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

  describe('GET /api/products', () => {
    it('應該回傳產品列表', async () => {
      // Mock 資料庫查詢結果
      const mockProducts = [
        {
          id: 1,
          sku: 'TEST-001',
          category: '測試分類',
          name: '測試產品',
          description: '測試描述',
          img_url: null,
          list_price_twd: 10000,
          unit_price_twd: 8000,
          is_active: 1,
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z',
        },
      ];

      // 設定 mock 行為
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ total: 1 }),
        all: vi.fn().mockResolvedValue({ results: mockProducts }),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProducts);
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

      const response = await app.request('/api/products?search=測試&category=分類&is_active=1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      expect(mockPrepare).toHaveBeenCalledWith(
        expect.stringContaining('WHERE')
      );
    });
  });

  describe('GET /api/products/:id', () => {
    it('應該回傳指定產品的詳細資訊', async () => {
      const mockProduct = {
        id: 1,
        sku: 'TEST-001',
        category: '測試分類',
        name: '測試產品',
        description: '測試描述',
        img_url: null,
        list_price_twd: 10000,
        unit_price_twd: 8000,
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(mockProduct),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/1', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockProduct);
    });

    it('應該回傳 404 當產品不存在時', async () => {
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/999', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('產品不存在');
    });
  });

  describe('POST /api/products', () => {
    it('應該成功建立新產品', async () => {
      const newProduct = {
        sku: 'NEW-001',
        category: '新分類',
        name: '新產品',
        description: '新產品描述',
        list_price_twd: 15000,
        unit_price_twd: 12000,
        is_active: 1,
      };

      const createdProduct = {
        id: 1,
        ...newProduct,
        img_url: null,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce({ count: 0 }) // SKU 檢查
          .mockResolvedValueOnce(createdProduct), // 取得新建產品
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true, meta: { last_row_id: 1 } }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      }, mockEnv);

      expect(response.status).toBe(201);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(createdProduct);
    });

    it('應該回傳 409 當 SKU 已存在時', async () => {
      const newProduct = {
        sku: 'EXISTING-001',
        name: '重複產品',
        list_price_twd: 10000,
        unit_price_twd: 8000,
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ count: 1 }), // SKU 已存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newProduct),
      }, mockEnv);

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('SKU 已存在');
    });
  });

  describe('PUT /api/products/:id', () => {
    it('應該成功更新產品', async () => {
      const updateData = {
        name: '更新產品名稱',
        list_price_twd: 20000,
      };

      const existingProduct = {
        id: 1,
        sku: 'TEST-001',
        category: '測試分類',
        name: '測試產品',
        description: '測試描述',
        img_url: null,
        list_price_twd: 10000,
        unit_price_twd: 8000,
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const updatedProduct = {
        ...existingProduct,
        ...updateData,
        updated_at: '2024-01-02T00:00:00Z',
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingProduct) // 檢查產品存在
          .mockResolvedValueOnce({ count: 0 }) // SKU 檢查（如果更新了 SKU）
          .mockResolvedValueOnce(updatedProduct), // 取得更新後產品
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/1', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(updatedProduct);
    });

    it('應該回傳 404 當產品不存在時', async () => {
      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null), // 產品不存在
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/999', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: '更新名稱' }),
      }, mockEnv);

      expect(response.status).toBe(404);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('產品不存在');
    });
  });

  describe('DELETE /api/products/:id', () => {
    it('應該成功刪除產品', async () => {
      const existingProduct = {
        id: 1,
        sku: 'TEST-001',
        category: '測試分類',
        name: '測試產品',
        description: '測試描述',
        img_url: null,
        list_price_twd: 10000,
        unit_price_twd: 8000,
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingProduct) // 檢查產品存在
          .mockResolvedValueOnce({ count: 0 }), // 檢查訂單項目
        all: vi.fn(),
        run: vi.fn().mockResolvedValue({ success: true }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.message).toBe('產品已成功刪除');
    });

    it('應該回傳 409 當產品有訂單記錄時', async () => {
      const existingProduct = {
        id: 1,
        sku: 'TEST-001',
        category: '測試分類',
        name: '測試產品',
        description: '測試描述',
        img_url: null,
        list_price_twd: 10000,
        unit_price_twd: 8000,
        is_active: 1,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
      };

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn()
          .mockResolvedValueOnce(existingProduct) // 檢查產品存在
          .mockResolvedValueOnce({ count: 1 }), // 有訂單項目
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/1', {
        method: 'DELETE',
      }, mockEnv);

      expect(response.status).toBe(409);
      
      const data = await response.json();
      expect(data.success).toBe(false);
      expect(data.error).toContain('無法刪除有訂單記錄的產品');
    });
  });

  describe('GET /api/products/categories', () => {
    it('應該回傳產品分類列表', async () => {
      const mockCategories = ['分類1', '分類2', '分類3'];

      const mockPrepare = mockEnv.DB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        all: vi.fn().mockResolvedValue({ 
          results: mockCategories.map(cat => ({ category: cat })) 
        }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const response = await app.request('/api/products/categories', {
        method: 'GET',
      }, mockEnv);

      expect(response.status).toBe(200);
      
      const data = await response.json();
      expect(data.success).toBe(true);
      expect(data.data).toEqual(mockCategories);
    });
  });
});

