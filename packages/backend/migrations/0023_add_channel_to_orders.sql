-- =========================================
-- 新增訂單管道欄位
-- 版本: 2025-11-28
-- 檔案: 0023_add_channel_to_orders.sql
-- =========================================

-- 使用 ALTER TABLE 添加 channel 欄位（SQLite 3.2.0+ 支援）
-- 現有訂單預設為「店消」
ALTER TABLE orders ADD COLUMN channel TEXT NOT NULL DEFAULT '店消' CHECK (channel IN ('店消','網路'));

-- 更新現有訂單的 channel 為「店消」（已經由 DEFAULT 處理，但明確設定以確保一致性）
UPDATE orders SET channel = '店消' WHERE channel IS NULL;

-- 創建索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_orders_channel ON orders(channel);

