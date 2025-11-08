import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import { z } from 'zod';
import type { Env } from '../env.d.ts';

/**
 * 資料摘要回應結構
 */
const DataSummarySchema = z.object({
  table_name: z.string().describe('資料表名稱'),
  total_count: z.number().describe('總筆數'),
  sample_data: z.array(z.record(z.string(), z.string())).describe('樣本資料（最多5筆）')
});

const DataResponseSchema = z.object({
  success: z.boolean().describe('操作是否成功'),
  data: z.array(DataSummarySchema).describe('各表資料摘要'),
  timestamp: z.string().describe('查詢時間戳')
});

/**
 * 取得各表資料摘要的 API 路由
 */
const getDataRoute = createRoute({
  method: 'get',
  path: '/api/data',
  tags: ['Data'],
  summary: '取得各表資料摘要',
  description: '列出系統中所有主要資料表的記錄數量和樣本資料',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: DataResponseSchema,
          example: {
            success: true,
            data: [
              {
                table_name: 'users',
                total_count: 4,
                sample_data: [
                  { id: '1', name: '管理員', role: 'ADMIN' }
                ]
              }
            ],
            timestamp: '2025-01-22T10:00:00.000Z'
          }
        }
      },
      description: '成功取得資料摘要'
    },
    500: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            error: z.string(),
            timestamp: z.string()
          })
        }
      },
      description: '伺服器錯誤'
    }
  }
});

/**
 * 資料路由處理器
 */
export const dataRouter = new OpenAPIHono<{ Bindings: Env }>();

dataRouter.openapi(getDataRoute, async (c) => {
  try {
    const db = c.env.DB;
    const timestamp = new Date().toISOString();

    // 定義要查詢的資料表
    const tables = [
      'users',
      'products', 
      'orders',
      'order_items',
      'coupons',
      'coupon_codes',
      'coupon_grants',
      'coupon_redemptions',
      'cost'
    ];

    const data = [];

    // 查詢每個表的摘要資料
    for (const tableName of tables) {
      try {
        // 取得總筆數
        const countResult = await db.prepare(`SELECT COUNT(*) as count FROM ${tableName}`).first();
        const totalCount = countResult?.count as number || 0;

        // 取得樣本資料（最多5筆）
        let sampleData: any[] = [];
        if (totalCount > 0) {
          const sampleResult = await db.prepare(`SELECT * FROM ${tableName} LIMIT 5`).all();
          sampleData = sampleResult.results || [];
        }

        data.push({
          table_name: tableName,
          total_count: totalCount,
          sample_data: sampleData
        });
      } catch (error) {
        console.error(`查詢表 ${tableName} 時發生錯誤:`, error);
        // 即使某個表查詢失敗，也繼續處理其他表
        data.push({
          table_name: tableName,
          total_count: 0,
          sample_data: [],
          error: '查詢失敗'
        });
      }
    }

    return c.json({
      success: true,
      data,
      timestamp
    }, 200);

  } catch (error) {
    console.error('取得資料摘要時發生錯誤:', error);
    
    return c.json({
      success: false,
      error: '取得資料摘要時發生錯誤',
      timestamp: new Date().toISOString()
    }, 500);
  }
});
