-- 異常訂單檢查 View

CREATE VIEW IF NOT EXISTS v_bad_discount AS
SELECT 
  o.id,
  o.order_number,
  o.subtotal_twd,
  o.discount_twd,
  o.total_twd,
  '總額為負數' AS issue
FROM orders o
WHERE o.total_twd < 0

UNION ALL

SELECT 
  o.id,
  o.order_number,
  o.subtotal_twd,
  o.discount_twd,
  o.total_twd,
  '折扣大於小計' AS issue
FROM orders o
WHERE o.discount_twd > o.subtotal_twd;

