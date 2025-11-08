import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createApp } from '../src/app.js';
import type { Env } from '../src/env.d.ts';

// Mock D1 資料庫
const mockDb = {
  prepare: (sql: string) => ({
    bind: (...params: any[]) => ({
      first: async () => {
        // Mock 根據 SQL 查詢返回不同結果
        if (sql.includes('SELECT COUNT(*) as count FROM users WHERE phone = ?')) {
          if (params[0] === '0912345678') {
            return { count: 1 };
          } else if (params[0] === '0999999999') {
            return { count: 2 }; // 重複手機號碼
          }
          return { count: 0 };
        }
        
        if (sql.includes('SELECT * FROM users WHERE phone = ?')) {
          if (params[0] === '0912345678') {
            return {
              id: 1,
              line_id: 'test_line_id',
              name: '測試使用者',
              phone: '0912345678',
              role: 'CLIENT',
              is_active: 1,
              created_at: '2024-01-01T00:00:00.000Z',
              updated_at: '2024-01-01T00:00:00.000Z',
            };
          }
          return null;
        }
        
        if (sql.includes('SELECT COUNT(*) as count FROM users WHERE id = ?')) {
          if (params[0] === 1) {
            return { count: 1 };
          }
          return { count: 0 };
        }
        
        if (sql.includes('FROM coupon_grants cg')) {
          return {
            results: [
              {
                grant_id: 1,
                coupon_id: 1,
                coupon_code_id: 1,
                coupon_name: '測試優惠券',
                coupon_code: 'TEST123',
                discount_type: 'PERCENT',
                percent_off_bps: 1000,
                amount_off_twd: null,
                min_order_twd: 5000,
                allowed_uses: 5,
                used_count: 2,
                remaining_uses: 3,
                granted_at: '2024-01-01T00:00:00.000Z',
                expires_at: '2025-12-31T23:59:59.000Z',
                coupon_is_active: 1,
                coupon_code_is_active: 1,
              },
              {
                grant_id: 2,
                coupon_id: 2,
                coupon_code_id: 2,
                coupon_name: '已過期優惠券',
                coupon_code: 'EXPIRED123',
                discount_type: 'FIXED',
                percent_off_bps: null,
                amount_off_twd: 1000,
                min_order_twd: 2000,
                allowed_uses: 3,
                used_count: 0,
                remaining_uses: 3,
                granted_at: '2024-01-01T00:00:00.000Z',
                expires_at: '2024-01-01T00:00:00.000Z', // 已過期
                coupon_is_active: 1,
                coupon_code_is_active: 1,
              },
            ],
          };
        }
        
        return { results: [] };
      },
      all: async () => {
        if (sql.includes('FROM coupon_grants cg')) {
          return {
            results: [
              {
                grant_id: 1,
                coupon_id: 1,
                coupon_code_id: 1,
                coupon_name: '測試優惠券',
                coupon_code: 'TEST123',
                discount_type: 'PERCENT',
                percent_off_bps: 1000,
                amount_off_twd: null,
                min_order_twd: 5000,
                allowed_uses: 5,
                used_count: 2,
                remaining_uses: 3,
                granted_at: '2024-01-01T00:00:00.000Z',
                expires_at: '2025-12-31T23:59:59.000Z',
                coupon_is_active: 1,
                coupon_code_is_active: 1,
              },
              {
                grant_id: 2,
                coupon_id: 2,
                coupon_code_id: 2,
                coupon_name: '已過期優惠券',
                coupon_code: 'EXPIRED123',
                discount_type: 'FIXED',
                percent_off_bps: null,
                amount_off_twd: 1000,
                min_order_twd: 2000,
                allowed_uses: 3,
                used_count: 0,
                remaining_uses: 3,
                granted_at: '2024-01-01T00:00:00.000Z',
                expires_at: '2024-01-01T00:00:00.000Z', // 已過期
                coupon_is_active: 1,
                coupon_code_is_active: 1,
              },
            ],
          };
        }
        return { results: [] };
      },
    }),
  }),
};

