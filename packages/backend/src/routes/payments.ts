import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { Context } from 'hono';
import type { Env } from '../env.d.ts';
import { LinePayService } from '../services/linepay.js';
import { PreorderService } from '../services/preorders.js';
import { OrderService } from '../services/orders.js';
import { PointsService } from '../services/points.js';
import { ApiError } from '../utils/api-error.js';
import { logger } from '../utils/logger.js';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export const paymentsRouter = new OpenAPIHono<{ Bindings: Env }>();

// 臨時調試端點：查詢所有支付記錄
paymentsRouter.get('/debug/payments', async (c) => {
  try {
    const allPaymentsQuery = `
      SELECT transaction_id, order_id, status, created_at, campaign_id, total_amount
      FROM preorder_payments 
      ORDER BY created_at DESC 
      LIMIT 20
    `;
    const allPayments = await c.env.DB.prepare(allPaymentsQuery).all();
    
    return c.json({
      success: true,
      count: allPayments.results?.length || 0,
      payments: allPayments.results?.map((p: any) => ({
        transaction_id: p.transaction_id,
        transaction_id_type: typeof p.transaction_id,
        transaction_id_length: String(p.transaction_id).length,
        order_id: p.order_id,
        status: p.status,
        campaign_id: p.campaign_id,
        total_amount: p.total_amount,
        created_at: p.created_at,
      })),
      timestamp: new Date().toISOString(),
    }, 200);
  } catch (error) {
    return c.json({
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }, 500);
  }
});

const handleError = (c: Context<{ Bindings: Env }>, error: unknown): never => {
  if (error instanceof ApiError) {
    logger.error('支付 API 發生錯誤', { code: error.code, status: error.status, details: error.details });
    return c.json(
      {
        code: error.code,
        message: error.message,
        ...(error.details ? { details: error.details } : {}),
      },
      error.status as ContentfulStatusCode,
    ) as never;
  }

  logger.error('支付 API 未預期錯誤', {
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
  return c.json(
    {
      code: 'INTERNAL_ERROR',
      message: error instanceof Error ? error.message : '伺服器發生錯誤，請稍後再試',
    },
    500,
  ) as never;
};

/**
 * 根據交易 ID 取得支付資訊（僅 transactionId，用於 LINE Pay 回調）
 */
const getPaymentInfoByTransactionIdRoute = createRoute({
  method: 'get',
  path: '/preorders/payment/info/by-transaction',
  tags: ['Payments'],
  summary: '根據交易 ID 取得支付資訊',
  description: '僅使用 transactionId 查詢支付資訊（用於 LINE Pay 回調場景）',
  operationId: 'Payments_GetInfoByTransactionId',
  request: {
    query: z.object({
      transactionId: z.string().min(1).describe('交易 ID（字符串格式）'),
    }),
  },
  responses: {
    200: {
      description: '成功取得支付資訊',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              transactionId: z.string(),
              orderId: z.string(),
              campaignId: z.number().int().positive(),
              items: z.array(
                z.object({
                  productId: z.number().int().positive(),
                  quantity: z.number().int().positive(),
                }),
              ),
              totalAmount: z.number().int().positive(),
              pickupDate: z.string(),
            }),
            timestamp: z.string(),
          }),
        },
      },
    },
    404: {
      description: '支付資訊不存在',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

paymentsRouter.openapi(getPaymentInfoByTransactionIdRoute, async (c) => {
  try {
    const { transactionId } = c.req.valid('query');
    
    logger.info('收到支付資訊查詢請求（僅 transactionId）', {
      transactionId,
      url: c.req.url,
    });

    const paymentQuery = `
      SELECT transaction_id, order_id, campaign_id, items_json, total_amount, pickup_date
      FROM preorder_payments
      WHERE transaction_id = ?
      LIMIT 1
    `;
    
    const paymentResult = await c.env.DB.prepare(paymentQuery).bind(transactionId).first();
    
    logger.info('數據庫查詢結果（僅 transactionId）', {
      found: !!paymentResult,
      transactionId,
    });
    
    if (!paymentResult) {
      throw new ApiError('PAYMENT_NOT_FOUND', '找不到支付資訊', 404);
    }

    let items;
    try {
      items = JSON.parse(paymentResult.items_json as string);
    } catch (error) {
      logger.error('解析支付商品列表失敗', { items_json: paymentResult.items_json, error });
      throw new ApiError('INVALID_PAYMENT_DATA', '支付資料格式錯誤', 500);
    }

    return c.json(
      {
        success: true,
        data: {
          transactionId: paymentResult.transaction_id as string,
          orderId: paymentResult.order_id as string,
          campaignId: paymentResult.campaign_id as number,
          items,
          totalAmount: paymentResult.total_amount as number,
          pickupDate: paymentResult.pickup_date as string,
        },
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

/**
 * 根據交易 ID 和訂單 ID 取得支付資訊
 */
const getPaymentInfoRoute = createRoute({
  method: 'get',
  path: '/preorders/payment/info',
  tags: ['Payments'],
  summary: '取得支付資訊',
  description: '根據 transactionId 和 orderId 取得支付交易資訊',
  operationId: 'Payments_GetInfo',
  request: {
    query: z.object({
      transactionId: z.string().min(1).describe('交易 ID（字符串格式）'),
      orderId: z.string().describe('訂單 ID'),
    }),
  },
  responses: {
    200: {
      description: '成功取得支付資訊',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              campaignId: z.number().int().positive(),
              items: z.array(
                z.object({
                  productId: z.number().int().positive(),
                  quantity: z.number().int().positive(),
                }),
              ),
              totalAmount: z.number().int().positive(),
              pickupDate: z.string(),
              userId: z.number().int().positive().optional(),
              pointsToRedeem: z.number().int().min(0).optional(),
            }),
            timestamp: z.string(),
          }),
        },
      },
    },
    404: {
      description: '支付資訊不存在',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
          }),
        },
      },
    },
  },
});

