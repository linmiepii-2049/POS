import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { Env } from '../env.d.ts';
import { PreorderService } from '../services/preorders.js';
import {
  PreorderCampaignQuerySchema,
  PreorderCampaignListResponseSchema,
  PreorderCampaignDetailResponseSchema,
  CreatePreorderCampaignRequestSchema,
  UpdatePreorderCampaignRequestSchema,
  ActivePreorderResponseSchema,
  CreatePreorderOrderRequestSchema,
  PreorderOrderResponseSchema,
  ErrorResponseSchema,
} from '../zod/preorders.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';
import { NotificationService } from '../services/notification.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const preordersRouter = new OpenAPIHono<{ Bindings: Env }>();
const notificationService = new NotificationService();

type ListResponse = z.infer<typeof PreorderCampaignListResponseSchema>;
type DetailResponse = z.infer<typeof PreorderCampaignDetailResponseSchema>;
type ActiveResponse = z.infer<typeof ActivePreorderResponseSchema>;
type OrderResponse = z.infer<typeof PreorderOrderResponseSchema>;
type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

const handleError = (c: Context<{ Bindings: Env }>, error: unknown): never => {
  if (error instanceof ApiError) {
    logger.error('預購 API 發生錯誤', { code: error.code, status: error.status, details: error.details });
    return c.json<ErrorResponse, ContentfulStatusCode>(
      {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      error.status,
    ) as never;
  }

  logger.error('預購 API 未預期錯誤', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    errorType: error?.constructor?.name || typeof error,
  });
  return c.json<ErrorResponse, 500>(
    {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : '伺服器發生錯誤，請稍後再試',
      details: error instanceof Error ? { stack: error.stack } : undefined,
    },
    500,
  ) as never;
};

