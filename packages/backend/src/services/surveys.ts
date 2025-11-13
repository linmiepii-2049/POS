/**
 * Survey Service
 * 問卷調查業務邏輯層
 */

import type { D1Database } from '@cloudflare/workers-types';
import type { CreateSurveyRequest, SurveyResponse, SurveyListQuery, SurveyStats } from '../zod/surveys.js';

/**
 * 建立問卷
 * @param db 資料庫實例
 * @param data 問卷資料
 * @param ipAddress 客戶端 IP 位址（可選）
 * @param userAgent 瀏覽器資訊（可選）
 * @throws {Error} 如果手機號碼已存在（重複提交）
 */
export async function createSurvey(
  db: D1Database, 
  data: CreateSurveyRequest,
  ipAddress?: string,
  userAgent?: string
): Promise<SurveyResponse> {
  // 檢查是否已存在該會員的問卷
  const existing = await db
    .prepare('SELECT id FROM survey_responses WHERE member_id = ?')
    .bind(data.memberId)
    .first();

  if (existing) {
    throw new Error('此手機號碼已經填寫過問卷，無法重複提交');
  }

  // 新增問卷記錄
  const result = await db
    .prepare(`
      INSERT INTO survey_responses (
        member_id, phone, age, gender, location,
        purchase_frequency, purchase_location, purchase_time, meal_type,
        purchase_factors, health_price, natural_preference, taste_preference,
        bread_types, bread_types_other, favorite_bread, desired_bread,
        line_user_id, display_name, ip_address, user_agent
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `)
    .bind(
      data.memberId,
      data.phone,
      data.age,
      data.gender,
      data.location || null,
      data.purchaseFrequency || null,
      data.purchaseLocation ? JSON.stringify(data.purchaseLocation) : null,
      data.purchaseTime || null,
      data.mealType || null,
      data.purchaseFactors ? JSON.stringify(data.purchaseFactors) : null,
      data.healthPrice || null,
      data.naturalPreference || null,
      data.tastePreference ? JSON.stringify(data.tastePreference) : null,
      data.breadTypes ? JSON.stringify(data.breadTypes) : null,
      data.breadTypesOther || null,
      data.favoriteBread || null,
      data.desiredBread || null,
      data.lineUserId || null,
      data.displayName || null,
      ipAddress || null,
      userAgent || null
    )
    .run();

  if (!result.success) {
    throw new Error('問卷建立失敗');
  }

  // 查詢並回傳新建立的問卷
  const survey = await getSurveyByMemberId(db, data.memberId);
  if (!survey) {
    throw new Error('問卷建立後查詢失敗');
  }

  return survey;
}

/**
 * 根據會員 ID（手機號碼）查詢問卷
 */
export async function getSurveyByMemberId(db: D1Database, memberId: string): Promise<SurveyResponse | null> {
  const row = await db
    .prepare('SELECT * FROM survey_responses WHERE member_id = ?')
    .bind(memberId)
    .first();

  if (!row) {
    return null;
  }

  return parseSurveyRow(row);
}

/**
 * 根據 ID 查詢問卷
 */
export async function getSurveyById(db: D1Database, id: number): Promise<SurveyResponse | null> {
  const row = await db
    .prepare('SELECT * FROM survey_responses WHERE id = ?')
    .bind(id)
    .first();

  if (!row) {
    return null;
  }

  return parseSurveyRow(row);
}

/**
 * 查詢問卷列表（支援分頁和篩選）
 */