const mockEnv: Env = {
  DB: mockDb as any,
  R2_BUCKET: 'test-bucket',
  R2_PUBLIC_URL: 'https://test.example.com',
};

describe('聚合路由測試', () => {
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    app = createApp();
  });

  afterEach(() => {
    // 清理
  });

  describe('GET /api/user-by-phone?phone=...', () => {
    it('應該成功根據手機號碼查詢使用者', async () => {
      const res = await app.request('/api/user-by-phone?phone=0912345678', {
        headers: {
          'Content-Type': 'application/json',
        },
      }, mockEnv);
      
      const data = await res.json();
      
      expect(res.status).toBe(200);
      expect(data.success).toBe(true);
      expect(data.data).toMatchObject({
        id: 1,
        name: '測試使用者',
        phone: '0912345678',
        role: 'CLIENT',
      });
    });

    it('應該在找不到使用者時返回 404', async () => {
      const res = await app.request('/api/user-by-phone?phone=0987654321', {}, mockEnv);
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在');
    });

    it('應該在找到多筆使用者時返回 400', async () => {
      const res = await app.request('/api/user-by-phone?phone=0999999999', {}, mockEnv);
      expect(res.status).toBe(400);
      
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('找到多筆相同手機號碼的使用者');
    });

    it('應該在無效手機號碼時返回 400', async () => {
      const res = await app.request('/api/user-by-phone?phone=invalid', {}, mockEnv);
      expect(res.status).toBe(400);
    });
  });

  describe('GET /api/users/{id}/available-coupons', () => {
    it('應該成功取得使用者可用優惠券', async () => {
      const res = await app.request('/api/users/1/available-coupons', {}, mockEnv);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(Array.isArray(data.data)).toBe(true);
      expect(data.data.length).toBe(2);
      
      // 檢查第一個優惠券（需要確認最低消費）
      const firstCoupon = data.data[0];
      expect(firstCoupon.coupon_name).toBe('測試優惠券');
      expect(firstCoupon.isUsable).toBe(false);
      expect(firstCoupon.reason).toContain('需確認是否達最低消費金額');
      
      // 檢查第二個優惠券（已過期）
      const secondCoupon = data.data[1];
      expect(secondCoupon.coupon_name).toBe('已過期優惠券');
      expect(secondCoupon.isUsable).toBe(false);
      expect(secondCoupon.reason).toBe('優惠券已過期');
    });

    it('應該在購物金額不足時標記為不可用', async () => {
      const res = await app.request('/api/users/1/available-coupons?order_amount=3000', {}, mockEnv);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      
      const firstCoupon = data.data[0];
      expect(firstCoupon.isUsable).toBe(false);
      expect(firstCoupon.reason).toContain('未達最低消費金額');
    });

    it('應該在無購物金額時提示需要確認', async () => {
      const res = await app.request('/api/users/1/available-coupons', {}, mockEnv);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      
      const firstCoupon = data.data[0];
      expect(firstCoupon.isUsable).toBe(false);
      expect(firstCoupon.reason).toContain('需確認是否達最低消費金額');
    });

    it('應該在購物金額足夠時標記為可用', async () => {
      const res = await app.request('/api/users/1/available-coupons?order_amount=6000', {}, mockEnv);
      expect(res.status).toBe(200);
      
      const data = await res.json();
      expect(data.success).toBe(true);
      
      const firstCoupon = data.data[0];
      expect(firstCoupon.isUsable).toBe(true);
      expect(firstCoupon.reason).toBeNull();
    });

    it('應該在使用者不存在時返回 404', async () => {
      const res = await app.request('/api/users/999/available-coupons', {}, mockEnv);
      expect(res.status).toBe(404);
      
      const data = await res.json();
      expect(data.success).toBe(false);
      expect(data.error).toBe('使用者不存在');
    });
  });
});
