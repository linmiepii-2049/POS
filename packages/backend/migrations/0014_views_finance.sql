-- 稽核 View

CREATE VIEW IF NOT EXISTS v_order_finance AS
SELECT 
  o.id,
  o.order_number,
  o.subtotal_twd,
  o.discount_twd,
  o.total_twd,
  -- 重新計算的 subtotal
  (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_twd), 0)
   FROM order_items oi 
   WHERE oi.order_id = o.id) AS calculated_subtotal_twd,
  -- 重新計算的 discount
  (SELECT COALESCE(SUM(cr.amount_applied_twd), 0)
   FROM coupon_redemptions cr 
   WHERE cr.order_id = o.id) AS calculated_discount_twd,
  -- 重新計算的 total
  (SELECT COALESCE(SUM(oi.quantity * oi.unit_price_twd), 0)
   FROM order_items oi 
   WHERE oi.order_id = o.id) - 
  (SELECT COALESCE(SUM(cr.amount_applied_twd), 0)
   FROM coupon_redemptions cr 
   WHERE cr.order_id = o.id) AS calculated_total_twd
FROM orders o;

