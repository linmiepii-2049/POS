-- =========================================
-- 預購檔期管理
-- 建立：preorder_campaigns
-- =========================================

PRAGMA foreign_keys = ON;

CREATE TABLE preorder_campaigns (
    id                  INTEGER PRIMARY KEY,
    product_id          INTEGER NOT NULL,
    campaign_copy       TEXT NOT NULL,
    reserved_quantity   INTEGER NOT NULL DEFAULT 0 CHECK (reserved_quantity >= 0),
    note                TEXT,
    pickup_time_slots   TEXT,
    max_quantity        INTEGER NOT NULL CHECK (max_quantity > 0),
    starts_at           TEXT NOT NULL,
    ends_at             TEXT NOT NULL,
    is_active           INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (product_id) REFERENCES products(id),
    CHECK (starts_at < ends_at),
    CHECK (reserved_quantity <= max_quantity)
);

CREATE INDEX idx_preorder_campaigns_period ON preorder_campaigns(starts_at, ends_at);
CREATE UNIQUE INDEX idx_preorder_campaigns_active ON preorder_campaigns(is_active) WHERE is_active = 1;

CREATE TABLE preorder_orders (
    id                  INTEGER PRIMARY KEY,
    campaign_id         INTEGER NOT NULL,
    order_id            INTEGER NOT NULL,
    customer_name       TEXT NOT NULL,
    customer_phone      TEXT NOT NULL CHECK (customer_phone GLOB '09********'),
    pickup_slot         TEXT NOT NULL,
    customer_note       TEXT,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (campaign_id) REFERENCES preorder_campaigns(id),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    UNIQUE (order_id),
    CHECK (pickup_slot <> '')
);

CREATE INDEX idx_preorder_orders_campaign ON preorder_orders(campaign_id);

