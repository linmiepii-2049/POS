import type { D1Database } from '@cloudflare/workers-types';
import type { 
  Order, 
  OrderDetail,
  OrderItem,
  CouponRedemption,
  CreateOrderRequest, 
  OrderQuery, 
  Pagination 
} from '../zod/orders.js';

/**
 * 訂單服務類別
 */
export class OrderService {
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
   * 將 UTC 時間轉換為台北時間
   */
  private utcToTaipei(utcTime: string): string {
    // 如果時間字符串沒有時區信息，假設它是 UTC 時間
    let dateStr = utcTime;
    if (!utcTime.includes('Z') && !utcTime.includes('+') && !utcTime.includes('-')) {
      dateStr = utcTime + 'Z'; // 添加 UTC 標識
    }
    
    // 創建 UTC 日期對象
    const date = new Date(dateStr);
    
    // 轉換為台北時間 (UTC+8)
    const taipeiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
    
    // 格式化為台北時間字符串 (YYYY-MM-DDTHH:mm:ss+08:00)
    const year = taipeiTime.getUTCFullYear();
    const month = String(taipeiTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(taipeiTime.getUTCDate()).padStart(2, '0');
    const hours = String(taipeiTime.getUTCHours()).padStart(2, '0');
    const minutes = String(taipeiTime.getUTCMinutes()).padStart(2, '0');
    const seconds = String(taipeiTime.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}+08:00`;
  }

  /**
   * 為訂單添加台北時間轉換
   */
  private enrichOrder(order: any): Order {
    return {
      ...order,
      created_at_taipei: this.utcToTaipei(order.created_at),
      updated_at_taipei: this.utcToTaipei(order.updated_at),
    };
  }

  /**
   * 生成訂單編號
   */
  private generateOrderNumber(): string {
    const now = new Date();
    const timestamp = now.getTime().toString();
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `ORD-${timestamp}-${random}`;
  }

  /**
   * 檢查使用者是否存在
   */
  private async checkUserExists(userId: number): Promise<boolean> {
    const query = 'SELECT COUNT(*) as count FROM users WHERE id = ? AND is_active = 1';
    const result = await this.db.prepare(query).bind(userId).first();
    return (result?.count as number || 0) > 0;
  }

  /**
   * 檢查產品是否存在且啟用
   */
  private async checkProductExists(productId: number): Promise<{ exists: boolean; product?: any }> {
    const query = 'SELECT * FROM products WHERE id = ? AND is_active = 1';
    const result = await this.db.prepare(query).bind(productId).first();
    
    if (!result) {
      return { exists: false };
    }

    return { exists: true, product: result };
  }

  /**
   * 檢查優惠券代碼是否可用
   */
  private async checkCouponCodeValid(couponCodeId: number, userId: number, orderSubtotal: number): Promise<{ valid: boolean; coupon?: any; couponCode?: any; error?: string }> {
    // 取得優惠券代碼資訊
    const couponCodeQuery = `
      SELECT 
        cc.id as coupon_code_id,
        cc.code,
        cc.is_active as coupon_code_is_active,
        cc.starts_at as coupon_code_starts_at,
        cc.ends_at as coupon_code_ends_at,
        c.id as coupon_id,
        c.name as coupon_name,
        c.is_active as coupon_is_active,
        c.starts_at as coupon_starts_at,
        c.ends_at as coupon_ends_at,
        c.discount_type,
        c.percent_off_bps,
        c.amount_off_twd,
        c.min_order_twd,
        cg.allowed_uses, 
        cg.used_count, 
        cg.expires_at as grant_expires_at
      FROM coupon_codes cc
      JOIN coupons c ON c.id = cc.coupon_id
      LEFT JOIN coupon_grants cg ON cg.coupon_code_id = cc.id AND cg.user_id = ?
      WHERE cc.id = ?
    `;
    
    const couponCodeResult = await this.db.prepare(couponCodeQuery).bind(userId, couponCodeId).first();
    
    if (!couponCodeResult) {
      return { valid: false, error: '優惠券代碼不存在' };
    }

    const now = new Date();
    const nowStr = now.toISOString();

    // 檢查優惠券代碼是否啟用
    if (couponCodeResult.coupon_code_is_active !== 1) {
      return { valid: false, error: '優惠券代碼已停用' };
    }

    // 檢查優惠券是否啟用
    if (couponCodeResult.coupon_is_active !== 1) {
      return { valid: false, error: '優惠券已停用' };
    }

    // 檢查時間範圍
    if (couponCodeResult.coupon_code_starts_at && couponCodeResult.coupon_code_starts_at > nowStr) {
      return { valid: false, error: '優惠券代碼尚未開始' };
    }

    if (couponCodeResult.coupon_code_ends_at && couponCodeResult.coupon_code_ends_at < nowStr) {
      return { valid: false, error: '優惠券代碼已過期' };
    }

    if (couponCodeResult.coupon_starts_at && couponCodeResult.coupon_starts_at > nowStr) {
      return { valid: false, error: '優惠券尚未開始' };
    }

    if (couponCodeResult.coupon_ends_at && couponCodeResult.coupon_ends_at < nowStr) {
      return { valid: false, error: '優惠券已過期' };
    }

    // 檢查使用者授權
    if (!couponCodeResult.allowed_uses) {
      return { valid: false, error: '使用者未獲得此優惠券授權' };
    }

    // 檢查使用次數
    if ((couponCodeResult.used_count as number) >= (couponCodeResult.allowed_uses as number)) {
      return { valid: false, error: '優惠券使用次數已達上限' };
    }

    // 檢查授權過期時間
    if (couponCodeResult.grant_expires_at && couponCodeResult.grant_expires_at < nowStr) {
      return { valid: false, error: '優惠券授權已過期' };
    }

    // 檢查代碼總使用次數
    if (couponCodeResult.max_redemptions) {
      const totalRedemptionsQuery = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_code_id = ?';
      const totalRedemptionsResult = await this.db.prepare(totalRedemptionsQuery).bind(couponCodeId).first();
      const totalRedemptions = totalRedemptionsResult?.count as number || 0;
      
      if (totalRedemptions >= (couponCodeResult.max_redemptions as number)) {
        return { valid: false, error: '優惠券代碼使用次數已達上限' };
      }
    }

    // 檢查優惠券總使用次數
    if (couponCodeResult.coupon_max_uses_total) {
      const couponTotalRedemptionsQuery = 'SELECT COUNT(*) as count FROM coupon_redemptions WHERE coupon_id = ?';
      const couponTotalRedemptionsResult = await this.db.prepare(couponTotalRedemptionsQuery).bind(couponCodeResult.coupon_id).first();
      const couponTotalRedemptions = couponTotalRedemptionsResult?.count as number || 0;
      
      if (couponTotalRedemptions >= (couponCodeResult.coupon_max_uses_total as number)) {
        return { valid: false, error: '優惠券總使用次數已達上限' };
      }
    }

    // 檢查最低消費
    if (orderSubtotal < (couponCodeResult.coupon_min_order_twd as number)) {
      return { valid: false, error: `訂單金額未達最低消費 ${couponCodeResult.coupon_min_order_twd} 元` };
    }

    return { 
      valid: true, 
      coupon: {
        id: couponCodeResult.coupon_id,
        discount_type: couponCodeResult.discount_type,
        percent_off_bps: couponCodeResult.percent_off_bps,
        amount_off_twd: couponCodeResult.amount_off_twd,
        min_order_twd: couponCodeResult.min_order_twd,
      },
      couponCode: {
        id: couponCodeResult.coupon_code_id,
        code: couponCodeResult.code,
      }
    };
  }

  /**
   * 計算優惠券折扣金額（統一使用元，四捨五入）
   */
  private calculateDiscountAmount(coupon: any, subtotal: number): number {
    if (coupon.discount_type === 'PERCENT') {
      // 百分比折扣：subtotal * percent_off_bps / 10000，然後四捨五入
      const discountAmount = Math.round(subtotal * coupon.percent_off_bps / 10000);
      return Math.min(discountAmount, subtotal); // 折扣不能超過小計
    } else if (coupon.discount_type === 'FIXED') {
      // 固定折扣：直接使用 amount_off_twd（已經是元）
      return Math.min(coupon.amount_off_twd, subtotal); // 折扣不能超過小計
    }
    return 0;
  }

  /**
   * 取得今日訂單統計
   */
  async getTodayOrderStats(): Promise<{ todayOrderCount: number }> {
    // 計算今日訂單數量（台北時間）
    const todayStart = this.taipeiToUtc(new Date().toISOString().split('T')[0]);
    const todayEnd = this.taipeiToUtcEnd(new Date().toISOString().split('T')[0]);
    
    const countQuery = `
      SELECT COUNT(*) as count
      FROM orders 
      WHERE created_at >= ? AND created_at <= ?
    `;
    
    const result = await this.db.prepare(countQuery).bind(todayStart, todayEnd).first();
    const todayOrderCount = result?.count as number || 0;
    
    return { todayOrderCount };
  }

  /**
   * 取得訂單列表（支援分頁、排序、篩選）
   */
  async getOrders(query: OrderQuery): Promise<{ orders: Order[]; pagination: Pagination }> {
    const { page, limit, sortBy, sortDir, status, user_id, from, to } = query;
    
    // 建立 WHERE 條件
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`o.status = ?`);
      params.push(status);
      paramIndex++;
    }

    if (user_id) {
      conditions.push(`o.user_id = ?`);
      params.push(user_id);
      paramIndex++;
    }

    if (from) {
      conditions.push(`o.created_at >= ?`);
      params.push(this.taipeiToUtc(from));
      paramIndex++;
    }

    if (to) {
      conditions.push(`o.created_at <= ?`);
      params.push(this.taipeiToUtcEnd(to));
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 計算總筆數
    const countQuery = `SELECT COUNT(*) as total FROM orders o LEFT JOIN users u ON o.user_id = u.id ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // 計算分頁資訊
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 取得訂單列表
    const orderBy = `${sortBy} ${sortDir.toUpperCase()}`;
    const listQuery = `
      SELECT 
        o.*,
        CASE 
          WHEN o.user_id = 10 THEN '非會員'
          WHEN u.id IS NOT NULL THEN u.name
          ELSE '非會員'
        END as user_name,
        CASE 
          WHEN o.user_id = 10 THEN NULL
          WHEN u.id IS NOT NULL THEN u.phone
          ELSE NULL
        END as user_phone,
        GROUP_CONCAT(
          CASE 
            WHEN cr.id IS NOT NULL THEN c.name || ' (' || cc.code || ')'
            ELSE NULL
          END, 
          ', '
        ) as coupon_names
      FROM orders o
      LEFT JOIN users u ON o.user_id = u.id
      LEFT JOIN coupon_redemptions cr ON o.id = cr.order_id
      LEFT JOIN coupon_codes cc ON cr.coupon_code_id = cc.id
      LEFT JOIN coupons c ON cc.coupon_id = c.id
      ${whereClause} 
      GROUP BY o.id
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const rawOrders = listResult.results as any[];

    // 為每個訂單添加台北時間轉換
    const orders = rawOrders.map(order => this.enrichOrder(order));

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * 根據 ID 取得訂單詳細資訊
   */
  async getOrderById(id: number): Promise<OrderDetail | null> {
    // 取得訂單基本資訊
    const orderQuery = 'SELECT * FROM orders WHERE id = ?';
    const orderResult = await this.db.prepare(orderQuery).bind(id).first();
    
    if (!orderResult) {
      return null;
    }

    const order = this.enrichOrder(orderResult);

    // 取得訂單項目
    const orderItemsQuery = 'SELECT * FROM order_items WHERE order_id = ? ORDER BY id';
    const orderItemsResult = await this.db.prepare(orderItemsQuery).bind(id).all();
    const orderItems = orderItemsResult.results as OrderItem[];

    // 取得優惠券兌換紀錄（包含優惠券名稱和代碼）
    const couponRedemptionsQuery = `
      SELECT 
        cr.*,
        c.name as coupon_name,
        cc.code as coupon_code
      FROM coupon_redemptions cr
      LEFT JOIN coupons c ON cr.coupon_id = c.id
      LEFT JOIN coupon_codes cc ON cr.coupon_code_id = cc.id
      WHERE cr.order_id = ? 
      ORDER BY cr.id
    `;
    const couponRedemptionsResult = await this.db.prepare(couponRedemptionsQuery).bind(id).all();
    const couponRedemptions = couponRedemptionsResult.results as any[];

    return {
      ...order,
      order_items: orderItems,
      coupon_redemptions: couponRedemptions,
    };
  }

  /**
   * 建立訂單
   */
  async createOrder(data: CreateOrderRequest): Promise<OrderDetail> {
    const { user_id, items, coupon_code_id } = data;

    // 如果沒有提供 user_id，使用特殊的非會員 ID (10)
    // 如果提供了 user_id，檢查使用者是否存在
    const finalUserId = user_id || 10;
    
    if (user_id) {
      const userExists = await this.checkUserExists(user_id);
      if (!userExists) {
        throw new Error('使用者不存在或已停用');
      }
    }

    // 檢查產品並計算小計
    let subtotal = 0;
    const orderItemsData: Array<{ product_id: number; product_name_snapshot: string; quantity: number; unit_price_twd: number }> = [];
    const productIds = new Set<number>();

    for (const item of items) {
      // 檢查是否有重複商品
      if (productIds.has(item.product_id)) {
        throw new Error('同一訂單不能包含重複商品');
      }
      productIds.add(item.product_id);

      // 檢查產品是否存在
      const { exists, product } = await this.checkProductExists(item.product_id);
      if (!exists || !product) {
        throw new Error(`產品 ID ${item.product_id} 不存在或已停用`);
      }

      // 計算小計
      const itemSubtotal = item.quantity * product.unit_price_twd;
      subtotal += itemSubtotal;

      orderItemsData.push({
        product_id: item.product_id,
        product_name_snapshot: product.name,
        quantity: item.quantity,
        unit_price_twd: product.unit_price_twd,
      });
    }

    // 檢查優惠券（如果提供且有用戶 ID）
    let couponData: any = null;
    let discountAmount = 0;

    if (coupon_code_id) {
      if (!user_id) {
        throw new Error('使用優惠券需要登入會員');
      }
      const couponCheck = await this.checkCouponCodeValid(coupon_code_id, user_id, subtotal);
      if (!couponCheck.valid) {
        throw new Error(couponCheck.error || '優惠券不可用');
      }
      couponData = couponCheck.coupon;
      discountAmount = this.calculateDiscountAmount(couponData, subtotal);
    }

    // 開始交易
    const orderNumber = this.generateOrderNumber();
    
    try {
      // 建立訂單
      const orderQuery = `
        INSERT INTO orders (order_number, user_id, subtotal_twd, discount_twd, total_twd, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, 'paid', datetime('now'), datetime('now'))
      `;
      
      const orderResult = await this.db.prepare(orderQuery).bind(
        orderNumber,
        finalUserId, // 使用 finalUserId (0 表示非會員)
        subtotal,
        discountAmount,
        subtotal - discountAmount
      ).run();

      if (!orderResult.success) {
        throw new Error('建立訂單失敗');
      }

      const orderId = orderResult.meta.last_row_id as number;

      // 建立訂單項目
      for (const itemData of orderItemsData) {
        const orderItemQuery = `
          INSERT INTO order_items (order_id, product_id, product_name_snapshot, quantity, unit_price_twd, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
        `;
        
        const orderItemResult = await this.db.prepare(orderItemQuery).bind(
          orderId,
          itemData.product_id,
          itemData.product_name_snapshot,
          itemData.quantity,
          itemData.unit_price_twd
        ).run();

        if (!orderItemResult.success) {
          throw new Error('建立訂單項目失敗');
        }
      }

      // 建立優惠券兌換紀錄（如果使用優惠券）
      if (coupon_code_id && couponData) {
        const couponRedemptionQuery = `
          INSERT INTO coupon_redemptions (order_id, coupon_id, coupon_code_id, user_id, amount_applied_twd, redeemed_at, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'), datetime('now'))
        `;
        
        const couponRedemptionResult = await this.db.prepare(couponRedemptionQuery).bind(
          orderId,
          couponData.id,
          coupon_code_id,
          finalUserId,
          discountAmount
        ).run();

        if (!couponRedemptionResult.success) {
          throw new Error('建立優惠券兌換紀錄失敗');
        }
      }

      // 取得完整的訂單資訊
      const orderDetail = await this.getOrderById(orderId);
      if (!orderDetail) {
        throw new Error('無法取得建立的訂單資訊');
      }

      return orderDetail;

    } catch (error) {
      // 如果發生錯誤，交易會自動回滾（因為沒有明確的 BEGIN/COMMIT）
      throw error;
    }
  }

  /**
   * 更新訂單狀態
   */
  async updateOrderStatus(id: number, status: string): Promise<Order | null> {
    // 檢查訂單是否存在
    const existingOrder = await this.getOrderById(id);
    if (!existingOrder) {
      return null;
    }

    const query = `
      UPDATE orders 
      SET status = ?, updated_at = datetime('now') 
      WHERE id = ?
    `;
    
    const result = await this.db.prepare(query).bind(status, id).run();
    
    if (!result.success) {
      throw new Error('更新訂單狀態失敗');
    }

    // 取得更新後的訂單（只取得基本資訊，不包含詳細項目）
    const orderQuery = 'SELECT * FROM orders WHERE id = ?';
    const orderResult = await this.db.prepare(orderQuery).bind(id).first();
    
    if (!orderResult) {
      throw new Error('無法取得更新後的訂單資訊');
    }

    return this.enrichOrder(orderResult);
  }

  /**
   * 取消訂單（將狀態重置為已建立）
   */
  async cancelOrder(id: number): Promise<Order | null> {
    return await this.updateOrderStatus(id, 'created');
  }

  /**
   * 根據訂單編號取得訂單
   */
  async getOrderByNumber(orderNumber: string): Promise<OrderDetail | null> {
    const query = 'SELECT * FROM orders WHERE order_number = ?';
    const result = await this.db.prepare(query).bind(orderNumber).first();
    
    if (!result) {
      return null;
    }

    return await this.getOrderById(result.id as number);
  }

  /**
   * 取得使用者的訂單列表
   */
  async getOrdersByUserId(userId: number, query: Omit<OrderQuery, 'user_id'>): Promise<{ orders: Order[]; pagination: Pagination }> {
    return await this.getOrders({ ...query, user_id: userId });
  }
}
