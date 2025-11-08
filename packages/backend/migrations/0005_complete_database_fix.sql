-- 完整資料庫修復遷移
-- 根據 docs/DB_OVERVIEW.md 修復缺失的觸發器、View 和約束

-- 1. 啟用外鍵延後檢查
PRAGMA defer_foreign_keys=ON;

-- 2. 創建訂單金額重算觸發器
-- 當 order_items 變更時，重新計算 orders 的金額
CREATE TRIGGER IF NOT EXISTS tr_order_items_recalculate_amounts
AFTER INSERT ON order_items
BEGIN
  UPDATE orders 
  SET 
    subtotal_twd = (
      SELECT COALESCE(SUM(quantity * unit_price_twd), 0)
      FROM order_items 
      WHERE order_id = NEW.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.order_id;
END;

CREATE TRIGGER IF NOT EXISTS tr_order_items_recalculate_amounts_update
AFTER UPDATE ON order_items
BEGIN
  UPDATE orders 
  SET 
    subtotal_twd = (
      SELECT COALESCE(SUM(quantity * unit_price_twd), 0)
      FROM order_items 
      WHERE order_id = NEW.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.order_id;
END;

CREATE TRIGGER IF NOT EXISTS tr_order_items_recalculate_amounts_delete
AFTER DELETE ON order_items
BEGIN
  UPDATE orders 
  SET 
    subtotal_twd = (
      SELECT COALESCE(SUM(quantity * unit_price_twd), 0)
      FROM order_items 
      WHERE order_id = OLD.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = OLD.order_id;
END;

-- 3. 創建優惠券兌換守門觸發器
CREATE TRIGGER IF NOT EXISTS cr_before_insert_guard
BEFORE INSERT ON coupon_redemptions
BEGIN
  -- 檢查授權是否存在
  SELECT CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM coupon_grants cg 
      WHERE cg.coupon_code_id = NEW.coupon_code_id 
        AND cg.user_id = NEW.user_id
    ) THEN RAISE(ABORT, '用戶未授權此優惠券代碼')
  END;
  
  -- 檢查優惠券是否啟用
  SELECT CASE 
    WHEN NOT EXISTS (
      SELECT 1 FROM coupons c 
      JOIN coupon_codes cc ON c.id = cc.coupon_id
      WHERE cc.id = NEW.coupon_code_id 
        AND c.is_active = 1 
        AND cc.is_active = 1
    ) THEN RAISE(ABORT, '優惠券或代碼已停用')
  END;
  
  -- 檢查時間窗
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM coupons c 
      JOIN coupon_codes cc ON c.id = cc.coupon_id
      WHERE cc.id = NEW.coupon_code_id 
        AND (
          (c.starts_at IS NOT NULL AND c.starts_at > datetime('now', '+8 hours')) OR
          (c.ends_at IS NOT NULL AND c.ends_at < datetime('now', '+8 hours')) OR
          (cc.starts_at IS NOT NULL AND cc.starts_at > datetime('now', '+8 hours')) OR
          (cc.ends_at IS NOT NULL AND cc.ends_at < datetime('now', '+8 hours'))
        )
    ) THEN RAISE(ABORT, '優惠券不在有效時間內')
  END;
  
  -- 檢查使用次數限制
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM coupon_grants cg 
      WHERE cg.coupon_code_id = NEW.coupon_code_id 
        AND cg.user_id = NEW.user_id
        AND cg.allowed_uses <= cg.used_count
    ) THEN RAISE(ABORT, '優惠券使用次數已達上限')
  END;
  
  -- 檢查代碼總使用次數限制
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM coupon_codes cc 
      WHERE cc.id = NEW.coupon_code_id 
        AND cc.max_redemptions IS NOT NULL
        AND cc.max_redemptions <= (
          SELECT COALESCE(COUNT(*), 0) 
          FROM coupon_redemptions cr 
          WHERE cr.coupon_code_id = NEW.coupon_code_id
        )
    ) THEN RAISE(ABORT, '優惠券代碼總使用次數已達上限')
  END;
  
  -- 檢查全站使用次數限制
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM coupons c 
      WHERE c.id = NEW.coupon_id 
        AND c.max_uses_total IS NOT NULL
        AND c.max_uses_total <= (
          SELECT COALESCE(COUNT(*), 0) 
          FROM coupon_redemptions cr 
          WHERE cr.coupon_id = NEW.coupon_id
        )
    ) THEN RAISE(ABORT, '優惠券全站使用次數已達上限')
  END;
  
  -- 檢查最低消費金額
  SELECT CASE 
    WHEN EXISTS (
      SELECT 1 FROM coupons c 
      JOIN orders o ON o.id = NEW.order_id
      WHERE c.id = NEW.coupon_id 
        AND c.min_order_twd IS NOT NULL
        AND o.subtotal_twd < c.min_order_twd
    ) THEN RAISE(ABORT, '訂單金額未達優惠券最低消費要求')
  END;
