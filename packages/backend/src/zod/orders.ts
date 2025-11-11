import { z } from 'zod';

/**
 * 排序方向枚舉
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * 訂單排序欄位枚舉
 */
export const OrderSortBySchema = z.enum(['id', 'order_number', 'user_id', 'subtotal_twd', 'discount_twd', 'total_twd', 'status', 'created_at', 'updated_at']);

/**
 * 訂單狀態枚舉
 */
export const OrderStatusSchema = z.enum(['created', 'confirmed', 'paid', 'cancelled']);

/**
 * 訂單項目基本資訊 Schema
 */
export const OrderItemSchema = z.object({
  id: z.number().int().positive().describe('訂單項目 ID'),
  order_id: z.number().int().positive().describe('訂單 ID'),
  product_id: z.number().int().positive().describe('產品 ID'),
  product_name_snapshot: z.string().nullable().describe('下單時產品名稱快照'),
  quantity: z.number().int().positive().describe('數量'),
  unit_price_twd: z.number().int().min(0).describe('單價 (元)'),
  total_twd: z.number().int().min(0).describe('小計 (元)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
});

/**
 * 優惠券兌換紀錄 Schema
 */
export const CouponRedemptionSchema = z.object({
  id: z.number().int().positive().describe('兌換紀錄 ID'),
  order_id: z.number().int().positive().describe('訂單 ID'),
  coupon_id: z.number().int().positive().describe('優惠券 ID'),
  coupon_code_id: z.number().int().positive().describe('優惠券代碼 ID'),
  user_id: z.number().int().positive().describe('使用者 ID'),
  redeemed_at: z.string().describe('兌換時間 (UTC)'),
  amount_applied_twd: z.number().int().min(0).describe('實際折扣金額 (元)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
  coupon_name: z.string().nullable().describe('優惠券名稱'),
  coupon_code: z.string().nullable().describe('優惠券代碼'),
});

/**
 * 訂單基本資訊 Schema
 */
export const OrderSchema = z.object({
  id: z.number().int().positive().describe('訂單 ID'),
  order_number: z.string().min(1).max(50).describe('訂單編號'),
  user_id: z.number().int().positive().describe('使用者 ID'),
  subtotal_twd: z.number().int().min(0).describe('小計 (元)'),
  discount_twd: z.number().int().min(0).describe('折扣金額 (元)'),
  points_discount_twd: z.number().int().min(0).describe('點數折扣金額 (元)'),
  total_twd: z.number().int().min(0).describe('總金額 (元)'),
  status: z.enum(['created', 'confirmed', 'paid', 'cancelled']).describe('訂單狀態'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
  // 台北時間轉換欄位
  created_at_taipei: z.string().describe('建立時間 (台北時間)'),
  updated_at_taipei: z.string().describe('更新時間 (台北時間)'),
});

/**
 * 訂單詳細資訊 Schema（包含訂單項目和優惠券兌換紀錄）
 */
export const OrderDetailSchema = OrderSchema.extend({
  order_items: z.array(OrderItemSchema).describe('訂單項目列表'),
  coupon_redemptions: z.array(CouponRedemptionSchema).describe('優惠券兌換紀錄列表'),
  points_earned: z.number().int().min(0).optional().describe('獲得的點數（僅會員）'),
  user_points_remaining: z.number().int().min(0).optional().describe('剩餘點數（僅會員）'),
});

/**
 * 建立訂單項目請求 Schema
 */
export const CreateOrderItemRequestSchema = z.object({
  product_id: z.number().int().positive().describe('產品 ID'),
  quantity: z.number().int().positive().describe('數量'),
});

/**
 * 建立訂單請求 Schema
 */
export const CreateOrderRequestSchema = z.object({
  user_id: z.number().int().positive().optional().describe('使用者 ID（可選）'),
  items: z.array(CreateOrderItemRequestSchema).min(1).describe('訂單項目列表'),
  coupon_code_id: z.number().int().positive().optional().describe('優惠券代碼 ID（可選）'),
  points_to_redeem: z.number().int().min(0).optional().describe('欲折抵的點數（可選，僅限 LINE ID 會員）'),
});

/**
 * 訂單查詢參數 Schema
 */
export const OrderQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  sortBy: OrderSortBySchema.default('id').describe('排序欄位'),
  sortDir: SortDirectionSchema.default('desc').describe('排序方向'),
  status: OrderStatusSchema.optional().describe('訂單狀態篩選'),
  user_id: z.coerce.number().int().positive().optional().describe('使用者 ID 篩選'),
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
 * 訂單列表回應 Schema
 */
export const OrderListResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(OrderSchema).describe('訂單列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 訂單詳細回應 Schema
 */
export const OrderDetailResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: OrderDetailSchema.describe('訂單詳細資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 訂單建立回應 Schema
 */
export const OrderCreateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: OrderDetailSchema.describe('建立的訂單資訊'),
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
export type Order = z.infer<typeof OrderSchema>;
export type OrderDetail = z.infer<typeof OrderDetailSchema>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type CouponRedemption = z.infer<typeof CouponRedemptionSchema>;
export type CreateOrderRequest = z.infer<typeof CreateOrderRequestSchema>;
export type CreateOrderItemRequest = z.infer<typeof CreateOrderItemRequestSchema>;
export type OrderQuery = z.infer<typeof OrderQuerySchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type OrderListResponse = z.infer<typeof OrderListResponseSchema>;
export type OrderDetailResponse = z.infer<typeof OrderDetailResponseSchema>;
export type OrderCreateResponse = z.infer<typeof OrderCreateResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
