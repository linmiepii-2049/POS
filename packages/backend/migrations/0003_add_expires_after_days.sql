-- 添加 expires_after_days 欄位到 coupon_codes 表
ALTER TABLE coupon_codes ADD COLUMN expires_after_days INTEGER;
