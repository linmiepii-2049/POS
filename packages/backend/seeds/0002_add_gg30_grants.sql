-- =========================================
-- 為 GG30 代碼添加授權記錄
-- 版本: 2025-09-25
-- 檔案: 0002_add_gg30_grants.sql
-- =========================================

-- 為張小明分配 GG30 代碼授權
INSERT INTO coupon_grants (coupon_code_id, user_id, allowed_uses, used_count, expires_at) VALUES
(7, 2, 1, 0, '2025-12-31T23:59:59Z'); -- 張小明可使用 GG30

-- 為李小花分配 GG30-2 代碼授權
INSERT INTO coupon_grants (coupon_code_id, user_id, allowed_uses, used_count, expires_at) VALUES
(8, 3, 1, 0, '2025-12-31T23:59:59Z'); -- 李小花可使用 GG30-2

-- 授權記錄添加完成
