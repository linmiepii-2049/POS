/**
 * Survey Zod Schemas
 * 問卷調查資料結構定義（SSOT）
 */

import { z } from '@hono/zod-openapi';

/**
 * 問卷回應 Schema
 */
export const SurveyResponseSchema = z.object({
  id: z.number().int().positive().openapi({
    example: 1,
    description: '問卷 ID',
  }).optional(),
  
  memberId: z.string().regex(/^09\d{8}$/, '手機號碼必須是09開頭的10位數字').openapi({
    example: '0912345678',
    description: '會員 ID（手機號碼）',
  }),
  
  phone: z.string().regex(/^09\d{8}$/).openapi({
    example: '0912345678',
    description: '手機號碼',
  }),
  
  age: z.enum(['25歲以下', '26-45歲', '46歲以上']).openapi({
    example: '26-45歲',
    description: '年齡範圍',
  }),
  
  gender: z.enum(['男', '女']).openapi({
    example: '男',
    description: '性別',
  }),
  
  location: z.enum(['附近', '外地']).optional().openapi({
    example: '附近',
    description: '居住地',
  }),
  
  purchaseFrequency: z.enum(['每週3次以上', '每週1~3次', '偶爾']).optional().openapi({
    example: '每週1~3次',
    description: '購買頻率',
  }),
  
  purchaseLocation: z.array(z.enum(['麵包店', '便利商店', '量販超市', '網購'])).optional().openapi({
    example: ['麵包店', '便利商店'],
    description: '購買地點（可複選）',
  }),
  
  purchaseTime: z.enum(['早上(6:00~12:00)', '下午(12:00~17:00)', '晚上(17:00後)']).optional().openapi({
    example: '早上(6:00~12:00)',
    description: '購買時間',
  }),
  
  mealType: z.enum(['早餐', '點心', '其他']).optional().openapi({
    example: '早餐',
    description: '用餐時機',
  }),
  
  purchaseFactors: z.array(z.enum(['價格', '健康', '好吃', '口味嚐鮮', '美觀', '衛生'])).optional().openapi({
    example: ['健康', '好吃'],
    description: '選購考量因素（可複選）',
  }),
  
  healthPrice: z.enum(['會', '不會']).optional().openapi({
    example: '會',
    description: '會因健康考量而選擇較貴的麵包嗎',
  }),
  
  naturalPreference: z.enum(['在意', '不在意']).optional().openapi({
    example: '在意',
    description: '在意天然食材嗎',
  }),
  
  tastePreference: z.array(z.enum(['原味', '鹹', '甜'])).optional().openapi({
    example: ['原味', '甜'],
    description: '口味偏好（可複選）',
  }),
  
  breadTypes: z.array(z.enum(['吐司', '台式、日式麵包', '歐式麵包', '法國麵包', '丹麥可頌', '貝果系列', '無麩質麵包', '其他'])).optional().openapi({
    example: ['吐司', '歐式麵包'],
    description: '喜歡的麵包種類（可複選）',
  }),
  
  breadTypesOther: z.string().max(100).optional().openapi({
    example: '雜糧麵包',
    description: '其他麵包種類（自行填寫）',
  }),
  
  favoriteBread: z.string().max(500).optional().openapi({
    example: '我最喜歡吃剛出爐的法國麵包，外酥內軟很好吃',
    description: '最喜歡的麵包',
  }),
  
  desiredBread: z.string().max(500).optional().openapi({
    example: '希望能有全麥核桃麵包',
    description: '想吃的麵包',
  }),
  
  lineUserId: z.string().optional().openapi({
    example: 'U1234567890abcdef',
    description: 'LINE 用戶 ID',
  }),
  
  displayName: z.string().optional().openapi({
    example: '王小明',
    description: 'LINE 顯示名稱',
  }),
  
  ipAddress: z.string().optional().openapi({
    example: '192.168.1.1',
    description: 'IP 位址',
  }),
  
  userAgent: z.string().optional().openapi({
    example: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    description: '瀏覽器資訊',
  }),
  
  userId: z.number().int().positive().optional().openapi({
    example: 1,
    description: '關聯的會員 ID（POS 系統）',
  }),
  
  createdAt: z.string().optional().openapi({
    example: '2025-01-12T10:30:00.000Z',
    description: '建立時間（UTC）',
  }),
  
  updatedAt: z.string().optional().openapi({
    example: '2025-01-12T10:30:00.000Z',
    description: '更新時間（UTC）',
  }),
});

/**
 * 建立問卷請求 Schema
 * 注意：ip_address 和 user_agent 由後端自動從 request 中提取，前端不需要傳送
 */
export const CreateSurveyRequestSchema = SurveyResponseSchema.omit({ 
  id: true, 
  userId: true,
  ipAddress: true,  // 由後端自動提取
  userAgent: true, // 由後端自動提取
  createdAt: true, 
  updatedAt: true 
}).openapi('CreateSurveyRequest');

/**
 * 問卷列表查詢參數 Schema
 */
export const SurveyListQuerySchema = z.object({
  page: z.string().optional().openapi({
    example: '1',
    description: '頁碼',
  }),
  limit: z.string().optional().openapi({
    example: '20',
    description: '每頁筆數',
  }),
  age: z.enum(['25歲以下', '26-45歲', '46歲以上']).optional().openapi({
    example: '26-45歲',
    description: '篩選年齡',
  }),
  gender: z.enum(['男', '女']).optional().openapi({
    example: '男',
    description: '篩選性別',
  }),
}).openapi('SurveyListQuery');

/**
 * 問卷列表回應 Schema
 */
export const SurveyListResponseSchema = z.object({
  surveys: z.array(SurveyResponseSchema).openapi({
    description: '問卷列表',
  }),
  pagination: z.object({
    page: z.number().int().positive(),
    limit: z.number().int().positive(),
    total: z.number().int().nonnegative(),
    totalPages: z.number().int().nonnegative(),
  }).openapi({
    description: '分頁資訊',
  }),
}).openapi('SurveyListResponse');

/**
 * 問卷統計 Schema
 */
export const SurveyStatsSchema = z.object({
  totalSurveys: z.number().int().nonnegative().openapi({
    example: 150,
    description: '總問卷數',
  }),
  ageDistribution: z.record(z.string(), z.number()).openapi({
    example: { '25歲以下': 30, '26-45歲': 80, '46歲以上': 40 },
    description: '年齡分佈',
  }),
  genderDistribution: z.record(z.string(), z.number()).openapi({
    example: { '男': 70, '女': 80 },
    description: '性別分佈',
  }),
  purchaseFrequencyDistribution: z.record(z.string(), z.number()).optional().openapi({
    example: { '每週3次以上': 40, '每週1~3次': 60, '偶爾': 50 },
    description: '購買頻率分佈',
  }),
}).openapi('SurveyStats');

/**
 * 型別導出
 */
export type SurveyResponse = z.infer<typeof SurveyResponseSchema>;
export type CreateSurveyRequest = z.infer<typeof CreateSurveyRequestSchema>;
export type SurveyListQuery = z.infer<typeof SurveyListQuerySchema>;
export type SurveyListResponse = z.infer<typeof SurveyListResponseSchema>;
export type SurveyStats = z.infer<typeof SurveyStatsSchema>;

