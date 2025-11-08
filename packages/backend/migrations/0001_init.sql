-- =========================================
-- POS 系統簡化版 Schema
-- 版本: 2025-01-22
-- 檔案: 0001_init_simple.sql
-- =========================================

-- 啟用外鍵約束
PRAGMA foreign_keys = ON;

-- 使用者
CREATE TABLE users (
    id              INTEGER PRIMARY KEY,
    line_id         TEXT UNIQUE,
    name            TEXT NOT NULL,
    phone           TEXT UNIQUE CHECK (phone IS NULL OR phone GLOB '09********'),
    role            TEXT NOT NULL CHECK (role IN ('CLIENT','ADMIN')),
    is_active       INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 商品
CREATE TABLE products (
    id                  INTEGER PRIMARY KEY,
    sku                 TEXT NOT NULL UNIQUE,
    category            TEXT,
    name                TEXT NOT NULL,
    description         TEXT,
    img_url             TEXT,
    list_price_twd      INTEGER NOT NULL CHECK (list_price_twd >= 0),
    unit_price_twd      INTEGER NOT NULL CHECK (unit_price_twd >= 0),
    is_active           INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 訂單
CREATE TABLE orders (
    id                  INTEGER PRIMARY KEY,
    order_number        TEXT NOT NULL UNIQUE,
    user_id             INTEGER NOT NULL,
    subtotal_twd        INTEGER NOT NULL DEFAULT 0 CHECK (subtotal_twd >= 0),
    discount_twd        INTEGER NOT NULL DEFAULT 0 CHECK (discount_twd >= 0),
    total_twd           INTEGER NOT NULL DEFAULT 0 CHECK (total_twd >= 0),
    status              TEXT NOT NULL DEFAULT 'confirmed'
                        CHECK (status IN ('created','confirmed','paid','cancelled','refunded')),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 訂單項目
CREATE TABLE order_items (
    id                  INTEGER PRIMARY KEY,
    order_id            INTEGER NOT NULL,
    product_id          INTEGER NOT NULL,
    product_name_snapshot TEXT,
    quantity            INTEGER NOT NULL CHECK (quantity > 0),
    unit_price_twd      INTEGER NOT NULL CHECK (unit_price_twd >= 0),
    total_twd           INTEGER GENERATED ALWAYS AS (quantity * unit_price_twd) STORED,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- 優惠券
CREATE TABLE coupons (
    id                      INTEGER PRIMARY KEY,
    name                    TEXT,
    discount_type           TEXT NOT NULL CHECK (discount_type IN ('PERCENT','FIXED')),
    percent_off_bps         INTEGER CHECK (percent_off_bps BETWEEN 0 AND 10000),
    amount_off_twd          INTEGER CHECK (amount_off_twd >= 0),
    min_order_twd           INTEGER NOT NULL DEFAULT 0 CHECK (min_order_twd >= 0),
    max_uses_total          INTEGER,
    starts_at               TEXT,
    ends_at                 TEXT,
    is_active               INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (
        (discount_type='PERCENT' AND percent_off_bps IS NOT NULL AND amount_off_twd IS NULL) OR
        (discount_type='FIXED'    AND amount_off_twd  IS NOT NULL AND percent_off_bps IS NULL)
    )
);

-- 優惠券代碼
CREATE TABLE coupon_codes (
    id                  INTEGER PRIMARY KEY,
    coupon_id           INTEGER NOT NULL,
    code                TEXT NOT NULL UNIQUE,
    max_redemptions     INTEGER,
    starts_at           TEXT,
    ends_at             TEXT,
    is_active           INTEGER NOT NULL DEFAULT 1 CHECK (is_active IN (0,1)),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id)
);

-- 優惠券授權
CREATE TABLE coupon_grants (
    id                  INTEGER PRIMARY KEY,
    coupon_code_id      INTEGER NOT NULL,
    user_id             INTEGER NOT NULL,
    allowed_uses        INTEGER NOT NULL DEFAULT 1 CHECK (allowed_uses >= 0),
    used_count          INTEGER NOT NULL DEFAULT 0 CHECK (used_count >= 0),
    granted_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    expires_at          TEXT,
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    UNIQUE (coupon_code_id, user_id),
    FOREIGN KEY (coupon_code_id) REFERENCES coupon_codes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 優惠券兌換紀錄
CREATE TABLE coupon_redemptions (
    id                      INTEGER PRIMARY KEY,
    order_id                INTEGER NOT NULL,
    coupon_id               INTEGER NOT NULL,
    coupon_code_id          INTEGER NOT NULL,
    user_id                 INTEGER NOT NULL,
    redeemed_at             TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    amount_applied_twd      INTEGER NOT NULL DEFAULT 0 CHECK (amount_applied_twd >= 0),
    created_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at              TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    FOREIGN KEY (order_id) REFERENCES orders(id),
    FOREIGN KEY (coupon_id) REFERENCES coupons(id),
    FOREIGN KEY (coupon_code_id) REFERENCES coupon_codes(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- 成本
CREATE TABLE cost (
    id              INTEGER PRIMARY KEY,
    category        TEXT NOT NULL CHECK (category IN ('tool_device','material','fixed_expenses')),
    name            TEXT NOT NULL,
    unit            TEXT,
    quantity        INTEGER,
    cost_twd        INTEGER NOT NULL CHECK (cost_twd >= 0),
    created_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at      TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- 索引
CREATE UNIQUE INDEX ux_order_items_order_product ON order_items(order_id, product_id);
CREATE INDEX idx_users_line_id ON users(line_id);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_order_items_order ON order_items(order_id);
CREATE INDEX idx_order_items_prod ON order_items(product_id);
CREATE INDEX idx_coupon_codes_coupon ON coupon_codes(coupon_id);
CREATE INDEX idx_coupon_grants_user_code ON coupon_grants(user_id, coupon_code_id);
CREATE INDEX idx_coupon_redemptions_order ON coupon_redemptions(order_id);
CREATE INDEX idx_coupon_redemptions_user ON coupon_redemptions(user_id);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_cr_redeemed_at ON coupon_redemptions(redeemed_at);
