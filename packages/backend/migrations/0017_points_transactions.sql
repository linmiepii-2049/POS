-- =========================================
-- 建立點數交易記錄表
-- 版本: 2025-01-22
-- 檔案: 0017_points_transactions.sql
-- =========================================

-- 點數交易記錄
CREATE TABLE points_transactions (
    id                  INTEGER PRIMARY KEY,
    user_id             INTEGER NOT NULL,
    order_id            INTEGER,
    points_change       INTEGER NOT NULL,
    transaction_type    TEXT NOT NULL CHECK (transaction_type IN ('EARN','REDEEM')),
    balance_after       INTEGER NOT NULL CHECK (balance_after >= 0),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (order_id) REFERENCES orders(id)
);

-- 索引：使用者點數交易查詢
CREATE INDEX idx_points_transactions_user ON points_transactions(user_id, created_at DESC);

-- 索引：訂單相關點數交易查詢
CREATE INDEX idx_points_transactions_order ON points_transactions(order_id);

