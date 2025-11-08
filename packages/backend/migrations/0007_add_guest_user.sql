-- =========================================
-- 新增預設的非會員使用者
-- 版本: 2025-01-22
-- 檔案: 0007_add_guest_user.sql
-- =========================================

-- 新增預設的非會員使用者 (id=10)
INSERT INTO users (id, line_id, name, phone, role, is_active) VALUES
(10, 'GUEST_USER', '非會員', NULL, 'CLIENT', 1);
