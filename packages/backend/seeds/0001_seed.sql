-- =========================================
-- POS 系統測試資料
-- 版本: 2025-01-22
-- 檔案: 0001_seed.sql
-- =========================================

-- 測試資料匯入

-- 使用者資料
INSERT INTO users (line_id, name, phone, role, is_active) VALUES
('U1234567890abcdef', '管理員', '0912345678', 'ADMIN', 1),
('U0987654321fedcba', '張小明', '0987654321', 'CLIENT', 1),
('U1111111111111111', '李小花', '0911111111', 'CLIENT', 1),
('U2222222222222222', '王大華', '0922222222', 'CLIENT', 1);

-- 商品資料
INSERT INTO products (sku, category, name, description, img_url, list_price_twd, unit_price_twd, is_active) VALUES
('PROD001', '工具', '專業螺絲起子組', '10件式精密螺絲起子組，適用於各種電子設備維修', 'https://example.com/screwdriver.jpg', 1200, 1000, 1),
('PROD002', '工具', '數位電錶', '自動量程數位電錶，具備電壓、電流、電阻測量功能', 'https://example.com/multimeter.jpg', 2500, 2000, 1),
('PROD003', '材料', '電子零件包', '常用電阻、電容、二極體組合包', 'https://example.com/components.jpg', 300, 250, 1),
('PROD004', '工具', '焊接工具組', '專業焊接工具，包含烙鐵、焊錫、助焊劑', 'https://example.com/solder.jpg', 1800, 1500, 1),
('PROD005', '材料', '連接線材', '各種規格連接線材組合包', 'https://example.com/cables.jpg', 800, 600, 1),
('PROD006', '工具', '防靜電工作台墊', '防靜電工作台墊，保護電子元件', 'https://example.com/esd-mat.jpg', 500, 400, 0); -- 停用商品

-- 訂單資料 (使用實際的 user_id)
INSERT INTO orders (order_number, user_id, status) VALUES
('ORD-20250122-001', (SELECT id FROM users WHERE line_id = 'U0987654321fedcba'), 'confirmed'),
('ORD-20250122-002', (SELECT id FROM users WHERE line_id = 'U1111111111111111'), 'paid'),
('ORD-20250122-003', (SELECT id FROM users WHERE line_id = 'U2222222222222222'), 'confirmed');

-- 訂單項目 (使用實際的 product_id)
INSERT INTO order_items (order_id, product_id, product_name_snapshot, quantity, unit_price_twd) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-20250122-001'), (SELECT id FROM products WHERE sku = 'PROD001'), '專業螺絲起子組', 1, 1000),
((SELECT id FROM orders WHERE order_number = 'ORD-20250122-001'), (SELECT id FROM products WHERE sku = 'PROD003'), '電子零件包', 2, 250),
((SELECT id FROM orders WHERE order_number = 'ORD-20250122-002'), (SELECT id FROM products WHERE sku = 'PROD002'), '數位電錶', 1, 2000),
((SELECT id FROM orders WHERE order_number = 'ORD-20250122-002'), (SELECT id FROM products WHERE sku = 'PROD004'), '焊接工具組', 1, 1500),
((SELECT id FROM orders WHERE order_number = 'ORD-20250122-003'), (SELECT id FROM products WHERE sku = 'PROD005'), '連接線材', 3, 600);

-- 優惠券
INSERT INTO coupons (name, discount_type, percent_off_bps, amount_off_twd, min_order_twd, max_uses_total, is_active) VALUES
('新客戶折扣', 'PERCENT', 1000, NULL, 1000, 100, 1), -- 10% 折扣
('滿額免運', 'FIXED', NULL, 100, 2000, NULL, 1),     -- 固定減免 100 元
('週年慶特惠', 'PERCENT', 1500, NULL, 3000, 50, 1); -- 15% 折扣

-- 優惠券代碼 (使用實際的 coupon_id)
INSERT INTO coupon_codes (coupon_id, code, max_redemptions, is_active) VALUES
((SELECT id FROM coupons WHERE name = '新客戶折扣'), 'WELCOME10', 10, 1),
((SELECT id FROM coupons WHERE name = '滿額免運'), 'FREE100', 20, 1),
((SELECT id FROM coupons WHERE name = '週年慶特惠'), 'ANNIVERSARY15', 5, 1);

-- 優惠券授權 (使用實際的 ID)
INSERT INTO coupon_grants (coupon_code_id, user_id, allowed_uses, used_count, expires_at) VALUES
((SELECT id FROM coupon_codes WHERE code = 'WELCOME10'), (SELECT id FROM users WHERE line_id = 'U0987654321fedcba'), 1, 0, '2025-12-31T23:59:59Z'), -- 張小明可使用新客戶折扣
((SELECT id FROM coupon_codes WHERE code = 'FREE100'), (SELECT id FROM users WHERE line_id = 'U1111111111111111'), 1, 0, '2025-12-31T23:59:59Z'), -- 李小花可使用滿額免運
((SELECT id FROM coupon_codes WHERE code = 'ANNIVERSARY15'), (SELECT id FROM users WHERE line_id = 'U2222222222222222'), 1, 0, '2025-12-31T23:59:59Z'); -- 王大華可使用週年慶特惠

-- 優惠券兌換（部分訂單使用優惠券）
INSERT INTO coupon_redemptions (order_id, coupon_id, coupon_code_id, user_id, amount_applied_twd) VALUES
((SELECT id FROM orders WHERE order_number = 'ORD-20250122-002'), (SELECT id FROM coupons WHERE name = '滿額免運'), (SELECT id FROM coupon_codes WHERE code = 'FREE100'), (SELECT id FROM users WHERE line_id = 'U1111111111111111'), 100); -- 李小花的訂單使用滿額免運

-- 成本資料
INSERT INTO cost (category, name, unit, quantity, cost_twd) VALUES
('tool_device', '螺絲起子組', '組', 50, 800),
('tool_device', '數位電錶', '台', 20, 1800),
('material', '電子零件', '包', 100, 200),
('tool_device', '焊接工具', '組', 30, 1200),
('material', '連接線材', '包', 80, 400),
('fixed_expenses', '店面租金', '月', 1, 50000),
('fixed_expenses', '水電費', '月', 1, 8000);

-- 資料匯入完成
