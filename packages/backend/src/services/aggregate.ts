import type { D1Database } from '@cloudflare/workers-types';
import type { 
  UserBasic,
  AvailableCouponItem,
  UserByPhoneQuery,
  UserAvailableCouponsQuery
} from '../zod/aggregate.js';

/**
 * 聚合服務類別
 */
export class AggregateService {
  constructor(private db: D1Database) {}

  /**
   * 根據手機號碼查詢使用者
   */
  async getUserByPhone(query: UserByPhoneQuery): Promise<UserBasic | null> {
    const { phone } = query;
    
    const query_sql = 'SELECT * FROM users WHERE phone = ?';
    const result = await this.db.prepare(query_sql).bind(phone).first();
    
    if (!result) {
      return null;
    }

    return result as UserBasic;
  }

  /**
   * 取得使用者可用優惠券（包含可用性判斷）
   */
  async getUserAvailableCoupons(
    userId: number, 
    query?: UserAvailableCouponsQuery
  ): Promise<AvailableCouponItem[]> {
    const orderAmount = query?.order_amount || 0;
    
    // 取得使用者擁有的優惠券授權
    const grantsQuery = `
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
        c.starts_at as coupon_starts_at,
        c.ends_at as coupon_ends_at,
        cg.allowed_uses,
        cg.used_count,
        (cg.allowed_uses - cg.used_count) as remaining_uses,
        cg.granted_at,
        cg.expires_at,
        c.is_active as coupon_is_active,
        cc.is_active as coupon_code_is_active
      FROM coupon_grants cg
      JOIN coupon_codes cc ON cc.id = cg.coupon_code_id
      JOIN coupons c ON c.id = cc.coupon_id
      WHERE cg.user_id = ?
      ORDER BY cg.granted_at DESC
    `;

    const result = await this.db.prepare(grantsQuery).bind(userId).all();
    const grants = result.results as any[];

    // 為每個授權判斷可用性
    const availableCoupons: AvailableCouponItem[] = [];
    const now = new Date();

    for (const grant of grants) {
      const { isUsable, reason } = this.checkCouponUsability(grant, orderAmount, now);
      
      availableCoupons.push({
        id: grant.coupon_code_id,
        grant_id: grant.grant_id,
        coupon_id: grant.coupon_id,
        coupon_code_id: grant.coupon_code_id,
        coupon_name: grant.coupon_name,
        coupon_code: grant.coupon_code,
        discount_type: grant.discount_type,
        percent_off_bps: grant.percent_off_bps,
        amount_off_twd: grant.amount_off_twd,
        min_order_twd: grant.min_order_twd,
        coupon_starts_at: grant.coupon_starts_at,
        coupon_ends_at: grant.coupon_ends_at,
        allowed_uses: grant.allowed_uses,
        used_count: grant.used_count,
        remaining_uses: grant.remaining_uses,
        granted_at: grant.granted_at,
        expires_at: grant.expires_at,
        is_active: grant.coupon_is_active,
        isUsable,
        reason,
      });
    }

    return availableCoupons;
  }

  /**
   * 檢查優惠券可用性
   */
  private checkCouponUsability(
    grant: any, 
    orderAmount: number, 
    now: Date
  ): { isUsable: boolean; reason: string | null } {
    // 檢查優惠券是否啟用
    if (grant.coupon_is_active !== 1) {
      return { isUsable: false, reason: '優惠券已停用' };
    }

    // 檢查優惠券代碼是否啟用
    if (grant.coupon_code_is_active !== 1) {
      return { isUsable: false, reason: '優惠券代碼已停用' };
    }

    // 檢查優惠券是否尚未開始
    if (grant.coupon_starts_at && new Date(grant.coupon_starts_at) > now) {
      return { isUsable: false, reason: '優惠券尚未生效' };
    }

    // 檢查優惠券是否已過期
    if (grant.coupon_ends_at && new Date(grant.coupon_ends_at) < now) {
      return { isUsable: false, reason: '優惠券已過期' };
    }

    // 檢查是否已用罄
    if (grant.remaining_uses <= 0) {
      return { isUsable: false, reason: '優惠券已用罄' };
    }

    // 檢查授權是否已過期
    if (grant.expires_at && new Date(grant.expires_at) < now) {
      return { isUsable: false, reason: '優惠券已過期' };
    }

    // 檢查授權是否尚未生效
    if (grant.granted_at && new Date(grant.granted_at) > now) {
      return { isUsable: false, reason: '優惠券尚未生效' };
    }

    // 檢查最低消費（僅在有購物金額時檢查）
    if (orderAmount > 0 && orderAmount < grant.min_order_twd) {
      return { 
        isUsable: false, 
        reason: `未達最低消費金額 ${grant.min_order_twd} 元` 
      };
    }

    // 如果沒有購物金額，但最低消費大於 0，則標記為需要確認
    if (orderAmount === 0 && grant.min_order_twd > 0) {
      return { 
        isUsable: false, 
        reason: `需確認是否達最低消費金額 ${grant.min_order_twd} 元` 
      };
    }

    return { isUsable: true, reason: null };
  }
}
