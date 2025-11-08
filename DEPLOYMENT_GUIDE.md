# POS 系統部署指南

## 📋 配置摘要

```yaml
✅ 當前配置：

deploy:
  prod_domain: "app.example.com"
  staging_domain: "app-staging.example.com"
  frontend_deploy: "pages"
  api_subdomain_staging: "api-staging.example.com"
  api_subdomain_prod: "api.example.com"

cloudflare:
  account_id: "090a04034814d8905c2a759afa46d73e"
  d1_staging_id: "<TODO>"
  d1_prod_id: "<TODO>"
  r2_staging_bucket: "pos-assets-staging"
  r2_prod_bucket: "pos-assets-prod"

cors:
  staging: ["http://localhost:3000", "https://app-staging.example.com"]
  prod: ["https://app.example.com"]

git:
  enable_actions: false
  environments: ["staging"]
```

---

## 🚀 您需要執行的命令

### 1. 初始化 Cloudflare 資源

```bash
# 登入並確認帳號
wrangler login && wrangler whoami
# 確認 Account ID: 090a04034814d8905c2a759afa46d73e

# 建立 Staging D1 Database
wrangler d1 create pos-db-staging
# ⚠️ 重要：記錄輸出的 database_id

# 建立 Staging R2 Bucket
wrangler r2 bucket create pos-assets-staging
```

### 2. 更新 wrangler.toml

取得 D1 Database ID 後，更新 `packages/backend/wrangler.toml`:

```toml
[[env.staging.d1_databases]]
binding = "DB"
database_name = "pos-db-staging"
database_id = "<填入步驟 1 取得的 database_id>"  # ← 更新這裡
migrations_dir = "migrations"
```

### 3. 初始化 Staging 資料庫

```bash
cd packages/backend

# 執行 migrations
pnpm run d1:migrate:staging

# 匯入測試資料（選用）
pnpm run d1:seed:staging
```

### 4. 建立前端環境變數

```bash
cd packages/frontend

# 創建 .env.staging
cat > .env.staging << 'EOF'
VITE_API_BASE_URL=https://api-staging.example.com
EOF
```

### 5. 部署後端到 Staging

```bash
cd packages/backend

# 確保代碼品質
pnpm run preflight

# 部署
pnpm run deploy:staging

# 驗證部署
curl https://api-staging.example.com/health
curl https://api-staging.example.com/version
```

### 6. 部署前端到 Staging

```bash
cd packages/frontend

# 建置 Staging 版本
pnpm run build --mode staging

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=pos-frontend-staging --branch=staging

# 驗證部署
# 開啟瀏覽器: https://app-staging.example.com
```

---

## ✅ 部署檢查清單

### 後端檢查

- [ ] D1 Database 已建立並填入 `wrangler.toml`
- [ ] R2 Bucket 已建立
- [ ] Migrations 已執行
- [ ] `pnpm run preflight` 全部通過
- [ ] `pnpm run deploy:staging` 成功
- [ ] `curl https://api-staging.example.com/health` 回傳:
  ```json
  {
    "ok": true,
    "env": "staging",
    "d1_status": "ok",
    "now_utc": "...",
    "now_local": "..."
  }
  ```
- [ ] `curl https://api-staging.example.com/version` 回傳:
  ```json
  {
    "version": "1.0.0",
    "env": "staging"
  }
  ```

### 前端檢查

- [ ] `.env.staging` 已創建
- [ ] `pnpm run build --mode staging` 成功
- [ ] Pages 部署成功
- [ ] 瀏覽器開啟 `https://app-staging.example.com`
- [ ] 健康檢查顯示「正常」（綠色圓點）
- [ ] 版本資訊顯示「1.0.0」
- [ ] Network 標籤顯示請求 URL 為 `https://api-staging.example.com/...`
- [ ] Console 無 CORS 錯誤
- [ ] Console 無 JSON 解析錯誤

---

## 🔍 常見問題速查

### API 回傳 HTML 而非 JSON

```bash
# 檢查前端環境變數
cat packages/frontend/.env.staging
# 應輸出: VITE_API_BASE_URL=https://api-staging.example.com

# 重新建置
cd packages/frontend
pnpm run build --mode staging
wrangler pages deploy dist --project-name=pos-frontend-staging
```

### CORS 錯誤

```bash
# 檢查後端 CORS 設定
cat packages/backend/wrangler.toml | grep CORS_ORIGINS

# 應包含前端域名
# CORS_ORIGINS = "http://localhost:3000,https://app-staging.example.com"

# 修改後重新部署
cd packages/backend
pnpm run deploy:staging
```

### D1 連線失敗

```bash
# 檢查 D1 Database ID
wrangler d1 list

# 重新執行 migrations
cd packages/backend
pnpm run d1:migrate:staging

# 驗證連線
curl https://api-staging.example.com/health | jq .d1_status
# 應輸出: "ok"
```

---

## 🔄 回滾操作

### 後端回滾

```bash
cd packages/backend

# 查看部署歷史
wrangler deployments list --env staging

# 回滾到上一個版本
wrangler rollback --env staging --message "Rollback due to XXX"
```

### 前端回滾

在 Cloudflare Dashboard 中：
1. 進入 **Pages** → **pos-frontend-staging**
2. 選擇 **Deployments**
3. 找到上一個穩定版本
4. 點擊 **"Rollback to this deployment"**

---

## 📊 監控與日誌

### 後端日誌

```bash
# Cloudflare Dashboard
# Workers → pos-backend-staging → Logs

# 日誌格式：
# [staging] GET /api/users 200 OK (15ms)
# [staging] POST /api/orders 201 Created (28ms)
```

### 前端日誌

開啟瀏覽器 Console（F12），檢查：
- 無 CORS 錯誤
- 無 JSON 解析錯誤
- API 請求的 URL 正確

---

## 📚 相關文件

- [後端 README](./packages/backend/README.md)
- [前端 README](./packages/frontend/README.md)
- [SDK README](./packages/sdk/README.md)
- [根 README - 部署 Runbook](./README.md#部署-runbook)

---

**作者**: AI Assistant  
**日期**: 2025-09-30  
**環境**: Staging  
**狀態**: ✅ 配置完成，等待 D1 Database ID
