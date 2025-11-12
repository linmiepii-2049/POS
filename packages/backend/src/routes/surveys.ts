/**
 * Survey Routes
 * 問卷調查 API 路由
 */

import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import type { Env } from '../env.d.ts';
import {
  CreateSurveyRequestSchema,
  SurveyResponseSchema,
  SurveyListQuerySchema,
  SurveyListResponseSchema,
  SurveyStatsSchema,
} from '../zod/surveys.js';
import { ErrorResponseSchema } from '../zod/users.js';
import {
  createSurvey,
  getSurveyByMemberId,
  getSurveyById,
  listSurveys,
  getSurveyStats,
  deleteSurvey,
} from '../services/surveys.js';
import { z } from '@hono/zod-openapi';

export const surveysRouter = new OpenAPIHono<{ Bindings: Env }>();

// ================================
// POST /api/surveys - 提交問卷
// ================================
const createSurveyRoute = createRoute({
  method: 'post',
  path: '/surveys',
  tags: ['Surveys'],
  summary: '提交問卷',
  description: '提交 LIFF 問卷調查資料。每個手機號碼只能提交一次。',
  request: {
    body: {
      content: {
        'application/json': {
          schema: CreateSurveyRequestSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SurveyResponseSchema,
        },
      },
      description: '問卷提交成功',
    },
    409: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '問卷已存在（重複提交）',
    },
    400: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '驗證錯誤',
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

surveysRouter.openapi(createSurveyRoute, async (c) => {
  const body = c.req.valid('json');
  const db = c.env.DB;

  try {
    const result = await createSurvey(db, body);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('問卷提交錯誤:', error);
    
    if (error.message.includes('已經填寫過問卷')) {
      return c.json(
        {
          code: 'DUPLICATE_SURVEY',
          message: error.message,
        },
        409
      );
    }
    
    return c.json(
      {
        code: 'INTERNAL_ERROR',
        message: '問卷提交失敗',
        details: error.message,
      },
      500
    );
  }
});

// ================================
// GET /api/surveys/:memberId - 查詢問卷（根據手機號碼）
// ================================
const getSurveyByMemberIdRoute = createRoute({
  method: 'get',
  path: '/surveys/{memberId}',
  tags: ['Surveys'],
  summary: '查詢問卷',
  description: '根據手機號碼（會員 ID）查詢問卷資料',
  request: {
    params: z.object({
      memberId: z.string().regex(/^09\d{8}$/, '手機號碼格式錯誤').openapi({
        example: '0912345678',
        description: '會員 ID（手機號碼）',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SurveyResponseSchema,
        },
      },
      description: '問卷資料',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '找不到問卷資料',
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

surveysRouter.openapi(getSurveyByMemberIdRoute, async (c) => {
  const { memberId } = c.req.valid('param');
  const db = c.env.DB;

  try {
    const result = await getSurveyByMemberId(db, memberId);
    
    if (!result) {
      return c.json(
        {
          code: 'NOT_FOUND',
          message: '找不到該會員的問卷資料',
        },
        404
      );
    }
    
    return c.json(result, 200);
  } catch (error: any) {
    console.error('查詢問卷錯誤:', error);
    return c.json(
      {
        code: 'INTERNAL_ERROR',
        message: '查詢失敗',
        details: error.message,
      },
      500
    );
  }
});

// ================================
// GET /api/surveys - 查詢問卷列表
// ================================
const listSurveysRoute = createRoute({
  method: 'get',
  path: '/surveys',
  tags: ['Surveys'],
  summary: '查詢問卷列表',
  description: '查詢問卷列表，支援分頁和篩選',
  request: {
    query: SurveyListQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SurveyListResponseSchema,
        },
      },
      description: '問卷列表',
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

surveysRouter.openapi(listSurveysRoute, async (c) => {
  const query = c.req.valid('query');
  const db = c.env.DB;

  try {
    const result = await listSurveys(db, query);
    return c.json(result, 200);
  } catch (error: any) {
    console.error('查詢問卷列表錯誤:', error);
    return c.json(
      {
        code: 'INTERNAL_ERROR',
        message: '查詢失敗',
        details: error.message,
      },
      500
    );
  }
});

// ================================
// GET /api/surveys/stats/summary - 問卷統計
// ================================
const getSurveyStatsRoute = createRoute({
  method: 'get',
  path: '/surveys/stats/summary',
  tags: ['Surveys'],
  summary: '問卷統計',
  description: '取得問卷統計資料（總數、年齡分佈、性別分佈等）',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: SurveyStatsSchema,
        },
      },
      description: '統計資料',
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

surveysRouter.openapi(getSurveyStatsRoute, async (c) => {
  const db = c.env.DB;

  try {
    const stats = await getSurveyStats(db);
    return c.json(stats, 200);
  } catch (error: any) {
    console.error('取得統計資料錯誤:', error);
    return c.json(
      {
        code: 'INTERNAL_ERROR',
        message: '查詢失敗',
        details: error.message,
      },
      500
    );
  }
});

// ================================
// DELETE /api/surveys/:id - 刪除問卷（管理功能）
// ================================
const deleteSurveyRoute = createRoute({
  method: 'delete',
  path: '/surveys/:id',
  tags: ['Surveys'],
  summary: '刪除問卷',
  description: '刪除指定 ID 的問卷（管理功能）',
  request: {
    params: z.object({
      id: z.string().regex(/^\d+$/, 'ID 必須是數字').openapi({
        example: '1',
        description: '問卷 ID',
      }),
    }),
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            message: z.string(),
          }),
        },
      },
      description: '刪除成功',
    },
    404: {
      content: {
        'application/json': {
          schema: ErrorResponseSchema,
        },
      },
      description: '找不到問卷',
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

surveysRouter.openapi(deleteSurveyRoute, async (c) => {
  const { id } = c.req.valid('param');
  const db = c.env.DB;

  try {
    const surveyId = parseInt(id, 10);
    
    // 檢查問卷是否存在
    const existing = await getSurveyById(db, surveyId);
    if (!existing) {
      return c.json(
        {
          code: 'NOT_FOUND',
          message: '找不到該問卷',
        },
        404
      );
    }
    
    // 刪除問卷
    const success = await deleteSurvey(db, surveyId);
    
    if (success) {
      return c.json(
        {
          success: true,
          message: '問卷已刪除',
        },
        200
      );
    } else {
      throw new Error('刪除失敗');
    }
  } catch (error: any) {
    console.error('刪除問卷錯誤:', error);
    return c.json(
      {
        code: 'INTERNAL_ERROR',
        message: '刪除失敗',
        details: error.message,
      },
      500
    );
  }
});

