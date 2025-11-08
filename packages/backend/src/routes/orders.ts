import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { OrderService } from '../services/orders.js';
import type { Env } from '../env.d.ts';
import {
  OrderQuerySchema,
  CreateOrderRequestSchema,
  OrderListResponseSchema,
  OrderDetailResponseSchema,
  OrderCreateResponseSchema,
  ErrorResponseSchema,
} from '../zod/orders.js';

/**
 * 訂單路由處理器
 */
export const ordersRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * GET /orders - 取得訂單列表
 */
const getOrdersRoute = createRoute({
  method: 'get',
  path: '/orders',
  tags: ['Orders'],
  summary: '取得訂單列表',
  description: '取得訂單列表，支援分頁、排序、篩選',
  operationId: 'Orders_List',
  request: {
    query: OrderQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderListResponseSchema,
        },
      },
      description: '成功取得訂單列表',
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

ordersRouter.openapi(getOrdersRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const orderService = new OrderService(c.env.DB);
    
    const result = await orderService.getOrders(query);
    
    return c.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得訂單列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得訂單列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /orders/:id - 取得訂單詳細資訊
 */
const getOrderByIdRoute = createRoute({
  method: 'get',
  path: '/orders/{id}',
  tags: ['Orders'],
  summary: '取得訂單詳細資訊',
  description: '根據訂單 ID 取得詳細資訊，包含訂單項目和優惠券兌換紀錄',
  operationId: 'Orders_Get',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('訂單 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderDetailResponseSchema,
        },
      },
      description: '成功取得訂單詳細資訊',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '訂單不存在',
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

ordersRouter.openapi(getOrderByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const orderService = new OrderService(c.env.DB);
    
    const order = await orderService.getOrderById(id);
    
    if (!order) {
      return c.json({
        success: false,
        error: '訂單不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得訂單詳細資訊時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得訂單詳細資訊時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * POST /orders - 建立訂單
 */
const createOrderRoute = createRoute({
  method: 'post',
  path: '/orders',
  tags: ['Orders'],
  summary: '建立訂單',
  description: '建立新的訂單，支援優惠券使用',
  operationId: 'Orders_Create',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateOrderRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: OrderCreateResponseSchema,
        },
      },
      description: '成功建立訂單',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '使用者或產品不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券不可用或訂單項目重複',
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

ordersRouter.openapi(createOrderRoute, async (c) => {
  try {
    const data = c.req.valid('json');
    const orderService = new OrderService(c.env.DB);
    
    const order = await orderService.createOrder(data);
    
    return c.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('建立訂單時發生錯誤:', error);
    
    if (error instanceof Error) {
      // 根據錯誤訊息返回適當的 HTTP 狀態碼
      if (error.message.includes('不存在') || error.message.includes('已停用')) {
        return c.json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }, 404);
      }
      
      if (error.message.includes('不可用') || error.message.includes('重複') || error.message.includes('未達最低消費')) {
        return c.json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }, 409);
      }
    }
    
    return c.json({
      success: false,
      error: '建立訂單時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /orders/:id/status - 更新訂單狀態
 */
const updateOrderStatusRoute = createRoute({
  method: 'put',
  path: '/orders/{id}/status',
  tags: ['Orders'],
  summary: '更新訂單狀態',
  description: '更新訂單狀態',
  operationId: 'Orders_UpdateStatus',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('訂單 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            status: z.enum(['created', 'confirmed', 'paid', 'cancelled']).describe('訂單狀態'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderDetailResponseSchema,
        },
      },
      description: '成功更新訂單狀態',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '訂單不存在',
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

ordersRouter.openapi(updateOrderStatusRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const { status } = c.req.valid('json');
    const orderService = new OrderService(c.env.DB);
    
    const order = await orderService.updateOrderStatus(id, status);
    
    if (!order) {
      return c.json({
        success: false,
        error: '訂單不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('更新訂單狀態時發生錯誤:', error);
    return c.json({
      success: false,
      error: '更新訂單狀態時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /orders/:id/cancel - 取消訂單
 */
const cancelOrderRoute = createRoute({
  method: 'put',
  path: '/orders/{id}/cancel',
  tags: ['Orders'],
  summary: '取消訂單',
  description: '取消訂單',
  operationId: 'Orders_Cancel',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('訂單 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderDetailResponseSchema,
        },
      },
      description: '成功取消訂單',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '訂單不存在',
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

ordersRouter.openapi(cancelOrderRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const orderService = new OrderService(c.env.DB);
    
    const order = await orderService.cancelOrder(id);
    
    if (!order) {
      return c.json({
        success: false,
        error: '訂單不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取消訂單時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取消訂單時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /orders/number/:orderNumber - 根據訂單編號取得訂單
 */
const getOrderByNumberRoute = createRoute({
  method: 'get',
  path: '/orders/number/{orderNumber}',
  tags: ['Orders'],
  summary: '根據訂單編號取得訂單',
  description: '根據訂單編號取得訂單詳細資訊',
  operationId: 'Orders_GetByNumber',
  request: {
    params: z.object({
      orderNumber: z.string().min(1).max(50).describe('訂單編號'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderDetailResponseSchema,
        },
      },
      description: '成功取得訂單詳細資訊',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '訂單不存在',
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

ordersRouter.openapi(getOrderByNumberRoute, async (c) => {
  try {
    const { orderNumber } = c.req.valid('param');
    const orderService = new OrderService(c.env.DB);
    
    const order = await orderService.getOrderByNumber(orderNumber);
    
    if (!order) {
      return c.json({
        success: false,
        error: '訂單不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: order,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('根據訂單編號取得訂單時發生錯誤:', error);
    return c.json({
      success: false,
      error: '根據訂單編號取得訂單時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /users/:userId/orders - 取得使用者的訂單列表
 */
const getUserOrdersRoute = createRoute({
  method: 'get',
  path: '/users/{userId}/orders',
  tags: ['Orders'],
  summary: '取得使用者的訂單列表',
  description: '取得指定使用者的訂單列表',
  operationId: 'Orders_GetByUser',
  request: {
    params: z.object({
      userId: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
    query: OrderQuerySchema.omit({ user_id: true }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: OrderListResponseSchema,
        },
      },
      description: '成功取得使用者訂單列表',
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

ordersRouter.openapi(getUserOrdersRoute, async (c) => {
  try {
    const { userId } = c.req.valid('param');
    const query = c.req.valid('query');
    const orderService = new OrderService(c.env.DB);
    
    const result = await orderService.getOrdersByUserId(userId, query);
    
    return c.json({
      success: true,
      data: result.orders,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得使用者訂單列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得使用者訂單列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /orders/stats/today - 取得今日訂單統計
 */
const getTodayOrderStatsRoute = createRoute({
  method: 'get',
  path: '/orders/stats/today',
  tags: ['Orders'],
  summary: '取得今日訂單統計',
  description: '取得今日訂單數量統計',
  operationId: 'Orders_GetTodayStats',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              todayOrderCount: z.number().int().min(0).describe('今日訂單數量'),
            }),
            timestamp: z.string().describe('回應時間戳'),
          }),
        },
      },
      description: '成功取得今日訂單統計',
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

ordersRouter.openapi(getTodayOrderStatsRoute, async (c) => {
  try {
    const orderService = new OrderService(c.env.DB);
    const stats = await orderService.getTodayOrderStats();
    
    return c.json({
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得今日訂單統計時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得今日訂單統計時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});
