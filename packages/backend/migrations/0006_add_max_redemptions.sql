-- 添加 max_redemptions 欄位到 coupons 表
-- 用於控制所有代碼的總量限制

ALTER TABLE coupons ADD COLUMN max_redemptions INTEGER CHECK (max_redemptions > 0);

