# 資料庫種子資料系統

## 概述

本系統提供完整的資料庫種子資料注入功能，讓您可以快速重建包含測試資料的資料庫環境。

## 檔案結構

```
seeds/
├── 0001_seed.sql                    # 基本種子資料
├── 0002_add_gg30_grants.sql         # GG30 優惠券授權
├── 0003_simulate_today_grants.sql   # 模擬今日授權
├── 0004_fix_gg30_expires_at.sql     # 修復 GG30 過期時間
└── 0005_complete_data_seed.sql      # 完整測試資料種子

scripts/
└── seed-data.sh                     # 種子資料注入腳本
```

## 使用方法

### 1. 重置資料庫並注入完整種子資料

```bash
# 重置資料庫（清除所有資料）
pnpm run d1:reset

# 注入完整種子資料
pnpm run d1:seed:full

# 或使用腳本（包含詳細輸出）
pnpm run d1:seed:script
```

### 2. 只注入基本種子資料

```bash
pnpm run d1:seed
```

### 3. 手動執行 SQL 檔案

```bash
# 執行特定種子檔案
pnpm wrangler d1 execute --local pos-local --file seeds/0005_complete_data_seed.sql
```

## 種子資料內容

### 0005_complete_data_seed.sql

包含完整的測試資料：

- **用戶資料 (8 筆)**：
  - 非會員用戶 (ID: 10)
  - 管理員 (ID: 11)
  - 一般客戶 (ID: 12-17)

- **商品資料 (6 筆)**：
  - 法式麵包：可頌、法棍
  - 養生：堅果麵包
  - 台式麵包：菠蘿麵包、蔥花麵包、焦燥土司

- **優惠券系統 (5 筆優惠券 + 5 筆代碼 + 7 筆授權)**：
  - 新客戶折扣 (WELCOME10)
  - 滿額免運 (FREE100)
  - 週年慶特惠 (ANNIVERSARY15)
  - 歡喜慶開幕 (GG10)
  - 新口味品嚐優惠 (CC20)

- **訂單資料 (4 筆訂單 + 14 筆訂單項目)**：
  - 包含不同狀態的訂單
  - 完整的訂單項目資料
  - 自動計算的總金額

## 資料特點

### 1. 資料完整性
- 所有外鍵關聯正確
- 符合資料庫約束條件
- 包含必要的索引和觸發器

### 2. 業務邏輯
- 訂單金額自動計算
- 優惠券授權和使用記錄
- 用戶角色和權限設定

### 3. 測試覆蓋
- 涵蓋各種業務場景
- 包含邊界條件測試
- 支援完整的 POS 功能測試

## 注意事項

### 1. 唯一約束
- `users.line_id` 必須唯一
- `order_items(order_id, product_id)` 組合必須唯一
- `coupon_codes.code` 必須唯一

### 2. 觸發器檢查
- 優惠券使用記錄會觸發複雜的業務邏輯檢查
- 訂單項目插入會自動重新計算訂單金額
- 時間戳會自動更新

### 3. 資料清理
- 種子檔案會先清理現有資料
- 保留系統必要的資料（如非會員用戶）
- 重置自動遞增序列

## 故障排除

### 1. 唯一約束錯誤
```bash
# 檢查重複資料
pnpm wrangler d1 execute --local pos-local --command "SELECT line_id, COUNT(*) FROM users GROUP BY line_id HAVING COUNT(*) > 1;"
```

### 2. 外鍵約束錯誤
```bash
# 檢查外鍵關聯
pnpm wrangler d1 execute --local pos-local --command "PRAGMA foreign_key_check;"
```

### 3. 觸發器錯誤
```bash
# 檢查觸發器狀態
pnpm wrangler d1 execute --local pos-local --command "SELECT name FROM sqlite_master WHERE type='trigger';"
```

## 開發建議

### 1. 新增種子資料
- 遵循現有的命名規範
- 確保資料完整性
- 測試所有約束條件

### 2. 修改現有資料
- 先備份現有資料
- 測試修改後的約束
- 更新相關的種子檔案

### 3. 版本控制
- 種子檔案應該納入版本控制
- 重大變更應該創建新的種子檔案
- 保持向後相容性

## 相關指令

```bash
# 查看資料庫狀態
pnpm wrangler d1 execute --local pos-local --command "SELECT name FROM sqlite_master WHERE type='table';"

# 查看特定表資料
pnpm wrangler d1 execute --local pos-local --command "SELECT * FROM users LIMIT 5;"

# 進入資料庫控制台
pnpm run d1:console
```

---

**注意**：此種子資料系統僅用於開發和測試環境，請勿在生產環境中使用。
