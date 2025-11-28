-- =========================================
-- 修復 transaction_id 類型（改為 TEXT）
-- 版本: 2025-11-28
-- 檔案: 0025_fix_transaction_id_type.sql
-- =========================================

PRAGMA foreign_keys = ON;

-- 由於 SQLite 不支援直接修改欄位類型，需要重建表
-- 步驟 1: 創建新表
CREATE TABLE IF NOT EXISTS preorder_payments_new (
    id                  INTEGER PRIMARY KEY,
    transaction_id     TEXT NOT NULL UNIQUE,
    order_id            TEXT NOT NULL UNIQUE,
    campaign_id         INTEGER NOT NULL,
    items_json          TEXT NOT NULL,
    total_amount        INTEGER NOT NULL CHECK (total_amount > 0),
    pickup_date         TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'failed')),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (campaign_id) REFERENCES preorder_campaigns(id)
);

-- 步驟 2: 遷移數據（將 transaction_id 轉換為字符串）
INSERT INTO preorder_payments_new (
    id, transaction_id, order_id, campaign_id, items_json, total_amount, 
    pickup_date, status, created_at, updated_at
)
SELECT 
    id, 
    CAST(transaction_id AS TEXT) AS transaction_id,
    order_id, 
    campaign_id, 
    items_json, 
    total_amount, 
    pickup_date, 
    status, 
    created_at, 
    updated_at
FROM preorder_payments;

-- 步驟 3: 刪除舊表
DROP TABLE IF EXISTS preorder_payments;

-- 步驟 4: 重命名新表
ALTER TABLE preorder_payments_new RENAME TO preorder_payments;

-- 步驟 5: 重建索引
CREATE INDEX IF NOT EXISTS idx_preorder_payments_transaction_id ON preorder_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_preorder_payments_order_id ON preorder_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_preorder_payments_status ON preorder_payments(status);

