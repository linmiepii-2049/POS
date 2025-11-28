import { describe, it, expect } from 'vitest';
import type { D1Database } from '@cloudflare/workers-types';
import { PreorderService } from '../src/services/preorders.js';
import type { OrderService } from '../src/services/orders.js';

type BindHandlers = {
  first?: () => Promise<unknown>;
  all?: () => Promise<{ results: unknown[] }>;
  run?: () => Promise<{ success: boolean; meta: { last_row_id?: number; changes?: number } }>;
};

const createStatement = (handler: (params: unknown[]) => BindHandlers) => {
  const execute = (params: unknown[]) => {
    const impl = handler(params);
    return {
      first: impl.first ?? (async () => null),
      all: impl.all ?? (async () => ({ results: [] })),
      run: impl.run ?? (async () => ({ success: true, meta: { last_row_id: 0, changes: 0 } })),
    };
  };

  return {
    bind: (...params: unknown[]) => execute(params),
    first: () => execute([]).first(),
    all: () => execute([]).all(),
    run: () => execute([]).run(),
  };
};

interface ProductRecord {
  id: number;
  name: string;
  unit_price_twd: number;
  img_url: string | null;
  is_active: number;
}

interface CampaignRecord {
  id: number;
  product_id: number;
  campaign_copy: string;
  note: string | null;
  pickup_time_slots: string;
  max_quantity: number;
  reserved_quantity: number;
  starts_at: string;
  ends_at: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface PreorderOrderRecord {
  id: number;
  campaign_id: number;
  order_id: number;
  quantity: number;
}

class InMemoryD1 {
  private products = new Map<number, ProductRecord>();
  private campaigns = new Map<number, CampaignRecord>();
  private preorderOrders = new Map<number, PreorderOrderRecord>();
  private campaignSeq = 0;
  private preorderSeq = 0;

  insertProduct(product: ProductRecord) {
    this.products.set(product.id, product);
  }

  insertCampaign(campaign: CampaignRecord) {
    this.campaignSeq = Math.max(this.campaignSeq, campaign.id);
    this.campaigns.set(campaign.id, campaign);
  }

