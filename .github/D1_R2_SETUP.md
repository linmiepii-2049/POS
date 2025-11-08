# D1 與 R2 部署設定指南

本文檔說明 GitHub Actions 部署流程中 D1 資料庫和 R2 儲存的自動化設定。

## 概述

部署流程已更新，自動處理：
- ✅ D1 資料庫狀態檢查
- ✅ 自動執行 pending migrations
- ✅ R2 bucket 存在性驗證
- ✅ 部署前資源確認

## 部署流程

### Staging 環境

```yaml
1. 📥 Checkout 程式碼
2. 📦 安裝依賴
3. 🗄️ 檢查 D1 資料庫狀態
4. 🔄 執行 D1 Migrations（如有 pending）
5. 📦 檢查 R2 Bucket 存在
6. 🚀 部署 Workers
7. 🔍 驗證部署（health check）
```

### Production 環境

```yaml
1. 📥 Checkout 程式碼
2. 📦 安裝依賴
3. 🗄️ 檢查 D1 資料庫狀態
4. 🔄 執行 D1 Migrations（如有 pending）
5. 📦 檢查 R2 Bucket 存在
6. 💾 備份資料庫提醒
7. 🚀 部署 Workers
8. 🔍 驗證部署（health check）
```

## D1 資料庫設定

### 自動 Migration 執行

部署流程會自動：

1. **檢查 pending migrations**
   ```bash
   wrangler d1 migrations list DB --env staging
   ```

2. **執行 migrations**（如有需要）
   ```bash
   # Staging
   wrangler d1 migrations apply DB --env staging
   
   # Production
   wrangler d1 migrations apply DB --env production
   ```

3. **確認執行結果**

### Migration 失敗處理

如果 migration 執行失敗：

1. **檢查錯誤日誌**
   - GitHub Actions 會顯示詳細錯誤訊息
   - 查看 wrangler 輸出

2. **手動修復**
   ```bash
   # 本地檢查
   cd packages/backend
   
   # 查看 pending migrations
   pnpm wrangler d1 migrations list DB --env staging
   
   # 手動執行特定 migration
   pnpm wrangler d1 execute DB --env staging --file migrations/XXXX_xxx.sql
   ```

3. **重新部署**

### Migration 最佳實踐

- ✅ **冪等性**：所有 migrations 必須可重複執行
- ✅ **使用 IF NOT EXISTS**：避免重複建立
- ✅ **小批次**：複雜變更分多個 migration
- ✅ **先測試**：Staging 測試通過後才部署 Production
- ⚠️ **避免破壞性變更**：DROP TABLE/COLUMN 需特別小心

## R2 Bucket 設定

### 自動檢查

部署前會驗證 R2 bucket 是否存在：

**Staging:**
```bash
wrangler r2 bucket list | grep "pos-assets-staging"
```

**Production:**
```bash
wrangler r2 bucket list | grep "pos-assets-prod"
```

### 首次設定

如果 R2 bucket 不存在，部署會失敗並提示：

```bash
# 建立 Staging bucket
wrangler r2 bucket create pos-assets-staging

# 建立 Production bucket
wrangler r2 bucket create pos-assets-prod
```

### R2 Bucket 配置

在 `wrangler.toml` 中已配置：

```toml
# Staging
[[env.staging.r2_buckets]]
binding = "ASSETS"
bucket_name = "pos-assets-staging"

# Production
[[env.production.r2_buckets]]
binding = "ASSETS"
bucket_name = "pos-assets-prod"
```

## 環境變數設定

### 必要的 GitHub Secrets

在 GitHub Repository Settings > Secrets and variables > Actions 中設定：

| Secret 名稱 | 說明 | 取得方式 |
|------------|------|---------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API Token | Cloudflare Dashboard > My Profile > API Tokens |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare Account ID | Cloudflare Dashboard > Workers & Pages > Overview |

### API Token 權限要求

建立 API Token 時需要以下權限：

- ✅ **Workers Scripts** - Edit
- ✅ **D1** - Edit
- ✅ **R2** - Edit
- ✅ **Account Settings** - Read

## 部署驗證

### 健康檢查

部署完成後自動執行：

```bash
# Staging
curl https://pos-backend-staging.survey-api.workers.dev/health

# Production  
curl https://pos-backend-prod.survey-api.workers.dev/health
```

預期回應：
```json
{
  "ok": true,
  "env": "staging",
  "d1_status": "ok",
  "now_utc": "2025-11-08T12:00:00.000Z",
  "now_local": "2025-11-08T20:00:00.000Z"
}
```

### 手動驗證

部署後建議手動測試：

```bash
# 1. 版本資訊
curl https://pos-backend-staging.survey-api.workers.dev/version

# 2. 資料庫連線
curl https://pos-backend-staging.survey-api.workers.dev/api/users?limit=1

# 3. 上傳功能（R2）
# 使用前端或 API 測試上傳圖片
```

## 故障排除

### D1 連線失敗

**問題**：`d1_status: "error"`

**解決方案**：
1. 確認 database_id 正確
2. 檢查 wrangler.toml 配置
3. 驗證 API Token 權限
4. 手動執行 migrations

```bash
# 檢查資料庫資訊
wrangler d1 info pos-db-staging

# 測試查詢
wrangler d1 execute pos-db-staging --command "SELECT 1"
```

### R2 存取失敗

**問題**：上傳/讀取圖片失敗

**解決方案**：
1. 確認 bucket 存在
2. 檢查 binding 名稱（ASSETS）
3. 驗證 API Token 權限

```bash
# 列出所有 buckets
wrangler r2 bucket list

# 檢查 bucket 內容
wrangler r2 object list pos-assets-staging
```

### Migration 衝突

**問題**：Migration 執行順序錯誤

**解決方案**：
```bash
# 1. 查看已執行的 migrations
wrangler d1 migrations list DB --env staging --applied

# 2. 查看 pending migrations
wrangler d1 migrations list DB --env staging

# 3. 如需重置（謹慎使用！）
# 先備份資料
wrangler d1 backup create pos-db-staging

# 然後處理衝突的 migration
```

## 部署檢查清單

### Staging 部署前

- [ ] 本地測試通過（`pnpm test`）
- [ ] Migrations 已在本地測試
- [ ] R2 bucket 已建立
- [ ] GitHub Secrets 已設定
- [ ] 確認 wrangler.toml 配置正確

### Production 部署前

- [ ] Staging 環境測試通過
- [ ] 資料庫已備份
- [ ] Migrations 在 Staging 測試通過
- [ ] 版本號已確認
- [ ] 團隊成員已通知
- [ ] 回滾計畫已準備

## 相關資源

- [Wrangler D1 文檔](https://developers.cloudflare.com/d1/)
- [Wrangler R2 文檔](https://developers.cloudflare.com/r2/)
- [GitHub Actions 工作流程](.github/workflows/)
- [專案部署指南](../DEPLOYMENT_GUIDE.md)

## 支援

如遇問題：
1. 查看 GitHub Actions 日誌
2. 檢查 Cloudflare Dashboard
3. 參考故障排除章節
4. 聯繫團隊成員

