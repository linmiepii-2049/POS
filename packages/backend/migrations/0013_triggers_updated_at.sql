-- updated_at 安全更新觸發器

CREATE TRIGGER IF NOT EXISTS tr_users_updated_at
AFTER UPDATE ON users
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE users 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_products_updated_at
AFTER UPDATE ON products
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE products 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_orders_updated_at
AFTER UPDATE ON orders
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE orders 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_coupons_updated_at
AFTER UPDATE ON coupons
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE coupons 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

CREATE TRIGGER IF NOT EXISTS tr_coupon_codes_updated_at
AFTER UPDATE ON coupon_codes
WHEN NEW.updated_at = OLD.updated_at
BEGIN
  UPDATE coupon_codes 
  SET updated_at = datetime('now', '+8 hours')
  WHERE id = NEW.id;
END;

