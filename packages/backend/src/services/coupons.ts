import type { D1Database } from '@cloudflare/workers-types';
import type { 
  Coupon, 
  CouponCode,
  CreateCouponRequest, 
  UpdateCouponRequest,
  CreateCouponCodeRequest,
  UpdateCouponCodeRequest,
  CouponQuery,
  CouponCodeQuery,
  Pagination 
} from '../zod/coupons.js';
import { formatDateOnly } from '../utils/time.js';

/**
 * 優惠券服務類別
 */
export class CouponService {
  constructor(private db: D1Database) {}

  /**
   * 將台北時間轉換為 UTC 時間
   */
  private taipeiToUtc(taipeiTime: string): string {
    // 如果輸入已經是 UTC 格式（包含 Z），直接返回
    if (taipeiTime.includes('Z')) {
      return taipeiTime;
    }
    
    // 如果輸入是台北時間格式（包含 +08:00），直接轉換為 UTC
    if (taipeiTime.includes('+08:00')) {
      const date = new Date(taipeiTime);
      return date.toISOString();
    }
    
    // 如果輸入是純日期格式 (YYYY-MM-DD)，添加台北時區信息後轉換
    if (/^\d{4}-\d{2}-\d{2}$/.test(taipeiTime)) {
      const date = new Date(`${taipeiTime}T00:00:00+08:00`);
      return date.toISOString();
    }
    
    // 其他情況，直接轉換
    const date = new Date(taipeiTime);
    return date.toISOString();
  }

  /**
   * 將 UTC 時間轉換為台北時間
   */
  private utcToTaipei(utcTime: string): string {
    // UTC 時間比台北時間慢 8 小時
    const date = new Date(utcTime);
    const taipeiDate = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    return taipeiDate.toISOString();
  }

  /**
   * 計算優惠券的剩餘使用次數
   */
  private async calculateCouponRemainingUses(couponId: number, maxUsesTotal: number | null): Promise<number | null> {
    if (maxUsesTotal === null) {
      return null; // 無上限
    }

    const query = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_id = ?';
    const result = await this.db.prepare(query).bind(couponId).first();
    const usedCount = result?.count as number || 0;
    
    return Math.max(0, maxUsesTotal - usedCount);
  }

  /**
   * 計算優惠券代碼的剩餘使用次數
   */
  private async calculateCouponCodeRemainingUses(couponCodeId: number, maxRedemptions: number | null): Promise<number | null> {
    if (maxRedemptions === null) {
      return null; // 無上限
    }

    const query = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_code_id = ?';
    const result = await this.db.prepare(query).bind(couponCodeId).first();
    const usedCount = result?.count as number || 0;
    
    return Math.max(0, maxRedemptions - usedCount);
  }

  /**
   * 判斷優惠券是否有效
   */
  private isCouponValid(coupon: any, now: Date): boolean {
    if (coupon.is_active !== 1) return false;
    
    if (coupon.starts_at && new Date(coupon.starts_at) > now) return false;
    if (coupon.ends_at && new Date(coupon.ends_at) < now) return false;
    
    return true;
  }

  /**
   * 判斷優惠券是否已過期
   */
  private isCouponExpired(coupon: any, now: Date): boolean {
    return coupon.ends_at ? new Date(coupon.ends_at) < now : false;
  }

  /**
   * 判斷優惠券是否尚未開始
   */
  private isCouponNotStarted(coupon: any, now: Date): boolean {
    return coupon.starts_at ? new Date(coupon.starts_at) > now : false;
  }

  /**
   * 判斷優惠券是否已完全兌換
   */
  private isCouponFullyRedeemed(coupon: any, remainingUses: number | null): boolean {
    return remainingUses !== null && remainingUses <= 0;
  }

  /**
   * 為優惠券添加計算欄位和台北時間轉換
   */
  private async enrichCoupon(coupon: any): Promise<Coupon> {
    const now = new Date();
    const totalRedemptions = await this.getCouponRedemptionCount(coupon.id);
    const remainingUses = await this.calculateCouponRemainingUses(coupon.id, coupon.max_uses_total);
    
    const is_valid = this.isCouponValid(coupon, now);
    const is_expired = this.isCouponExpired(coupon, now);
    const is_not_started = this.isCouponNotStarted(coupon, now);
    const is_fully_redeemed = this.isCouponFullyRedeemed(coupon, remainingUses);

    return {
      ...coupon,
      total_redemptions: totalRedemptions,
      remaining_uses: remainingUses,
      starts_at_taipei: coupon.starts_at ? this.utcToTaipei(coupon.starts_at) : null,
      ends_at_taipei: coupon.ends_at ? this.utcToTaipei(coupon.ends_at) : null,
      created_at_taipei: this.utcToTaipei(coupon.created_at),
      updated_at_taipei: this.utcToTaipei(coupon.updated_at),
      is_valid,
      is_expired,
      is_not_started,
      is_fully_redeemed,
    };
  }