  prepare(query: string) {
    const normalized = query.replace(/\s+/g, ' ').trim();

    if (normalized.startsWith('SELECT id, name, unit_price_twd, img_url, is_active FROM products')) {
      return createStatement(([productId]) => ({
        first: async () => this.products.get(Number(productId)) ?? null,
      }));
    }

    if (normalized.startsWith('UPDATE preorder_campaigns SET is_active = 0')) {
      return createStatement(() => ({
        run: async () => {
          this.campaigns.forEach((record) => {
            record.is_active = 0;
          });
          return { success: true, meta: { changes: this.campaigns.size } };
        },
      }));
    }

    if (normalized.startsWith('INSERT INTO preorder_campaigns')) {
      return createStatement((params) => ({
        run: async () => {
          const [
            productId,
            campaignCopy,
            note,
            pickupSlots,
            maxQuantity,
            startsAt,
            endsAt,
            isActive,
          ] = params as [number, string, string | null, string, number, string, string, number];
          const id = ++this.campaignSeq;
          const now = new Date().toISOString();
          this.campaigns.set(id, {
            id,
            product_id: Number(productId),
            campaign_copy: campaignCopy,
            note: note ?? null,
            pickup_time_slots: pickupSlots,
            max_quantity: Number(maxQuantity),
            reserved_quantity: 0,
            starts_at: startsAt,
            ends_at: endsAt,
            is_active: Number(isActive),
            created_at: now,
            updated_at: now,
          });
          return { success: true, meta: { last_row_id: id, changes: 1 } };
        },
      }));
    }

    if (normalized.includes('FROM preorder_campaigns pc') && normalized.includes('WHERE pc.id = ?')) {
      return createStatement(([id]) => ({
        first: async () => {
          const campaign = this.campaigns.get(Number(id));
          if (!campaign) {
            return null;
          }
          const product = this.products.get(campaign.product_id);
          if (!product) {
            return null;
          }
          return {
            ...campaign,
            product_name: product.name,
            product_price_twd: product.unit_price_twd,
            product_image_url: product.img_url,
          };
        },
      }));
    }

    if (normalized.startsWith('SELECT COUNT(*) as total FROM preorder_orders WHERE campaign_id = ?')) {
      return createStatement(([campaignId]) => ({
        first: async () => {
          let total = 0;
          this.preorderOrders.forEach((record) => {
            if (record.campaign_id === Number(campaignId)) {
              total += 1;
            }
          });
          return { total };
        },
      }));
    }

    if (normalized.startsWith('DELETE FROM preorder_campaigns WHERE id = ?')) {
      return createStatement(([id]) => ({
        run: async () => {
          const removed = this.campaigns.delete(Number(id));
          return { success: removed, meta: { changes: removed ? 1 : 0 } };
        },
      }));
    }

    if (normalized.includes('WHERE pc.is_active = 1 AND pc.starts_at <= ? AND pc.ends_at >= ?')) {
      return createStatement(([now]) => ({
        first: async () => {
          for (const campaign of this.campaigns.values()) {
            if (
              campaign.is_active === 1 &&
              campaign.starts_at <= String(now) &&
              campaign.ends_at >= String(now)
            ) {
              const product = this.products.get(campaign.product_id);
              if (!product) {
                continue;
              }
              return {
                ...campaign,
                product_name: product.name,
                product_price_twd: product.unit_price_twd,
                product_image_url: product.img_url,
              };
            }
          }
          return null;
        },
      }));
    }

    if (
      normalized.startsWith('UPDATE preorder_campaigns SET reserved_quantity = reserved_quantity + ?')
    ) {
      return createStatement(([quantity, campaignId]) => ({
        run: async () => {
          const campaign = this.campaigns.get(Number(campaignId));
          if (!campaign) {
            return { success: false, meta: { changes: 0 } };
          }
          const qty = Number(quantity);
          if (campaign.reserved_quantity + qty > campaign.max_quantity) {
            return { success: true, meta: { changes: 0 } };
          }
          campaign.reserved_quantity += qty;
          campaign.updated_at = new Date().toISOString();
          return { success: true, meta: { changes: 1 } };
        },
      }));
    }

    if (normalized.startsWith('INSERT INTO preorder_orders')) {
      return createStatement((params) => ({
        run: async () => {
          const [, orderId, , , , , quantity] = params as [number, number, string, string, string, string | null, number];
          const id = ++this.preorderSeq;
          const [campaignId] = params as [number];
          if (this.preorderOrders.has(orderId)) {
            return { success: false, meta: { changes: 0 } };
          }
          this.preorderOrders.set(orderId, {
            id,
            campaign_id: Number(campaignId),
            order_id: Number(orderId),
            quantity: Number(quantity),
          });
          return { success: true, meta: { last_row_id: id, changes: 1 } };
        },
      }));
    }

    if (
      normalized.startsWith(
        'SELECT MAX(max_quantity - reserved_quantity, 0) as remaining FROM preorder_campaigns WHERE id = ?',
      )
    ) {
      return createStatement(([campaignId]) => ({
        first: async () => {
          const campaign = this.campaigns.get(Number(campaignId));
          if (!campaign) {
            return { remaining: 0 };
          }
          return { remaining: Math.max(campaign.max_quantity - campaign.reserved_quantity, 0) };
        },
      }));
    }

    if (normalized === 'BEGIN TRANSACTION' || normalized === 'COMMIT' || normalized === 'ROLLBACK') {
      return createStatement(() => ({
        run: async () => ({ success: true, meta: { changes: 0 } }),
      }));
    }

    throw new Error(`Unhandled SQL: ${normalized}`);
  }
}

const createMockOrderService = (overrides?: Partial<OrderService>): OrderService =>
  ({
    createOrder: async () => ({
      id: 500,
      order_number: 'ORD-TEST-001',
      user_id: 10,
      subtotal_twd: 200,
      discount_twd: 0,
      points_discount_twd: 0,
      total_twd: 200,
      status: 'paid',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_at_taipei: new Date().toISOString(),
      updated_at_taipei: new Date().toISOString(),
      order_items: [],
      coupon_redemptions: [],
    }),
    ...overrides,
  }) as unknown as OrderService;

describe('PreorderService', () => {
  it('建立檔期時應清空其他啟用狀態並回傳詳細資料', async () => {
    const db = new InMemoryD1();
    db.insertProduct({
      id: 1,
      name: '拿鐵',
      unit_price_twd: 120,
      img_url: null,
      is_active: 1,
    });
    db.insertCampaign({
      id: 10,
      product_id: 1,
      campaign_copy: '舊檔期',
      note: null,
      pickup_time_slots: '["10:00-11:00"]',
      max_quantity: 50,
      reserved_quantity: 10,
      starts_at: '2025-01-01T00:00:00.000Z',
      ends_at: '2025-01-07T23:59:59.000Z',
      is_active: 1,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    });

    const service = new PreorderService(db as unknown as D1Database);
    const result = await service.createCampaign({
      productId: 1,
      campaignCopy: '新春預購',
      note: '取餐請提前 10 分鐘報到',
      pickupTimeSlots: ['12:00-13:00', '13:00-14:00'],
      maxQuantity: 100,
      startsAt: '2025-02-01T00:00',
      endsAt: '2025-02-05T23:00',
      isActive: true,
    });

    expect(result.campaignCopy).toBe('新春預購');
    expect(result.pickupTimeSlots).toEqual(['12:00-13:00', '13:00-14:00']);
    expect(result.isActive).toBe(true);

    const previous = await service.getCampaignById(10);
    expect(previous.isActive).toBe(false);
  });

  it('建立預購訂單時應扣除名額並寫入預購訂單', async () => {
    const db = new InMemoryD1();
    db.insertProduct({
      id: 2,
      name: '草莓蛋糕',
      unit_price_twd: 250,
      img_url: null,
      is_active: 1,
    });
    db.insertCampaign({
      id: 20,
      product_id: 2,
      campaign_copy: '情人節限定',
      note: null,
      pickup_time_slots: '["14:00-15:00","15:00-16:00"]',
      max_quantity: 20,
      reserved_quantity: 5,
      starts_at: '2025-02-10T00:00:00.000Z',
      ends_at: '2026-02-15T23:59:59.000Z',
      is_active: 1,
      created_at: '2025-01-01T00:00:00.000Z',
      updated_at: '2025-01-01T00:00:00.000Z',
    });

    const mockOrderService = createMockOrderService();
    const service = new PreorderService(db as unknown as D1Database, mockOrderService);

    const summary = await service.createPreorderOrder({
      campaignId: 20,
      quantity: 3,
      customerName: '小明',
      customerPhone: '0911222333',
      pickupSlot: '14:00-15:00',
      customerNote: '幫我寫卡片',
    });

    expect(summary.orderNumber).toBe('ORD-TEST-001');
    expect(summary.remainingQuantity).toBe(12);
  });
});

