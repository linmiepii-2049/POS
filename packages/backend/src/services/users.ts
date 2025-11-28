import type { D1Database } from '@cloudflare/workers-types';
import { getCurrentUTC } from '../utils/time.js';
import type { 
  User, 
  CreateUserRequest, 
  UpdateUserRequest, 
  UserQuery, 
  UserStats, 
  UserDetail, 
  Pagination, 
  CouponOwned 
} from '../zod/users.js';
import { PointsService } from './points.js';
import type { PointsHistoryQuery } from '../zod/points.js';

/**
 * 使用者服務類別
 */
export class UserService {
  constructor(private db: D1Database) {}

  /**
   * 將台北時間轉換為 UTC 時間
   */
  private taipeiToUtc(taipeiTime: string): string {
    // 台北時間比 UTC 快 8 小時
    const date = new Date(taipeiTime);
    const utcDate = new Date(date.getTime() - 8 * 60 * 60 * 1000);
    return utcDate.toISOString();
  }

  /**
   * 為使用者添加點數等值金額
   */
  private enrichUserWithPoints(user: any): User {
    const points = user.points || 0;
    return {
      ...user,
      points,
      points_yuan_equivalent: Math.floor(points / 20),
    };
  }

  /**
   * 取得使用者列表（支援分頁、排序、篩選）
   */
  async getUsers(query: UserQuery): Promise<{ users: User[]; pagination: Pagination }> {
    const { page, limit, sortBy, sortDir, nameOrPhone, is_active, from, to } = query;
    
    // 建立 WHERE 條件
    const conditions: string[] = [];
    const params: unknown[] = [];
    if (nameOrPhone) {
      conditions.push(`(name LIKE ? OR phone LIKE ?)`);
      params.push(`%${nameOrPhone}%`, `%${nameOrPhone}%`);
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = ?`);
      params.push(is_active);
    }

    if (from) {
      conditions.push(`created_at >= ?`);
      params.push(this.taipeiToUtc(from));
    }

    if (to) {
      conditions.push(`created_at <= ?`);
      params.push(this.taipeiToUtc(to));
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 計算總筆數
    const countQuery = `SELECT COUNT(*) as total FROM users ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // 計算分頁資訊
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 取得使用者列表（包含最後消費時間和月度消費金額）
    const orderBy = `${sortBy} ${sortDir.toUpperCase()}`;
    const listQuery = `
      SELECT 
        u.*,
        MAX(CASE WHEN o.status != 'cancelled' THEN o.created_at END) as last_purchase_at,
        COALESCE(SUM(CASE 
          WHEN o.created_at >= datetime('now', '-30 days') 
          AND o.status != 'cancelled'
          THEN o.total_twd 
          ELSE 0 
        END), 0) as current_month_spending,
        COALESCE(SUM(CASE 
          WHEN o.created_at >= datetime('now', '-60 days') 
          AND o.created_at < datetime('now', '-30 days')
          AND o.status != 'cancelled'
          THEN o.total_twd 
          ELSE 0 
        END), 0) as last_month_spending
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      ${whereClause} 
      GROUP BY u.id
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const rawUsers = listResult.results as any[];
    const users = rawUsers.map(user => this.enrichUserWithPoints(user));

    return {
      users,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * 根據 ID 取得使用者詳細資訊
   */
  async getUserById(id: number): Promise<UserDetail | null> {
    // 取得基本資訊
    const userQuery = 'SELECT * FROM users WHERE id = ?';
    const userResult = await this.db.prepare(userQuery).bind(id).first();
    
    if (!userResult) {
      return null;
    }

    const user = this.enrichUserWithPoints(userResult);

    // 取得統計資訊
    const stats = await this.getUserStats(id);

    return {
      ...user,
      stats,
    };
  }

  /**
   * 根據 LINE ID 取得使用者資訊
   */
  async getUserByLineId(lineId: string): Promise<User | null> {
    const query = `
      SELECT 
        u.*,
        MAX(CASE WHEN o.status != 'cancelled' THEN o.created_at END) as last_purchase_at,
        COALESCE(SUM(CASE 
          WHEN o.created_at >= datetime('now', '-30 days') 
          AND o.status != 'cancelled'
          THEN o.total_twd 
          ELSE 0 
        END), 0) as current_month_spending,
        COALESCE(SUM(CASE 
          WHEN o.created_at >= datetime('now', '-60 days') 
          AND o.created_at < datetime('now', '-30 days')
          AND o.status != 'cancelled'
          THEN o.total_twd 
          ELSE 0 
        END), 0) as last_month_spending
      FROM users u
      LEFT JOIN orders o ON u.id = o.user_id
      WHERE u.line_id = ? AND u.is_active = 1
      GROUP BY u.id
    `;
    
    const result = await this.db.prepare(query).bind(lineId).first();
    
    if (!result) {
      return null;
    }

    return this.enrichUserWithPoints(result);
  }

  /**
   * 取得使用者統計資訊
   */
  async getUserStats(userId: number): Promise<UserStats> {
    // 總消費金額
    const totalSpentQuery = `
      SELECT IFNULL(SUM(total_twd), 0) as total_spent
      FROM orders 
      WHERE user_id = ? AND status IN ('paid', 'confirmed')
    `;
    const totalSpentResult = await this.db.prepare(totalSpentQuery).bind(userId).first();
    const total_spent = totalSpentResult?.total_spent as number || 0;

    // 最後購買時間
    const lastPurchaseQuery = `
      SELECT MAX(created_at) as last_purchase_at
      FROM orders 
      WHERE user_id = ? AND status IN ('paid', 'confirmed')
    `;
    const lastPurchaseResult = await this.db.prepare(lastPurchaseQuery).bind(userId).first();
    const last_purchase_at = lastPurchaseResult?.last_purchase_at as string || null;

    // 總訂單數
    const totalOrdersQuery = `
      SELECT COUNT(*) as total_orders
      FROM orders 
      WHERE user_id = ?
    `;
    const totalOrdersResult = await this.db.prepare(totalOrdersQuery).bind(userId).first();
    const total_orders = totalOrdersResult?.total_orders as number || 0;

    return {
      total_spent,
      last_purchase_at,
      total_orders,
    };
  }

  /**
   * 建立使用者
   */
  async createUser(data: CreateUserRequest): Promise<User> {
    const { line_id, name, phone, role, is_active } = data;
    
    const query = `
      INSERT INTO users (line_id, name, phone, role, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = getCurrentUTC();
    const result = await this.db.prepare(query).bind(line_id || null, name, phone || null, role, is_active, now, now).run();
    
    if (!result.success) {
      throw new Error('建立使用者失敗');
    }

    // 取得新建立的使用者
    const newUser = await this.getUserById(result.meta.last_row_id as number);
    if (!newUser) {
      throw new Error('無法取得新建立的使用者');
    }

    return newUser;
  }

  /**
   * 更新使用者
   */
  async updateUser(id: number, data: UpdateUserRequest): Promise<User | null> {
    const { line_id, name, phone, role, is_active } = data;
    
    // 檢查使用者是否存在
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return null;
    }

    // 建立更新欄位
    const updateFields: string[] = [];
    const params: unknown[] = [];
    if (line_id !== undefined) {
      updateFields.push(`line_id = ?`);
      params.push(line_id);
    }

    if (name !== undefined) {
      updateFields.push(`name = ?`);
      params.push(name);
    }

    if (phone !== undefined) {
      updateFields.push(`phone = ?`);
      params.push(phone);
    }

    if (role !== undefined) {
      updateFields.push(`role = ?`);
      params.push(role);
    }

    if (is_active !== undefined) {
      updateFields.push(`is_active = ?`);
      params.push(is_active);
    }

    if (updateFields.length === 0) {
      return existingUser;
    }

    // 加入 updated_at
    updateFields.push(`updated_at = ?`);
    
    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    const now = getCurrentUTC();
    const result = await this.db.prepare(query).bind(...params, now, id).run();
    
    if (!result.success) {
      throw new Error('更新使用者失敗');
    }

    // 取得更新後的使用者
    const updatedUser = await this.getUserById(id);
    return updatedUser;
  }

  /**
   * 刪除使用者
   */
  async deleteUser(id: number): Promise<boolean> {
    // 檢查使用者是否存在
    const existingUser = await this.getUserById(id);
    if (!existingUser) {
      return false;
    }

    // 檢查是否有相關訂單
    const orderCheckQuery = 'SELECT COUNT(*) as count FROM orders WHERE user_id = ?';
    const orderCheckResult = await this.db.prepare(orderCheckQuery).bind(id).first();
    const orderCount = orderCheckResult?.count as number || 0;

    if (orderCount > 0) {
      throw new Error('無法刪除有訂單記錄的使用者');
    }

    // 刪除使用者
    const deleteQuery = 'DELETE FROM users WHERE id = ?';
    const result = await this.db.prepare(deleteQuery).bind(id).run();
    
    return result.success;
  }

  /**
   * 取得使用者擁有的優惠券
   */
  async getUserCouponsOwned(userId: number): Promise<CouponOwned[]> {
    const query = `
      SELECT 
        cg.id as grant_id,
        c.id as coupon_id,
        cc.id as coupon_code_id,
        c.name as coupon_name,
        cc.code as coupon_code,
        c.discount_type,
        c.percent_off_bps,
        c.amount_off_twd,
        c.min_order_twd,
        c.starts_at,
        c.ends_at,
        cg.allowed_uses,
        cg.used_count,
        (cg.allowed_uses - cg.used_count) as remaining_uses,
        cg.granted_at,
        cg.expires_at,
        c.is_active
      FROM coupon_grants cg
      JOIN coupon_codes cc ON cc.id = cg.coupon_code_id
      JOIN coupons c ON c.id = cc.coupon_id
      WHERE cg.user_id = ?
      ORDER BY cg.granted_at DESC
    `;

    const result = await this.db.prepare(query).bind(userId).all();
    return result.results as CouponOwned[];
  }

  /**
   * 檢查手機號碼是否已存在
   */
  async isPhoneExists(phone: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM users WHERE phone = ?';
    const params = [phone];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(String(excludeId));
    }

    const result = await this.db.prepare(query).bind(...params).first();
    return (result?.count as number || 0) > 0;
  }

  /**
   * 檢查 LINE ID 是否已存在
   */
  async isLineIdExists(lineId: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM users WHERE line_id = ?';
    const params = [lineId];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(String(excludeId));
    }

    const result = await this.db.prepare(query).bind(...params).first();
    return (result?.count as number || 0) > 0;
  }

  /**
   * 取得使用者點數
   */
  async getUserPoints(userId: number): Promise<number> {
    const pointsService = new PointsService(this.db);
    return await pointsService.getUserPoints(userId);
  }

  /**
   * 取得使用者點數交易歷史
   */
  async getPointsHistory(userId: number, query: PointsHistoryQuery) {
    const pointsService = new PointsService(this.db);
    return await pointsService.getPointsHistory(userId, query);
  }
}
