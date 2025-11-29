-- =========================================
-- 為預購支付表添加用戶和點數折抵欄位
-- 版本: 2025-11-28
-- 檔案: 0027_add_user_points_to_preorder_payments.sql
-- =========================================

PRAGMA foreign_keys = ON;

-- 添加 user_id 和 points_to_redeem 欄位
ALTER TABLE preorder_payments ADD COLUMN user_id INTEGER;
ALTER TABLE preorder_payments ADD COLUMN points_to_redeem INTEGER DEFAULT 0 CHECK (points_to_redeem >= 0);

-- 添加外鍵約束（如果 user_id 存在，必須是有效的用戶）
-- 注意：SQLite 不支持 ALTER TABLE ADD FOREIGN KEY，所以這裡只添加索引
CREATE INDEX IF NOT EXISTS idx_preorder_payments_user_id ON preorder_payments(user_id);


