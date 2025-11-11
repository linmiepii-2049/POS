/*
 * ==========================================
 * COUPON ROUTES - TEMPORARILY DISABLED
 * 優惠券路由 - 暫時停用
 * ==========================================
 * Date: 2024-11-11
 * Reason: Business requirement to hide coupon features
 * 原因：業務需求暫時隱藏優惠券功能
 * Note: May be restored in the future
 * 備註：未來可能恢復使用
 * 
 * To restore: Uncomment all code below and restore the import in app.ts
 * 恢復方法：取消以下所有代碼的註解，並恢復 app.ts 中的 import
 * ==========================================
 */

/* eslint-disable @typescript-eslint/no-unused-vars */

/*
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { CouponService } from '../services/coupons.js';
import type { Env } from '../env.d.ts';
import {
  CouponQuerySchema,
  CouponCodeQuerySchema,
  CreateCouponRequestSchema,
  UpdateCouponRequestSchema,
  CreateCouponCodeRequestSchema,
  UpdateCouponCodeRequestSchema,
  CouponListResponseSchema,
  CouponDetailResponseSchema,
  CouponCreateResponseSchema,
  CouponUpdateResponseSchema,
  CouponDeleteResponseSchema,
  CouponCodeListResponseSchema,
  CouponCodeDetailResponseSchema,
  CouponCodeCreateResponseSchema,
  CouponCodeUpdateResponseSchema,
  CouponCodeDeleteResponseSchema,
  CreateCouponGrantRequestSchema,
  CouponGrantQuerySchema,
  CouponGrantListResponseSchema,
  CouponGrantCreateResponseSchema,
  ErrorResponseSchema,
} from '../zod/coupons.js';

** 優惠券路由處理器 **
export const couponsRouter = new OpenAPIHono<{ Bindings: Env }>();

** GET /coupons - 取得優惠券列表 **
const getCouponsRoute = createRoute({
  method: 'get',
  path: '/coupons',
  tags: ['Coupons'],
  summary: '取得優惠券列表',
  description: '取得優惠券列表，支援分頁、排序、搜尋和篩選',
  operationId: 'Coupons_List',
  request: {
    query: CouponQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponListResponseSchema,
        },
      },
      description: '成功取得優惠券列表',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    500: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

couponsRouter.openapi(getCouponsRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const couponService = new CouponService(c.env.DB);
    
    const result = await couponService.getCoupons(query);
    
    return c.json({
      success: true,
      data: result.coupons,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得優惠券列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得優惠券列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

... [Additional routes and handlers - all routes commented out]

*/

// Export empty router to avoid breaking imports
import { OpenAPIHono } from '@hono/zod-openapi';
import type { Env } from '../env.d.ts';

export const couponsRouter = new OpenAPIHono<{ Bindings: Env }>();

// Router is empty - coupon functionality temporarily disabled
// 路由為空 - 優惠券功能暫時停用
