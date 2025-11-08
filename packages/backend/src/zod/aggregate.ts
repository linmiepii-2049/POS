import { z } from 'zod';

/**
 * 可用優惠券項目 Schema
 */
export const AvailableCouponItemSchema = z.object({
  id: z.number().int().positive().describe('優惠券代碼 ID'),
  grant_id: z.number().int().positive().describe('授權 ID'),
  coupon_id: z.number().int().positive().describe('優惠券 ID'),
  coupon_code_id: z.number().int().positive().describe('優惠券代碼 ID'),
  coupon_name: z.string().describe('優惠券名稱'),
  coupon_code: z.string().describe('優惠券代碼'),
  discount_type: z.enum(['PERCENT', 'FIXED']).describe('折扣類型'),
  percent_off_bps: z.number().int().min(0).max(10000).nullable().describe('折扣百分比 (基點)'),
  amount_off_twd: z.number().int().min(0).nullable().describe('固定折扣金額 (元)'),
  min_order_twd: z.number().int().min(0).describe('最低消費金額 (元)'),
  allowed_uses: z.number().int().min(0).describe('允許使用次數'),
  used_count: z.number().int().min(0).describe('已使用次數'),
  remaining_uses: z.number().int().min(0).describe('剩餘可用次數'),
  granted_at: z.string().describe('授權時間 (UTC)'),
  expires_at: z.string().nullable().describe('過期時間 (UTC)'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用'),
  // 可用性判斷
  isUsable: z.boolean().describe('是否可用'),
  reason: z.string().nullable().describe('不可用原因（若不可用）'),
});

/**
 * 使用者查詢參數 Schema（根據手機號碼）
 */
export const UserByPhoneQuerySchema = z.object({
  phone: z.string().regex(/^09\d{8,9}$/, '請輸入有效的台灣手機號碼').describe('手機號碼'),
});

/**
 * 使用者可用優惠券查詢參數 Schema
 */
export const UserAvailableCouponsQuerySchema = z.object({
  order_amount: z.coerce.number().int().min(0).optional().describe('當次購物金額 (元)'),
});

/**
 * 使用者基本資訊 Schema（簡化版）
 */
export const UserBasicSchema = z.object({
  id: z.number().int().positive().describe('使用者 ID'),
  line_id: z.string().nullable().describe('LINE ID'),
  name: z.string().min(1).max(100).describe('姓名'),
  phone: z.string().regex(/^09\d{8}$/, '請輸入有效的台灣手機號碼').nullable().describe('手機號碼'),
  role: z.enum(['CLIENT', 'ADMIN']).describe('使用者角色'),
  is_active: z.number().int().min(0).max(1).describe('是否啟用 (0: 停用, 1: 啟用)'),
  created_at: z.string().describe('建立時間 (UTC)'),
  updated_at: z.string().describe('更新時間 (UTC)'),
});

/**
 * 根據手機號碼查詢使用者回應 Schema
 */
export const UserByPhoneResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: UserBasicSchema.describe('使用者資訊'),
  timestamp: z.string().describe('回應時間戳'),
});

/**
 * 使用者可用優惠券回應 Schema
 */
export const UserAvailableCouponsResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(AvailableCouponItemSchema).describe('可用優惠券列表'),
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
export type AvailableCouponItem = z.infer<typeof AvailableCouponItemSchema>;
export type UserByPhoneQuery = z.infer<typeof UserByPhoneQuerySchema>;
export type UserAvailableCouponsQuery = z.infer<typeof UserAvailableCouponsQuerySchema>;
export type UserBasic = z.infer<typeof UserBasicSchema>;
export type UserByPhoneResponse = z.infer<typeof UserByPhoneResponseSchema>;
export type UserAvailableCouponsResponse = z.infer<typeof UserAvailableCouponsResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
