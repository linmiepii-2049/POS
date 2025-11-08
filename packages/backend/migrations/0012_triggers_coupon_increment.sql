-- 優惠券使用次數自增觸發器

CREATE TRIGGER IF NOT EXISTS cr_after_insert_increment
AFTER INSERT ON coupon_redemptions
BEGIN
  UPDATE coupon_grants 
  SET 
    used_count = used_count + 1,
    updated_at = datetime('now', '+8 hours')
  WHERE coupon_code_id = NEW.coupon_code_id 
    AND user_id = NEW.user_id;
END;

