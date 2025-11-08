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

/**
 * 優惠券路由處理器
 */
export const couponsRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * GET /coupons - 取得優惠券列表
 */
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

/**
 * GET /coupons/codes - 取得優惠券代碼列表
 */
const getCouponCodesRoute = createRoute({
  method: 'get',
  path: '/coupons/codes',
  tags: ['CouponCodes'],
  summary: '取得優惠券代碼列表',
  description: '取得優惠券代碼列表，支援分頁、排序、搜尋和篩選',
  operationId: 'CouponCodes_List',
  request: {
    query: CouponCodeQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponCodeListResponseSchema,
        },
      },
      description: '成功取得優惠券代碼列表',
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

couponsRouter.openapi(getCouponCodesRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const couponService = new CouponService(c.env.DB);
    
    const result = await couponService.getCouponCodes(query);
    
    return c.json({
      success: true,
      data: result.couponCodes,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得優惠券代碼列表時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得優惠券代碼列表時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /coupons/:id - 取得優惠券詳細資訊
 */
const getCouponByIdRoute = createRoute({
  method: 'get',
  path: '/coupons/{id}',
  tags: ['Coupons'],
  summary: '取得優惠券詳細資訊',
  description: '根據優惠券 ID 取得詳細資訊',
  operationId: 'Coupons_Get',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('優惠券 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponDetailResponseSchema,
        },
      },
      description: '成功取得優惠券詳細資訊',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券不存在',
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

couponsRouter.openapi(getCouponByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const couponService = new CouponService(c.env.DB);
    
    const coupon = await couponService.getCouponById(id);
    
    if (!coupon) {
      return c.json({
        success: false,
        error: '優惠券不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: coupon,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得優惠券詳細資訊時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得優惠券詳細資訊時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * POST /coupons - 建立優惠券
 */
const createCouponRoute = createRoute({
  method: 'post',
  path: '/coupons',
  tags: ['Coupons'],
  summary: '建立優惠券',
  description: '建立新的優惠券',
  operationId: 'Coupons_Create',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCouponRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CouponCreateResponseSchema,
        },
      },
      description: '成功建立優惠券',
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

couponsRouter.openapi(createCouponRoute, async (c) => {
  try {
    const data = c.req.valid('json');
    const couponService = new CouponService(c.env.DB);
    
    const coupon = await couponService.createCoupon(data);
    
    return c.json({
      success: true,
      data: coupon,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('建立優惠券時發生錯誤:', error);
    return c.json({
      success: false,
      error: '建立優惠券時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /coupons/:id - 更新優惠券
 */
const updateCouponRoute = createRoute({
  method: 'put',
  path: '/coupons/{id}',
  tags: ['Coupons'],
  summary: '更新優惠券',
  description: '更新優惠券資訊',
  operationId: 'Coupons_Update',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('優惠券 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateCouponRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponUpdateResponseSchema,
        },
      },
      description: '成功更新優惠券',
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
      description: '優惠券不存在',
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

couponsRouter.openapi(updateCouponRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const couponService = new CouponService(c.env.DB);
    
    const coupon = await couponService.updateCoupon(id, data);
    
    if (!coupon) {
      return c.json({
        success: false,
        error: '優惠券不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: coupon,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('更新優惠券時發生錯誤:', error);
    
    if (error instanceof Error && error.message.includes('優惠券已有代碼')) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 400);
    }
    
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '更新優惠券時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * DELETE /coupons/:id - 刪除優惠券
 */
const deleteCouponRoute = createRoute({
  method: 'delete',
  path: '/coupons/{id}',
  tags: ['Coupons'],
  summary: '刪除優惠券',
  description: '刪除優惠券（僅限無優惠券代碼和兌換記錄的優惠券）',
  operationId: 'Coupons_Delete',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('優惠券 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponDeleteResponseSchema,
        },
      },
      description: '成功刪除優惠券',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '無法刪除有優惠券代碼或兌換記錄的優惠券',
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

couponsRouter.openapi(deleteCouponRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const couponService = new CouponService(c.env.DB);
    
    const success = await couponService.deleteCoupon(id);
    
    if (!success) {
      return c.json({
        success: false,
        error: '優惠券不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '優惠券已成功刪除',
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('刪除優惠券時發生錯誤:', error);
    
    if (error instanceof Error && (
      error.message.includes('無法刪除有優惠券代碼的優惠券') ||
      error.message.includes('無法刪除有兌換記錄的優惠券')
    )) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    return c.json({
      success: false,
      error: '刪除優惠券時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /coupons/codes/:id - 取得優惠券代碼詳細資訊
 */
const getCouponCodeByIdRoute = createRoute({
  method: 'get',
  path: '/coupons/codes/{id}',
  tags: ['CouponCodes'],
  summary: '取得優惠券代碼詳細資訊',
  description: '根據優惠券代碼 ID 取得詳細資訊',
  operationId: 'CouponCodes_Get',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('優惠券代碼 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponCodeDetailResponseSchema,
        },
      },
      description: '成功取得優惠券代碼詳細資訊',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券代碼不存在',
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

couponsRouter.openapi(getCouponCodeByIdRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const couponService = new CouponService(c.env.DB);
    
    const couponCode = await couponService.getCouponCodeById(id);
    
    if (!couponCode) {
      return c.json({
        success: false,
        error: '優惠券代碼不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: couponCode,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得優惠券代碼詳細資訊時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得優惠券代碼詳細資訊時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * POST /coupons/codes - 建立優惠券代碼
 */
const createCouponCodeRoute = createRoute({
  method: 'post',
  path: '/coupons/codes',
  tags: ['CouponCodes'],
  summary: '建立優惠券代碼',
  description: '建立新的優惠券代碼',
  operationId: 'CouponCodes_Create',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCouponCodeRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CouponCodeCreateResponseSchema,
        },
      },
      description: '成功建立優惠券代碼',
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
      description: '優惠券不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券代碼已存在',
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

couponsRouter.openapi(createCouponCodeRoute, async (c) => {
  try {
    const data = c.req.valid('json');
    const couponService = new CouponService(c.env.DB);
    
    const couponCode = await couponService.createCouponCode(data);
    
    return c.json({
      success: true,
      data: couponCode,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('建立優惠券代碼時發生錯誤:', error);
    
    if (error instanceof Error) {
      if (error.message.includes('優惠券不存在')) {
        return c.json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }, 404);
      }
      if (error.message.includes('優惠券代碼已存在')) {
        return c.json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString(),
        }, 409);
      }
    }
    
    return c.json({
      success: false,
      error: '建立優惠券代碼時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /coupons/codes/:id - 更新優惠券代碼
 */
const updateCouponCodeRoute = createRoute({
  method: 'put',
  path: '/coupons/codes/{id}',
  tags: ['CouponCodes'],
  summary: '更新優惠券代碼',
  description: '更新優惠券代碼資訊',
  operationId: 'CouponCodes_Update',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('優惠券代碼 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdateCouponCodeRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponCodeUpdateResponseSchema,
        },
      },
      description: '成功更新優惠券代碼',
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
      description: '優惠券代碼不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券代碼已存在',
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

couponsRouter.openapi(updateCouponCodeRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const couponService = new CouponService(c.env.DB);
    
    const couponCode = await couponService.updateCouponCode(id, data);
    
    if (!couponCode) {
      return c.json({
        success: false,
        error: '優惠券代碼不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: couponCode,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('更新優惠券代碼時發生錯誤:', error);
    
    if (error instanceof Error && error.message.includes('優惠券代碼已存在')) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    return c.json({
      success: false,
      error: '更新優惠券代碼時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * DELETE /coupons/codes/:id - 刪除優惠券代碼
 */
const deleteCouponCodeRoute = createRoute({
  method: 'delete',
  path: '/coupons/codes/{id}',
  tags: ['CouponCodes'],
  summary: '刪除優惠券代碼',
  description: '刪除優惠券代碼（僅限無兌換記錄和授權記錄的優惠券代碼）',
  operationId: 'CouponCodes_Delete',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('優惠券代碼 ID'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponCodeDeleteResponseSchema,
        },
      },
      description: '成功刪除優惠券代碼',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '優惠券代碼不存在',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '無法刪除有兌換記錄或授權記錄的優惠券代碼',
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

couponsRouter.openapi(deleteCouponCodeRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const couponService = new CouponService(c.env.DB);
    
    const success = await couponService.deleteCouponCode(id);
    
    if (!success) {
      return c.json({
        success: false,
        error: '優惠券代碼不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      message: '優惠券代碼已成功刪除',
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('刪除優惠券代碼時發生錯誤:', error);
    
    if (error instanceof Error && (
      error.message.includes('無法刪除有兌換記錄的優惠券代碼') ||
      error.message.includes('無法刪除有授權記錄的優惠券代碼')
    )) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    return c.json({
      success: false,
      error: '刪除優惠券代碼時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * POST /coupons/grants - 建立優惠券授權
 */
const createCouponGrantRoute = createRoute({
  method: 'post',
  path: '/coupons/grants',
  tags: ['Coupons'],
  summary: '建立優惠券授權',
  description: '為指定用戶建立優惠券代碼的授權記錄',
  operationId: 'Coupons_CreateGrant',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateCouponGrantRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: CouponGrantCreateResponseSchema,
        },
      },
      description: '成功建立優惠券授權',
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
      description: '授權已存在或相關資源不存在',
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

couponsRouter.openapi(createCouponGrantRoute, async (c) => {
  try {
    const data = c.req.valid('json');
    const couponService = new CouponService(c.env.DB);
    
    const grant = await couponService.createCouponGrant(data);
    
    return c.json({
      success: true,
      data: grant,
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('建立優惠券授權時發生錯誤:', error);
    
    if (error instanceof Error && (
      error.message.includes('優惠券代碼不存在') ||
      error.message.includes('用戶不存在') ||
      error.message.includes('用戶已經有此優惠券代碼的授權')
    )) {
      return c.json({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString(),
      }, 409);
    }
    
    return c.json({
      success: false,
      error: '伺服器錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /coupons/grants - 取得優惠券授權列表
 */
const getCouponGrantsRoute = createRoute({
  method: 'get',
  path: '/coupons/grants/list',
  tags: ['Coupons'],
  summary: '取得優惠券授權列表',
  description: '取得優惠券授權列表，支援分頁和篩選',
  operationId: 'Coupons_ListGrants',
  request: {
    query: CouponGrantQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: CouponGrantListResponseSchema,
        },
      },
      description: '成功取得優惠券授權列表',
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

couponsRouter.openapi(getCouponGrantsRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const couponService = new CouponService(c.env.DB);
    
    const result = await couponService.getCouponGrants(query);
    
    return c.json({
      success: true,
      data: result.grants,
      pagination: result.pagination,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('取得優惠券授權列表時發生錯誤:', error);
    
    return c.json({
      success: false,
      error: '伺服器錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * PUT /coupons/grants/{id} - 更新優惠券授權
 */
const updateCouponGrantRoute = createRoute({
  method: 'put',
  path: '/coupons/grants/{id}',
  tags: ['Coupons'],
  summary: '更新優惠券授權',
  description: '更新優惠券授權資訊',
  operationId: 'Coupons_UpdateGrant',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('授權 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            granted_at: z.string().optional().describe('授權時間 (UTC)'),
            expires_at: z.string().optional().describe('過期時間 (UTC)'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().describe('是否成功'),
            data: z.any().describe('更新後的授權資訊'),
            timestamp: z.string().describe('回應時間戳'),
          }),
        },
      },
      description: '更新成功',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '授權不存在',
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

couponsRouter.openapi(updateCouponGrantRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const data = c.req.valid('json');
    const couponService = new CouponService(c.env.DB);
    
    const result = await couponService.updateCouponGrant(id, data);
    
    if (!result) {
      return c.json({
        success: false,
        error: '授權不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }
    
    return c.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('更新優惠券授權時發生錯誤:', error);
    return c.json({
      success: false,
      error: '更新優惠券授權時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});
