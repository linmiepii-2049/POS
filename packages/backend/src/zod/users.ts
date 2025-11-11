import { z } from 'zod';

/**
 * 使用者角色枚舉
 */
export const UserRoleSchema = z.enum(['CLIENT', 'ADMIN']);

/**
 * 排序方向枚舉
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * 使用者排序欄位枚舉
 */
export const UserSortBySchema = z.enum(['id', 'name', 'phone', 'created_at', 'updated_at', 'last_purchase_at', 'current_month_spending', 'last_month_spending']);

/**
 * 使用者基本資訊 Schema
 */
export const UserSchema = z.object({
  id: z.number().int().positive().describe('使用者 ID'),
  line_id: z.string().nullable().describe('LINE ID'),
  name: z.string().min(1).max(100).describe('姓名'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼').nullable().describe('手機號碼'),
  role: UserRoleSchema.describe('使用者角色'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
  points: z.number().int().min(0).describe('目前點數'),
  points_yuan_equivalent: z.number().int().min(0).describe('點數折抵金額 (元，20點折1元)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
  last_purchase_at: z.string().nullable().describe('最後消費時間 (UTC)'),
  current_month_spending: z.number().int().min(0).describe('本月消費金額 (元)'),
  last_month_spending: z.number().int().min(0).describe('上月消費金額 (元)'),
});

/**
 * 建立使用者請求 Schema
 */
export const CreateUserRequestSchema = z.object({
  line_id: z.string().optional().describe('LINE ID'),
  name: z.string().min(1).max(100).describe('姓名'),
  phone: z.union([
    z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼'),
    z.literal('')
  ]).optional().describe('手機號碼'),
  role: UserRoleSchema.default('CLIENT').describe('使用者角色'),
  is_active: z.number().int().min(0).max(1).default(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
});

/**
 * 更新使用者請求 Schema
 */
export const UpdateUserRequestSchema = z.object({
  line_id: z.string().optional().describe('LINE ID'),
  name: z.string().min(1).max(100).optional().describe('姓名'),
  phone: z.union([
    z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼'),
    z.literal('')
  ]).optional().describe('手機號碼'),
  role: UserRoleSchema.optional().describe('使用者角色'),
  is_active: z.number().int().min(0).max(1).optional().describe('是否啟用 (0: 停用, 1: 啟用)'),
});

/**
 * 使用者查詢參數 Schema
 */
export const UserQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼 (從 1 開始)'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數 (1-100)'),
  sortBy: UserSortBySchema.default('id').describe('排序欄位'),
  sortDir: SortDirectionSchema.default('asc').describe('排序方向'),
  nameOrPhone: z.string().optional().describe('姓名或手機號碼搜尋'),
  is_active: z.coerce.number().int().min(0).max(1).optional().describe('啟用狀態篩選'),
  from: z.string().optional().describe('建立時間起始 (台北時間)'),
  to: z.string().optional().describe('建立時間結束 (台北時間)'),
});

/**
 * 使用者統計資訊 Schema
 */
export const UserStatsSchema = z.object({
  total_spent: z.number().int().min(0).describe('總消費金額 (元)'),
  last_purchase_at: z.string().nullable().describe('最後購買時間 (UTC)'),
  total_orders: z.number().int().min(0).describe('總訂單數'),
});

/**
 * 使用者詳細資訊 Schema (包含統計)
 */
export const UserDetailSchema = UserSchema.extend({
  stats: UserStatsSchema.describe('使用者統計資訊'),
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
 * 使用者列表回應 Schema
 */
export const UserListResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(UserSchema).describe('使用者列表'),
  pagination: PaginationSchema.describe('分頁資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 使用者詳細回應 Schema
 */
export const UserDetailResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: UserDetailSchema.describe('使用者詳細資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 使用者建立回應 Schema
 */
export const UserCreateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: UserSchema.describe('建立的使用者資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 使用者更新回應 Schema
 */
export const UserUpdateResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: UserSchema.describe('更新的使用者資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 使用者刪除回應 Schema
 */
export const UserDeleteResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  message: z.string().describe('刪除成功訊息'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 優惠券擁有資訊 Schema
 */
export const CouponOwnedSchema = z.object({
  grant_id: z.number().int().positive().describe('授權 ID'),
  coupon_id: z.number().int().positive().describe('優惠券 ID'),
  coupon_code_id: z.number().int().positive().describe('優惠券代碼 ID'),
  coupon_name: z.string().describe('優惠券名稱'),
  coupon_code: z.string().describe('優惠券代碼'),
  discount_type: z.enum(['PERCENT', 'FIXED']).describe('折扣類型'),
  percent_off_bps: z.number().int().min(0).max(10000).nullable().describe('折扣百分比 (基點)'),
  amount_off_twd: z.number().int().min(0).nullable().describe('固定折扣金額 (元)'),
  min_order_twd: z.number().int().min(0).describe('最低消費金額 (元)'),
  starts_at: z.string().nullable().describe('優惠券開始時間 (UTC)'),
  ends_at: z.string().nullable().describe('優惠券結束時間 (UTC)'),
  allowed_uses: z.number().int().min(0).describe('允許使用次數'),
  used_count: z.number().int().min(0).describe('已使用次數'),
  remaining_uses: z.number().int().min(0).describe('剩餘可用次數'),
  granted_at: z.string().describe('授權時間 (UTC)'),
  expires_at: z.string().nullable().describe('過期時間 (UTC)'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用'),
});

/**
 * 使用者擁有優惠券回應 Schema
 */
export const UserCouponsOwnedResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(CouponOwnedSchema).describe('擁有的優惠券列表'),
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
export type User = z.infer<typeof UserSchema>;
export type CreateUserRequest = z.infer<typeof CreateUserRequestSchema>;
export type UpdateUserRequest = z.infer<typeof UpdateUserRequestSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
export type UserStats = z.infer<typeof UserStatsSchema>;
export type UserDetail = z.infer<typeof UserDetailSchema>;
export type Pagination = z.infer<typeof PaginationSchema>;
export type UserListResponse = z.infer<typeof UserListResponseSchema>;
export type UserDetailResponse = z.infer<typeof UserDetailResponseSchema>;
export type UserCreateResponse = z.infer<typeof UserCreateResponseSchema>;
export type UserUpdateResponse = z.infer<typeof UserUpdateResponseSchema>;
export type UserDeleteResponse = z.infer<typeof UserDeleteResponseSchema>;
export type CouponOwned = z.infer<typeof CouponOwnedSchema>;
export type UserCouponsOwnedResponse = z.infer<typeof UserCouponsOwnedResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
