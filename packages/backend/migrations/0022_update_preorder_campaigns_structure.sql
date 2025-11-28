-- =========================================
-- 更新預購檔期表結構
-- 移除舊欄位，改為使用多商品關聯表
-- =========================================

PRAGMA foreign_keys = ON;

-- 由於表是空的，我們可以安全地重建表結構
-- 1. 備份舊表（如果需要的話）
-- 2. 刪除舊表
-- 3. 建立新表結構

-- 刪除舊表（表是空的，可以安全刪除）
DROP TABLE IF EXISTS preorder_campaigns_backup;

-- 建立新表結構（只包含需要的欄位）
CREATE TABLE preorder_campaigns_new (
    id                  INTEGER PRIMARY KEY,
    campaign_name       TEXT NOT NULL,
    campaign_copy       TEXT NOT NULL,
    starts_at           TEXT NOT NULL,
    ends_at             TEXT NOT NULL,
    is_active           INTEGER NOT NULL DEFAULT 0 CHECK (is_active IN (0,1)),
    created_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    updated_at          TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
    CHECK (starts_at < ends_at)
);

-- 複製資料（如果有）
INSERT INTO preorder_campaigns_new (id, campaign_name, campaign_copy, starts_at, ends_at, is_active, created_at, updated_at)
SELECT 
    id,
    COALESCE(campaign_name, '') as campaign_name,
    campaign_copy,
    starts_at,
    ends_at,
    is_active,
    created_at,
    updated_at
FROM preorder_campaigns;

-- 刪除舊表
DROP TABLE preorder_campaigns;

-- 重新命名新表
ALTER TABLE preorder_campaigns_new RENAME TO preorder_campaigns;

-- 重新建立索引
CREATE INDEX IF NOT EXISTS idx_preorder_campaigns_period ON preorder_campaigns(starts_at, ends_at);
CREATE UNIQUE INDEX IF NOT EXISTS idx_preorder_campaigns_active ON preorder_campaigns(is_active) WHERE is_active = 1;
