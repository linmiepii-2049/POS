import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { R2Service } from '../utils/r2.js';
import type { Env } from '../env.d.ts';
import {
  R2UploadResponseSchema,
  ErrorResponseSchema,
} from '../zod/products.js';

/**
 * R2 上傳路由處理器
 */
export const r2UploadRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * POST /api/uploads/products - 上傳產品圖片到 R2
 */
const uploadProductImageRoute = createRoute({
  method: 'post',
  path: '/api/uploads/products',
  tags: ['Uploads'],
  summary: '上傳產品圖片',
  description: '上傳 WebP 格式的產品圖片到 R2 儲存桶',
  operationId: 'Uploads_ProductImage',
  request: {
    body: {
      content: {
        'multipart/form-data': {
          schema: z.object({
            file: z.any().describe('WebP 檔案（檔案上傳）'),
          }),
        },
      },
      required: true,
    },
  },
  responses: {
    201: {
      content: {
        'application/json': {
          schema: R2UploadResponseSchema,
        },
      },
      description: '成功上傳圖片',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '請求參數錯誤或檔案格式不正確',
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

r2UploadRouter.openapi(uploadProductImageRoute, async (c) => {
  try {
    // 取得上傳的檔案
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({
        success: false,
        error: '未提供檔案',
        timestamp: new Date().toISOString(),
      }, 400);
    }

    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      return c.json({
        success: false,
        error: '只允許上傳圖片檔案',
        timestamp: new Date().toISOString(),
      }, 400);
    }

    // 驗證檔案大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return c.json({
        success: false,
        error: '檔案大小不能超過 10MB',
        timestamp: new Date().toISOString(),
      }, 400);
    }

    // 取得環境變數
    const envName = c.env.ENV_NAME || 'development';
    const apiBase = c.env.API_BASE || 'http://localhost:8787';

    // 上傳檔案到 R2
    const r2Service = new R2Service(c.env.ASSETS as any, envName, apiBase);
    const result = await r2Service.uploadFile(file, 'products');

    return c.json({
      success: true,
      data: {
        key: result.key,
        public_url: result.publicUrl,
      },
      timestamp: new Date().toISOString(),
    }, 201);
  } catch (error) {
    console.error('上傳產品圖片時發生錯誤:', error);
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : '上傳產品圖片時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * GET /assets/:key - 代理讀取 R2 檔案
 */
const getAssetRoute = createRoute({
  method: 'get',
  path: '/assets/{key}',
  tags: ['Assets'],
  summary: '取得檔案',
  description: '透過代理讀取 R2 儲存桶中的檔案',
  operationId: 'Assets_GetFile',
  request: {
    params: z.object({
      key: z.string().describe('檔案 key'),
    }),
  },
  responses: {
    200: {
      content: {
        'image/webp': {
          schema: z.string().describe('WebP 圖片內容'),
        },
        'image/jpeg': {
          schema: z.string().describe('JPEG 圖片內容'),
        },
        'image/png': {
          schema: z.string().describe('PNG 圖片內容'),
        },
        'application/octet-stream': {
          schema: z.string().describe('檔案內容'),
        },
      },
      description: '成功取得檔案',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '檔案不存在',
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

r2UploadRouter.openapi(getAssetRoute, async (c) => {
  try {
    const { key } = c.req.valid('param');

    // 從 R2 取得檔案
    const r2Service = new R2Service(c.env.ASSETS as any);
    const fileData = await r2Service.getFile(key);

    if (!fileData) {
      return c.json({
        success: false,
        error: '檔案不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }

    // 設定回應標頭
    const headers = new Headers();
    headers.set('Content-Type', fileData.contentType);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 年快取

    // 回傳檔案內容
    return new Response(fileData.body, {
      status: 200,
      headers,
    });
  } catch (error) {
    console.error('取得檔案時發生錯誤:', error);
    return c.json({
      success: false,
      error: '取得檔案時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});

/**
 * DELETE /assets/:key - 刪除 R2 檔案
 */
const deleteAssetRoute = createRoute({
  method: 'delete',
  path: '/assets/{key}',
  tags: ['Assets'],
  summary: '刪除檔案',
  description: '刪除 R2 儲存桶中的檔案',
  operationId: 'Assets_DeleteFile',
  request: {
    params: z.object({
      key: z.string().describe('檔案 key'),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().describe('操作是否成功'),
            message: z.string().describe('刪除成功訊息'),
            timestamp: z.string().describe('回應時間戳'),
          }),
        },
      },
      description: '成功刪除檔案',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '檔案不存在',
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

r2UploadRouter.openapi(deleteAssetRoute, async (c) => {
  try {
    const { key } = c.req.valid('param');

    // 檢查檔案是否存在
    const r2Service = new R2Service(c.env.ASSETS as any);
    const exists = await r2Service.fileExists(key);

    if (!exists) {
      return c.json({
        success: false,
        error: '檔案不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }

    // 刪除檔案
    const success = await r2Service.deleteFile(key);

    if (!success) {
      return c.json({
        success: false,
        error: '刪除檔案失敗',
        timestamp: new Date().toISOString(),
      }, 500);
    }

    return c.json({
      success: true,
      message: '檔案已成功刪除',
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    console.error('刪除檔案時發生錯誤:', error);
    return c.json({
      success: false,
      error: '刪除檔案時發生錯誤',
      timestamp: new Date().toISOString(),
    }, 500);
  }
});
