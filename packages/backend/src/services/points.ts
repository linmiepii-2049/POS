import type { D1Database } from '@cloudflare/workers-types';
import type { PointsTransaction, PointsHistoryQuery, Pagination } from '../zod/points.js';

/**
 * 點數服務類別
 */
export class PointsService {
  constructor(private db: D1Database) {}

  /**
   * 將台北時間轉換為 UTC 時間
   */
  private taipeiToUtc(taipeiTime: string): string {
    // 如果輸入只有日期（YYYY-MM-DD），則設定為當天的開始時間
    let dateStr = taipeiTime;
    if (/^\d{4}-\d{2}-\d{2}$/.test(taipeiTime)) {
      dateStr = `${taipeiTime}T00:00:00+08:00`;
    }
    
    // 直接解析帶時區的日期字串
    const date = new Date(dateStr);
    return date.toISOString();
  }

  /**
   * 將台北時間轉換為 UTC 時間（結束時間）
   */
  private taipeiToUtcEnd(taipeiTime: string): string {
    // 如果輸入只有日期（YYYY-MM-DD），則設定為當天的結束時間
    let dateStr = taipeiTime;
    if (/^\d{4}-\d{2}-\d{2}$/.test(taipeiTime)) {
      dateStr = `${taipeiTime}T23:59:59+08:00`;
    }
    
    // 直接解析帶時區的日期字串
    const date = new Date(dateStr);
    return date.toISOString();
  }

  /**
   * 計算獲得的點數（消費金額 = 點數）
   */
  calculatePointsEarned(totalAmount: number): number {
    return Math.floor(totalAmount); // 1元 = 1點
  }

  /**
   * 計算點數折扣金額（20點 = 1元）
   */
  calculatePointsDiscount(pointsToRedeem: number): number {
    return Math.floor(pointsToRedeem / 20);
  }

  /**
   * 取得使用者目前點數
   */
  async getUserPoints(userId: number): Promise<number> {
    const query = 'SELECT points FROM users WHERE id = ?';
    const result = await this.db.prepare(query).bind(userId).first();
    return (result?.points as number) || 0;
  }

  /**
   * 驗證點數折抵是否有效
   */
  async validatePointsRedemption(userId: number, pointsToRedeem: number): Promise<{ valid: boolean; error?: string; currentPoints?: number }> {
    if (pointsToRedeem < 0) {
      return { valid: false, error: '點數不可為負數' };
    }

    if (pointsToRedeem === 0) {
      return { valid: true, currentPoints: 0 };
    }

    // 檢查點數必須是 20 的倍數
    if (pointsToRedeem % 20 !== 0) {
      return { valid: false, error: '點數必須是 20 的倍數' };
    }

    const currentPoints = await this.getUserPoints(userId);

    if (currentPoints < pointsToRedeem) {
      return { valid: false, error: `點數不足，目前點數: ${currentPoints}`, currentPoints };
    }

    return { valid: true, currentPoints };
  }

  /**
   * 新增點數（獲得）
   */
  async addPoints(userId: number, points: number, orderId: number | null, transactionType: 'EARN' | 'REDEEM'): Promise<void> {
    // 更新使用者點數
    const updateUserQuery = `
      UPDATE users 
      SET points = points + ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    await this.db.prepare(updateUserQuery).bind(points, userId).run();

    // 取得更新後的餘額
    const newBalance = await this.getUserPoints(userId);

    // 記錄交易
    const insertTransactionQuery = `
      INSERT INTO points_transactions (user_id, order_id, points_change, transaction_type, balance_after, created_at)
      VALUES (?, ?, ?, ?, ?, datetime('now'))
    `;
    await this.db.prepare(insertTransactionQuery).bind(
      userId,
      orderId,
      points,
      transactionType,
      newBalance
    ).run();
  }

  /**
   * 扣除點數（兌換）
   */
  async deductPoints(userId: number, points: number, orderId: number | null): Promise<void> {
    // 更新使用者點數
    const updateUserQuery = `
      UPDATE users 
      SET points = points - ?, updated_at = datetime('now')
      WHERE id = ?
    `;
    await this.db.prepare(updateUserQuery).bind(points, userId).run();

    // 取得更新後的餘額
    const newBalance = await this.getUserPoints(userId);

    // 記錄交易（扣除記錄為負數）
    const insertTransactionQuery = `
      INSERT INTO points_transactions (user_id, order_id, points_change, transaction_type, balance_after, created_at)
      VALUES (?, ?, ?, 'REDEEM', ?, datetime('now'))
    `;
    await this.db.prepare(insertTransactionQuery).bind(
      userId,
      orderId,
      -points, // 記錄為負數
      newBalance
    ).run();
  }

  /**
   * 取得點數交易歷史
   */
  async getPointsHistory(userId: number, query: PointsHistoryQuery): Promise<{ transactions: PointsTransaction[]; pagination: Pagination }> {
    const { page, limit, sortDir, transaction_type, from, to } = query;
    
    // 建立 WHERE 條件
    const conditions: string[] = ['user_id = ?'];
    const params: unknown[] = [userId];

    if (transaction_type) {
      conditions.push('transaction_type = ?');
      params.push(transaction_type);
    }

    if (from) {
      conditions.push('created_at >= ?');
      params.push(this.taipeiToUtc(from));
    }

    if (to) {
      conditions.push('created_at <= ?');
      params.push(this.taipeiToUtcEnd(to));
    }

    const whereClause = conditions.join(' AND ');

    // 計算總筆數
    const countQuery = `SELECT COUNT(*) as total FROM points_transactions WHERE ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // 計算分頁資訊
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 取得交易列表
    const orderBy = `created_at ${sortDir.toUpperCase()}`;
    const listQuery = `
      SELECT * FROM points_transactions 
      WHERE ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    
    const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const transactions = listResult.results as PointsTransaction[];

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }
}

