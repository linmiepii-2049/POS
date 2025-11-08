-- 訂單金額重算觸發器（UPDATE）

CREATE TRIGGER IF NOT EXISTS tr_order_items_recalculate_amounts_update
AFTER UPDATE ON order_items
BEGIN
  UPDATE orders 
  SET 
    subtotal_twd = (
      SELECT COALESCE(SUM(quantity * unit_price_twd), 0)
      FROM order_items 
      WHERE order_id = NEW.order_id
    ),
    updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.order_id;
END;

