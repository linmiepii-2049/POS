-- 完整的資料庫種子檔案
-- 包含所有現有的測試資料，方便重新注入

-- 清理現有資料（保留系統表）
DELETE FROM coupon_redemptions;
DELETE FROM coupon_grants;
DELETE FROM coupon_codes;
DELETE FROM coupons;
DELETE FROM order_items;
DELETE FROM orders;
DELETE FROM products;
DELETE FROM users WHERE id > 10; -- 保留非會員用戶

-- 插入用戶資料（保留 guest user ID 10）
INSERT INTO users (id, line_id, name, phone, role, is_active, created_at, updated_at) VALUES
(11, 'U1234567890abcdef', '管理員', '0912345678', 'ADMIN', 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(12, 'U0987654321fedcba', '張小明', '0987654321', 'CLIENT', 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(13, 'U1111111111111111', '李小花', '0911111111', 'CLIENT', 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(14, 'U2222222222222222', '王大華', '0922222222', 'CLIENT', 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(15, 'U3333333333333333', 'ueto aya', '0933333333', 'CLIENT', 1, '2025-09-28T03:15:39.050Z', '2025-09-28T04:11:54.417Z'),
(16, 'U4444444444444444', 'Matthew', '0977777777', 'CLIENT', 1, '2025-09-28T03:16:11.776Z', '2025-09-28T04:07:26.169Z'),
(17, 'U5555555555555555', 'Jazz', '0966666666', 'CLIENT', 1, '2025-09-28T04:29:45.059Z', '2025-09-28T04:40:12.677Z');

-- 插入商品資料
INSERT INTO products (id, sku, category, name, description, img_url, list_price_twd, unit_price_twd, is_active, created_at, updated_at) VALUES
(1, 'PROD001', '法式麵包', '可頌', '進口法國奶油', 'http://localhost:3000/assets/products/1759028917042-ea3npx.webp', 120, 100, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T03:09:17.397Z'),
(2, 'PROD002', '法式麵包', '法棍', '口感鬆軟', 'http://localhost:3000/assets/products/1759028996656-ft3axx.webp', 250, 200, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T03:10:29.792Z'),
(3, 'PROD003', '養生', '堅果麵包', '添加五種堅果', 'http://localhost:3000/assets/products/1759029074331-5mwbfg.webp', 300, 250, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T03:11:56.487Z'),
(4, 'PROD004', '台式麵包', '菠蘿麵包', '表面酥脆', 'http://localhost:3000/assets/products/1759029130293-c9t07m.webp', 180, 150, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T03:13:20.181Z'),
(5, 'PROD005', '台式麵包', '蔥花麵包', '三星現採蔥', 'http://localhost:3000/assets/products/1759029212751-v9rxi5.webp', 80, 60, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T03:13:57.817Z'),
(6, 'PROD006', '台式麵包', '焦燥土司', '表面微焦，香氣四溢', 'http://localhost:3000/assets/products/1759029256863-on4pz3.webp', 200, 170, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T03:15:08.613Z');

-- 插入優惠券資料
INSERT INTO coupons (id, name, discount_type, percent_off_bps, amount_off_twd, min_order_twd, max_uses_total, starts_at, ends_at, is_active, created_at, updated_at, description, max_redemptions) VALUES
(1, '新客戶折扣', 'PERCENT', 1000, NULL, 1000, 100, NULL, NULL, 1, '2025-09-28T02:50:05.180Z', '2025-09-28 07:17:01', NULL, NULL),
(2, '滿額免運', 'FIXED', NULL, 100, 2000, NULL, NULL, NULL, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z', NULL, NULL),
(3, '週年慶特惠', 'PERCENT', 1500, NULL, 3000, 50, NULL, NULL, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z', NULL, NULL),
(4, '歡喜慶開幕', 'PERCENT', 1000, NULL, 300, 1000, '2025-09-28T16:00:00.000Z', '2025-10-04T15:59:59.000Z', 1, '2025-09-28 03:27:29', '2025-09-28 03:27:29', NULL, NULL),
(5, '新口味品嚐優惠', 'FIXED', NULL, 20, 200, 100, '2025-09-27T16:00:00.000Z', '2026-03-11T15:59:59.000Z', 1, '2025-09-28 03:31:21', '2025-09-28 03:39:07', NULL, NULL);

-- 插入優惠券代碼資料
INSERT INTO coupon_codes (id, coupon_id, code, max_redemptions, starts_at, ends_at, is_active, created_at, updated_at, expires_after_days) VALUES
(1, 1, 'WELCOME10', 10, NULL, NULL, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z', NULL),
(2, 2, 'FREE100', 20, NULL, NULL, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z', NULL),
(3, 3, 'ANNIVERSARY15', 5, NULL, NULL, 1, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z', NULL),
(4, 4, 'GG10', 300, '2025-09-29T16:00:00.000Z', '2025-10-01T15:59:59.000Z', 1, '2025-09-28 03:32:24', '2025-09-28 03:32:24', 20),
(5, 5, 'CC20', 100, '2025-09-27T16:00:00.000Z', '2026-03-11T15:59:59.000Z', 1, '2025-09-28 04:27:47', '2025-09-28 04:27:47', NULL);

-- 插入訂單資料
INSERT INTO orders (id, order_number, user_id, subtotal_twd, discount_twd, total_twd, status, created_at, updated_at) VALUES
(1, 'ORD-20250122-001', 12, 1500, 0, 1500, 'confirmed', '2025-09-28T02:50:05.180Z', '2025-09-28 10:50:05'),
(2, 'ORD-20250122-002', 13, 3500, 100, 3400, 'paid', '2025-09-28T02:50:05.180Z', '2025-09-28 10:50:05'),
(3, 'ORD-20250122-003', 14, 1800, 0, 1800, 'confirmed', '2025-09-28T02:50:05.180Z', '2025-09-28 10:50:05'),
(4, 'ORD-1759043408130-WROWY3', 16, 420, 20, 400, 'paid', '2025-09-28 07:10:08', '2025-09-28 15:10:08');

-- 插入訂單項目資料
INSERT INTO order_items (id, order_id, product_id, product_name_snapshot, quantity, unit_price_twd, created_at, updated_at) VALUES
(1, 1, 1, '可頌', 1, 100, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(2, 1, 3, '堅果麵包', 2, 250, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(3, 1, 6, '焦燥土司', 3, 170, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(4, 1, 4, '菠蘿麵包', 2, 150, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(5, 1, 5, '蔥花麵包', 3, 60, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(6, 2, 2, '法棍', 1, 200, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(7, 2, 3, '堅果麵包', 1, 250, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(8, 2, 6, '焦燥土司', 1, 170, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(9, 2, 1, '可頌', 2, 100, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(10, 2, 4, '菠蘿麵包', 3, 150, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(11, 2, 5, '蔥花麵包', 5, 60, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(12, 3, 5, '蔥花麵包', 3, 60, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(13, 4, 3, '堅果麵包', 1, 250, '2025-09-28 07:10:08', '2025-09-28 07:10:08'),
(14, 4, 6, '焦燥土司', 1, 170, '2025-09-28 07:10:08', '2025-09-28 07:10:08');

-- 插入優惠券授權資料
INSERT INTO coupon_grants (id, coupon_code_id, user_id, allowed_uses, used_count, granted_at, expires_at, created_at, updated_at) VALUES
(1, 1, 12, 1, 0, '2025-09-28T02:50:05.180Z', '2025-12-31T23:59:59Z', '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(2, 2, 13, 1, 0, '2025-09-28T02:50:05.180Z', '2025-12-31T23:59:59Z', '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(3, 3, 14, 1, 0, '2025-09-28T02:50:05.180Z', '2025-12-31T23:59:59Z', '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
(4, 4, 16, 1, 0, '2025-09-29T16:00:00.000Z', '2025-10-01T15:59:59.000Z', '2025-09-28 04:07:21', '2025-09-28 04:07:21'),
(5, 4, 15, 1, 0, '2025-09-29T16:00:00.000Z', '2025-10-01T15:59:59.000Z', '2025-09-28 04:11:51', '2025-09-28 04:11:51'),
(6, 5, 16, 1, 0, '2025-09-28T04:28:04.725Z', '2026-03-11T15:59:59.000Z', '2025-09-28 04:28:04', '2025-09-28 04:28:04'),
(7, 5, 17, 1, 0, '2025-09-28T04:29:55.570Z', '2026-03-11T15:59:59.000Z', '2025-09-28 04:29:55', '2025-09-28 04:29:55');

-- 插入優惠券使用記錄（暫時跳過，因為觸發器檢查較複雜）
-- INSERT INTO coupon_redemptions (id, coupon_id, coupon_code_id, user_id, order_id, amount_applied_twd, redeemed_at, created_at, updated_at) VALUES
-- (1, 2, 2, 13, 2, 100, '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z', '2025-09-28T02:50:05.180Z'),
-- (2, 5, 5, 16, 4, 20, '2025-09-28T07:10:08.000Z', '2025-09-28 07:10:08', '2025-09-28 07:10:08');

-- 重置自動遞增序列
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM users) WHERE name = 'users';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM products) WHERE name = 'products';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM coupons) WHERE name = 'coupons';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM coupon_codes) WHERE name = 'coupon_codes';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM orders) WHERE name = 'orders';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM order_items) WHERE name = 'order_items';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM coupon_grants) WHERE name = 'coupon_grants';
UPDATE sqlite_sequence SET seq = (SELECT MAX(id) FROM coupon_redemptions) WHERE name = 'coupon_redemptions';
