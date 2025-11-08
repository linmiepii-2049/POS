-- =========================================
-- 模擬今天取得 GG30 代碼的授權記錄
-- 版本: 2025-09-25
-- 檔案: 0003_simulate_today_grants.sql
-- =========================================

-- 更新張小明的 GG30 授權時間為今天
UPDATE coupon_grants 
SET granted_at = datetime('now'), 
    updated_at = datetime('now')
WHERE id = 4 AND coupon_code_id = 7 AND user_id = 2;

-- 更新李小花的 GG30-2 授權時間為今天
UPDATE coupon_grants 
SET granted_at = datetime('now'), 
    updated_at = datetime('now')
WHERE id = 5 AND coupon_code_id = 8 AND user_id = 3;

-- 模擬完成