const listRoute = createRoute({
  method: 'get',
  path: '/admin/preorders',
  tags: ['Preorders'],
  summary: '取得預購檔期列表',
  description: '列出所有預購檔期，支援分頁與狀態篩選',
  operationId: 'Preorders_AdminList',
  request: {
    query: PreorderCampaignQuerySchema,
  },
  responses: {
    200: {
      description: '成功取得預購檔期列表',
      content: {
        'application/json': {
          schema: PreorderCampaignListResponseSchema,
        },
      },
    },
    400: {
      description: '請求參數錯誤',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(listRoute, async (c) => {
  try {
    const query = c.req.valid('query');
    const service = new PreorderService(c.env.DB);
    const result = await service.listCampaigns(query);
    return c.json<ListResponse, 200>(
      {
        success: true,
        data: result.campaigns,
        pagination: result.pagination,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

const createRouteDef = createRoute({
  method: 'post',
  path: '/admin/preorders',
  tags: ['Preorders'],
  summary: '建立預購檔期',
  description: '新增一個新的預購檔期，並可選擇是否立即啟用',
  operationId: 'Preorders_AdminCreate',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePreorderCampaignRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '成功建立預購檔期',
      content: {
        'application/json': {
          schema: PreorderCampaignDetailResponseSchema,
        },
      },
    },
    400: {
      description: '驗證錯誤',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(createRouteDef, async (c) => {
  try {
    const payload = c.req.valid('json');
    logger.info('建立預購檔期請求', { payload });
    const service = new PreorderService(c.env.DB);
    const campaign = await service.createCampaign(payload);
    logger.info('預購檔期建立成功', { campaignId: campaign.id });
    return c.json<DetailResponse, 201>(
      {
        success: true,
        data: campaign,
        timestamp: new Date().toISOString(),
      },
      201,
    );
  } catch (error) {
    logger.error('建立預購檔期 API 錯誤', {
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
    return handleError(c, error);
  }
});

const detailRoute = createRoute({
  method: 'get',
  path: '/admin/preorders/{id}',
  tags: ['Preorders'],
  summary: '取得預購檔期',
  description: '取得單一預購檔期詳細資料',
  operationId: 'Preorders_AdminGet',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('檔期 ID'),
    }),
  },
  responses: {
    200: {
      description: '成功取得預購檔期',
      content: {
        'application/json': {
          schema: PreorderCampaignDetailResponseSchema,
        },
      },
    },
    404: {
      description: '檔期不存在',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(detailRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const service = new PreorderService(c.env.DB);
    const campaign = await service.getCampaignById(id);
    return c.json<DetailResponse, 200>(
      {
        success: true,
        data: campaign,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

const updateRoute = createRoute({
  method: 'put',
  path: '/admin/preorders/{id}',
  tags: ['Preorders'],
  summary: '更新預購檔期',
  description: '更新既有預購檔期內容',
  operationId: 'Preorders_AdminUpdate',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('檔期 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: UpdatePreorderCampaignRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      description: '成功更新預購檔期',
      content: {
        'application/json': {
          schema: PreorderCampaignDetailResponseSchema,
        },
      },
    },
    400: {
      description: '驗證錯誤',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(updateRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const payload = c.req.valid('json');
    const service = new PreorderService(c.env.DB);
    const campaign = await service.updateCampaign(id, payload);
    return c.json<DetailResponse, 200>(
      {
        success: true,
        data: campaign,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

const deleteRoute = createRoute({
  method: 'delete',
  path: '/admin/preorders/{id}',
  tags: ['Preorders'],
  summary: '刪除預購檔期',
  description: '刪除預購檔期，若已有訂單則禁止刪除',
  operationId: 'Preorders_AdminDelete',
  request: {
    params: z.object({
      id: z.coerce.number().int().positive().describe('檔期 ID'),
    }),
  },
  responses: {
    204: {
      description: '成功刪除預購檔期',
    },
    409: {
      description: '已有訂單，無法刪除',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(deleteRoute, async (c) => {
  try {
    const { id } = c.req.valid('param');
    const service = new PreorderService(c.env.DB);
    await service.deleteCampaign(id);
    return c.body(null, 204);
  } catch (error) {
    return handleError(c, error);
  }
});

const activeRoute = createRoute({
  method: 'get',
  path: '/preorders/active',
  tags: ['Preorders'],
  summary: '取得可預購檔期',
  description: '提供前台顯示的有效預購檔期資料',
  operationId: 'Preorders_GetActive',
  responses: {
    200: {
      description: '成功取得檔期',
      content: {
        'application/json': {
          schema: ActivePreorderResponseSchema,
        },
      },
    },
    404: {
      description: '目前無檔期',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(activeRoute, async (c) => {
  try {
    const service = new PreorderService(c.env.DB);
    const campaign = await service.getActiveCampaign();
    return c.json<ActiveResponse, 200>(
      {
        success: true,
        data: campaign,
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

const orderRoute = createRoute({
  method: 'post',
  path: '/preorders/order',
  tags: ['Preorders'],
  summary: '建立預購訂單',
  description: '根據有效檔期建立預購訂單並扣除名額',
  operationId: 'Preorders_CreateOrder',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreatePreorderOrderRequestSchema,
        },
      },
    },
  },
  responses: {
    201: {
      description: '成功建立預購訂單',
      content: {
        'application/json': {
          schema: PreorderOrderResponseSchema,
        },
      },
    },
    409: {
      description: '名額不足或檔期無效',
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
    },
  },
});

preordersRouter.openapi(orderRoute, async (c) => {
  try {
    const payload = c.req.valid('json');
    const service = new PreorderService(c.env.DB);
    const orderSummary = await service.createPreorderOrder(payload);
    notificationService.notifyPreorderSuccess({
      orderNumber: orderSummary.orderNumber,
      campaignId: orderSummary.campaignId,
      quantity: orderSummary.quantity,
      customerName: payload.customerName,
    });
    return c.json<OrderResponse, 201>(
      {
        success: true,
        data: orderSummary,
        timestamp: new Date().toISOString(),
      },
      201,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