  /**
   * 為優惠券代碼添加計算欄位和台北時間轉換
   */
  private async enrichCouponCode(couponCode: any): Promise<CouponCode> {
    const now = new Date();
    const totalRedemptions = await this.getCouponCodeRedemptionCount(couponCode.id);
    const remainingUses = await this.calculateCouponCodeRemainingUses(couponCode.id, couponCode.max_redemptions);
    
    const is_valid = this.isCouponValid(couponCode, now);
    const is_expired = this.isCouponExpired(couponCode, now);
    const is_not_started = this.isCouponNotStarted(couponCode, now);
    const is_fully_redeemed = this.isCouponFullyRedeemed(couponCode, remainingUses);

    return {
      ...couponCode,
      total_redemptions: totalRedemptions,
      remaining_uses: remainingUses,
      starts_at_taipei: couponCode.starts_at ? this.utcToTaipei(couponCode.starts_at) : null,
      ends_at_taipei: couponCode.ends_at ? this.utcToTaipei(couponCode.ends_at) : null,
      created_at_taipei: this.utcToTaipei(couponCode.created_at),
      updated_at_taipei: this.utcToTaipei(couponCode.updated_at),
      is_valid,
      is_expired,
      is_not_started,
      is_fully_redeemed,
    };
  }

  /**
   * 取得優惠券兌換次數
   */
  private async getCouponRedemptionCount(couponId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_id = ?';
    const result = await this.db.prepare(query).bind(couponId).first();
    return result?.count as number || 0;
  }

  /**
   * 取得優惠券代碼兌換次數
   */
  private async getCouponCodeRedemptionCount(couponCodeId: number): Promise<number> {
    const query = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_code_id = ?';
    const result = await this.db.prepare(query).bind(couponCodeId).first();
    return result?.count as number || 0;
  }

