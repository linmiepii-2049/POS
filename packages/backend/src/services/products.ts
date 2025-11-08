import type { D1Database } from '@cloudflare/workers-types';
import { getCurrentUTC } from '../utils/time.js';
import type { 
  Product, 
  CreateProductRequest, 
  UpdateProductRequest, 
  ProductQuery, 
  Pagination 
} from '../zod/products.js';

/**
 * 產品服務類別
 */
export class ProductService {
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
   * 取得產品列表（支援分頁、排序、篩選）
   */
  async getProducts(query: ProductQuery): Promise<{ products: Product[]; pagination: Pagination }> {
    const { page, limit, sortBy, sortDir, search, category, is_active, from, to } = query;
    
    // 建立 WHERE 條件
    const conditions: string[] = [];
    const params: unknown[] = [];
    let _paramIndex = 1;

    if (search) {
      conditions.push(`(sku LIKE ? OR name LIKE ?)`);
      params.push(`%${search}%`, `%${search}%`);
      _paramIndex += 2;
    }

    if (category) {
      conditions.push(`category = ?`);
      params.push(category);
      _paramIndex++;
    }

    if (is_active !== undefined) {
      conditions.push(`is_active = ?`);
      params.push(is_active);
      _paramIndex++;
    }

    if (from) {
      conditions.push(`created_at >= ?`);
      params.push(this.taipeiToUtc(from));
      _paramIndex++;
    }

    if (to) {
      conditions.push(`created_at <= ?`);
      params.push(this.taipeiToUtc(to));
      _paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // 計算總筆數
    const countQuery = `SELECT COUNT(*) as total FROM products ${whereClause}`;
    const countResult = await this.db.prepare(countQuery).bind(...params).first();
    const total = countResult?.total as number || 0;

    // 計算分頁資訊
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;

    // 取得產品列表（包含銷售數量統計）
    const orderBy = `${sortBy} ${sortDir.toUpperCase()}`;
    const listQuery = `
      SELECT 
        p.*,
        COALESCE(SUM(CASE 
          WHEN oi.created_at >= datetime('now', '-30 days') 
          AND o.status != 'cancelled'
          THEN oi.quantity 
          ELSE 0 
        END), 0) as current_month_sales,
        COALESCE(SUM(CASE 
          WHEN oi.created_at >= datetime('now', '-60 days') 
          AND oi.created_at < datetime('now', '-30 days')
          AND o.status != 'cancelled'
          THEN oi.quantity 
          ELSE 0 
        END), 0) as last_month_sales
      FROM products p
      LEFT JOIN order_items oi ON p.id = oi.product_id
      LEFT JOIN orders o ON oi.order_id = o.id
      ${whereClause} 
      GROUP BY p.id
      ORDER BY ${orderBy} 
      LIMIT ? OFFSET ?
    `;
    
    const listResult = await this.db.prepare(listQuery).bind(...params, limit, offset).all();
    const products = listResult.results as Product[];

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        total_pages: totalPages,
      },
    };
  }

  /**
   * 根據 ID 取得產品詳細資訊
   */
  async getProductById(id: number): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE id = ?';
    const result = await this.db.prepare(query).bind(id).first();
    
    if (!result) {
      return null;
    }

    return result as Product;
  }

  /**
   * 根據 SKU 取得產品
   */
  async getProductBySku(sku: string): Promise<Product | null> {
    const query = 'SELECT * FROM products WHERE sku = ?';
    const result = await this.db.prepare(query).bind(sku).first();
    
    if (!result) {
      return null;
    }

    return result as Product;
  }

  /**
   * 建立產品
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const { sku, category, name, description, img_url, list_price_twd, unit_price_twd, is_active } = data;
    
    const query = `
      INSERT INTO products (sku, category, name, description, img_url, list_price_twd, unit_price_twd, is_active, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    const now = getCurrentUTC();
    const result = await this.db.prepare(query).bind(
      sku, 
      category || null, 
      name, 
      description || null, 
      img_url || null, 
      list_price_twd, 
      unit_price_twd, 
      is_active,
      now,
      now
    ).run();
    
    if (!result.success) {
      throw new Error('建立產品失敗');
    }

    // 取得新建立的產品
    const newProduct = await this.getProductById(result.meta.last_row_id as number);
    if (!newProduct) {
      throw new Error('無法取得新建立的產品');
    }

    return newProduct;
  }

  /**
   * 更新產品
   */
  async updateProduct(id: number, data: UpdateProductRequest): Promise<Product | null> {
    // 檢查產品是否存在
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      return null;
    }

    // 建立更新欄位
    const updateFields: string[] = [];
    const params: unknown[] = [];
    let _paramIndex = 1;

    if (data.sku !== undefined) {
      updateFields.push(`sku = ?`);
      params.push(data.sku);
      _paramIndex++;
    }

    if (data.category !== undefined) {
      updateFields.push(`category = ?`);
      params.push(data.category);
      _paramIndex++;
    }

    if (data.name !== undefined) {
      updateFields.push(`name = ?`);
      params.push(data.name);
      _paramIndex++;
    }

    if (data.description !== undefined) {
      updateFields.push(`description = ?`);
      // 如果 description 是空字串，則設為 NULL
      params.push(data.description === '' ? null : data.description);
      _paramIndex++;
    }

    if (data.img_url !== undefined) {
      updateFields.push(`img_url = ?`);
      params.push(data.img_url);
      _paramIndex++;
    }

    if (data.list_price_twd !== undefined) {
      updateFields.push(`list_price_twd = ?`);
      params.push(data.list_price_twd);
      _paramIndex++;
    }

    if (data.unit_price_twd !== undefined) {
      updateFields.push(`unit_price_twd = ?`);
      params.push(data.unit_price_twd);
      _paramIndex++;
    }

    if (data.is_active !== undefined) {
      updateFields.push(`is_active = ?`);
      params.push(data.is_active);
      _paramIndex++;
    }

    if (updateFields.length === 0) {
      return existingProduct;
    }

    // 加入 updated_at
    updateFields.push(`updated_at = ?`);
    
    const query = `
      UPDATE products 
      SET ${updateFields.join(', ')} 
      WHERE id = ?
    `;
    
    const now = getCurrentUTC();
    const result = await this.db.prepare(query).bind(...params, now, id).run();
    
    if (!result.success) {
      throw new Error('更新產品失敗');
    }

    // 取得更新後的產品
    const updatedProduct = await this.getProductById(id);
    return updatedProduct;
  }

  /**
   * 刪除產品
   */
  async deleteProduct(id: number): Promise<boolean> {
    // 檢查產品是否存在
    const existingProduct = await this.getProductById(id);
    if (!existingProduct) {
      return false;
    }

    // 檢查是否有相關訂單項目
    const orderItemCheckQuery = 'SELECT COUNT(*) as count FROM order_items WHERE product_id = ?';
    const orderItemCheckResult = await this.db.prepare(orderItemCheckQuery).bind(id).first();
    const orderItemCount = orderItemCheckResult?.count as number || 0;

    if (orderItemCount > 0) {
      throw new Error('無法刪除有訂單記錄的產品');
    }

    // 刪除產品
    const deleteQuery = 'DELETE FROM products WHERE id = ?';
    const result = await this.db.prepare(deleteQuery).bind(id).run();
    
    return result.success;
  }

  /**
   * 檢查 SKU 是否已存在
   */
  async isSkuExists(sku: string, excludeId?: number): Promise<boolean> {
    let query = 'SELECT COUNT(*) as count FROM products WHERE sku = ?';
    const params = [sku];

    if (excludeId) {
      query += ' AND id != ?';
      params.push(String(excludeId));
    }

    const result = await this.db.prepare(query).bind(...params).first();
    return (result?.count as number || 0) > 0;
  }

  /**
   * 取得所有產品分類
   */
  async getCategories(): Promise<string[]> {
    const query = `
      SELECT DISTINCT category 
      FROM products 
      WHERE category IS NOT NULL 
      ORDER BY category
    `;
    
    const result = await this.db.prepare(query).all();
    return result.results.map((row: any) => row.category as string);
  }

  /**
   * 更新產品圖片 URL
   */
  async updateProductImage(id: number, imgUrl: string): Promise<Product | null> {
    const query = `
      UPDATE products 
      SET img_url = ?, updated_at = ? 
      WHERE id = ?
    `;
    
    const now = getCurrentUTC();
    const result = await this.db.prepare(query).bind(imgUrl, now, id).run();
    
    if (!result.success) {
      throw new Error('更新產品圖片失敗');
    }

    return await this.getProductById(Number(id));
  }
}