paymentsRouter.openapi(getPaymentInfoRoute, async (c) => {
  try {
    // 先获取原始查询参数用于日志
    const rawTransactionId = c.req.query('transactionId');
    const rawOrderId = c.req.query('orderId');
    
    logger.info('收到支付資訊查詢請求', {
      rawTransactionId,
      rawOrderId,
      url: c.req.url,
    });
    
    const { transactionId, orderId } = c.req.valid('query');
    
    logger.info('驗證後的查詢參數', {
      transactionId,
      orderId,
      transactionIdType: typeof transactionId,
    });

    const paymentQuery = `
      SELECT campaign_id, items_json, total_amount, pickup_date, user_id, points_to_redeem
      FROM preorder_payments
      WHERE transaction_id = ? AND order_id = ?
      LIMIT 1
    `;
    
    const paymentResult = await c.env.DB.prepare(paymentQuery).bind(transactionId, orderId).first();
    
    logger.info('數據庫查詢結果', {
      found: !!paymentResult,
      transactionId,
      orderId,
      transactionIdType: typeof transactionId,
      transactionIdLength: transactionId?.length,
    });
    
    if (!paymentResult) {
      // 嘗試查詢所有記錄，看看是否有類似的
      const allPaymentsQuery = `
        SELECT transaction_id, order_id, status, created_at 
        FROM preorder_payments 
        ORDER BY created_at DESC 
        LIMIT 5
      `;
      const allPayments = await c.env.DB.prepare(allPaymentsQuery).all();
      logger.error('找不到支付資訊，最近的支付記錄', {
        requestedTransactionId: transactionId,
        requestedOrderId: orderId,
        recentPayments: allPayments.results?.map((p: any) => ({
          transaction_id: p.transaction_id,
          order_id: p.order_id,
          status: p.status,
          created_at: p.created_at,
        })),
      });
      throw new ApiError('PAYMENT_NOT_FOUND', '找不到支付資訊', 404);
    }

    let items;
    try {
      items = JSON.parse(paymentResult.items_json as string);
    } catch (error) {
      logger.error('解析支付商品列表失敗', { items_json: paymentResult.items_json, error });
      throw new ApiError('INVALID_PAYMENT_DATA', '支付資料格式錯誤', 500);
    }

    return c.json(
      {
        success: true,
        data: {
          campaignId: paymentResult.campaign_id as number,
          items,
          totalAmount: paymentResult.total_amount as number,
          pickupDate: paymentResult.pickup_date as string,
        },
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

/**
 * 請求 LINE Pay 支付
 */
const requestPaymentRoute = createRoute({
  method: 'post',
  path: '/preorders/payment/request',
  tags: ['Payments'],
  summary: '請求 LINE Pay 支付',
  description: '為預購訂單請求 LINE Pay 支付，返回支付 URL',
  operationId: 'Payments_RequestLinePay',
  request: {
    body: {
      content: {
        'application/json': {
          schema: z.object({
            campaignId: z.number().int().positive().describe('檔期 ID'),
            items: z
              .array(
                z.object({
                  productId: z.number().int().positive().describe('商品 ID'),
                  quantity: z.number().int().positive().describe('預購數量'),
                }),
              )
              .min(1)
              .describe('商品列表'),
            pickupDate: z.string().describe('取貨日期（格式：YYYY-MM-DD）'),
            userId: z.number().int().positive().optional().describe('使用者 ID（可選，用於點數折抵和回饋）'),
            pointsToRedeem: z.number().int().min(0).optional().describe('要折抵的點數（可選，僅限 LINE ID 會員）'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '成功，返回支付 URL',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean().describe('操作是否成功'),
            data: z.object({
              paymentUrl: z.string().describe('LINE Pay 支付頁面 URL'),
              transactionId: z.string().describe('交易 ID（字符串格式）'),
              orderId: z.string().describe('訂單 ID'),
              totalAmount: z.number().describe('總金額'),
            }),
            timestamp: z.string().describe('時間戳'),
          }),
        },
      },
    },
    400: {
      description: '請求參數錯誤',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
            details: z.unknown().optional(),
          }),
        },
      },
    },
  },
});

paymentsRouter.openapi(requestPaymentRoute, async (c) => {
  try {
    // 驗證請求體
    const body = c.req.valid('json');
    if (!body) {
      throw new ApiError('INVALID_REQUEST', '請求體為空', 400);
    }

    const { campaignId, items, pickupDate, userId, pointsToRedeem } = body;
    
    logger.info('收到支付請求', {
      campaignId,
      items,
      pickupDate,
      userId,
      pointsToRedeem,
    });

    // 驗證預購檔期和商品
    const preorderService = new PreorderService(c.env.DB);
    const campaign = await preorderService.getCampaignById(campaignId);

    // 驗證所有商品
    const validatedItems: Array<{ product: any; quantity: number }> = [];
    let totalAmount = 0;
    const productNames: string[] = [];

    for (const item of items) {
      const product = campaign.products.find((p) => p.productId === item.productId);
      if (!product) {
        throw new ApiError('PRODUCT_NOT_FOUND', `商品 ${item.productId} 不存在於此預購檔期`, 404);
      }

      if (item.quantity > product.remainingQuantity) {
        throw new ApiError('QUANTITY_EXCEEDED', `商品 ${product.productName} 預購數量不足`, 409);
      }

      validatedItems.push({ product, quantity: item.quantity });
      totalAmount += product.productPriceTwd * item.quantity;
      productNames.push(product.productName);
    }

    // 如果有點數折抵，需要驗證用戶和點數，並計算最終金額
    let originalAmount = totalAmount; // 保存原始金額（用於記錄）
    if (pointsToRedeem && pointsToRedeem > 0) {
      if (!userId) {
        throw new ApiError('POINTS_REDEEM_REQUIRES_USER', '點數折抵需要用戶 ID', 400);
      }

      // 驗證點數折抵
      const pointsService = new PointsService(c.env.DB);
      const validation = await pointsService.validatePointsRedemption(userId, pointsToRedeem);
      
      if (!validation.valid) {
        throw new ApiError('POINTS_REDEEM_INVALID', validation.error || '點數折抵驗證失敗', 400);
      }

      // 計算點數折抵金額並從總金額中扣除
      const pointsDiscount = pointsService.calculatePointsDiscount(pointsToRedeem);
      totalAmount = Math.max(0, totalAmount - pointsDiscount);
      
      logger.info('點數折抵處理', {
        userId,
        pointsToRedeem,
        pointsDiscount,
        originalAmount,
        finalAmount: totalAmount,
      });
    }

    // 生成訂單 ID
    const orderId = `PREORDER-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const packageName = items.length === 1 ? productNames[0] : `預購商品 (${items.length}項)`;

    // 請求 LINE Pay（支援多商品，使用扣除點數折抵後的金額）
    const linePayService = new LinePayService(c.env);
    const paymentResponse = await linePayService.requestPayment(
      orderId,
      totalAmount, // 使用扣除點數折抵後的金額
      packageName,
      validatedItems,
    );

    if (!paymentResponse.info) {
      throw new ApiError('LINE_PAY_INVALID_RESPONSE', 'LINE Pay 回應格式錯誤', 500);
    }

    // 將交易信息存儲到數據庫（必須成功，否則無法確認支付）
    // transactionId 現在已經是字符串（在 linepay.ts 中已處理精度問題）
    const transactionIdStr = typeof paymentResponse.info.transactionId === 'string' 
      ? paymentResponse.info.transactionId 
      : String(paymentResponse.info.transactionId);
    
    logger.info('LINE Pay 返回的 transactionId（已處理精度問題）', {
      transactionId: transactionIdStr,
      transactionIdType: typeof transactionIdStr,
      transactionIdLength: transactionIdStr.length,
      rawTransactionId: paymentResponse.info.transactionId,
      rawTransactionIdType: typeof paymentResponse.info.transactionId,
    });
    
    logger.info('準備存儲支付記錄', {
      transactionId: transactionIdStr,
      transactionIdType: typeof transactionIdStr,
      transactionIdLength: transactionIdStr.length,
      rawTransactionId: paymentResponse.info.transactionId,
      rawTransactionIdType: typeof paymentResponse.info.transactionId,
      orderId,
      campaignId,
      totalAmount,
      pickupDate,
      userId,
      pointsToRedeem,
    });

    const paymentInsertQuery = `
      INSERT INTO preorder_payments (
        transaction_id,
        order_id,
        campaign_id,
        items_json,
        total_amount,
        pickup_date,
        user_id,
        points_to_redeem,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', datetime('now'), datetime('now'))
    `;
    
    try {
      const insertResult = await c.env.DB.prepare(paymentInsertQuery).bind(
        transactionIdStr,
        orderId,
        campaignId,
        JSON.stringify(validatedItems.map((item) => ({
          productId: item.product.productId,
          quantity: item.quantity,
        }))),
        totalAmount,
        pickupDate,
        userId || null, // user_id
        pointsToRedeem || 0, // points_to_redeem
      ).run();
      
      logger.info('支付交易記錄已存儲', {
        transactionId: transactionIdStr,
        orderId,
        insertResult: {
          success: insertResult.success,
          meta: insertResult.meta,
        },
      });
      
      // 驗證數據是否真的寫入
      const verifyQuery = `
        SELECT transaction_id, order_id FROM preorder_payments 
        WHERE transaction_id = ? AND order_id = ? LIMIT 1
      `;
      const verifyResult = await c.env.DB.prepare(verifyQuery).bind(transactionIdStr, orderId).first();
      if (!verifyResult) {
        logger.error('支付交易記錄寫入驗證失敗', {
          transactionId: transactionIdStr,
          orderId,
        });
        throw new ApiError('PAYMENT_STORAGE_FAILED', '支付記錄存儲失敗，請重試', 500);
      }
      
      logger.info('支付交易記錄驗證成功', {
        transactionId: transactionIdStr,
        orderId,
      });
    } catch (dbError) {
      logger.error('存儲支付交易記錄失敗', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        stack: dbError instanceof Error ? dbError.stack : undefined,
        transactionId: transactionIdStr,
        orderId,
      });
      // 存儲失敗必須中斷流程，否則無法確認支付
      if (dbError instanceof ApiError) {
        throw dbError;
      }
      throw new ApiError('PAYMENT_STORAGE_FAILED', '支付記錄存儲失敗，請重試', 500);
    }

    logger.info('LINE Pay 支付請求成功', {
      orderId,
      transactionId: transactionIdStr, // 使用轉換後的字符串（與存儲時一致）
      rawTransactionId: paymentResponse.info.transactionId, // 記錄原始值
      totalAmount,
      itemCount: items.length,
    });

    // 返回給前端（注意：返回的 transactionId 必須與存儲到數據庫的一致）
    return c.json(
      {
        success: true,
        data: {
          paymentUrl: paymentResponse.info.paymentUrl.web,
          transactionId: transactionIdStr, // 使用與存儲時相同的字符串
          orderId,
          totalAmount,
          items: validatedItems.map((item) => ({
            productId: item.product.productId,
            quantity: item.quantity,
          })),
        },
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});

/**
 * 確認 LINE Pay 支付（回調）
 */
const confirmPaymentRoute = createRoute({
  method: 'post',
  path: '/preorders/payment/confirm',
  tags: ['Payments'],
  summary: '確認 LINE Pay 支付',
  description: 'LINE Pay 支付完成後的回調接口，確認支付並創建預購訂單',
  operationId: 'Payments_ConfirmLinePay',
  request: {
    query: z.object({
      transactionId: z.string().min(1).describe('交易 ID（字符串格式）'),
      orderId: z.string().describe('訂單 ID'),
    }),
    body: {
      content: {
        'application/json': {
          schema: z.object({
            campaignId: z.number().int().positive().optional().describe('檔期 ID（可選，如果提供則驗證）'),
            items: z
              .array(
                z.object({
                  productId: z.number().int().positive().describe('商品 ID'),
                  quantity: z.number().int().positive().describe('預購數量'),
                }),
              )
              .min(1)
              .optional()
              .describe('商品列表（可選，如果提供則驗證）'),
            pickupDate: z.string().optional().describe('取貨日期（可選）'),
            totalAmount: z.number().int().positive().optional().describe('總金額（可選，如果提供則驗證）'),
            customerName: z.string().min(1).max(100).optional().describe('取餐人姓名'),
            customerPhone: z.string().regex(/^09\d{8}$/).optional().describe('取餐人手機'),
            customerNote: z.string().max(500).optional().describe('客製備註'),
          }),
        },
      },
    },
  },
  responses: {
    200: {
      description: '支付確認成功，訂單已創建',
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            data: z.object({
              orderNumber: z.string().describe('訂單編號'),
              campaignId: z.number().int().positive().describe('檔期 ID'),
              quantity: z.number().int().positive().describe('預購數量'),
              remainingQuantity: z.number().int().nonnegative().describe('剩餘量'),
              totalTwd: z.number().int().nonnegative().describe('訂單總金額'),
            }),
            timestamp: z.string(),
          }),
        },
      },
    },
    400: {
      description: '支付確認失敗',
      content: {
        'application/json': {
          schema: z.object({
            code: z.string(),
            message: z.string(),
            details: z.unknown().optional(),
          }),
        },
      },
    },
  },
});

paymentsRouter.openapi(confirmPaymentRoute, async (c) => {
  try {
    // 先获取原始查询参数用于日志
    const rawTransactionId = c.req.query('transactionId');
    const rawOrderId = c.req.query('orderId');
    
    logger.info('收到支付確認請求（原始參數）', {
      rawTransactionId,
      rawOrderId,
      url: c.req.url,
    });
    
    const { transactionId, orderId } = c.req.valid('query');
    const body = c.req.valid('json');
    
    logger.info('收到支付確認請求（驗證後）', {
      transactionId,
      orderId,
      transactionIdType: typeof transactionId,
      hasBody: !!body,
      bodyKeys: body ? Object.keys(body) : [],
    });
    
    // 從數據庫獲取支付資訊（優先使用數據庫中的資訊）
    const paymentQuery = `
      SELECT campaign_id, items_json, total_amount, pickup_date, status, user_id, points_to_redeem
      FROM preorder_payments
      WHERE transaction_id = ? AND order_id = ?
      LIMIT 1
    `;
    
    const paymentResult = await c.env.DB.prepare(paymentQuery).bind(transactionId, orderId).first();
    
    let campaignId: number;
    let items: Array<{ productId: number; quantity: number }>;
    let totalAmount: number;
    let pickupDate: string;
    let userId: number | undefined;
    let pointsToRedeem: number | undefined;
    
    if (paymentResult) {
      // 使用數據庫中的資訊
      logger.info('從數據庫獲取支付資訊', { transactionId, orderId });
      campaignId = paymentResult.campaign_id as number;
      try {
        items = JSON.parse(paymentResult.items_json as string);
      } catch (error) {
        logger.error('解析支付商品列表失敗', { items_json: paymentResult.items_json, error });
        throw new ApiError('INVALID_PAYMENT_DATA', '支付資料格式錯誤', 500);
      }
      totalAmount = paymentResult.total_amount as number;
      pickupDate = paymentResult.pickup_date as string;
      userId = paymentResult.user_id as number | undefined;
      pointsToRedeem = (paymentResult.points_to_redeem as number | undefined) || undefined;
      
      // 檢查是否已經確認過
      if (paymentResult.status === 'confirmed') {
        logger.info('支付已經確認過，查詢已創建的訂單', { transactionId, orderId });
        
        // 如果已經確認過，查詢已創建的訂單並返回
        // 先獲取 campaign 資訊（用於查詢剩餘數量）
        const preorderService = new PreorderService(c.env.DB);
        const campaign = await preorderService.getCampaignById(campaignId);
        
        // 查詢 preorder_orders 表，找到這個支付對應的訂單
        // 通過 preorder_payments 的 transaction_id 和 order_id 找到對應的訂單
        const recentOrderQuery = `
          SELECT DISTINCT o.order_number, o.id as order_id, o.total_twd
          FROM preorder_orders po
          INNER JOIN orders o ON po.order_id = o.id
          INNER JOIN preorder_payments pp ON pp.transaction_id = ? AND pp.order_id = ?
          WHERE po.campaign_id = ? AND o.channel = '網路'
          ORDER BY o.created_at DESC
          LIMIT 1
        `;
        const recentOrder = await c.env.DB.prepare(recentOrderQuery)
          .bind(transactionId, orderId, campaignId)
          .first();
        
        if (recentOrder) {
          // 計算總數量（一個訂單可能包含多個商品）
          const totalQuantityQuery = `
            SELECT SUM(quantity) as total_quantity
            FROM preorder_orders
            WHERE order_id = ?
          `;
          const totalQuantityResult = await c.env.DB.prepare(totalQuantityQuery)
            .bind(recentOrder.order_id)
            .first();
          const totalQuantity = (totalQuantityResult?.total_quantity as number) || 0;
          
          // 查詢第一個商品的剩餘數量（用於顯示）
          const product = campaign.products.find((p) => p.productId === items[0]?.productId);
          const remainingQuantity = product ? product.remainingQuantity : 0;
          
          return c.json(
            {
              success: true,
              data: {
                orderNumber: recentOrder.order_number as string,
                campaignId: campaignId,
                quantity: totalQuantity,
                remainingQuantity: remainingQuantity,
                totalTwd: recentOrder.total_twd as number,
              },
              timestamp: new Date().toISOString(),
            },
            200,
          );
        }
        
        // 如果找不到訂單，返回一個符合 schema 的響應
        const product = campaign.products.find((p) => p.productId === items[0]?.productId);
        return c.json(
          {
            success: true,
            data: {
              orderNumber: orderId, // 使用 orderId 作為訂單編號（臨時方案）
              campaignId: campaignId,
              quantity: items.reduce((sum, item) => sum + item.quantity, 0),
              remainingQuantity: product ? product.remainingQuantity : 0,
              totalTwd: totalAmount,
            },
            timestamp: new Date().toISOString(),
          },
          200,
        );
      }
    } else if (body && body.campaignId && body.items && body.totalAmount && body.pickupDate) {
      // 如果數據庫中沒有，使用請求體中的資訊（向後相容）
      logger.info('使用請求體中的支付資訊', { transactionId, orderId });
      campaignId = body.campaignId;
      items = body.items;
      totalAmount = body.totalAmount;
      pickupDate = body.pickupDate;
    } else {
      throw new ApiError('PAYMENT_INFO_NOT_FOUND', '找不到支付資訊，請重新下單', 404);
    }

    // 驗證預購檔期和商品
    const preorderService = new PreorderService(c.env.DB);
    const campaign = await preorderService.getCampaignById(campaignId);

    // 驗證所有商品並計算金額
    let calculatedAmount = 0;
    for (const item of items) {
      const product = campaign.products.find((p) => p.productId === item.productId);
      if (!product) {
        throw new ApiError('PRODUCT_NOT_FOUND', `商品 ${item.productId} 不存在於此預購檔期`, 404);
      }

      if (item.quantity > product.remainingQuantity) {
        throw new ApiError('QUANTITY_EXCEEDED', `商品 ${product.productName} 預購數量不足`, 409);
      }

      calculatedAmount += product.productPriceTwd * item.quantity;
    }

    // 如果有點數折抵，需要從計算金額中扣除點數折抵金額
    let finalCalculatedAmount = calculatedAmount;
    if (pointsToRedeem && pointsToRedeem > 0) {
      const pointsService = new PointsService(c.env.DB);
      const pointsDiscount = pointsService.calculatePointsDiscount(pointsToRedeem);
      finalCalculatedAmount = Math.max(0, calculatedAmount - pointsDiscount);
      
      logger.info('支付確認時計算點數折抵', {
        calculatedAmount,
        pointsToRedeem,
        pointsDiscount,
        finalCalculatedAmount,
        totalAmount,
      });
    }

    // 驗證金額是否一致（防止金額被篡改）
    // 允許 1 元的誤差（因為浮點數計算可能會有微小誤差）
    const amountDifference = Math.abs(finalCalculatedAmount - totalAmount);
    if (amountDifference > 1) {
      logger.error('支付金額不匹配', {
        calculatedAmount,
        finalCalculatedAmount,
        totalAmount,
        pointsToRedeem,
        difference: amountDifference,
        transactionId,
        items,
      });
      throw new ApiError(
        'AMOUNT_MISMATCH',
        `支付金額與訂單金額不匹配：計算金額 ${finalCalculatedAmount} 元，請求金額 ${totalAmount} 元`,
        400,
      );
    }

    // 確認 LINE Pay 支付
    // 注意：LINE Pay API 的 URL 路徑可以接受字符串格式的 transactionId
    // 直接使用字符串，避免轉換為 number 時丟失精度
    
    // 注意：這裡不需要再次檢查，因為上面的代碼已經處理了已確認的情況
    // 如果執行到這裡，說明支付狀態是 'pending'，需要調用 LINE Pay API 確認
    
    const linePayService = new LinePayService(c.env);
    
    logger.info('準備確認 LINE Pay 支付', {
      transactionId,
      transactionIdType: typeof transactionId,
      transactionIdLength: transactionId.length,
    });
    
    // 直接傳遞字符串（LINE Pay API 在 URL 路徑中會自動處理）
    let confirmResponse;
    try {
      confirmResponse = await linePayService.confirmPayment(transactionId, totalAmount);
    } catch (error) {
      // 如果 LINE Pay 返回 "Duplicated" 錯誤，說明支付已經確認過
      // 但我們的數據庫狀態可能還是 'pending'，需要檢查是否已經創建訂單
      if (error instanceof ApiError && error.code === 'LINE_PAY_ERROR') {
        const errorMessage = error.message || '';
        if (errorMessage.includes('Duplicated') || errorMessage.includes('Existing same orderId')) {
          logger.warn('LINE Pay 返回重複請求錯誤，檢查是否已創建訂單', {
            transactionId,
            orderId,
            errorMessage,
          });
          
          // 查詢是否已經有訂單（通過 transactionId 或 orderId）
          const existingOrderQuery = `
            SELECT DISTINCT o.id, o.order_number, o.channel, o.total_twd, po.campaign_id
            FROM preorder_orders po
            INNER JOIN orders o ON po.order_id = o.id
            INNER JOIN preorder_payments pp ON pp.transaction_id = ? AND pp.order_id = ?
            WHERE o.channel = '網路'
            ORDER BY o.created_at DESC
            LIMIT 1
          `;
          const existingOrder = await c.env.DB.prepare(existingOrderQuery)
            .bind(transactionId, orderId)
            .first();
          
          if (existingOrder) {
            // 訂單已經創建，更新支付狀態為 'confirmed' 並返回成功
            logger.info('發現已創建的訂單，更新支付狀態', {
              transactionId,
              requestOrderId: orderId,
              existingOrderId: existingOrder.id,
              orderNumber: existingOrder.order_number,
            });
            
            // 更新支付狀態
            const updateStatusQuery = `
              UPDATE preorder_payments
              SET status = 'confirmed', updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
              WHERE transaction_id = ? AND order_id = ?
            `;
            await c.env.DB.prepare(updateStatusQuery).bind(transactionId, orderId).run();
            
            // 計算總數量（一個訂單可能包含多個商品）
            const totalQuantityQuery = `
              SELECT SUM(quantity) as total_quantity
              FROM preorder_orders
              WHERE order_id = ?
            `;
            const totalQuantityResult = await c.env.DB.prepare(totalQuantityQuery)
              .bind(existingOrder.id)
              .first();
            const totalQuantity = (totalQuantityResult?.total_quantity as number) || 0;
            
            // 獲取第一個商品的剩餘數量（用於顯示）
            const product = campaign.products.find((p) => p.productId === items[0]?.productId);
            const remainingQuantity = product ? product.remainingQuantity : 0;
            
            return c.json(
              {
                success: true,
                data: {
                  orderNumber: existingOrder.order_number as string,
                  campaignId: campaignId,
                  quantity: totalQuantity,
                  remainingQuantity: remainingQuantity,
                  totalTwd: existingOrder.total_twd as number,
                },
                timestamp: new Date().toISOString(),
              },
              200,
            );
          }
          
          // 如果沒有找到訂單，但 LINE Pay 說已經重複，可能是時序問題
          // 繼續拋出錯誤，讓前端重試
          logger.error('LINE Pay 返回重複請求，但未找到已創建的訂單', {
            transactionId,
            orderId,
          });
        }
      }
      
      // 其他錯誤直接拋出
      throw error;
    }

    if (!confirmResponse.info) {
      throw new ApiError('LINE_PAY_INVALID_RESPONSE', 'LINE Pay 回應格式錯誤', 500);
    }

    logger.info('LINE Pay 支付確認成功', {
      transactionId,
      orderId,
      totalAmount,
      itemCount: items.length,
    });

    // 創建一個訂單包含所有商品（而不是為每個商品創建獨立訂單）
    const orderService = new OrderService(c.env.DB);
    
    // 1. 先驗證所有商品並更新預購數量
    for (const item of items) {
      const product = campaign.products.find((p) => p.productId === item.productId);
      if (!product) {
        throw new ApiError('PRODUCT_NOT_FOUND', `商品 ${item.productId} 不存在於此預購檔期`, 404);
      }

      if (item.quantity > product.remainingQuantity) {
        throw new ApiError('QUANTITY_EXCEEDED', `商品 ${product.productName} 預購數量不足`, 409);
      }

      // 更新商品預購數量
      const updateResult = await c.env.DB
        .prepare(
          `
          UPDATE preorder_campaign_products
          SET reserved_quantity = reserved_quantity + ?, updated_at = datetime('now')
          WHERE campaign_id = ? AND product_id = ? AND reserved_quantity + ? <= supply_quantity
        `,
        )
        .bind(item.quantity, campaignId, item.productId, item.quantity)
        .run();

      if (!updateResult.success || updateResult.meta.changes === 0) {
        throw new ApiError('PREORDER_QUOTA_EXCEEDED', `商品 ${product.productName} 預購數量不足`, 409);
      }
    }

    // 2. 創建一個訂單包含所有商品
    const orderItems = items.map((item) => ({
      product_id: item.productId,
      quantity: item.quantity,
    }));

    const orderDetail = await orderService.createOrder({
      user_id: userId, // 使用從支付資訊中獲取的 user_id（如果有的話）
      items: orderItems,
      channel: '網路',
      points_to_redeem: pointsToRedeem && pointsToRedeem > 0 ? pointsToRedeem : undefined, // 點數折抵
    });

    logger.info('創建多商品訂單成功', {
      orderId: orderDetail.id,
      orderNumber: orderDetail.order_number,
      itemCount: items.length,
    });

    // 3. 為每個商品創建 preorder_orders 記錄（關聯到同一個訂單）
    const customerName = body?.customerName || '未提供';
    const customerPhone = body?.customerPhone || '0900000000';
    const customerNote = body?.customerNote || null;

    for (const item of items) {
      const preorderOrderResult = await c.env.DB
        .prepare(
          `
          INSERT INTO preorder_orders (
            campaign_id,
            order_id,
            product_id,
            customer_name,
            customer_phone,
            pickup_slot,
            customer_note,
            quantity,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `,
        )
        .bind(
          campaignId,
          orderDetail.id,
          item.productId,
          customerName,
          customerPhone,
          pickupDate,
          customerNote,
          item.quantity,
        )
        .run();

      if (!preorderOrderResult.success) {
        logger.error('創建預購訂單記錄失敗', {
          orderId: orderDetail.id,
          productId: item.productId,
          quantity: item.quantity,
        });
        throw new ApiError('PREORDER_ORDER_FAILED', '建立預購訂單記錄失敗', 500);
      }
    }

    // 4. 更新支付狀態為已確認
    try {
      const updatePaymentQuery = `
        UPDATE preorder_payments
        SET status = 'confirmed', updated_at = datetime('now')
        WHERE transaction_id = ? AND order_id = ?
      `;
      await c.env.DB.prepare(updatePaymentQuery).bind(transactionId, orderId).run();
    } catch (dbError) {
      logger.error('更新支付狀態失敗', {
        error: dbError instanceof Error ? dbError.message : String(dbError),
        transactionId,
        orderId,
      });
      // 不中斷流程，訂單已經創建成功
    }

    // 5. 計算剩餘數量（使用第一個商品作為參考）
    const firstProduct = campaign.products.find((p) => p.productId === items[0]?.productId);
    const remainingQuantity = firstProduct ? firstProduct.remainingQuantity - items[0].quantity : 0;

    // 6. 返回訂單資訊
    return c.json(
      {
        success: true,
        data: {
          orderNumber: orderDetail.order_number,
          campaignId: campaignId,
          quantity: items.reduce((sum, item) => sum + item.quantity, 0), // 總數量
          remainingQuantity: Math.max(remainingQuantity, 0),
          totalTwd: totalAmount,
        },
        timestamp: new Date().toISOString(),
      },
      200,
    );
  } catch (error) {
    return handleError(c, error);
  }
});
