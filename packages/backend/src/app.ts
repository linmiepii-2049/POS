import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { getCurrentTimeInfo } from './utils/time.js';
import { parseCorsOrigins } from './utils/env.js';
import type { Env } from './env.d.ts';
import { docsRouter } from './routes/docs.js';
import { dataRouter } from './routes/data.js';
import { usersRouter } from './routes/users.js';
import { usersAggregateRouter } from './routes/users-aggregate.js';
import { productsRouter } from './routes/products.js';
// COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11) - May be restored in the future
// import { couponsRouter } from './routes/coupons.js';
import { ordersRouter } from './routes/orders.js';
import { surveysRouter } from './routes/surveys.js';
import { r2UploadRouter } from './routes/r2-upload.js';
import localUploadRouter from './routes/local-upload.js';
import { preordersRouter } from './routes/preorders.js';
import { paymentsRouter } from './routes/payments.js';

/**
 * 讀取 package.json 版本資訊
 * 在 Workers 環境中，我們使用靜態版本號
 */
const getVersion = (): string => {
  return '1.0.0';
};

// Zod schemas
const HealthResponseSchema = z.object({
  ok: z.boolean().describe('健康狀態'),
  env: z.string().describe('環境名稱'),
  git_sha: z.string().optional().describe('Git commit SHA'),
  d1_status: z.string().describe('D1 資料庫狀態'),
  now_utc: z.string().describe('當前時間（UTC）'),
  now_local: z.string().describe('本地時間（Asia/Taipei）'),
});

const VersionResponseSchema = z.object({
  version: z.string().describe('版本號'),
  env: z.string().describe('環境名稱'),
  git_sha: z.string().optional().describe('Git commit SHA'),
});

// OpenAPI 路由定義
const healthRoute = createRoute({
  method: 'get',
  path: '/health',
  tags: ['System'],
  summary: '健康檢查',
  description: '檢查系統健康狀態並回傳時間資訊',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: HealthResponseSchema,
        },
      },
      description: '健康狀態資訊',
    },
  },
});

const versionRoute = createRoute({
  method: 'get',
  path: '/version',
  tags: ['System'],
  summary: '版本資訊',
  description: '取得系統版本資訊',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: VersionResponseSchema,
        },
      },
      description: '版本資訊',
    },
  },
});

/**
 * 建立 Hono 應用程式
 */
