# 預購管理 API 錯誤修復

## 問題描述

Staging 環境的預購管理頁面出現 500 錯誤（`GET /api/admin/preorders`）。

## 修復內容

### 1. 改進錯誤處理 (`packages/backend/src/services/preorders.ts`)

- **`listCampaigns` 方法**：
  - 添加完整的 try-catch 錯誤處理
  - 添加詳細的日誌記錄（查詢參數、執行階段、結果統計）
  - 檢測資料表不存在的錯誤，提供明確的錯誤訊息
  - 驗證查詢結果，避免空值錯誤

- **`loadCampaignProducts` 方法**：
  - 添加錯誤處理和日誌記錄
  - 當資料表不存在時，返回空陣列而非拋出錯誤（允許檔期列表正常顯示）
  - 其他錯誤提供詳細的錯誤資訊

### 2. 改進路由錯誤處理 (`packages/backend/src/routes/preorders.ts`)

- 在 `listRoute` 處理器中添加詳細的日誌記錄
- 記錄請求參數、成功狀態和錯誤詳情
- 改進錯誤訊息的可讀性

## 可能的根本原因

最可能的原因是 **staging 環境的資料庫沒有執行 migrations**，導致以下資料表不存在：

- `preorder_campaigns`
- `preorder_campaign_products`
- `products` (如果也不存在)

## 檢查步驟

### 1. 檢查 migrations 狀態

```bash
cd packages/backend
pnpm wrangler d1 migrations list DB --env staging
```

預期應該看到所有 migrations 都已應用。如果有 pending migrations，執行：

```bash
pnpm wrangler d1 migrations apply DB --env staging
```

### 2. 檢查資料表是否存在

```bash
pnpm wrangler d1 execute DB --env staging --command "SELECT name FROM sqlite_master WHERE type='table' AND name LIKE 'preorder%';"
```

應該看到：
- `preorder_campaigns`
- `preorder_campaign_products`
- `preorder_orders`
- `preorder_payments`

### 3. 查看後端日誌

修復後，API 錯誤會記錄更詳細的資訊，可以通過以下方式查看：

- Cloudflare Dashboard → Workers → pos-backend-staging → Logs
- 或查看錯誤回應中的詳細錯誤訊息

## 錯誤訊息改進

修復後，如果資料表不存在，會收到類似以下的錯誤訊息：

```json
{
  "code": "DATABASE_SCHEMA_ERROR",
  "message": "預購檔期資料表不存在，請執行資料庫遷移",
  "details": {
    "message": "no such table: preorder_campaigns"
  }
}
```

## 後續步驟

1. ✅ 提交修復代碼
2. ⏳ 部署到 staging 環境
3. ⏳ 檢查 Cloudflare Workers 日誌，查看詳細錯誤資訊
4. ⏳ 如有需要，執行 pending migrations
5. ⏳ 驗證預購管理頁面功能正常

