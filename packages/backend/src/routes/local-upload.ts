import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Env } from '../env.d.ts';
import {
  R2UploadResponseSchema,
  ErrorResponseSchema,
} from '../zod/products.js';

/**
 * 本地檔案上傳路由處理器（開發環境用）
 */
export const localUploadRouter = new OpenAPIHono<{ Bindings: Env }>();

/**
 * POST /api/uploads/products - 上傳產品圖片到本地檔案系統
 */
const uploadProductImageRoute = createRoute({
  method: 'post',
  path: '/api/uploads/products',
  tags: ['Uploads'],
  summary: '上傳產品圖片',
  description: '上傳 WebP 格式的產品圖片到本地檔案系統',
  operationId: 'Uploads_ProductImage_Local',
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

localUploadRouter.openapi(uploadProductImageRoute, async (c) => {
  try {
    const formData = await c.req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return c.json({
        success: false,
        error: '請選擇要上傳的檔案',
        timestamp: new Date().toISOString(),
      }, 400);
    }

    // 驗證檔案類型
    console.log('檔案資訊:', {
      name: file.name,
      type: file.type,
      size: file.size
    });
    
    // 檢查 MIME 類型或副檔名
    const isImageByMime = file.type.startsWith('image/');
    const isImageByExtension = /\.(jpg|jpeg|png|gif|webp)$/i.test(file.name);
    
    if (!isImageByMime && !isImageByExtension) {
      return c.json({
        success: false,
        error: `只允許上傳圖片檔案，收到類型: ${file.type}，檔案名: ${file.name}`,
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

    // 產生檔案名稱
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop() || 'webp';
    const fileName = `${timestamp}-${random}.${extension}`;

    // 上傳到 R2
    const arrayBuffer = await file.arrayBuffer();
    await c.env.ASSETS.put(`products/${fileName}`, arrayBuffer, {
      httpMetadata: {
        contentType: file.type || 'image/webp',
      },
    });

    const key = `products/${fileName}`;
    const publicUrl = undefined; // 使用代理路由

    return c.json({
      success: true,
      data: {
        key,
        public_url: publicUrl,
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
 * GET /assets/* - 提供本地檔案系統中的圖片檔案
 */
const getAssetRoute = createRoute({
  method: 'get',
  path: '/assets/*',
  tags: ['Assets'],
  summary: '取得檔案',
  description: '透過代理讀取本地檔案系統中的檔案',
  operationId: 'Assets_GetFile_Local',
  request: {},
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
        'image/gif': {
          schema: z.string().describe('GIF 圖片內容'),
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

localUploadRouter.openapi(getAssetRoute, async (c) => {
  try {
    const key = c.req.path.replace('/assets/', '');

    // 從 R2 讀取檔案
    const object = await c.env.ASSETS.get(key);
    
    if (!object) {
      return c.json({
        success: false,
        error: '檔案不存在',
        timestamp: new Date().toISOString(),
      }, 404);
    }

    // 取得檔案內容和類型
    const arrayBuffer = await object.arrayBuffer();
    let contentType = object.httpMetadata?.contentType || 'application/octet-stream';
    
    // 如果 Content-Type 不正確，根據副檔名判斷
    if (contentType === 'application/octet-stream') {
      const ext = key.split('.').pop()?.toLowerCase();
      switch (ext) {
        case 'webp':
          contentType = 'image/webp';
          break;
        case 'jpg':
        case 'jpeg':
          contentType = 'image/jpeg';
          break;
        case 'png':
          contentType = 'image/png';
          break;
        case 'gif':
          contentType = 'image/gif';
          break;
      }
    }

    // 設定回應標頭
    const headers = new Headers();
    headers.set('Content-Type', contentType);
    headers.set('Cache-Control', 'public, max-age=31536000'); // 1 年快取

    // 回傳實際的圖片內容
    return new Response(arrayBuffer, {
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

export default localUploadRouter;
