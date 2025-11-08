import { z } from 'zod';

/**
 * 排序方向枚舉
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * 優惠券排序欄位枚舉
 */
export const CouponSortBySchema = z.enum(['id', 'name', 'discount_type', 'min_order_twd', 'max_uses_total', 'starts_at', 'ends_at', 'is_active', 'created_at', 'updated_at']);

/**
 * 優惠券代碼排序欄位枚舉
 */
export const CouponCodeSortBySchema = z.enum(['id', 'code', 'max_redemptions', 'starts_at', 'ends_at', 'is_active', 'created_at', 'updated_at']);

/**
 * 折扣類型枚舉
 */
export const DiscountTypeSchema = z.enum(['PERCENT', 'FIXED']);

/**
 * 優惠券基本資訊 Schema
 */
export const CouponSchema = z.object({
  id: z.number().int().positive().describe('優惠券 ID'),
  name: z.string().max(200).nullable().describe('優惠券名稱'),
  description: z.string().max(500).nullable().describe('優惠券描述'),
  discount_type: z.enum(['PERCENT', 'FIXED']).describe('折扣類型'),
  percent_off_bps: z.number().int().min(0).max(10000).nullable().describe('折扣百分比 (基點，100 = 1%，最大值 10000 = 100%)'),
  amount_off_twd: z.number().int().min(0).nullable().describe('固定折扣金額 (元)'),
  min_order_twd: z.number().int().min(0).describe('最低消費金額 (元)'),
  max_uses_total: z.number().int().positive().nullable().describe('全站總可用次數'),
  starts_at: z.string().nullable().describe('開始時間 (UTC)'),
  ends_at: z.string().nullable().describe('結束時間 (UTC)'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
  // 計算欄位
  total_redemptions: z.number().int().min(0).describe('已兌換總次數'),
  remaining_uses: z.number().int().min(0).nullable().describe('剩餘可用次數'),
  // 台北時間轉換欄位
  starts_at_taipei: z.string().nullable().describe('開始時間 (台北時間)'),
  ends_at_taipei: z.string().nullable().describe('結束時間 (台北時間)'),
  created_at_taipei: z.string().describe('建立時間 (台北時間)'),
  updated_at_taipei: z.string().describe('更新時間 (台北時間)'),
  // 狀態判斷
  is_valid: z.boolean().describe('是否有效 (啟用且未過期)'),
  is_expired: z.boolean().describe('是否已過期'),
  is_not_started: z.boolean().describe('是否尚未開始'),
  is_fully_redeemed: z.boolean().describe('是否已完全兌換'),
});

/**
 * 優惠券代碼基本資訊 Schema
 */
export const CouponCodeSchema = z.object({
  id: z.number().int().positive().describe('優惠券代碼 ID'),
  coupon_id: z.number().int().positive().describe('優惠券 ID'),
  code: z.string().min(1).max(50).describe('優惠券代碼'),
  max_redemptions: z.number().int().positive().nullable().describe('單一代碼的可用總次數'),
  starts_at: z.string().nullable().describe('開始時間 (UTC)'),
  ends_at: z.string().nullable().describe('結束時間 (UTC)'),
  expires_after_days: z.number().int().positive().nullable().describe('取得後有效天數'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
  // 計算欄位
  total_redemptions: z.number().int().min(0).describe('已兌換次數'),
  remaining_uses: z.number().int().min(0).nullable().describe('剩餘可用次數'),
  // 台北時間轉換欄位
  starts_at_taipei: z.string().nullable().describe('開始時間 (台北時間)'),
  ends_at_taipei: z.string().nullable().describe('結束時間 (台北時間)'),
  created_at_taipei: z.string().describe('建立時間 (台北時間)'),
  updated_at_taipei: z.string().describe('更新時間 (台北時間)'),
  // 狀態判斷
  is_valid: z.boolean().describe('是否有效 (啟用且未過期)'),
  is_expired: z.boolean().describe('是否已過期'),
  is_not_started: z.boolean().describe('是否尚未開始'),
  is_fully_redeemed: z.boolean().describe('是否已完全兌換'),
});

/**
 * 建立優惠券請求 Schema
 */
export const CreateCouponRequestSchema = z.object({
  name: z.string().min(1).max(200).describe('優惠券名稱'),
  description: z.string().max(500).optional().describe('優惠券描述'),
  discount_type: z.enum(['PERCENT', 'FIXED']).describe('折扣類型'),
  percent_off_bps: z.number().int().min(0).max(10000).optional().describe('折扣百分比 (基點，100 = 1%，最大值 10000 = 100%)'),
  amount_off_twd: z.number().int().min(0).optional().describe('固定折扣金額 (元)'),
  min_order_twd: z.number().int().min(0).default(0).describe('最低消費金額 (元)'),
  max_uses_total: z.number().int().positive().optional().describe('全站總可用次數'),
  starts_at: z.string().optional().describe('開始時間 (台北時間)'),
  ends_at: z.string().optional().describe('結束時間 (台北時間)'),
  is_active: z.number().int().min(0).max(1).default(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
}).refine(
  (data) => {
    if (data.discount_type === 'PERCENT') {
      return data.percent_off_bps !== undefined && data.amount_off_twd === undefined;
    }
    if (data.discount_type === 'FIXED') {
      return data.amount_off_twd !== undefined && data.percent_off_bps === undefined;
    }
    return false;
  },
  {
    message: 'PERCENT 類型需要 percent_off_bps，FIXED 類型需要 amount_off_twd',
  }
).refine(
  (data) => {
    // 驗證日期範圍
    if (data.starts_at && data.ends_at) {
      const startDate = new Date(data.starts_at);
      const endDate = new Date(data.ends_at);
      return endDate >= startDate;
    }
    return true;
  },
  {
    message: '結束日期不得早於開始日期',
  }
);

/**
 * 更新優惠券請求 Schema
 */
export const UpdateCouponRequestSchema = z.object({
  name: z.string().min(1).max(200).optional().describe('優惠券名稱'),
  description: z.string().max(500).optional().describe('優惠券描述'),
  discount_type: z.enum(['PERCENT', 'FIXED']).optional().describe('折扣類型'),
  percent_off_bps: z.number().int().min(0).max(10000).optional().describe('折扣百分比 (基點，100 = 1%，最大值 10000 = 100%)'),
  amount_off_twd: z.number().int().min(0).optional().describe('固定折扣金額 (元)'),
  min_order_twd: z.number().int().min(0).optional().describe('最低消費金額 (元)'),
  max_uses_total: z.number().int().positive().optional().describe('全站總可用次數'),
  max_redemptions: z.number().int().positive().optional().describe('代碼總量限制'),
  starts_at: z.string().optional().describe('開始時間 (台北時間)'),
  ends_at: z.string().optional().describe('結束時間 (台北時間)'),
  is_active: z.number().int().min(0).max(1).optional().describe('是否啟用 (0: 停用, 1: 啟用)'),
}).refine(
  (data) => {
    // 只有在同時指定了 discount_type 和對應欄位時才驗證
    if (data.discount_type === 'PERCENT' && data.percent_off_bps !== undefined) {
      return data.amount_off_twd === undefined;
    }
    if (data.discount_type === 'FIXED' && data.amount_off_twd !== undefined) {
      return data.percent_off_bps === undefined;
    }
    return true; // 其他情況都允許
  },
  {
    message: 'PERCENT 類型不能有 amount_off_twd，FIXED 類型不能有 percent_off_bps',
  }
).refine(
  (data) => {
    // 驗證日期範圍
    if (data.starts_at && data.ends_at) {
      const startDate = new Date(data.starts_at);
      const endDate = new Date(data.ends_at);
      return endDate >= startDate;
    }
    return true;
  },
  {
    message: '結束日期不得早於開始日期',
  }
);

/**
 * 建立優惠券代碼請求 Schema
 */
export const CreateCouponCodeRequestSchema = z.object({
  coupon_id: z.number().int().positive().describe('優惠券 ID'),
  code: z.string().min(1).max(50).describe('優惠券代碼'),
  max_redemptions: z.number().int().positive().describe('單一代碼的可用總次數'),
  starts_at: z.string().nullable().optional().describe('開始時間 (台北時間)'),
  ends_at: z.string().nullable().optional().describe('結束時間 (台北時間)'),
  expires_after_days: z.number().int().positive().optional().describe('取得後有效天數'),
  is_active: z.number().int().min(0).max(1).default(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
});

/**
 * 更新優惠券代碼請求 Schema
 */
export const UpdateCouponCodeRequestSchema = z.object({
  code: z.string().min(1).max(50).optional().describe('優惠券代碼'),
  max_redemptions: z.number().int().positive().optional().describe('單一代碼的可用總次數'),
  starts_at: z.string().nullable().optional().describe('開始時間 (台北時間)'),
  ends_at: z.string().nullable().optional().describe('結束時間 (台北時間)'),
  is_active: z.number().int().min(0).max(1).optional().describe('是否啟用 (0: 停用, 1: 啟用)'),
});

/**
 * 建立優惠券授權請求 Schema
 */
export const CreateCouponGrantRequestSchema = z.object({
  coupon_code_id: z.number().int().positive().describe('優惠券代碼 ID'),
  user_id: z.number().int().positive().describe('用戶 ID'),
  allowed_uses: z.number().int().min(1).default(1).describe('允許使用次數'),
  expires_at: z.string().optional().describe('授權過期時間 (台北時間)'),
});

/**
 * 優惠券授權查詢參數 Schema
 */
export const CouponGrantQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  user_id: z.coerce.number().int().positive().optional().describe('用戶 ID'),
  coupon_code_id: z.coerce.number().int().positive().optional().describe('優惠券代碼 ID'),
});

/**
 * 優惠券查詢參數 Schema
 */
export const CouponQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  sortBy: CouponSortBySchema.default('id').describe('排序欄位'),
  sortDir: SortDirectionSchema.default('asc').describe('排序方向'),
  search: z.string().optional().describe('名稱搜尋'),
  discount_type: z.enum(['PERCENT', 'FIXED']).optional().describe('折扣類型篩選'),
  is_active: z.coerce.number().int().min(0).max(1).optional().describe('啟用狀態篩選'),
  is_valid: z.coerce.boolean().optional().describe('有效性篩選'),
  from: z.string().optional().describe('建立時間起始 (台北時間)'),
  to: z.string().optional().describe('建立時間結束 (台北時間)'),
});

