import { z } from 'zod';

/**
 * 排序方向枚舉
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * 產品排序欄位枚舉
 */
export const ProductSortBySchema = z.enum(['id', 'sku', 'name', 'category', 'list_price_twd', 'unit_price_twd', 'created_at', 'updated_at', 'current_month_sales', 'last_month_sales']);

/**
 * 產品基本資訊 Schema
 */
export const ProductSchema = z.object({
  id: z.number().int().positive().describe('產品 ID'),
  sku: z.string().min(1).max(50).describe('產品 SKU'),
  category: z.string().max(100).nullable().describe('產品分類'),
  name: z.string().min(1).max(200).describe('產品名稱'),
  description: z.string().max(1000).nullable().describe('產品描述'),
  img_url: z.string().url().nullable().describe('產品圖片 URL'),
  list_price_twd: z.number().int().min(0).describe('定價 (元)'),
  unit_price_twd: z.number().int().min(0).describe('單價 (元)'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
  current_month_sales: z.number().int().min(0).describe('本月賣出數量'),
  last_month_sales: z.number().int().min(0).describe('上月賣出數量'),
});

/**
 * 建立產品請求 Schema
 */
export const CreateProductRequestSchema = z.object({
  sku: z.string().min(1).max(50).describe('產品 SKU'),
  category: z.string().max(100).optional().describe('產品分類'),
  name: z.string().min(1).max(200).describe('產品名稱'),
  description: z.string().max(1000).optional().describe('產品描述'),
  img_url: z.string().url().optional().or(z.literal('')).describe('產品圖片 URL'),
  list_price_twd: z.number().int().min(0).describe('定價 (元)'),
  unit_price_twd: z.number().int().min(0).describe('單價 (元)'),
  is_active: z.number().int().min(0).max(1).default(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
});

/**
 * 更新產品請求 Schema
 */
export const UpdateProductRequestSchema = z.object({
  sku: z.string().min(1).max(50).optional().describe('產品 SKU'),
  category: z.string().max(100).optional().describe('產品分類'),
  name: z.string().min(1).max(200).optional().describe('產品名稱'),
  description: z.string().max(1000).optional().describe('產品描述'),
  img_url: z.string().url().optional().or(z.literal('')).describe('產品圖片 URL'),
  list_price_twd: z.number().int().min(0).optional().describe('定價 (元)'),
  unit_price_twd: z.number().int().min(0).optional().describe('單價 (元)'),
  is_active: z.number().int().min(0).max(1).optional().describe('是否啟用 (0: 停用, 1: 啟用)'),
});

/**
 * 產品查詢參數 Schema
 */
export const ProductQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  sortBy: ProductSortBySchema.default('id').describe('排序欄位'),
  sortDir: SortDirectionSchema.default('asc').describe('排序方向'),
  search: z.string().optional().describe('SKU 或名稱搜尋'),
  category: z.string().optional().describe('分類篩選'),
  is_active: z.coerce.number().int().min(0).max(1).optional().describe('啟用狀態篩選'),
  from: z.string().optional().describe('建立時間起始 (台北時間)'),
  to: z.string().optional().describe('建立時間結束 (台北時間)'),
});

/**
 * 分頁資訊 Schema
 */
export const PaginationSchema = z.object({
  page: z.number().int().positive().describe('當前頁碼'),
  limit: z.number().int().positive().describe('每頁筆數'),
  total: z.number().int().min(0).describe('總筆數'),
  total_pages: z.number().int().min(0).describe('總頁數'),
});

/**
 * 產品列表回應 Schema
 */
export const ProductListResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(ProductSchema).describe('產品列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 產品詳細回應 Schema
 */
export const ProductDetailResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: ProductSchema.describe('產品詳細資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 產品建立回應 Schema
 */
export const ProductCreateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: ProductSchema.describe('建立的產品資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 產品更新回應 Schema
 */
export const ProductUpdateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: ProductSchema.describe('更新的產品資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 產品刪除回應 Schema
 */
export const ProductDeleteResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  message: z.string().describe('刪除成功訊息'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * R2 上傳請求 Schema
 */
export const R2UploadRequestSchema = z.object({
  file: z.instanceof(File).describe('WebP 檔案'),
});

/**
 * R2 上傳回應 Schema
 */
export const R2UploadResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.object({
    key: z.string().describe('檔案 key'),
    public_url: z.string().url().optional().describe('公開 URL（如果有設定）'),
  }).describe('上傳結果'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 錯誤回應 Schema
 */
export const ErrorResponseSchema = z.object({
  success: z.literal(false).describe('操作失敗'),
  error: z.string().describe('錯誤訊息'),
  timestamp: z.string().describe('錯誤時間戳'),
});

/**
 * 導出的類型
 */
export type Product = z.infer<typeof ProductSchema>;
export type CreateProductRequest = z.infer<typeof CreateProductRequestSchema>;
export type UpdateProductRequest = z.infer<typeof UpdateProductRequestSchema>;
export type ProductQuery = z.infer<typeof ProductQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type ProductListResponse = z.infer<typeof ProductListResponseSchema>;
export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;
export type ProductCreateResponse = z.infer<typeof ProductCreateResponseSchema>;
export type ProductUpdateResponse = z.infer<typeof ProductUpdateResponseSchema>;
export type ProductDeleteResponse = z.infer<typeof ProductDeleteResponseSchema>;
export type R2UploadRequest = z.infer<typeof R2UploadRequestSchema>;
export type R2UploadResponse = z.infer<typeof R2UploadResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

