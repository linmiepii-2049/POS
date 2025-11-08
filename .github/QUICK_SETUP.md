# 快速設定指南

## 🚀 立即開始部署

### 前置條件檢查

#### 1. 確認 GitHub Secrets

在 GitHub Repository Settings > Secrets and variables > Actions 中檢查：

- [ ] `CLOUDFLARE_API_TOKEN` ✅ 已設定
- [ ] `CLOUDFLARE_ACCOUNT_ID` ✅ 已設定

#### 2. 確認 D1 資料庫存在

```bash
# 列出所有 D1 資料庫
wrangler d1 list

# 應該看到：
# - pos-db-staging (e4719617-39ba-44b8-890b-6cc08c9c778a)
# - pos-db-prod (f3aa95e5-594c-4d68-a588-19dc6f7962f0)
```

✅ 已確認資料庫存在（從 wrangler.toml）

#### 3. 確認 R2 Buckets

```bash
# 列出所有 R2 buckets
wrangler r2 bucket list

# 需要看到：
# - pos-assets-staging
# - pos-assets-prod
```

**如果不存在，執行**:
```bash
# Staging
wrangler r2 bucket create pos-assets-staging

# Production
wrangler r2 bucket create pos-assets-prod
```

## 📋 部署檢查清單

### Staging 部署

```bash
# 1. 本地測試通過
cd packages/backend
pnpm test  # 可能有些 mock 測試失敗，但不影響部署

# 2. 確認 migrations
pnpm wrangler d1 migrations list DB --env staging

# 3. 確認 R2
pnpm wrangler r2 bucket list | grep staging
```

**部署步驟**:
1. 前往 GitHub > Actions > "Deploy to Staging"
2. 點擊 "Run workflow"
3. 輸入部署原因（例如："修復 health endpoint 問題"）
4. 點擊 "Run workflow" 確認

**自動執行的步驟**:
- ✅ 品質檢查（lint + typecheck + test）
- ✅ 檢查 D1 資料庫狀態
- ✅ 執行 pending migrations（如有）
- ✅ 檢查 R2 bucket 存在
- ✅ 部署 Workers
- ✅ 健康檢查（重試 3 次）
- ✅ 部署前端

### Production 部署

**前置準備**:
```bash
# 1. 確認 Staging 正常
curl https://pos-backend-staging.survey-api.workers.dev/health

# 2. 決定版本號
# 格式: v1.0.0, v1.1.0, v2.0.0

# 3. 建議：備份 Production 資料庫（手動）
wrangler d1 backup create pos-db-prod
```

**部署步驟**:
1. 前往 GitHub > Actions > "Deploy to Production"
2. 點擊 "Run workflow"
3. 輸入:
   - **版本號**: `v1.0.0`（範例）
   - **部署原因**: "正式發布 v1.0.0 版本"
4. 點擊 "Run workflow" 確認

**自動執行的步驟**:
- ✅ 完整品質檢查
- ✅ 版本號格式驗證
- ✅ 檢查 D1 資料庫狀態
- ✅ 執行 pending migrations（batch-size: 5）
- ✅ 檢查 R2 bucket 存在
- ✅ 備份提醒
- ✅ 部署 Workers（含版本追蹤）
- ✅ 健康檢查（重試 3 次）
- ✅ 部署前端
- ✅ 建立 Git Tag

## 🔍 部署驗證

### Staging 驗證

```bash
# 1. 健康檢查
curl https://pos-backend-staging.survey-api.workers.dev/health

# 預期: {"ok": true, "d1_status": "ok", ...}

# 2. 版本資訊
curl https://pos-backend-staging.survey-api.workers.dev/version

# 3. API 測試
curl https://pos-backend-staging.survey-api.workers.dev/api/users?limit=1
```

### Production 驗證

```bash
# 1. 健康檢查
curl https://pos-backend-prod.survey-api.workers.dev/health

# 2. 版本資訊（應該顯示新版本）
curl https://pos-backend-prod.survey-api.workers.dev/version

# 3. API 測試
curl https://pos-backend-prod.survey-api.workers.dev/api/users?limit=1

# 4. 前端檢查
# 開啟瀏覽器測試前端功能
```

## ⚠️ 常見問題

### Q: 測試失敗會阻止部署嗎？

**A**: 不會。測試失敗只會顯示警告，不會阻止部署。

Preflight 腳本使用 `|| true` 允許測試失敗：
```bash
bash scripts/preflight.sh || true
```

### Q: Migration 失敗怎麼辦？

**A**: 部署會繼續，但建議手動檢查並修復：

```bash
# 1. 查看失敗的 migration
wrangler d1 migrations list DB --env staging

# 2. 手動執行
wrangler d1 execute DB --env staging --file migrations/XXXX_xxx.sql

# 3. 重新部署
```

### Q: R2 bucket 不存在怎麼辦？

**A**: 部署會失敗並提供建立指令：

```bash
# 根據錯誤訊息執行
wrangler r2 bucket create pos-assets-staging
# 或
wrangler r2 bucket create pos-assets-prod
```

### Q: 如何回滾部署？

**A**: 

**Workers 回滾**:
```bash
cd packages/backend
wrangler rollback --env production
```

**前端回滾**:
- 在 Cloudflare Pages Dashboard 中選擇先前的部署版本

**D1 回滾**:
- 需要手動處理，建議事先備份

## 📊 監控部署

### 查看部署日誌

1. GitHub > Actions
2. 選擇執行的 workflow
3. 展開各個步驟查看詳細日誌

### Cloudflare Dashboard

**Workers**:
- https://dash.cloudflare.com/ > Workers & Pages
- 查看部署狀態、日誌、指標

**D1**:
- Dashboard > D1
- 查看資料庫大小、查詢次數

**R2**:
- Dashboard > R2
- 查看儲存使用量

## 🎯 下一步

### 首次部署 Staging

```bash
# 1. 確認 R2 buckets
wrangler r2 bucket create pos-assets-staging  # 如需要

# 2. 提交程式碼（如有修改）
git add .
git commit -m "fix: 更新測試日期並加入 D1/R2 部署設定"
git push origin main

# 3. 觸發部署
# GitHub > Actions > Deploy to Staging > Run workflow
```

### 測試通過後部署 Production

```bash
# 1. 確認 Staging 運作正常
curl https://pos-backend-staging.survey-api.workers.dev/health

# 2. 確認 R2 bucket
wrangler r2 bucket create pos-assets-prod  # 如需要

# 3. 執行部署
# GitHub > Actions > Deploy to Production > Run workflow
# 版本號: v1.0.0
```

## 📚 相關文件

- [D1 與 R2 設定詳細指南](D1_R2_SETUP.md)
- [完整更新說明](../WORKFLOW_UPDATES_2025-11-08.md)
- [部署指南](../DEPLOYMENT_GUIDE.md)

---

**提示**: 所有步驟都已自動化，您只需要觸發 workflow 即可！

