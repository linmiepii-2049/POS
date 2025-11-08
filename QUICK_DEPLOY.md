# 🚀 快速部署指令（複製貼上即可）

## 方式 1：使用自動化腳本（推薦）

```bash
# 執行自動化部署腳本
./deploy-staging.sh
```

腳本會引導您完成所有步驟。

---

## 方式 2：手動執行命令

### 📝 前置檢查

```bash
# 確認已登入 Cloudflare
wrangler whoami
# Account ID: 090a04034814d8905c2a759afa46d73e
```

---

### 🔧 步驟 1：建立 Cloudflare 資源

```bash
# 建立 D1 Database
wrangler d1 create pos-db-staging

# ⚠️ 記錄輸出的 database_id，然後執行:
# 編輯 packages/backend/wrangler.toml
# 將 database_id 填入 [[env.staging.d1_databases]] 區塊

# 建立 R2 Bucket
wrangler r2 bucket create pos-assets-staging
```

---

### 🗄️ 步驟 2：初始化資料庫

```bash
cd packages/backend

# 執行 migrations
pnpm run d1:migrate:staging

# 匯入測試資料（選用）
pnpm run d1:seed:staging

cd ../..
```

---

### ⚙️ 步驟 3：設定前端環境變數

```bash
cd packages/frontend

# 建立 .env.staging
cat > .env.staging << 'EOF'
VITE_API_BASE_URL=https://api-staging.example.com
EOF

cd ../..
```

---

### 🚀 步驟 4：部署後端

```bash
cd packages/backend

# 部署到 Staging
pnpm run deploy:staging

cd ../..
```

---

### 🎨 步驟 5：部署前端

```bash
cd packages/frontend

# 建置 Staging 版本
pnpm run build --mode staging

# 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=pos-frontend-staging --branch=staging

cd ../..
```

---

### ✅ 步驟 6：驗證部署

```bash
# 測試後端健康檢查
curl https://api-staging.example.com/health | jq

# 預期回應：
# {
#   "ok": true,
#   "env": "staging",
#   "d1_status": "ok",
#   "now_utc": "...",
#   "now_local": "..."
# }

# 測試版本資訊
curl https://api-staging.example.com/version | jq

# 預期回應：
# {
#   "version": "1.0.0",
#   "env": "staging"
# }
```

**然後開啟瀏覽器：**
- URL: `https://app-staging.example.com`
- 檢查健康狀態顯示「正常」（綠色圓點）
- 檢查版本資訊顯示「1.0.0」
- 開啟 Console（F12），確認無錯誤
- 開啟 Network 標籤，確認請求 URL 為 `https://api-staging.example.com/...`

---

## 🔄 如需回滾

### 後端回滾

```bash
cd packages/backend

# 查看部署歷史
wrangler deployments list --env staging

# 回滾到上一個版本
wrangler rollback --env staging --message "Rollback due to issue"
```

### 前端回滾

1. 前往 Cloudflare Dashboard
2. Pages → pos-frontend-staging
3. Deployments
4. 選擇上一個穩定版本
5. 點擊 "Rollback to this deployment"

---

## ⚠️ 常見問題

### 問題 1: `wrangler d1 create` 失敗

**解決**: 
```bash
# 確認已登入
wrangler login

# 確認 Account ID
wrangler whoami
```

### 問題 2: Migrations 失敗

**解決**:
```bash
# 檢查 database_id 是否正確填入 wrangler.toml
cat packages/backend/wrangler.toml | grep -A 5 "env.staging.d1_databases"

# 列出所有 D1 databases
wrangler d1 list
```

### 問題 3: API 回傳 404

**解決**:
```bash
# 檢查部署狀態
cd packages/backend
wrangler deployments list --env staging

# 確認路由設定
cat wrangler.toml | grep -A 3 "env.staging.routes"

# 需要在 Cloudflare Dashboard 設定 DNS:
# api-staging.example.com → Workers (pos-backend-staging)
```

### 問題 4: CORS 錯誤

**解決**:
```bash
# 檢查 CORS 設定
cat packages/backend/wrangler.toml | grep CORS_ORIGINS

# 應包含: "http://localhost:3000,https://app-staging.example.com"

# 修改後重新部署
cd packages/backend
pnpm run deploy:staging
```

---

## 📚 詳細文檔

- [部署指南](./DEPLOYMENT_GUIDE.md)
- [部署完成摘要](./DEPLOYMENT_COMPLETE.md)
- [根 README - 部署 Runbook](./README.md#部署-runbook)
- [後端 README](./packages/backend/README.md)
- [前端 README](./packages/frontend/README.md)

---

**執行方式**：

```bash
# 方式 1: 使用自動化腳本
./deploy-staging.sh

# 方式 2: 複製本文件的命令逐行執行
```