  /**
   * 取得優惠券列表（支援分頁、排序、篩選）
   */
  async getCoupons(query: CouponQuery): Promise<{ coupons: Coupon[]; pagination: Pagination }> {
    const { page, limit, sortBy, sortDir, search, discount_type, is_active, is_valid, from, to } = query;
    
    // 建立 WHERE 條件
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`name LIKE ?`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (discount_type) {
      conditions.push(`discount_type = ?`);
      params.push(discount_type);
      paramIndex++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = ?`);
      params.push(is_active);
      paramIndex++;
    }

    if (from) {
      conditions.push(`created_at >= ?`);
      params.push(this.taipeiToUtc(from));
      paramIndex++;
    }

    if (to) {
      conditions.push(`created_at <= ?`);
      params.push(this.taipeiToUtc(to));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 計算總筆數
    const countQuery = `SELECT COUNT(*) as total FROM coupons ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // 計算分頁資訊
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 取得優惠券列表
    const orderBy = `${sortBy} ${sortDir.toUpperCase()}`;
    const listQuery = `
      SELECT * FROM coupons 
      ${whereClause} 
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const rawCoupons = listResult.results as any[];

    // 為每個優惠券添加計算欄位
    const coupons = await Promise.all(
      rawCoupons.map(coupon => this.enrichCoupon(coupon))
    );

    // 如果指定了有效性篩選，進行過濾
    let filteredCoupons = coupons;
    if (is_valid !== undefined) {
      filteredCoupons = coupons.filter(coupon => coupon.is_valid === is_valid);
    }

    return {
      coupons: filteredCoupons,
      pagination: {
        page,
        limit,
        total: is_valid !== undefined ? filteredCoupons.length : total,
        total_pages: is_valid !== undefined ? Math.ceil(filteredCoupons.length / limit) : totalPages,
      },
    };
  }

  /**
   * 根據 ID 取得優惠券詳細資訊
   */
  async getCouponById(id: number): Promise<Coupon | null> {
    const query = 'SELECT * FROM coupons WHERE id = ?';
    const result = await this.db.prepare(query).bind(id).first();
    
    if (!result) {
      return null;
    }

    return await this.enrichCoupon(result as any);
  }

  /**
   * 建立優惠券
   */
  async createCoupon(data: CreateCouponRequest): Promise<Coupon> {
    const { 
      name, 
      description,
      discount_type, 
      percent_off_bps, 
      amount_off_twd, 
      min_order_twd, 
      max_uses_total, 
      starts_at, 
      ends_at, 
      is_active 
    } = data;
    
    const query = `
      INSERT INTO coupons (
        name, description, discount_type, percent_off_bps, amount_off_twd, 
        min_order_twd, max_uses_total, starts_at, ends_at, is_active, 
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = await this.db.prepare(query).bind(
      name || null,
      description || null,
      discount_type,
      percent_off_bps || null,
      amount_off_twd || null,
      min_order_twd,
      max_uses_total || null,
      starts_at ? this.taipeiToUtc(starts_at) : null,
      ends_at ? this.taipeiToUtc(ends_at) : null,
      is_active
    ).run();
    
    if (!result.success) {
      throw new Error('建立優惠券失敗');
    }

    // 取得新建立的優惠券
    const newCoupon = await this.getCouponById(result.meta.last_row_id as number);
    if (!newCoupon) {
      throw new Error('無法取得新建立的優惠券');
    }

    return newCoupon;
  }

  /**
   * 檢查優惠券是否有代碼
   */
  async checkCouponHasCodes(coupon_id: number): Promise<boolean> {
    const result = await this.db.prepare(`
      SELECT COUNT(*) as count
      FROM coupon_codes
      WHERE coupon_id = ? AND is_active = 1
    `).bind(coupon_id).first();
    
    return (result?.count as number) > 0;
  }

  /**
   * 更新優惠券
   */
  async updateCoupon(id: number, data: UpdateCouponRequest): Promise<Coupon | null> {
    // 檢查優惠券是否存在
    const existingCoupon = await this.getCouponById(id);
    if (!existingCoupon) {
      return null;
    }

    // 檢查優惠券是否有代碼，如果有代碼則不允許修改日期
    if (data.starts_at !== undefined || data.ends_at !== undefined) {
      const hasCodes = await this.checkCouponHasCodes(id);
      if (hasCodes) {
        throw new Error('優惠券已有代碼，無法修改日期');
      }
    }

    // 建立更新欄位
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = ?`);
      params.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updateFields.push(`description = ?`);
      params.push(data.description);
      paramIndex++;
    }

    if (data.discount_type !== undefined) {
      updateFields.push(`discount_type = ?`);
      params.push(data.discount_type);
      paramIndex++;
    }

    // 處理折扣相關欄位
    if (data.discount_type !== undefined) {
      // 當改變折扣類型時，清除不相關的欄位
      if (data.discount_type === 'PERCENT') {
        updateFields.push(`percent_off_bps = ?`);
        params.push(data.percent_off_bps || null);
        updateFields.push(`amount_off_twd = NULL`);
        paramIndex++;
      } else if (data.discount_type === 'FIXED') {
        updateFields.push(`amount_off_twd = ?`);
        params.push(data.amount_off_twd || null);
        updateFields.push(`percent_off_bps = NULL`);
        paramIndex++;
      }
    } else {
      // 如果沒有改變折扣類型，只更新有值的欄位
      if (data.percent_off_bps !== undefined) {
        updateFields.push(`percent_off_bps = ?`);
        params.push(data.percent_off_bps);
        paramIndex++;
      }

      if (data.amount_off_twd !== undefined) {
        updateFields.push(`amount_off_twd = ?`);
        params.push(data.amount_off_twd);
        paramIndex++;
      }
    }

    if (data.min_order_twd !== undefined) {
      updateFields.push(`min_order_twd = ?`);
      params.push(data.min_order_twd);
      paramIndex++;
    }

    if (data.max_uses_total !== undefined) {
      updateFields.push(`max_uses_total = ?`);
      params.push(data.max_uses_total);
      paramIndex++;
    }

    if (data.max_redemptions !== undefined) {
      updateFields.push(`max_redemptions = ?`);
      params.push(data.max_redemptions);
      paramIndex++;
    }

    if (data.starts_at !== undefined) {
      updateFields.push(`starts_at = ?`);
      params.push(data.starts_at ? this.taipeiToUtc(data.starts_at) : null);
      paramIndex++;
    }

    if (data.ends_at !== undefined) {
      updateFields.push(`ends_at = ?`);
      params.push(data.ends_at ? this.taipeiToUtc(data.ends_at) : null);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updateFields.push(`is_active = ?`);
      params.push(data.is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return existingCoupon;
    }

    // 加入 updated_at
    updateFields.push(`updated_at = datetime('now')`);
    
    const query = `
      UPDATE coupons 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    const result = await this.db.prepare(query).bind(...params, id).run();
    
    if (!result.success) {
      throw new Error('更新優惠券失敗');
    }

    // 取得更新後的優惠券
    const updatedCoupon = await this.getCouponById(id);
    return updatedCoupon;
  }

  /**
   * 刪除優惠券
   */
  async deleteCoupon(id: number): Promise<boolean> {
    // 檢查優惠券是否存在
    const existingCoupon = await this.getCouponById(id);
    if (!existingCoupon) {
      return false;
    }

    // 檢查是否有相關的優惠券代碼
    const couponCodeCheckQuery = 'SELECT COUNT(*) as count FROM coupon_codes WHERE coupon_id = ?';
    const couponCodeCheckResult = await this.db.prepare(couponCodeCheckQuery).bind(id).first();
    const couponCodeCount = couponCodeCheckResult?.count as number || 0;

    if (couponCodeCount > 0) {
      throw new Error('無法刪除有優惠券代碼的優惠券');
    }

    // 檢查是否有兌換記錄
    const redemptionCheckQuery = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_id = ?';
    const redemptionCheckResult = await this.db.prepare(redemptionCheckQuery).bind(id).first();
    const redemptionCount = redemptionCheckResult?.count as number || 0;

    if (redemptionCount > 0) {
      throw new Error('無法刪除有兌換記錄的優惠券');
    }

    // 刪除優惠券
    const deleteQuery = 'DELETE FROM coupons WHERE id = ?';
    const result = await this.db.prepare(deleteQuery).bind(id).run();
    
    return result.success;
  }

  /**
   * 取得優惠券代碼列表（支援分頁、排序、篩選）
   */
  async getCouponCodes(query: CouponCodeQuery): Promise<{ couponCodes: CouponCode[]; pagination: Pagination }> {
    const { page, limit, sortBy, sortDir, search, coupon_id, user_id, is_active, is_valid, from, to } = query;
    
    // 建立 WHERE 條件
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`code LIKE ?`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (coupon_id) {
      conditions.push(`cc.coupon_id = ?`);
      params.push(coupon_id);
      paramIndex++;
    }

    if (user_id) {
      conditions.push(`cg.user_id = ?`);
      params.push(user_id);
      paramIndex++;
    }

    if (is_active !== undefined) {
      conditions.push(`cc.is_active = ?`);
      params.push(is_active);
      paramIndex++;
    }

    if (from) {
      conditions.push(`created_at >= ?`);
      params.push(this.taipeiToUtc(from));
      paramIndex++;
    }

    if (to) {
      conditions.push(`created_at <= ?`);
      params.push(this.taipeiToUtc(to));
      paramIndex++;
    }

    // 決定是否使用 JOIN
    const useJoin = user_id !== undefined;
    const fromClause = useJoin 
      ? `FROM coupon_codes cc 
         LEFT JOIN coupon_grants cg ON cc.id = cg.coupon_code_id
         LEFT JOIN coupons c ON cc.coupon_id = c.id`
      : `FROM coupon_codes cc`;
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 計算總筆數
    const countQuery = `SELECT COUNT(*) as total ${fromClause} ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // 計算分頁資訊
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 取得優惠券代碼列表
    const orderBy = useJoin ? `cc.${sortBy} ${sortDir.toUpperCase()}` : `${sortBy} ${sortDir.toUpperCase()}`;
    const selectFields = useJoin 
      ? `cc.*, cg.allowed_uses, cg.used_count, cg.granted_at, cg.expires_at, c.name as coupon_name`
      : `*`;
    
    const listQuery = `
      SELECT ${selectFields} 
      ${fromClause}
      ${whereClause} 
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const rawCouponCodes = listResult.results as any[];

    // 為每個優惠券代碼添加計算欄位
    const couponCodes = await Promise.all(
      rawCouponCodes.map(couponCode => this.enrichCouponCode(couponCode))
    );

    // 如果指定了有效性篩選，進行過濾
    let filteredCouponCodes = couponCodes;
    if (is_valid !== undefined) {
      filteredCouponCodes = couponCodes.filter(couponCode => couponCode.is_valid === is_valid);
    }

    return {
      couponCodes: filteredCouponCodes,
      pagination: {
        page,
        limit,
        total: is_valid !== undefined ? filteredCouponCodes.length : total,
        total_pages: is_valid !== undefined ? Math.ceil(filteredCouponCodes.length / limit) : totalPages,
      },
    };
  }

  /**
   * 根據 ID 取得優惠券代碼詳細資訊
   */
  async getCouponCodeById(id: number): Promise<CouponCode | null> {
    const query = 'SELECT * FROM coupon_codes WHERE id = ?';
    const result = await this.db.prepare(query).bind(id).first();
    
    if (!result) {
      return null;
    }

    return await this.enrichCouponCode(result as any);
  }

  /**
   * 根據代碼取得優惠券代碼
   */
  async getCouponCodeByCode(code: string): Promise<CouponCode | null> {
    const query = 'SELECT * FROM coupon_codes WHERE code = ?';
    const result = await this.db.prepare(query).bind(code).first();
    
    if (!result) {
      return null;
    }

    return await this.enrichCouponCode(result as any);
  }

  /**
   * 取得現有代碼的總使用量
   */
  async getExistingCodesTotal(coupon_id: number, excludeCodeId?: number): Promise<number> {
    let query = `
      SELECT COALESCE(SUM(max_redemptions), 0) as total_used
      FROM coupon_codes 
      WHERE coupon_id = ? AND is_active = 1
    `;
    const params = [coupon_id];

    if (excludeCodeId) {
      query += ` AND id != ?`;
      params.push(excludeCodeId);
    }

    const result = await this.db.prepare(query).bind(...params).first();
    return result?.total_used as number || 0;
  }

  /**
   * 驗證優惠券代碼數量控管
   */
  async validateCouponCodeQuantity(coupon_id: number, newMaxRedemptions: number, excludeCodeId?: number): Promise<void> {
    // 取得優惠券的總量限制
    const coupon = await this.getCouponById(coupon_id);
    if (!coupon || !coupon.max_redemptions) {
      return; // 如果優惠券沒有總量限制，則不檢查
    }

    // 取得現有代碼的總量
    const totalUsed = await this.getExistingCodesTotal(coupon_id, excludeCodeId);

    // 檢查新增的代碼數量是否會超過總量
    if (totalUsed + newMaxRedemptions > coupon.max_redemptions) {
      throw new Error(`代碼總量不能超過優惠券總量。目前使用：${totalUsed}，優惠券總量：${coupon.max_redemptions}，新增數量：${newMaxRedemptions}`);
    }
  }

  /**
   * 建立優惠券代碼
   */
  async createCouponCode(data: CreateCouponCodeRequest): Promise<CouponCode> {
    const { coupon_id, code, max_redemptions, starts_at, ends_at, expires_after_days, is_active } = data;
    
    // 檢查優惠券是否存在
    const coupon = await this.getCouponById(coupon_id);
    if (!coupon) {
      throw new Error('優惠券不存在');
    }

    // 檢查代碼是否已存在
    const existingCode = await this.getCouponCodeByCode(code);
    if (existingCode) {
      throw new Error('優惠券代碼已存在');
    }

    // 檢查代碼數量控管
    if (coupon.max_redemptions) {
      // 如果優惠券有總量限制，檢查代碼數量是否會超過總量
      await this.validateCouponCodeQuantity(coupon_id, max_redemptions);
    }
    
    // 驗證代碼日期是否在優惠券範圍內
    if (starts_at) {
      const codeStartDate = new Date(this.taipeiToUtc(starts_at));
      if (coupon.starts_at) {
        const couponStartDate = new Date(coupon.starts_at);
        if (codeStartDate < couponStartDate) {
          throw new Error(`代碼開始日期不能早於優惠券開始日期：${formatDateOnly(coupon.starts_at)}`);
        }
      }
      if (coupon.ends_at) {
        const couponEndDate = new Date(coupon.ends_at);
        if (codeStartDate > couponEndDate) {
          throw new Error(`代碼開始日期不能晚於優惠券結束日期：${formatDateOnly(coupon.ends_at)}`);
        }
      }
    }
    
    if (ends_at) {
      const codeEndDate = new Date(this.taipeiToUtc(ends_at));
      if (coupon.starts_at) {
        const couponStartDate = new Date(coupon.starts_at);
        if (codeEndDate < couponStartDate) {
          throw new Error(`代碼結束日期不能早於優惠券開始日期：${formatDateOnly(coupon.starts_at)}`);
        }
      }
      if (coupon.ends_at) {
        const couponEndDate = new Date(coupon.ends_at);
        if (codeEndDate > couponEndDate) {
          throw new Error(`代碼結束日期不能晚於優惠券結束日期：${formatDateOnly(coupon.ends_at)}`);
        }
      }
    }

    // 如果代碼沒有設定時間，使用父優惠券的時間
    const finalStartsAt = starts_at ? this.taipeiToUtc(starts_at) : (coupon.starts_at ? this.taipeiToUtc(coupon.starts_at) : null);
    const finalEndsAt = ends_at ? this.taipeiToUtc(ends_at) : (coupon.ends_at ? this.taipeiToUtc(coupon.ends_at) : null);
    
    const query = `
      INSERT INTO coupon_codes (
        coupon_id, code, max_redemptions, starts_at, ends_at, expires_after_days, is_active, 
        created_at, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = await this.db.prepare(query).bind(
      coupon_id,
      code,
      max_redemptions,
      finalStartsAt,
      finalEndsAt,
      expires_after_days || null,
      is_active
    ).run();
    
    if (!result.success) {
      throw new Error('建立優惠券代碼失敗');
    }

    // 取得新建立的優惠券代碼
    const newCouponCode = await this.getCouponCodeById(result.meta.last_row_id as number);
    if (!newCouponCode) {
      throw new Error('無法取得新建立的優惠券代碼');
    }

    return newCouponCode;
  }

  /**
   * 更新優惠券代碼
   */
  async updateCouponCode(id: number, data: UpdateCouponCodeRequest): Promise<CouponCode | null> {
    // 檢查優惠券代碼是否存在
    const existingCouponCode = await this.getCouponCodeById(id);
    if (!existingCouponCode) {
      return null;
    }

    // 建立更新欄位
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.code !== undefined) {
      // 檢查新代碼是否已存在
      const existingCode = await this.getCouponCodeByCode(data.code);
      if (existingCode && existingCode.id !== id) {
        throw new Error('優惠券代碼已存在');
      }
      
      updateFields.push(`code = ?`);
      params.push(data.code);
      paramIndex++;
    }

    if (data.max_redemptions !== undefined) {
      // 檢查代碼數量控管
      const coupon = await this.getCouponById(existingCouponCode.coupon_id);
      if (coupon && coupon.max_redemptions) {
        if (data.max_redemptions) {
          // 如果代碼有數量限制，檢查是否會超過總量
          await this.validateCouponCodeQuantity(existingCouponCode.coupon_id, data.max_redemptions, id);
        } else {
          // 如果代碼沒有數量限制，檢查現有代碼是否已經達到總量
          const existingTotal = await this.getExistingCodesTotal(existingCouponCode.coupon_id, id);
          if (existingTotal >= coupon.max_redemptions) {
            throw new Error(`優惠券總量已用完。目前使用：${existingTotal}，優惠券總量：${coupon.max_redemptions}。無法將代碼改為無限制。`);
          }
        }
      }
      
      updateFields.push(`max_redemptions = ?`);
      params.push(data.max_redemptions);
      paramIndex++;
    }

    if (data.starts_at !== undefined) {
      // 如果明確傳入 null，則設為 null；否則轉換為 UTC 時間
      const finalStartsAt = data.starts_at === null ? null : this.taipeiToUtc(data.starts_at);
      
      updateFields.push(`starts_at = ?`);
      params.push(finalStartsAt);
      paramIndex++;
    }

    if (data.ends_at !== undefined) {
      // 獲取父優惠券資訊
      const parentCoupon = await this.getCouponById(existingCouponCode.coupon_id);
      const finalEndsAt = data.ends_at ? this.taipeiToUtc(data.ends_at) : (parentCoupon?.ends_at ? this.taipeiToUtc(parentCoupon.ends_at) : null);
      
      updateFields.push(`ends_at = ?`);
      params.push(finalEndsAt);
      paramIndex++;
    }

    if (data.is_active !== undefined) {
      updateFields.push(`is_active = ?`);
      params.push(data.is_active);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return existingCouponCode;
    }

    // 加入 updated_at
    updateFields.push(`updated_at = datetime('now')`);
    
    const query = `
      UPDATE coupon_codes 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    const result = await this.db.prepare(query).bind(...params, id).run();
    
    if (!result.success) {
      throw new Error('更新優惠券代碼失敗');
    }

    // 取得更新後的優惠券代碼
    const updatedCouponCode = await this.getCouponCodeById(id);
    return updatedCouponCode;
  }

  /**
   * 刪除優惠券代碼
   */
  async deleteCouponCode(id: number): Promise<boolean> {
    // 檢查優惠券代碼是否存在
    const existingCouponCode = await this.getCouponCodeById(id);
    if (!existingCouponCode) {
      return false;
    }

    // 檢查是否有兌換記錄
    const redemptionCheckQuery = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_code_id = ?';
    const redemptionCheckResult = await this.db.prepare(redemptionCheckQuery).bind(id).first();
    const redemptionCount = redemptionCheckResult?.count as number || 0;

    if (redemptionCount > 0) {
      throw new Error('無法刪除有兌換記錄的優惠券代碼');
    }

    // 檢查是否有授權記錄
    const grantCheckQuery = 'SELECT COUNT(*) as count FROM coupon_grants WHERE coupon_code_id = ?';
    const grantCheckResult = await this.db.prepare(grantCheckQuery).bind(id).first();
    const grantCount = grantCheckResult?.count as number || 0;

    if (grantCount > 0) {
      throw new Error('無法刪除有授權記錄的優惠券代碼');
    }

    // 刪除優惠券代碼
    const deleteQuery = 'DELETE FROM coupon_codes WHERE id = ?';
    const result = await this.db.prepare(deleteQuery).bind(id).run();
    
    return result.success;
  }

  /**
   * 建立優惠券授權
   */
  async createCouponGrant(data: {
    coupon_code_id: number;
    user_id: number;
    allowed_uses: number;
    expires_at?: string;
  }): Promise<any> {
    const { coupon_code_id, user_id, allowed_uses, expires_at } = data;
    
    // 檢查優惠券代碼是否存在
    const couponCode = await this.getCouponCodeById(coupon_code_id);
    if (!couponCode) {
      throw new Error('優惠券代碼不存在');
    }

    // 檢查用戶是否存在
    const userCheckQuery = 'SELECT id FROM users WHERE id = ?';
    const userResult = await this.db.prepare(userCheckQuery).bind(user_id).first();
    if (!userResult) {
      throw new Error('用戶不存在');
    }

    // 檢查是否已經有授權記錄
    const existingGrantQuery = 'SELECT id FROM coupon_grants WHERE coupon_code_id = ? AND user_id = ?';
    const existingGrant = await this.db.prepare(existingGrantQuery).bind(coupon_code_id, user_id).first();
    if (existingGrant) {
      throw new Error('用戶已經有此優惠券代碼的授權');
    }

    // 取得優惠券和代碼的開始時間
    const couponQuery = `
      SELECT c.starts_at as coupon_starts_at, c.ends_at as coupon_ends_at, cc.starts_at as code_starts_at, cc.ends_at as code_ends_at, cc.expires_after_days
      FROM coupons c
      JOIN coupon_codes cc ON c.id = cc.coupon_id
      WHERE cc.id = ?
    `;
    const couponResult = await this.db.prepare(couponQuery).bind(coupon_code_id).first();
    
    // 決定實際的開始時間（優先使用代碼的開始時間，其次使用優惠券的開始時間）
    const effectiveStartsAt = couponResult?.code_starts_at || couponResult?.coupon_starts_at;
    
    // 取得當前時間
    const now = new Date();
    const nowStr = now.toISOString();
    
    // 實現您要求的邏輯：
    // 1. 代碼取得時間優先以用戶取得日期為主
    // 2. 如果用戶取得日期早於代碼開始日期，則以代碼開始日期替代
    // 3. 如果代碼沒有開始日期，且用戶取得日期早於父級開始日期，則以父級開始日期替代
    let grantedAt = nowStr;
    
    // 首先檢查代碼的開始時間
    if (couponResult?.code_starts_at) {
      const codeStartsAtDate = new Date(couponResult.code_starts_at);
      const nowDate = new Date(nowStr);
      
      // 如果用戶取得日期早於代碼開始日期，則使用代碼開始日期
      if (nowDate < codeStartsAtDate) {
        grantedAt = couponResult.code_starts_at;
      }
    }
    // 如果代碼沒有開始時間，檢查父級的開始時間
    else if (couponResult?.coupon_starts_at) {
      const couponStartsAtDate = new Date(couponResult.coupon_starts_at);
      const nowDate = new Date(nowStr);
      
      // 如果用戶取得日期早於父級開始日期，則使用父級開始日期
      if (nowDate < couponStartsAtDate) {
        grantedAt = couponResult.coupon_starts_at;
      }
    }

    // 處理過期時間
    let finalExpiresAt = null;
    
    if (expires_at) {
      // 如果明確指定了過期時間，使用指定的時間
      finalExpiresAt = this.taipeiToUtc(expires_at);
    } else {
      // 計算過期時間的優先順序：
      // 1. 代碼的結束時間
      // 2. 代碼的 expires_after_days 計算
      // 3. 父級優惠券的結束時間
      
      let calculatedExpiresAt = null;
      
      // 首先檢查代碼是否有結束時間
      if (couponResult?.code_ends_at) {
        calculatedExpiresAt = couponResult.code_ends_at;
      }
      // 如果代碼沒有結束時間，但有 expires_after_days，則計算
      else if (couponResult?.expires_after_days) {
        const grantedDate = new Date(grantedAt);
        const expiresDate = new Date(grantedDate.getTime() + (couponResult.expires_after_days * 24 * 60 * 60 * 1000));
        calculatedExpiresAt = expiresDate.toISOString();
      }
      // 如果都沒有，使用父級優惠券的結束時間
      else if (couponResult?.coupon_ends_at) {
        calculatedExpiresAt = couponResult.coupon_ends_at;
      }
      
      // 如果計算出的過期時間晚於父級優惠券結束時間，以父級結束時間為主
      if (calculatedExpiresAt && couponResult?.coupon_ends_at) {
        const calculatedDate = new Date(calculatedExpiresAt);
        const couponEndDate = new Date(couponResult.coupon_ends_at);
        if (calculatedDate > couponEndDate) {
          calculatedExpiresAt = couponResult.coupon_ends_at;
        }
      }
      
      // 如果還是沒有過期時間，設置為一年後
      if (!calculatedExpiresAt) {
        const oneYearLater = new Date();
        oneYearLater.setFullYear(oneYearLater.getFullYear() + 1);
        calculatedExpiresAt = oneYearLater.toISOString();
      }
      
      finalExpiresAt = calculatedExpiresAt;
    }

    const query = `
      INSERT INTO coupon_grants (
        coupon_code_id, user_id, allowed_uses, used_count, granted_at, expires_at,
        created_at, updated_at
      )
      VALUES (?, ?, ?, 0, ?, ?, datetime('now'), datetime('now'))
    `;
    
    const result = await this.db.prepare(query).bind(
      coupon_code_id,
      user_id,
      allowed_uses,
      grantedAt,
      finalExpiresAt
    ).run();
    
    if (!result.success) {
      throw new Error('建立優惠券授權失敗');
    }

    // 取得新建立的授權記錄
    const newGrantQuery = 'SELECT * FROM coupon_grants WHERE id = ?';
    const newGrant = await this.db.prepare(newGrantQuery).bind(result.meta.last_row_id as number).first();
    
    return newGrant;
  }

  /**
   * 取得優惠券授權列表
   */
  async getCouponGrants(query: {
    page: number;
    limit: number;
    user_id?: number;
    coupon_code_id?: number;
  }): Promise<{ grants: any[]; pagination: any }> {
    const { page, limit, user_id, coupon_code_id } = query;
    
    // 建立查詢條件
    const conditions = [];
    const params = [];
    
    if (user_id) {
      conditions.push('cg.user_id = ?');
      params.push(user_id);
    }
    
    if (coupon_code_id) {
      conditions.push('cg.coupon_code_id = ?');
      params.push(coupon_code_id);
    }
    
    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // 計算總數
    const countQuery = `
      SELECT COUNT(*) as total
      FROM coupon_grants cg
      ${whereClause}
    `;
    
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;
    
    // 計算分頁
    const offset = (page - 1) * limit;
    const totalPages = Math.ceil(total / limit);
    
    // 取得授權列表
    const listQuery = `
      SELECT 
        cg.*,
        cc.code as coupon_code,
        c.name as coupon_name,
        u.name as user_name,
        u.phone as user_phone
      FROM coupon_grants cg
      JOIN coupon_codes cc ON cc.id = cg.coupon_code_id
      JOIN coupons c ON c.id = cc.coupon_id
      JOIN users u ON u.id = cg.user_id
      ${whereClause}
      ORDER BY cg.granted_at DESC
      LIMIT ? OFFSET ?
    `;
    
    const grantsResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const grants = grantsResult.results as any[];
    
    return {
      grants,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * 更新優惠券授權
   */
  async updateCouponGrant(id: number, data: {
    granted_at?: string;
    expires_at?: string;
  }): Promise<any> {
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (data.granted_at !== undefined) {
      updateFields.push(`granted_at = ?`);
      params.push(data.granted_at);
      paramIndex++;
    }

    if (data.expires_at !== undefined) {
      updateFields.push(`expires_at = ?`);
      params.push(data.expires_at);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      throw new Error('沒有要更新的欄位');
    }

    updateFields.push(`updated_at = datetime('now')`);

    const query = `
      UPDATE coupon_grants 
      SET ${updateFields.join(', ')}
      WHERE id = ?
    `;
    
    const result = await this.db.prepare(query).bind(...params, id).run();
    
    if (!result.success) {
      throw new Error('更新優惠券授權失敗');
    }

    // 取得更新後的授權資訊
    const updatedGrant = await this.getCouponGrantById(id);
    return updatedGrant;
  }

  /**
   * 取得優惠券授權詳細資訊
   */
  async getCouponGrantById(id: number): Promise<any> {
    const query = `
      SELECT 
        cg.id as grant_id,
        cg.coupon_code_id,
        cg.user_id,
        cg.allowed_uses,
        cg.used_count,
        cg.granted_at,
        cg.expires_at,
        cg.created_at,
        cg.updated_at,
        cc.code as coupon_code,
        c.id as coupon_id,
        c.name as coupon_name,
        c.discount_type,
        c.percent_off_bps,
        c.amount_off_twd,
        c.min_order_twd,
        c.is_active
      FROM coupon_grants cg
      JOIN coupon_codes cc ON cg.coupon_code_id = cc.id
      JOIN coupons c ON cc.coupon_id = c.id
      WHERE cg.id = ?
    `;

    const result = await this.db.prepare(query).bind(id).first();
    return result;
  }
}
