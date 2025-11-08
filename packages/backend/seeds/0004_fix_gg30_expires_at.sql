-- =========================================
-- 修正 GG30 代碼的到期日計算
-- 版本: 2025-09-25
-- 檔案: 0004_fix_gg30_expires_at.sql
-- =========================================

-- 更新張小明的 GG30 授權到期日
-- 取得時間: 2025-09-25 01:43:11
-- expires_after_days: 12
-- 計算到期日: 2025-09-25 + 12天 = 2025-10-07
-- 父級優惠券結束時間: 2025-10-10
-- 取較早的日期: 2025-10-07
UPDATE coupon_grants 
SET expires_at = '2025-10-07T23:59:59Z',
    updated_at = datetime('now')
WHERE id = 4 AND coupon_code_id = 7 AND user_id = 2;

-- 更新李小花的 GG30-2 授權到期日
-- 取得時間: 2025-09-25 01:43:11
-- expires_after_days: 12
-- 計算到期日: 2025-09-25 + 12天 = 2025-10-07
-- 父級優惠券結束時間: 2025-10-10
-- 取較早的日期: 2025-10-07
UPDATE coupon_grants 
SET expires_at = '2025-10-07T23:59:59Z',
    updated_at = datetime('now')
WHERE id = 5 AND coupon_code_id = 8 AND user_id = 3;

-- 修正完成
