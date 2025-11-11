-- =========================================
-- 新增使用者點數欄位
-- 版本: 2025-01-22
-- 檔案: 0016_add_user_points.sql
-- =========================================

-- 新增點數欄位到使用者表
ALTER TABLE users ADD COLUMN points INTEGER NOT NULL DEFAULT 0 CHECK (points >= 0);

-- 更新現有使用者的點數為 0（已經由 DEFAULT 處理）
-- 此行確保資料一致性
UPDATE users SET points = 0 WHERE points IS NULL;

