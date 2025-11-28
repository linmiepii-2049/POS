-- =========================================
-- 修復預購訂單表結構，支援多商品訂單
-- 版本: 2025-11-28
-- 檔案: 0026_fix_preorder_orders_multi_product.sql
-- =========================================

PRAGMA foreign_keys = ON;

-- 1. 創建新的 preorder_orders 表（包含 product_id）
CREATE TABLE preorder_orders_new (
    id                  INTEGER PRIMARY KEY,
    campaign_id         INTEGER NOT NULL,
    order_id            INTEGER NOT NULL,
    product_id          INTEGER NOT NULL, -- 新增：商品 ID
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT NOT NULL CHECK (customer_phone GLOB '09********'),
    pickup_slot         TEXT NOT NULL,
    customer_note       TEXT,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (campaign_id) REFERENCES preorder_campaigns(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (order_id, product_id), -- 修改：一個訂單可以有多個商品，但同一商品不能重複
    CHECK (pickup_slot <> '')
);

-- 2. 遷移現有數據（如果有的話）
-- 注意：舊表沒有 product_id，我們需要從 order_items 中獲取
INSERT INTO preorder_orders_new (
    id,
    campaign_id,
    order_id,
    product_id,
    customer_name,
    customer_phone,
    pickup_slot,
    customer_note,
    quantity,
    created_at,
    updated_at
)
SELECT 
    po.id,
    po.campaign_id,
    po.order_id,
    COALESCE(oi.product_id, 0) as product_id, -- 從 order_items 獲取，如果沒有則設為 0（需要手動修正）
    po.customer_name,
    po.customer_phone,
    po.pickup_slot,
    po.customer_note,
    po.quantity,
    po.created_at,
    po.updated_at
FROM preorder_orders po
LEFT JOIN order_items oi ON po.order_id = oi.order_id
WHERE oi.id = (
    SELECT id FROM order_items 
    WHERE order_id = po.order_id 
    ORDER BY id 
    LIMIT 1
);

-- 3. 刪除舊表
DROP TABLE preorder_orders;

-- 4. 重命名新表
ALTER TABLE preorder_orders_new RENAME TO preorder_orders;

-- 5. 重建索引
CREATE INDEX IF NOT EXISTS idx_preorder_orders_campaign ON preorder_orders(campaign_id);
CREATE INDEX IF NOT EXISTS idx_preorder_orders_order ON preorder_orders(order_id);
CREATE INDEX IF NOT EXISTS idx_preorder_orders_product ON preorder_orders(product_id);

