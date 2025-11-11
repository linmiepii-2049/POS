import { z } from 'zod';

/**
 * 點數交易類型枚舉
 */
export const PointsTransactionTypeSchema = z.enum(['EARN', 'REDEEM']);

/**
 * 排序方向枚舉
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * 點數交易記錄 Schema
 */
export const PointsTransactionSchema = z.object({
  id: z.number().int().positive().describe('交易記錄 ID'),
  user_id: z.number().int().positive().describe('使用者 ID'),
  order_id: z.number().int().positive().nullable().describe('訂單 ID'),
  points_change: z.number().int().describe('點數變動（正數為獲得，負數為扣除）'),
  transaction_type: PointsTransactionTypeSchema.describe('交易類型'),
  balance_after: z.number().int().min(0).describe('交易後餘額'),
  created_at: z.string().describe('建立時間 (UTC)'),
});

/**
 * 點數歷史查詢參數 Schema
 */
export const PointsHistoryQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  sortDir: SortDirectionSchema.default('desc').describe('排序方向'),
  transaction_type: PointsTransactionTypeSchema.optional().describe('交易類型篩選'),
  from: z.string().optional().describe('開始時間 (台北時間)'),
  to: z.string().optional().describe('結束時間 (台北時間)'),
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
 * 點數歷史回應 Schema
 */
export const PointsHistoryResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(PointsTransactionSchema).describe('點數交易記錄列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 點數資訊 Schema
 */
export const PointsInfoSchema = z.object({
  points: z.number().int().min(0).describe('目前點數'),
  points_yuan_equivalent: z.number().int().min(0).describe('點數折抵金額 (元，20點折1元)'),
});

/**
 * 點數資訊回應 Schema
 */
export const PointsInfoResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: PointsInfoSchema.describe('點數資訊'),
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
export type PointsTransaction = z.infer<typeof PointsTransactionSchema>;
export type PointsTransactionType = z.infer<typeof PointsTransactionTypeSchema>;
export type PointsHistoryQuery = z.infer<typeof PointsHistoryQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type PointsHistoryResponse = z.infer<typeof PointsHistoryResponseSchema>;
export type PointsInfo = z.infer<typeof PointsInfoSchema>;
export type PointsInfoResponse = z.infer<typeof PointsInfoResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

