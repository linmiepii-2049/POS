/*
 * ==========================================
 * COUPON ZOD SCHEMAS - TEMPORARILY DISABLED
 * 優惠券 Zod 模式 - 暫時停用
 * ==========================================
 * Date: 2024-11-11
 * Reason: Business requirement to hide coupon features
 * 原因：業務需求暫時隱藏優惠券功能
 * Note: May be restored in the future
 * 備註：未來可能恢復使用
 * 
 * To restore: Restore original file content from git history
 * 恢復方法：從 git 歷史恢復原始檔案內容
 * ==========================================
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

import { z } from '@hono/zod-openapi';

/*
 * All coupon Zod schemas have been commented out.
 * Original file contained:
 * - Request/Response schemas for coupons
 * - Request/Response schemas for coupon codes
 * - Request/Response schemas for coupon grants
 * - Query parameter schemas
 * - Error response schemas
 * 
 * 所有優惠券 Zod 模式已被註解。
 * 原始檔案包含：
 * - 優惠券的請求/回應模式
 * - 優惠券代碼的請求/回應模式
 * - 優惠券授權的請求/回應模式
 * - 查詢參數模式
 * - 錯誤回應模式
 */

// Placeholder exports to prevent import errors
export const CouponQuerySchema = z.object({});
export const CouponCodeQuerySchema = z.object({});
export const CreateCouponRequestSchema = z.object({});
export const UpdateCouponRequestSchema = z.object({});
export const CreateCouponCodeRequestSchema = z.object({});
export const UpdateCouponCodeRequestSchema = z.object({});
export const CouponListResponseSchema = z.object({});
export const CouponDetailResponseSchema = z.object({});
export const CouponCreateResponseSchema = z.object({});
export const CouponUpdateResponseSchema = z.object({});
export const CouponDeleteResponseSchema = z.object({});
export const CouponCodeListResponseSchema = z.object({});
export const CouponCodeDetailResponseSchema = z.object({});
export const CouponCodeCreateResponseSchema = z.object({});
export const CouponCodeUpdateResponseSchema = z.object({});
export const CouponCodeDeleteResponseSchema = z.object({});
export const CreateCouponGrantRequestSchema = z.object({});
export const CouponGrantQuerySchema = z.object({});
export const CouponGrantListResponseSchema = z.object({});
export const CouponGrantCreateResponseSchema = z.object({});
export const ErrorResponseSchema = z.object({});