/**
 * 優惠券代碼查詢參數 Schema
 */
export const CouponCodeQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  sortBy: CouponCodeSortBySchema.default('id').describe('排序欄位'),
  sortDir: SortDirectionSchema.default('asc').describe('排序方向'),
  search: z.string().optional().describe('代碼搜尋'),
  coupon_id: z.coerce.number().int().positive().optional().describe('優惠券 ID 篩選'),
  user_id: z.coerce.number().int().positive().optional().describe('用戶 ID 篩選'),
  is_active: z.coerce.number().int().min(0).max(1).optional().describe('啟用狀態篩選'),
  is_valid: z.coerce.boolean().optional().describe('有效性篩選'),
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
 * 優惠券列表回應 Schema
 */
export const CouponListResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(CouponSchema).describe('優惠券列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券詳細回應 Schema
 */
export const CouponDetailResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponSchema.describe('優惠券詳細資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券建立回應 Schema
 */
export const CouponCreateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponSchema.describe('建立的優惠券資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券更新回應 Schema
 */
export const CouponUpdateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponSchema.describe('更新的優惠券資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券刪除回應 Schema
 */
export const CouponDeleteResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  message: z.string().describe('刪除成功訊息'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券代碼列表回應 Schema
 */
export const CouponCodeListResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(CouponCodeSchema).describe('優惠券代碼列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券代碼詳細回應 Schema
 */
export const CouponCodeDetailResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponCodeSchema.describe('優惠券代碼詳細資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券代碼建立回應 Schema
 */
export const CouponCodeCreateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponCodeSchema.describe('建立的優惠券代碼資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券代碼更新回應 Schema
 */
export const CouponCodeUpdateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponCodeSchema.describe('更新的優惠券代碼資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券代碼刪除回應 Schema
 */
export const CouponCodeDeleteResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  message: z.string().describe('刪除成功訊息'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券授權 Schema
 */
export const CouponGrantSchema = z.object({
  id: z.number().int().positive().describe('授權 ID'),
  coupon_code_id: z.number().int().positive().describe('優惠券代碼 ID'),
  user_id: z.number().int().positive().describe('用戶 ID'),
  allowed_uses: z.number().int().min(0).describe('允許使用次數'),
  used_count: z.number().int().min(0).describe('已使用次數'),
  granted_at: z.string().describe('授權時間 (UTC)'),
  expires_at: z.string().nullable().describe('授權過期時間 (UTC)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
});

/**
 * 優惠券授權列表回應 Schema
 */
export const CouponGrantListResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(CouponGrantSchema).describe('優惠券授權列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券授權建立回應 Schema
 */
export const CouponGrantCreateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: CouponGrantSchema.describe('建立的優惠券授權資訊'),
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
export type Coupon = z.infer<typeof CouponSchema>;
export type CouponCode = z.infer<typeof CouponCodeSchema>;
export type CreateCouponRequest = z.infer<typeof CreateCouponRequestSchema>;
export type UpdateCouponRequest = z.infer<typeof UpdateCouponRequestSchema>;
export type CreateCouponCodeRequest = z.infer<typeof CreateCouponCodeRequestSchema>;
export type UpdateCouponCodeRequest = z.infer<typeof UpdateCouponCodeRequestSchema>;
export type CouponGrant = z.infer<typeof CouponGrantSchema>;
export type CreateCouponGrantRequest = z.infer<typeof CreateCouponGrantRequestSchema>;
export type CouponGrantQuery = z.infer<typeof CouponGrantQuerySchema>;
export type CouponQuery = z.infer<typeof CouponQuerySchema>;
export type CouponCodeQuery = z.infer<typeof CouponCodeQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type CouponListResponse = z.infer<typeof CouponListResponseSchema>;
export type CouponDetailResponse = z.infer<typeof CouponDetailResponseSchema>;
export type CouponCreateResponse = z.infer<typeof CouponCreateResponseSchema>;
export type CouponUpdateResponse = z.infer<typeof CouponUpdateResponseSchema>;
export type CouponDeleteResponse = z.infer<typeof CouponDeleteResponseSchema>;
export type CouponCodeListResponse = z.infer<typeof CouponCodeListResponseSchema>;
export type CouponCodeDetailResponse = z.infer<typeof CouponCodeDetailResponseSchema>;
export type CouponCodeCreateResponse = z.infer<typeof CouponCodeCreateResponseSchema>;
export type CouponCodeUpdateResponse = z.infer<typeof CouponCodeUpdateResponseSchema>;
export type CouponCodeDeleteResponse = z.infer<typeof CouponCodeDeleteResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
