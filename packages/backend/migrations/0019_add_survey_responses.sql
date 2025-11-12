-- LIFF 問卷調查資料表
-- Migration: 0019_add_survey_responses
-- 說明: 整合 LIFF 問卷系統到 POS 後端
-- 建立時間: 2025-01-12

-- ================================
-- 建立 survey_responses 表
-- ================================
CREATE TABLE IF NOT EXISTS survey_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    member_id TEXT NOT NULL UNIQUE,  -- 會員ID（手機號碼）
    phone TEXT NOT NULL,             -- 手機號碼
    age TEXT NOT NULL,               -- 年齡範圍
    gender TEXT NOT NULL,            -- 性別
    
    -- 購買習慣
    location TEXT,                   -- 居住地
    purchase_frequency TEXT,         -- 購買頻率
    purchase_location TEXT,          -- 購買地點（JSON 陣列）
    purchase_time TEXT,              -- 購買時間
    meal_type TEXT,                  -- 用餐時機
    
    -- 選購考量
    purchase_factors TEXT,           -- 選購考量（JSON 陣列）
    health_price TEXT,               -- 健康考量
    natural_preference TEXT,         -- 天然食材偏好
    
    -- 口味偏好
    taste_preference TEXT,           -- 口味偏好（JSON 陣列）
    bread_types TEXT,                -- 麵包種類（JSON 陣列）
    bread_types_other TEXT,          -- 其他麵包種類
    favorite_bread TEXT,             -- 最喜歡的麵包
    desired_bread TEXT,              -- 想吃的麵包
    
    -- LINE 資訊
    line_user_id TEXT,               -- LINE 用戶 ID
    display_name TEXT,               -- LINE 顯示名稱
    
    -- 系統欄位
    ip_address TEXT,                 -- IP 位址
    user_agent TEXT,                 -- 瀏覽器資訊
    created_at TEXT NOT NULL DEFAULT (datetime('now')),  -- 建立時間（UTC）
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),  -- 更新時間（UTC）
    
    -- 關聯到 users 表（可選，未來可用於會員整合）
    user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    
    -- 約束條件
    CHECK (age IN ('25歲以下', '26-45歲', '46歲以上')),
    CHECK (gender IN ('男', '女')),
    CHECK (length(phone) = 10 AND phone GLOB '09[0-9][0-9][0-9][0-9][0-9][0-9][0-9][0-9]')
);

-- ================================
-- 建立索引以提升查詢效能
-- ================================
CREATE INDEX IF NOT EXISTS idx_survey_member_id ON survey_responses(member_id);
CREATE INDEX IF NOT EXISTS idx_survey_phone ON survey_responses(phone);
CREATE INDEX IF NOT EXISTS idx_survey_created_at ON survey_responses(created_at);
CREATE INDEX IF NOT EXISTS idx_survey_line_user_id ON survey_responses(line_user_id);
CREATE INDEX IF NOT EXISTS idx_survey_user_id ON survey_responses(user_id);

-- ================================
-- 建立更新時間觸發器
-- ================================
CREATE TRIGGER IF NOT EXISTS survey_responses_updated_at
AFTER UPDATE ON survey_responses
FOR EACH ROW
BEGIN
  UPDATE survey_responses SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- ================================
-- 註解說明
-- ================================
-- 此表用於儲存來自 LIFF 問卷調查的資料
-- member_id 使用手機號碼作為唯一識別碼
-- 所有時間欄位使用 UTC 時區
-- JSON 欄位使用 TEXT 型別儲存
-- 支援與 users 表關聯（透過 user_id）

