-- 修復時區一致性問題
-- 將所有 UTC 時間轉換為台北時間格式

-- 更新 users 表的時間欄位
UPDATE users 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';

-- 更新 products 表的時間欄位
UPDATE products 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';

-- 更新 coupons 表的時間欄位
UPDATE coupons 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';

-- 更新 coupon_codes 表的時間欄位
UPDATE coupon_codes 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';

-- 更新 orders 表的時間欄位
UPDATE orders 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';

-- 更新 order_items 表的時間欄位
UPDATE order_items 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';

-- 更新 coupon_grants 表的時間欄位
UPDATE coupon_grants 
SET created_at = datetime(created_at, '+8 hours'),
    updated_at = datetime(updated_at, '+8 hours')
WHERE created_at LIKE '%Z' OR updated_at LIKE '%Z';
