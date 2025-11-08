-- =========================================
-- 金額單位轉換：從分轉換為元
-- 版本: 2025-01-22
-- 檔案: 0003_convert_money_to_yuan.sql
-- =========================================

-- 轉換產品價格：從分轉換為元（四捨五入）
UPDATE products 
SET 
  list_price_twd = ROUND(list_price_twd / 100.0),
  unit_price_twd = ROUND(unit_price_twd / 100.0)
WHERE list_price_twd > 0 OR unit_price_twd > 0;

-- 轉換優惠券金額：從分轉換為元（四捨五入）
UPDATE coupons 
SET 
  amount_off_twd = ROUND(amount_off_twd / 100.0),
  min_order_twd = ROUND(min_order_twd / 100.0)
WHERE amount_off_twd > 0 OR min_order_twd > 0;

-- 轉換訂單金額：從分轉換為元（四捨五入）
UPDATE orders 
SET 
  subtotal_twd = ROUND(subtotal_twd / 100.0),
  discount_twd = ROUND(discount_twd / 100.0),
  total_twd = ROUND(total_twd / 100.0)
WHERE subtotal_twd > 0 OR discount_twd > 0 OR total_twd > 0;

-- 轉換訂單項目金額：從分轉換為元（四捨五入）
UPDATE order_items 
SET 
  unit_price_twd = ROUND(unit_price_twd / 100.0)
WHERE unit_price_twd > 0;

-- 轉換優惠券兌換紀錄金額：從分轉換為元（四捨五入）
UPDATE coupon_redemptions 
SET 
  amount_applied_twd = ROUND(amount_applied_twd / 100.0)
WHERE amount_applied_twd > 0;

-- 轉換成本金額：從分轉換為元（四捨五入）
UPDATE cost 
SET 
  cost_twd = ROUND(cost_twd / 100.0)
WHERE cost_twd > 0;
