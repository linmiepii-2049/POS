-- =========================================
-- 新增訂單點數折扣欄位
-- 版本: 2025-01-22
-- 檔案: 0018_add_points_discount_to_orders.sql
-- =========================================

-- 新增點數折扣欄位到訂單表
ALTER TABLE orders ADD COLUMN points_discount_twd INTEGER NOT NULL DEFAULT 0 CHECK (points_discount_twd >= 0);

-- 更新現有訂單的點數折扣為 0（已經由 DEFAULT 處理）
UPDATE orders SET points_discount_twd = 0 WHERE points_discount_twd IS NULL;