export async function listSurveys(
  db: D1Database,
  query: SurveyListQuery
): Promise<{ surveys: SurveyResponse[]; pagination: any }> {
  const page = parseInt(query.page || '1', 10);
  const limit = parseInt(query.limit || '20', 10);
  const offset = (page - 1) * limit;

  // 建立查詢條件
  const conditions: string[] = [];
  const bindings: any[] = [];

  if (query.age) {
    conditions.push('age = ?');
    bindings.push(query.age);
  }

  if (query.gender) {
    conditions.push('gender = ?');
    bindings.push(query.gender);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // 查詢總數
  const countResult = await db
    .prepare(`SELECT COUNT(*) as total FROM survey_responses ${whereClause}`)
    .bind(...bindings)
    .first<{ total: number }>();

  const total = countResult?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // 查詢資料
  const rows = await db
    .prepare(`
      SELECT * FROM survey_responses 
      ${whereClause}
      ORDER BY created_at DESC 
      LIMIT ? OFFSET ?
    `)
    .bind(...bindings, limit, offset)
    .all();

  const surveys = rows.results.map(parseSurveyRow);

  return {
    surveys,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
}

/**
 * 取得問卷統計資料
 */
export async function getSurveyStats(db: D1Database): Promise<SurveyStats> {
  // 總問卷數
  const totalResult = await db
    .prepare('SELECT COUNT(*) as total FROM survey_responses')
    .first<{ total: number }>();
  const totalSurveys = totalResult?.total || 0;

  // 年齡分佈
  const ageRows = await db
    .prepare('SELECT age, COUNT(*) as count FROM survey_responses GROUP BY age')
    .all();
  const ageDistribution: Record<string, number> = {};
  ageRows.results.forEach((row: any) => {
    ageDistribution[row.age] = row.count;
  });

  // 性別分佈
  const genderRows = await db
    .prepare('SELECT gender, COUNT(*) as count FROM survey_responses GROUP BY gender')
    .all();
  const genderDistribution: Record<string, number> = {};
  genderRows.results.forEach((row: any) => {
    genderDistribution[row.gender] = row.count;
  });

  // 購買頻率分佈
  const frequencyRows = await db
    .prepare('SELECT purchase_frequency, COUNT(*) as count FROM survey_responses WHERE purchase_frequency IS NOT NULL GROUP BY purchase_frequency')
    .all();
  const purchaseFrequencyDistribution: Record<string, number> = {};
  frequencyRows.results.forEach((row: any) => {
    purchaseFrequencyDistribution[row.purchase_frequency] = row.count;
  });

  return {
    totalSurveys,
    ageDistribution,
    genderDistribution,
    purchaseFrequencyDistribution,
  };
}

/**
 * 刪除問卷（管理功能）
 */
export async function deleteSurvey(db: D1Database, id: number): Promise<boolean> {
  const result = await db
    .prepare('DELETE FROM survey_responses WHERE id = ?')
    .bind(id)
    .run();

  return result.success;
}

/**
 * 解析資料庫列為 SurveyResponse 物件
 */
function parseSurveyRow(row: any): SurveyResponse {
  return {
    id: row.id,
    memberId: row.member_id,
    phone: row.phone,
    age: row.age,
    gender: row.gender,
    location: row.location || undefined,
    purchaseFrequency: row.purchase_frequency || undefined,
    purchaseLocation: row.purchase_location ? JSON.parse(row.purchase_location) : undefined,
    purchaseTime: row.purchase_time || undefined,
    mealType: row.meal_type || undefined,
    purchaseFactors: row.purchase_factors ? JSON.parse(row.purchase_factors) : undefined,
    healthPrice: row.health_price || undefined,
    naturalPreference: row.natural_preference || undefined,
    tastePreference: row.taste_preference ? JSON.parse(row.taste_preference) : undefined,
    breadTypes: row.bread_types ? JSON.parse(row.bread_types) : undefined,
    breadTypesOther: row.bread_types_other || undefined,
    favoriteBread: row.favorite_bread || undefined,
    desiredBread: row.desired_bread || undefined,
    lineUserId: row.line_user_id || undefined,
    displayName: row.display_name || undefined,
    ipAddress: row.ip_address || undefined,
    userAgent: row.user_agent || undefined,
    userId: row.user_id || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

