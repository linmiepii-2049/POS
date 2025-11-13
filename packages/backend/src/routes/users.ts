import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { UserService } from '../services/users.js';
import type { Env } from '../env.d.ts';
import {
  UserQuerySchema,
  CreateUserRequestSchema,
  UpdateUserRequestSchema,
  UserListResponseSchema,
  UserDetailResponseSchema,
  UserCreateResponseSchema,
  UserUpdateResponseSchema,
  UserDeleteResponseSchema,
  UserCouponsOwnedResponseSchema,
  ErrorResponseSchema,
} from '../zod/users.js';
import {
  PointsHistoryQuerySchema,
  PointsHistoryResponseSchema,
  ErrorResponseSchema as PointsErrorResponseSchema,
} from '../zod/points.js';

/**
 * 使用者路由處理器
 */
export const usersRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * GET /users - 取得使用者列表
 */
const getUsersRoute = createRoute({
  method: 'get',
  path: '/users',
  tags: ['Users'],
  summary: '取得使用者列表',
  description: '取得使用者列表，支援分頁、排序、搜尋和篩選',
  request: {
    query: UserQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserListResponseSchema,
        },
      },
      description: '成功取得使用者列表',
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

usersRouter.openapi(getUsersRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const userService = new UserService(c.env.DB);
    
    const result = await userService.getUsers(query);
    
    return c.json({
      success: true,
      data: result.users,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得使用者列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得使用者列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /users/:id - 取得使用者詳細資訊
 */
const getUserByIdRoute = createRoute({
  method: 'get',
  path: '/users/{id}',
  tags: ['Users'],
  summary: '取得使用者詳細資訊',
  description: '根據使用者 ID 取得詳細資訊，包含統計資料',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserDetailResponseSchema,
        },
      },
      description: '成功取得使用者詳細資訊',
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

usersRouter.openapi(getUserByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const userService = new UserService(c.env.DB);
    
    const user = await userService.getUserById(id);
    
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
    console.error('取得使用者詳細資訊時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得使用者詳細資訊時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * POST /users - 建立使用者
 */
const createUserRoute = createRoute({
  method: 'post',
  path: '/users',
  tags: ['Users'],
  summary: '建立使用者',
  description: '建立新的使用者',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateUserRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: UserCreateResponseSchema,
        },
      },
      description: '成功建立使用者',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '手機號碼或 LINE ID 已存在',
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

usersRouter.openapi(createUserRoute, async (c) => {
  try {
    console.log('=== 創建用戶請求開始 ===');
    console.log('請求 URL:', c.req.url);
    console.log('請求方法:', c.req.method);
    console.log('請求 Headers:', Object.fromEntries(c.req.raw.headers.entries()));
    
    const rawData = await c.req.json();
    console.log('原始請求資料:', rawData);
    
    const data = c.req.valid('json');
    console.log('驗證後的資料:', data);
    
    const userService = new UserService(c.env.DB);
    
    // 檢查手機號碼是否已存在
    if (data.phone && await userService.isPhoneExists(data.phone)) {
      return c.json({
        success: false,
        error: '手機號碼已存在',
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    // 檢查 LINE ID 是否已存在
    if (data.line_id && await userService.isLineIdExists(data.line_id)) {
      return c.json({
        success: false,
        error: 'LINE ID 已存在',
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    const user = await userService.createUser(data);
    
    return c.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error: any) {
    console.error('=== 創建用戶錯誤 ===');
    console.error('錯誤物件:', error);
    console.error('錯誤訊息:', error?.message);
    console.error('錯誤堆疊:', error?.stack);
    return c.json({
      success: false,
      error: error?.message || '建立使用者時發生錯誤',
      details: error,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /users/:id - 更新使用者
 */
const updateUserRoute = createRoute({
  method: 'put',
  path: '/users/{id}',
  tags: ['Users'],
  summary: '更新使用者',
  description: '更新使用者資訊',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateUserRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserUpdateResponseSchema,
        },
      },
      description: '成功更新使用者',
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
      description: '使用者不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '手機號碼或 LINE ID 已存在',
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

usersRouter.openapi(updateUserRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const userService = new UserService(c.env.DB);
    
    // 檢查使用者是否存在
    const existingUser = await userService.getUserById(id);
    if (!existingUser) {
      return c.json({
        success: false,
        error: '使用者不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    // 檢查手機號碼是否已存在
    if (data.phone && await userService.isPhoneExists(data.phone, id)) {
      return c.json({
        success: false,
        error: '手機號碼已存在',
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    // 檢查 LINE ID 是否已存在
    if (data.line_id && await userService.isLineIdExists(data.line_id, id)) {
      return c.json({
        success: false,
        error: 'LINE ID 已存在',
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    const user = await userService.updateUser(id, data);
    
    if (!user) {
      return c.json({
        success: false,
        error: '更新使用者失敗',
        timestamp: new Date().toISOString(),
      }, 500);
    }
    
    return c.json({
      success: true,
      data: user,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('更新使用者時發生錯誤:', error);
    return c.json({
      success: false,
      error: '更新使用者時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * DELETE /users/:id - 刪除使用者
 */
const deleteUserRoute = createRoute({
  method: 'delete',
  path: '/users/{id}',
  tags: ['Users'],
  summary: '刪除使用者',
  description: '刪除使用者（僅限無訂單記錄的使用者）',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserDeleteResponseSchema,
        },
      },
      description: '成功刪除使用者',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '使用者不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '無法刪除有訂單記錄的使用者',
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

usersRouter.openapi(deleteUserRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const userService = new UserService(c.env.DB);
    
    const success = await userService.deleteUser(id);
    
    if (!success) {
      return c.json({
        success: false,
        error: '使用者不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '使用者已成功刪除',
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('刪除使用者時發生錯誤:', error);
    
    if (error instanceof Error && error.message.includes('無法刪除有訂單記錄的使用者')) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    return c.json({
      success: false,
      error: '刪除使用者時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /users/:id/coupons/owned - 取得使用者擁有的優惠券
 */
const getUserCouponsOwnedRoute = createRoute({
  method: 'get',
  path: '/users/{id}/coupons/owned',
  tags: ['Users'],
  summary: '取得使用者擁有的優惠券',
  description: '取得使用者擁有的優惠券列表，包含剩餘可用次數和有效期間',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: UserCouponsOwnedResponseSchema,
        },
      },
      description: '成功取得使用者擁有的優惠券',
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

usersRouter.openapi(getUserCouponsOwnedRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const userService = new UserService(c.env.DB);
    
    // 檢查使用者是否存在
    const user = await userService.getUserById(id);
    if (!user) {
      return c.json({
        success: false,
        error: '使用者不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    const coupons = await userService.getUserCouponsOwned(id);
    
    return c.json({
      success: true,
      data: coupons,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得使用者擁有的優惠券時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得使用者擁有的優惠券時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /users/by-line-id/:lineId - 根據 LINE ID 取得使用者資訊
 */
const getUserByLineIdRoute = createRoute({
  method: 'get',
  path: '/users/by-line-id/{lineId}',
  tags: ['Users'],
  summary: '根據 LINE ID 查詢使用者',
  description: '根據 LINE ID 查詢使用者資訊，用於點數折抵功能',
  operationId: 'Users_GetByLineId',
  request: {
    params: z.object({
      lineId: z.string().min(1).describe('LINE ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              id: z.number().int().positive(),
              name: z.string(),
              points: z.number().int().min(0),
              points_yuan_equivalent: z.number().int().min(0),
            }),
            timestamp: z.string(),
          }),
        },
      },
      description: '成功取得使用者資訊',
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

usersRouter.openapi(getUserByLineIdRoute, async (c) => {
  const requestId = `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const startTime = Date.now();
  
  try {
    // 詳細日誌：接收到的參數
    const { lineId } = c.req.valid('param');
    console.log(`[${requestId}] 🔍 LINE ID 查詢開始:`, {
      lineId: lineId ? `${lineId.substring(0, 10)}...` : 'empty',
      lineIdLength: lineId?.length || 0,
      userAgent: c.req.header('User-Agent'),
      origin: c.req.header('Origin'),
      timestamp: new Date().toISOString(),
    });
    
    // 驗證 LINE ID 格式
    if (!lineId || lineId.trim().length === 0) {
      console.error(`[${requestId}] ❌ LINE ID 為空`);
      return c.json({
        success: false,
        error: 'LINE ID 不能為空',
        details: {
          received: lineId || '(空值)',
          message: '請提供有效的 LINE ID',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 400);
    }
    
    if (lineId === 'dummy') {
      console.warn(`[${requestId}] ⚠️ 收到 dummy LINE ID，可能是前端初始化問題`);
    }
    
    const userService = new UserService(c.env.DB);
    
    // 執行查詢
    console.log(`[${requestId}] 📊 開始查詢資料庫...`);
    const user = await userService.getUserByLineId(lineId);
    
    if (!user) {
      console.warn(`[${requestId}] ⚠️ 未找到使用者:`, {
        lineId: lineId.substring(0, 10) + '...',
        searchTime: `${Date.now() - startTime}ms`,
      });
      return c.json({
        success: false,
        error: '找不到此 LINE ID 對應的使用者',
        details: {
          lineId: lineId.substring(0, 10) + '...',
          message: '此 LINE ID 尚未註冊為會員，請先註冊',
          suggestion: '請確認 LINE ID 是否正確，或聯繫客服協助註冊',
        },
        requestId,
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    console.log(`[${requestId}] ✅ 查詢成功:`, {
      userId: user.id,
      name: user.name,
      points: user.points,
      searchTime: `${Date.now() - startTime}ms`,
    });
    
    return c.json({
      success: true,
      data: {
        id: user.id,
        name: user.name,
        points: user.points,
        points_yuan_equivalent: user.points_yuan_equivalent,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    const errorDetails = {
      requestId,
      lineId: c.req.param('lineId')?.substring(0, 10) + '...' || 'unknown',
      errorType: error instanceof Error ? error.constructor.name : typeof error,
      errorMessage: error instanceof Error ? error.message : String(error),
      errorStack: error instanceof Error ? error.stack : undefined,
      searchTime: `${Date.now() - startTime}ms`,
    };
    
    console.error(`[${requestId}] ❌ LINE ID 查詢錯誤:`, errorDetails);
    return c.json({
      success: false,
      error: '查詢使用者時發生錯誤',
      details: {
        message: errorDetails.errorMessage,
        type: errorDetails.errorType,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /users/:id/points-history - 取得使用者點數交易歷史
 */
const getUserPointsHistoryRoute = createRoute({
  method: 'get',
  path: '/users/{id}/points-history',
  tags: ['Users'],
  summary: '取得使用者點數交易歷史',
  description: '取得使用者的點數獲得與折抵記錄',
  operationId: 'Users_GetPointsHistory',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('使用者 ID'),
    }),
    query: PointsHistoryQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: PointsHistoryResponseSchema,
        },
      },
      description: '成功取得點數交易歷史',
    },
    404: {
      content: {
        'application/json': {
          schema: PointsErrorResponseSchema,
        },
      },
      description: '使用者不存在',
    },
    500: {
      content: {
        'application/json': {
          schema: PointsErrorResponseSchema,
        },
      },
      description: '伺服器錯誤',
    },
  },
});

usersRouter.openapi(getUserPointsHistoryRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const query = c.req.valid('query');
    const userService = new UserService(c.env.DB);
    
    // 檢查使用者是否存在
    const user = await userService.getUserById(id);
    if (!user) {
      return c.json({
        success: false,
        error: '使用者不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    const result = await userService.getPointsHistory(id, query);
    
    return c.json({
      success: true,
      data: result.transactions,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得使用者點數交易歷史時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得點數交易歷史時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});