export const createApp = () => {
  const app = new OpenAPIHono();

  // 請求日誌中間件
  app.use('*', async (c, next) => {
    const start = Date.now();
    console.log(`=== 請求開始 ===`);
    console.log(`方法: ${c.req.method}`);
    console.log(`URL: ${c.req.url}`);
    console.log(`Headers:`, Object.fromEntries(c.req.raw.headers.entries()));
    
    await next();
    
    const end = Date.now();
    console.log(`=== 請求結束 ===`);
    console.log(`狀態碼: ${c.res.status}`);
    console.log(`耗時: ${end - start}ms`);
    console.log(`Response Headers:`, Object.fromEntries(c.res.headers.entries()));
  });

  // CORS 設定：從環境變數讀取允許的來源
  app.use('*', async (c, next) => {
    const env = c.env as Env | undefined;
    const corsOrigins = env?.CORS_ORIGINS || 'http://localhost:3000,http://localhost:3001,http://localhost:3100';
    const allowedOrigins = parseCorsOrigins(corsOrigins);
    
    const origin = c.req.header('Origin');
    
    // 處理 OPTIONS 預檢請求
    if (c.req.method === 'OPTIONS') {
      const corsHeaders: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Max-Age': '86400',
      };
      
      // 只有在 origin 在允許清單中時才設定 Access-Control-Allow-Origin
      if (origin && allowedOrigins.includes(origin)) {
        corsHeaders['Access-Control-Allow-Origin'] = origin;
      }
      
      return new Response(null, { 
        status: 204,
        headers: corsHeaders,
      });
    }
    
    // 設定 CORS headers（僅在 origin 在允許清單中時）
    if (origin && allowedOrigins.includes(origin)) {
      c.header('Access-Control-Allow-Origin', origin);
    }
    c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    c.header('Access-Control-Max-Age', '86400');
    
    await next();
  });

  // 註冊 OpenAPI 路由
  app.openapi(healthRoute, async (c) => {
    const env = c.env as Env | undefined;
    const envName = env?.ENV_NAME || 'development';
    const logPrefix = `[${envName}]`;
    const timeInfo = getCurrentTimeInfo();
    
    // 測試 D1 連線
    let d1Status = 'ok';
    try {
      if (env?.DB) {
        await env.DB.prepare('SELECT 1').first();
      }
    } catch (error) {
      console.error(`${logPrefix} D1 health check failed:`, error);
      d1Status = 'error';
    }
    
    return c.json({
      ok: d1Status === 'ok',
      env: envName,
      git_sha: env?.GIT_SHA,
      d1_status: d1Status,
      now_utc: timeInfo.now_utc,
      now_local: timeInfo.now_local,
    });
  });

  app.openapi(versionRoute, (c) => {
    const env = c.env as Env | undefined;
    return c.json({
      version: getVersion(),
      env: env?.ENV_NAME || 'development',
      git_sha: env?.GIT_SHA,
    });
  });

  // OpenAPI 文檔端點
  app.doc('/openapi.json', {
    openapi: '3.0.0',
    info: {
      version: getVersion(),
      title: 'POS 系統後端 API',
      description: 'POS 系統後端 API 文檔',
      contact: {
        name: 'POS 系統開發團隊',
        email: 'dev@pos-system.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:8787',
        description: '開發環境',
      },
    ],
    tags: [
      {
        name: 'System',
        description: '系統相關端點',
      },
      {
        name: 'Data',
        description: '資料查詢端點',
      },
      {
        name: 'Users',
        description: '使用者管理端點',
      },
      {
        name: 'Products',
        description: '產品管理端點',
      },
      // COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11) - May be restored in the future
      // {
      //   name: 'Coupons',
      //   description: '優惠券管理端點',
      // },
      // {
      //   name: 'CouponCodes',
      //   description: '優惠券代碼管理端點',
      // },
      {
        name: 'Orders',
        description: '訂單管理端點',
      },
      {
        name: 'Surveys',
        description: '問卷調查端點',
      },
      {
        name: 'Uploads',
        description: '檔案上傳端點',
      },
      {
        name: 'Assets',
        description: '檔案存取端點',
      },
      {
        name: 'Preorders',
        description: '預購管理端點',
      },
    ],
  });

  // 掛載文檔路由
  app.route('/docs', docsRouter);

  // 掛載資料路由
  app.route('/', dataRouter);

  // 掛載使用者路由
  app.route('/api', usersRouter);

  // 掛載使用者聚合路由
  app.route('/api', usersAggregateRouter);

  // 掛載產品路由
  app.route('/api', productsRouter);

  // COUPON FEATURE HIDDEN - 優惠券路由已隱藏 (2024-11-11) - May be restored in the future
  // app.route('/api', couponsRouter);

  // 掛載訂單路由
  app.route('/api', ordersRouter);

  // 掛載問卷調查路由
  app.route('/api', surveysRouter);
  // 掛載預購路由
  app.route('/api', preordersRouter);
  
  // 掛載支付路由
  app.route('/api', paymentsRouter);

  // 掛載 R2 上傳路由（生產環境用）
  app.route('/', r2UploadRouter);
  
  // 掛載本地上傳路由（開發環境用）
  app.route('/', localUploadRouter);

  // 全域錯誤處理器
  app.onError((err, c) => {
    const requestId = `err-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const errorDetails = {
      requestId,
      method: c.req.method,
      path: c.req.path,
      url: c.req.url,
      userAgent: c.req.header('User-Agent'),
      origin: c.req.header('Origin'),
      errorType: err.name || err.constructor?.name || typeof err,
      errorMessage: err instanceof Error ? err.message : String(err),
      timestamp: new Date().toISOString(),
    };
    
    console.error(`[${requestId}] ❌ 全域錯誤處理器:`, errorDetails);
    console.error(`[${requestId}] 錯誤堆疊:`, err instanceof Error ? err.stack : 'N/A');
    
    // 處理 Zod 驗證錯誤
    if (err.name === 'ZodError' && 'issues' in err) {
      const zodError = err as { issues: Array<{ path: (string | number)[]; message: string; code: string }> };
      const validationDetails = zodError.issues.map((issue) => ({
        field: issue.path.join('.'),
        message: issue.message,
        code: issue.code,
        path: issue.path,
      }));
      
      console.error(`[${requestId}] 🔍 Zod 驗證錯誤詳情:`, {
        issues: validationDetails,
        totalIssues: validationDetails.length,
      });
      
      return c.json({
        success: false,
        error: '請求參數驗證失敗',
        details: validationDetails,
        summary: `共有 ${validationDetails.length} 個驗證錯誤`,
        requestId,
        timestamp: new Date().toISOString(),
      }, 400);
    }
    
    // 處理其他錯誤
    return c.json({
      success: false,
      error: '伺服器內部錯誤',
      details: {
        type: errorDetails.errorType,
        message: errorDetails.errorMessage,
        path: errorDetails.path,
      },
      requestId,
      timestamp: new Date().toISOString(),
    }, 500);
  });

  return app;
};

