import type { D1Database } from '@cloudflare/workers-types';
import type {
  PreorderCampaign,
  PreorderCampaignQuery,
  CreatePreorderCampaignRequest,
  UpdatePreorderCampaignRequest,
  CreatePreorderOrderRequest,
  PreorderCampaignProduct,
} from '../zod/preorders.js';
import { taipeiToUtc, taipeiToUtcEnd, utcToTaipei } from '../utils/time.js';
import { ApiError } from '../utils/api-error.js';
import { OrderService } from './orders.js';
import { logger } from '../utils/logger.js';

interface CampaignRow {
  id: number;
  campaign_name: string | null;
  campaign_copy: string;
  starts_at: string;
  ends_at: string;
  is_active: number;
  created_at: string;
  updated_at: string;
}

interface CampaignProductRow {
  product_id: number;
  product_name: string;
  product_price_twd: number;
  product_image_url: string | null;
  supply_quantity: number;
  reserved_quantity: number;
}

export class PreorderService {
  private orderService: OrderService;

  constructor(private db: D1Database, orderService?: OrderService) {
    this.orderService = orderService ?? new OrderService(db);
  }

  private async loadCampaignProducts(campaignId: number): Promise<PreorderCampaignProduct[]> {
    try {
      const query = `
        SELECT
          pcp.product_id,
          p.name as product_name,
          p.unit_price_twd as product_price_twd,
          p.img_url as product_image_url,
          pcp.supply_quantity,
          pcp.reserved_quantity
        FROM preorder_campaign_products pcp
        JOIN products p ON p.id = pcp.product_id
        WHERE pcp.campaign_id = ?
        ORDER BY pcp.id
      `;
      logger.info('載入預購檔期商品', { campaignId, query });
      const result = await this.db.prepare(query).bind(campaignId).all<CampaignProductRow>();
      
      if (!result) {
        logger.warn('載入預購檔期商品查詢結果為空', { campaignId });
        return [];
      }
      
      const rows = (result.results as unknown as CampaignProductRow[]) ?? [];
      logger.info('載入預購檔期商品成功', { campaignId, count: rows.length });

      return rows.map((row) => ({
        productId: row.product_id,
        productName: row.product_name,
        productPriceTwd: row.product_price_twd,
        productImageUrl: row.product_image_url,
        supplyQuantity: row.supply_quantity,
        reservedQuantity: row.reserved_quantity,
        remainingQuantity: Math.max(row.supply_quantity - row.reserved_quantity, 0),
      }));
    } catch (error) {
      logger.error('載入預購檔期商品失敗', {
        campaignId,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      
      // 如果商品表不存在或查詢失敗，返回空陣列而不是拋出錯誤
      // 這樣即使沒有商品，檔期資料仍能正常顯示
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('does not exist')) {
        logger.warn('預購商品表不存在，返回空商品列表', { campaignId });
        return [];
      }
      
      // 其他錯誤仍然拋出，但提供更詳細的錯誤資訊
      throw new ApiError('LOAD_PRODUCTS_FAILED', `載入預購檔期商品失敗: ${errorMessage}`, 500);
    }
  }

  private async mapCampaign(row: CampaignRow): Promise<PreorderCampaign> {
    try {
      const products = await this.loadCampaignProducts(row.id);

      return {
        id: row.id,
        campaignName: row.campaign_name ?? '',
        campaignCopy: row.campaign_copy,
        products,
        startsAt: row.starts_at,
        endsAt: row.ends_at,
        startsAtTaipei: utcToTaipei(row.starts_at),
        endsAtTaipei: utcToTaipei(row.ends_at),
        isActive: row.is_active === 1,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      };
    } catch (error) {
      logger.error('mapCampaign 失敗', {
        row,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
      });
      throw error;
    }
  }

  private async ensureProductExists(productId: number) {
    const productQuery = `
      SELECT id, name, unit_price_twd, img_url, is_active
      FROM products
      WHERE id = ?
    `;
    const product = await this.db.prepare(productQuery).bind(productId).first();

    if (!product || product.is_active !== 1) {
      throw new ApiError('PRODUCT_NOT_AVAILABLE', `產品 ${productId} 不存在或已停用`, 404);
    }

    return product;
  }

  async listCampaigns(query: PreorderCampaignQuery): Promise<{ campaigns: PreorderCampaign[]; pagination: { page: number; limit: number; total: number; totalPages: number } }> {
    try {
      const { page, limit, sortBy, sortDir, isActive } = query;
      const offset = (page - 1) * limit;
      const conditions: string[] = [];
      const params: unknown[] = [];

      if (typeof isActive === 'boolean') {
        conditions.push('pc.is_active = ?');
        params.push(isActive ? 1 : 0);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

      const countQuery = `SELECT COUNT(*) as total FROM preorder_campaigns pc ${whereClause}`;
      logger.info('執行預購檔期數量查詢', { query: countQuery, params });
      const countResult = await this.db.prepare(countQuery).bind(...params).first();
      
      if (!countResult) {
        logger.error('預購檔期數量查詢失敗', { query: countQuery, params });
        throw new ApiError('DATABASE_ERROR', '無法取得預購檔期數量', 500);
      }
      
      const total = (countResult.total as number) || 0;
      const totalPages = Math.ceil(total / limit);

      const sortColumn = ['starts_at', 'created_at', 'updated_at'].includes(sortBy) ? sortBy : 'created_at';
      const listQuery = `
        SELECT pc.*
        FROM preorder_campaigns pc
        ${whereClause}
        ORDER BY pc.${sortColumn} ${sortDir.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      logger.info('執行預購檔期列表查詢', { query: listQuery, params: [...params, limit, offset] });
      const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all<CampaignRow>();
      
      if (!listResult) {
        logger.error('預購檔期列表查詢失敗', { query: listQuery, params: [...params, limit, offset] });
        throw new ApiError('DATABASE_ERROR', '無法取得預購檔期列表', 500);
      }
      
      const rows = (listResult.results as unknown as CampaignRow[]) ?? [];
      logger.info('開始映射預購檔期資料', { count: rows.length });
      
      const campaigns = await Promise.all(rows.map((row) => this.mapCampaign(row)));

      logger.info('預購檔期列表查詢成功', { total, campaignsCount: campaigns.length });
      return {
        campaigns,
        pagination: {
          page,
          limit,
          total,
          totalPages,
        },
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      
      logger.error('listCampaigns 執行失敗', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        query,
      });
      
      // 檢查是否是資料表不存在的錯誤
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('no such table') || errorMessage.includes('does not exist')) {
        throw new ApiError('DATABASE_SCHEMA_ERROR', '預購檔期資料表不存在，請執行資料庫遷移', 500, {
          message: errorMessage,
        });
      }
      
      throw new ApiError('LIST_CAMPAIGNS_FAILED', '取得預購檔期列表失敗', 500, {
        message: errorMessage,
      });
    }
  }

  async getCampaignById(id: number): Promise<PreorderCampaign> {
    const query = `SELECT * FROM preorder_campaigns WHERE id = ? LIMIT 1`;
    const result = await this.db.prepare(query).bind(id).first<CampaignRow>();

    if (!result) {
      throw new ApiError('PREORDER_NOT_FOUND', '預購檔期不存在', 404);
    }

    return this.mapCampaign(result);
  }

  async getActiveCampaign(): Promise<PreorderCampaign> {
    const now = new Date().toISOString();
    const query = `
      SELECT * FROM preorder_campaigns
      WHERE is_active = 1 AND starts_at <= ? AND ends_at >= ?
      LIMIT 1
    `;
    const result = await this.db.prepare(query).bind(now, now).first<CampaignRow>();

    if (!result) {
      throw new ApiError('PREORDER_INACTIVE', '目前沒有可預購的檔期', 404);
    }

    const campaign = await this.mapCampaign(result);
    const hasAvailableProducts = campaign.products.some((p) => p.remainingQuantity > 0);

    if (!hasAvailableProducts) {
      throw new ApiError('PREORDER_SOLD_OUT', '預購檔期已售罄', 409);
    }

    return campaign;
  }

  async createCampaign(payload: CreatePreorderCampaignRequest): Promise<PreorderCampaign> {
    // 驗證所有商品
    for (const product of payload.products) {
      await this.ensureProductExists(product.productId);
    }

    const startsAtUtc = new Date(taipeiToUtc(payload.startsAt)).toISOString();
    const endsAtUtc = new Date(taipeiToUtcEnd(payload.endsAt)).toISOString();

    if (startsAtUtc >= endsAtUtc) {
      throw new ApiError('INVALID_RANGE', '開始時間必須早於結束時間', 400);
    }

    if (payload.isActive) {
      await this.db.prepare('UPDATE preorder_campaigns SET is_active = 0').run();
    }

    try {
      // 使用 D1 batch API 執行交易
      const insertQuery = `
        INSERT INTO preorder_campaigns (
          campaign_name,
          campaign_copy,
          starts_at,
          ends_at,
          is_active,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      const result = await this.db
        .prepare(insertQuery)
        .bind(
          payload.campaignName,
          payload.campaignCopy,
          startsAtUtc,
          endsAtUtc,
          payload.isActive ? 1 : 0,
        )
        .run();

      if (!result.success) {
        logger.error('建立預購檔期失敗', { result, payload });
        throw new ApiError('PREORDER_CREATE_FAILED', '建立預購檔期失敗', 500);
      }

      const campaignId = result.meta.last_row_id as number;

      // 準備所有商品關聯的插入語句
      const productStatements = payload.products.map((product) => {
        const productInsertQuery = `
          INSERT INTO preorder_campaign_products (
            campaign_id,
            product_id,
            supply_quantity,
            reserved_quantity,
            created_at,
            updated_at
          ) VALUES (?, ?, ?, 0, datetime('now'), datetime('now'))
        `;
        return this.db.prepare(productInsertQuery).bind(campaignId, product.productId, product.supplyQuantity);
      });

      // 使用 batch 執行所有商品關聯插入
      if (productStatements.length > 0) {
        const batchResults = await this.db.batch(productStatements);
        
        // 檢查是否有失敗的操作
        for (let i = 0; i < batchResults.length; i++) {
          if (!batchResults[i].success) {
            logger.error('建立預購商品關聯失敗', { 
              productIndex: i,
              product: payload.products[i],
              result: batchResults[i],
            });
            throw new ApiError('PREORDER_PRODUCT_CREATE_FAILED', '建立預購商品關聯失敗', 500);
          }
        }
      }
      
      // 獲取創建的檔期
      try {
        return await this.getCampaignById(campaignId);
      } catch (getError) {
        logger.error('獲取創建的預購檔期失敗', {
          campaignId,
          error: getError instanceof Error ? getError.message : String(getError),
          stack: getError instanceof Error ? getError.stack : undefined,
        });
        // 即使獲取失敗，檔期已經創建成功，所以返回基本資訊
        const basicCampaign = await this.db
          .prepare('SELECT * FROM preorder_campaigns WHERE id = ?')
          .bind(campaignId)
          .first<CampaignRow>();
        
        if (!basicCampaign) {
          throw new ApiError('PREORDER_CREATE_FAILED', '建立預購檔期失敗', 500);
        }
        
        return this.mapCampaign(basicCampaign);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('建立預購檔期失敗', { 
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        payload 
      });
      throw new ApiError('PREORDER_CREATE_FAILED', '建立預購檔期失敗', 500);
    }
  }

  async updateCampaign(id: number, payload: UpdatePreorderCampaignRequest): Promise<PreorderCampaign> {
    const current = await this.getCampaignById(id);

    const updates: string[] = [];
    const values: unknown[] = [];

    if (payload.campaignName !== undefined) {
      updates.push('campaign_name = ?');
      values.push(payload.campaignName);
    }

    if (payload.campaignCopy !== undefined) {
      updates.push('campaign_copy = ?');
      values.push(payload.campaignCopy);
    }

    let nextStartsAt = current.startsAt;
    let nextEndsAt = current.endsAt;

    if (payload.startsAt !== undefined) {
      nextStartsAt = new Date(taipeiToUtc(payload.startsAt)).toISOString();
      updates.push('starts_at = ?');
      values.push(nextStartsAt);
    }

    if (payload.endsAt !== undefined) {
      nextEndsAt = new Date(taipeiToUtcEnd(payload.endsAt)).toISOString();
      updates.push('ends_at = ?');
      values.push(nextEndsAt);
    }

    if (nextStartsAt >= nextEndsAt) {
      throw new ApiError('INVALID_RANGE', '開始時間必須早於結束時間', 400);
    }

    if (payload.isActive !== undefined) {
      if (payload.isActive) {
        await this.db.prepare('UPDATE preorder_campaigns SET is_active = 0').run();
      }
      updates.push('is_active = ?');
      values.push(payload.isActive ? 1 : 0);
    }

    try {
      // 更新基本資訊
      if (updates.length > 0) {
        updates.push("updated_at = datetime('now')");
        const updateQuery = `UPDATE preorder_campaigns SET ${updates.join(', ')} WHERE id = ?`;
        values.push(id);

        const result = await this.db.prepare(updateQuery).bind(...values).run();

        if (!result.success) {
          throw new ApiError('PREORDER_UPDATE_FAILED', '更新預購檔期失敗', 500);
        }
      }

      // 更新商品列表
      if (payload.products !== undefined) {
        // 驗證所有商品
        for (const product of payload.products) {
          await this.ensureProductExists(product.productId);
        }

        // 檢查是否有已預購的數量超過新的供應數量
        const existingProducts = await this.db
          .prepare('SELECT product_id, reserved_quantity FROM preorder_campaign_products WHERE campaign_id = ?')
          .bind(id)
          .all<{ product_id: number; reserved_quantity: number }>();

        const existingMap = new Map(
          (existingProducts.results as unknown as Array<{ product_id: number; reserved_quantity: number }>).map(
            (p) => [p.product_id, p.reserved_quantity],
          ),
        );

        for (const product of payload.products) {
          const existingReserved = existingMap.get(product.productId) ?? 0;
          if (product.supplyQuantity < existingReserved) {
            throw new ApiError('INVALID_QUANTITY', `商品 ${product.productId} 的供應數量不得小於已預購數量`, 400);
          }
        }

        // 刪除舊的商品關聯
        await this.db.prepare('DELETE FROM preorder_campaign_products WHERE campaign_id = ?').bind(id).run();

        // 準備所有商品關聯的插入語句
        const productStatements = payload.products.map((product) => {
          const existingReserved = existingMap.get(product.productId) ?? 0;
          const productInsertQuery = `
            INSERT INTO preorder_campaign_products (
              campaign_id,
              product_id,
              supply_quantity,
              reserved_quantity,
              created_at,
              updated_at
            ) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
          `;
          return this.db.prepare(productInsertQuery).bind(id, product.productId, product.supplyQuantity, existingReserved);
        });

        // 使用 batch 執行所有商品關聯插入
        if (productStatements.length > 0) {
          const batchResults = await this.db.batch(productStatements);
          
          // 檢查是否有失敗的操作
          for (let i = 0; i < batchResults.length; i++) {
            if (!batchResults[i].success) {
              logger.error('更新預購商品關聯失敗', { 
                productIndex: i,
                product: payload.products[i],
                result: batchResults[i],
              });
              throw new ApiError('PREORDER_PRODUCT_UPDATE_FAILED', '更新預購商品關聯失敗', 500);
            }
          }
        }
      }

      return this.getCampaignById(id);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('更新預購檔期失敗', { error: error instanceof Error ? error.message : String(error) });
      throw new ApiError('PREORDER_UPDATE_FAILED', '更新預購檔期失敗', 500);
    }
  }

  async deleteCampaign(id: number): Promise<void> {
    const current = await this.getCampaignById(id);

    const orderCountQuery = 'SELECT COUNT(*) as total FROM preorder_orders WHERE campaign_id = ?';
    const orderCountResult = await this.db.prepare(orderCountQuery).bind(current.id).first();
    if ((orderCountResult?.total as number) > 0) {
      throw new ApiError('PREORDER_HAS_ORDERS', '已有預購訂單，無法刪除檔期', 409);
    }

    try {
      // 刪除商品關聯
      await this.db.prepare('DELETE FROM preorder_campaign_products WHERE campaign_id = ?').bind(id).run();

      // 刪除檔期
      const deleteQuery = 'DELETE FROM preorder_campaigns WHERE id = ?';
      const result = await this.db.prepare(deleteQuery).bind(id).run();

      if (!result.success || result.meta.changes === 0) {
        throw new ApiError('PREORDER_DELETE_FAILED', '刪除預購檔期失敗', 500);
      }
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('刪除預購檔期失敗', { 
        error: error instanceof Error ? error.message : String(error),
        campaignId: id,
      });
      throw new ApiError('PREORDER_DELETE_FAILED', '刪除預購檔期失敗', 500);
    }
  }

  async createPreorderOrder(payload: CreatePreorderOrderRequest) {
    const campaign = await this.getCampaignById(payload.campaignId);

    if (!campaign.isActive) {
      throw new ApiError('PREORDER_INACTIVE', '檔期已停用', 409);
    }

    const now = new Date().toISOString();
    if (campaign.startsAt > now || campaign.endsAt < now) {
      throw new ApiError('PREORDER_OUT_OF_RANGE', '檔期不在有效期間', 409);
    }

    // 找到對應的商品
    const product = campaign.products.find((p) => p.productId === payload.productId);
    if (!product) {
      throw new ApiError('PRODUCT_NOT_IN_CAMPAIGN', '商品不在預購檔期中', 400);
    }

    if (payload.quantity > product.remainingQuantity) {
      throw new ApiError('PREORDER_QUOTA_EXCEEDED', '預購數量不足', 409);
    }

    let orderNumber = '';
    let orderTotal = 0;
    let remainingQuantity = product.remainingQuantity;

    try {
      // 更新商品預購數量
      const updateResult = await this.db
        .prepare(
          `
        UPDATE preorder_campaign_products
        SET reserved_quantity = reserved_quantity + ?, updated_at = datetime('now')
        WHERE campaign_id = ? AND product_id = ? AND reserved_quantity + ? <= supply_quantity
      `,
        )
        .bind(payload.quantity, campaign.id, payload.productId, payload.quantity)
        .run();

      if (!updateResult.success || updateResult.meta.changes === 0) {
        throw new ApiError('PREORDER_QUOTA_EXCEEDED', '預購數量不足', 409);
      }

      const orderDetail = await this.orderService.createOrder({
        user_id: payload.userId,
        items: [
          {
            product_id: payload.productId,
            quantity: payload.quantity,
          },
        ],
        channel: '網路',
      });

      orderNumber = orderDetail.order_number;
      orderTotal = orderDetail.total_twd;

      const preorderOrderResult = await this.db
        .prepare(
          `
        INSERT INTO preorder_orders (
          campaign_id,
          order_id,
          product_id,
          customer_name,
          customer_phone,
          pickup_slot,
          customer_note,
          quantity,
          created_at,
          updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
      `,
        )
        .bind(
          campaign.id,
          orderDetail.id,
          payload.productId,
          payload.customerName,
          payload.customerPhone,
          payload.pickupSlot ?? '',
          payload.customerNote ?? null,
          payload.quantity,
        )
        .run();

      if (!preorderOrderResult.success) {
        throw new ApiError('PREORDER_ORDER_FAILED', '建立預購訂單失敗', 500);
      }

      const remainingQuery = `
        SELECT MAX(supply_quantity - reserved_quantity, 0) as remaining
        FROM preorder_campaign_products
        WHERE campaign_id = ? AND product_id = ?
      `;
      const remainingResult = await this.db.prepare(remainingQuery).bind(campaign.id, payload.productId).first();
      remainingQuantity = Math.max(Number(remainingResult?.remaining) || 0, 0);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      logger.error('預購訂單建立失敗', { error: error instanceof Error ? error.message : String(error) });
      throw new ApiError('PREORDER_ORDER_FAILED', '建立預購訂單失敗', 500);
    }

    return {
      orderNumber,
      campaignId: campaign.id,
      quantity: payload.quantity,
      remainingQuantity,
      totalTwd: orderTotal,
    };
  }
}
