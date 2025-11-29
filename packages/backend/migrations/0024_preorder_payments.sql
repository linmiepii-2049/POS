-- =========================================
-- 預購支付交易記錄表
-- 版本: 2025-11-28
-- 檔案: 0024_preorder_payments.sql
-- =========================================

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS preorder_payments (
    id                  INTEGER PRIMARY KEY,
    transaction_id     INTEGER NOT NULL UNIQUE,
    order_id            TEXT NOT NULL UNIQUE,
    campaign_id         INTEGER NOT NULL,
    items_json          TEXT NOT NULL, -- JSON 格式的商品列表
    total_amount        INTEGER NOT NULL CHECK (total_amount > 0),
    pickup_date         TEXT NOT NULL,
    status              TEXT NOT NULL DEFAULT 'pending'
                        CHECK (status IN ('pending', 'confirmed', 'cancelled', 'failed')),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (campaign_id) REFERENCES preorder_campaigns(id)
);

CREATE INDEX IF NOT EXISTS idx_preorder_payments_transaction_id ON preorder_payments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_preorder_payments_order_id ON preorder_payments(order_id);
CREATE INDEX IF NOT EXISTS idx_preorder_payments_status ON preorder_payments(status);