END;

-- 4. 創建優惠券使用次數自增觸發器
CREATE TRIGGER IF NOT EXISTS cr_after_insert_increment
AFTER INSERT ON coupon_redemptions
BEGIN
  UPDATE coupon_grants 
  SET 
    used_count = used_count + 1,
    updated_at = datetime('now', '+8 hours')
  WHERE coupon_code_id = NEW.coupon_code_id 
    AND user_id = NEW.user_id;
END;

-- 5. 創建優惠券兌換後訂單折扣重算觸發器
CREATE TRIGGER IF NOT EXISTS tr_coupon_redemptions_recalculate_discount
AFTER INSERT ON coupon_redemptions
BEGIN
  UPDATE orders 
  SET 
    discount_twd = (
      SELECT COALESCE(SUM(amount_applied_twd), 0)
      FROM coupon_redemptions 
      WHERE order_id = NEW.order_id
    ),
    total_twd = subtotal_twd - (
      SELECT COALESCE(SUM(amount_applied_twd), 0)
      FROM coupon_redemptions 
      WHERE order_id = NEW.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.order_id;
END;

CREATE TRIGGER IF NOT EXISTS tr_coupon_redemptions_recalculate_discount_delete
AFTER DELETE ON coupon_redemptions
BEGIN
  UPDATE orders 
  SET 
    discount_twd = (
      SELECT COALESCE(SUM(amount_applied_twd), 0)
      FROM coupon_redemptions 
      WHERE order_id = OLD.order_id
    ),
    total_twd = subtotal_twd - (
      SELECT COALESCE(SUM(amount_applied_twd), 0)
      FROM coupon_redemptions 
      WHERE order_id = OLD.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = OLD.order_id;
END;

-- 6. 創建 updated_at 安全更新觸發器
CREATE TRIGGER IF NOT EXISTS tr_users_updated_at
AFTER UPDATE ON users
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_products_updated_at
AFTER UPDATE ON products
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE products 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_orders_updated_at
AFTER UPDATE ON orders
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE orders 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_coupons_updated_at
AFTER UPDATE ON coupons
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE coupons 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_coupon_codes_updated_at
AFTER UPDATE ON coupon_codes
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE coupon_codes 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

-- 7. 創建稽核 View
CREATE VIEW IF NOT EXISTS v_order_finance AS
SELECT 
  o.id,
  o.order_number,
  o.subtotal_twd,
  o.discount_twd,
  o.total_twd,
  -- 重新計算的 subtotal
  (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_twd), 0)
   FROM order_items oi 
   WHERE oi.order_id = o.id) AS calculated_subtotal_twd,
  -- 重新計算的 discount
  (SELECT COALESCE(SUM(cr.amount_applied_twd), 0)
   FROM coupon_redemptions cr 
   WHERE cr.order_id = o.id) AS calculated_discount_twd,
  -- 重新計算的 total
  (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_twd), 0)
   FROM order_items oi 
   WHERE oi.order_id = o.id) - 
  (SELECT COALESCE(SUM(cr.amount_applied_twd), 0)
   FROM coupon_redemptions cr 
   WHERE cr.order_id = o.id) AS calculated_total_twd
FROM orders o;

-- 8. 創建異常訂單檢查 View
CREATE VIEW IF NOT EXISTS v_bad_discount AS
SELECT 
  o.id,
  o.order_number,
  o.subtotal_twd,
  o.discount_twd,
  o.total_twd,
  '總額為負數' AS issue
FROM orders o
WHERE o.total_twd < 0

UNION ALL

SELECT 
  o.id,
  o.order_number,
  o.subtotal_twd,
  o.discount_twd,
  o.total_twd,
  '折扣大於小計' AS issue
FROM orders o
WHERE o.discount_twd > o.subtotal_twd;
