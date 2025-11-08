-- 優惠券兌換刪除後訂單折扣重算觸發器

CREATE TRIGGER IF NOT EXISTS tr_coupon_redemptions_recalculate_discount_delete
AFTER DELETE ON coupon_redemptions
BEGIN
  UPDATE orders 
  SET 
    discount_twd = (
      SELECT COALESCE(SUM(amount_applied_twd), 0)
      FROM coupon_redemptions 
      WHERE order_id = OLD.order_id
    ),
    total_twd = subtotal_twd - (
      SELECT COALESCE(SUM(amount_applied_twd), 0)
      FROM coupon_redemptions 
      WHERE order_id = OLD.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = OLD.order_id;
END;

