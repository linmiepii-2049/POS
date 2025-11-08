-- 修改 orders 表的 user_id 欄位，允許 NULL 值（支援非會員訂單）
-- 由於 SQLite 的限制，我們需要重新創建表

-- 1. 禁用外鍵約束
PRAGMA foreign_keys = OFF;

-- 2. 創建新的 orders 表結構
CREATE TABLE orders_new (
    id                  INTEGER PRIMARY KEY,
    order_number        TEXT NOT NULL UNIQUE,
    user_id             INTEGER,  -- 改為允許 NULL
    subtotal_twd        INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_twd >= 0),
    discount_twd        INTEGER NOT NULL DEFAULT 0 CHECK (discount_twd >= 0),
    total_twd           INTEGER NOT NULL DEFAULT 0 CHECK (total_twd >= 0),
    status              TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('created','confirmed','paid','cancelled','refunded')),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 3. 複製現有數據到新表
INSERT INTO orders_new SELECT * FROM orders;

-- 4. 刪除舊表
DROP TABLE orders;

-- 5. 重新命名新表
ALTER TABLE orders_new RENAME TO orders;

-- 6. 重新創建索引
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_created_at ON orders(created_at);

-- 7. 重新啟用外鍵約束
PRAGMA foreign_keys = ON;