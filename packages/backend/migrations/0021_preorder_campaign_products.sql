-- =========================================
-- 預購檔期商品多對多關係
-- 建立：preorder_campaign_products
-- 修改：preorder_campaigns 增加 campaign_name
-- =========================================

PRAGMA foreign_keys = ON;

-- 新增預購名稱欄位
ALTER TABLE preorder_campaigns ADD COLUMN campaign_name TEXT;

-- 建立預購檔期商品關聯表
CREATE TABLE preorder_campaign_products (
    id                  INTEGER PRIMARY KEY,
    campaign_id         INTEGER NOT NULL,
    product_id          INTEGER NOT NULL,
    supply_quantity     INTEGER NOT NULL CHECK (supply_quantity > 0),
    reserved_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (campaign_id) REFERENCES preorder_campaigns(id) ON DELETE CASCADE,
    FOREIGN KEY (product_id) REFERENCES products(id),
    UNIQUE (campaign_id, product_id),
    CHECK (reserved_quantity <= supply_quantity)
);

CREATE INDEX idx_preorder_campaign_products_campaign ON preorder_campaign_products(campaign_id);
CREATE INDEX idx_preorder_campaign_products_product ON preorder_campaign_products(product_id);


