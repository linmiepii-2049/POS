import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { AggregateService } from '../services/aggregate.js';
import type { Env } from '../env.d.ts';
import {
  UserByPhoneQuerySchema,
  UserAvailableCouponsQuerySchema,
  UserByPhoneResponseSchema,
  UserAvailableCouponsResponseSchema,
  ErrorResponseSchema,
} from '../zod/aggregate.js';

/**
 * 使用者聚合路由處理器
 */
export const usersAggregateRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * GET /users?phone=... - 根據手機號碼查詢使用者
 */
const getUserByPhoneRoute = createRoute({
  method: 'get',
  path: '/user-by-phone',
  tags: ['Users'],
  summary: '根據手機號碼查詢使用者',
  description: '根據手機號碼查詢單一使用者，多筆結果返回 400，無結果返回 404',
  operationId: 'Users_GetByPhone',
  request: {
    query: UserByPhoneQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserByPhoneResponseSchema,
        },
      },
      description: '成功取得使用者資訊',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '找到多筆使用者或請求參數錯誤',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '使用者不存在',
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

usersAggregateRouter.openapi(getUserByPhoneRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const aggregateService = new AggregateService(c.env.DB);
    
    // 先檢查是否有重複的手機號碼
    const duplicateCheckQuery = 'SELECT COUNT(*) as count FROM users WHERE phone = ?';
    const duplicateResult = await c.env.DB.prepare(duplicateCheckQuery).bind(query.phone).first();
    const count = duplicateResult?.count as number || 0;
    
    if (count > 1) {
      return c.json({
        success: false,
        error: '找到多筆相同手機號碼的使用者',
        timestamp: new Date().toISOString(),
      }, 400);
    }
    
    const user = await aggregateService.getUserByPhone(query);
    
    if (!user) {
      return c.json({
        success: false,
        error: '使用者不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('根據手機號碼查詢使用者時發生錯誤:', error);
    return c.json({
      success: false,
      error: '根據手機號碼查詢使用者時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /users/{id}/available-coupons - 取得使用者可用優惠券
 */
const getUserAvailableCouponsRoute = createRoute({
  method: 'get',
  path: '/users/{id}/available-coupons',
  tags: ['Users'],
  summary: '取得使用者可用優惠券',
  description: '取得使用者授權的優惠券列表，包含可用性判斷和原因說明',
  operationId: 'Users_GetAvailableCoupons',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
    query: UserAvailableCouponsQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserAvailableCouponsResponseSchema,
        },
      },
      description: '成功取得使用者可用優惠券',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '使用者不存在',
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

usersAggregateRouter.openapi(getUserAvailableCouponsRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const query = c.req.valid('query');
    const aggregateService = new AggregateService(c.env.DB);
    
    // 檢查使用者是否存在
    const userCheckQuery = 'SELECT COUNT(*) as count FROM users WHERE id = ?';
    const userCheckResult = await c.env.DB.prepare(userCheckQuery).bind(id).first();
    const userExists = (userCheckResult?.count as number || 0) > 0;
    
    if (!userExists) {
      return c.json({
        success: false,
        error: '使用者不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    const availableCoupons = await aggregateService.getUserAvailableCoupons(id, query);
    
    return c.json({
      success: true,
      data: availableCoupons,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得使用者可用優惠券時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得使用者可用優惠券時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});
