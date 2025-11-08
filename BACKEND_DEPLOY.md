# 🚀 後端部署指令（Staging）

## 📋 請依序執行以下命令

### 步驟 1：建立 D1 Database

```bash
wrangler d1 create pos-db-staging
```

**輸出範例：**
```
✅ Successfully created DB 'pos-db-staging'

[[d1_databases]]
binding = "DB"
database_name = "pos-db-staging"
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"  # ← 記錄這個 ID
```

---

### 步驟 2：更新 wrangler.toml

**編輯檔案：** `packages/backend/wrangler.toml`

找到這一行：
```toml
database_id = "<TODO: wrangler d1 create pos-db-staging 後填入>"
```

替換為步驟 1 取得的 database_id：
```toml
database_id = "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
```

---

### 步驟 3：建立 R2 Bucket

```bash
wrangler r2 bucket create pos-assets-staging
```

**預期輸出：**
```
✅ Created bucket 'pos-assets-staging'
```

---

### 步驟 4：執行 D1 Migrations

```bash
cd packages/backend
pnpm run d1:migrate:staging
```

**預期輸出：**
```
Migrations to be applied:
  ...
✅ Applied X migration(s)
```

---

### 步驟 5：匯入測試資料（選用）

```bash
pnpm run d1:seed:staging
```

---

### 步驟 6：部署後端到 Staging

```bash
pnpm run deploy:staging
```

**預期輸出：**
```
⎔ Starting deployment...
✨ Deployment complete!
Current Deployment ID: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
```

---

### 步驟 7：驗證部署

```bash
# 測試健康檢查
curl https://api-staging.example.com/health | jq

# 預期回應：
# {
#   "ok": true,
#   "env": "staging",
#   "d1_status": "ok",
#   "now_utc": "2025-09-30T03:00:00.000Z",
#   "now_local": "2025-09-30T11:00:00.000Z"
# }

# 測試版本資訊
curl https://api-staging.example.com/version | jq

# 預期回應：
# {
#   "version": "1.0.0",
#   "env": "staging"
# }
```

---

## ✅ 檢查清單

- [ ] D1 Database 已建立
- [ ] `wrangler.toml` 中的 `database_id` 已填入
- [ ] R2 Bucket 已建立
- [ ] Migrations 已執行成功
- [ ] 後端部署成功
- [ ] `/health` 回傳 `ok: true, env: "staging", d1_status: "ok"`
- [ ] `/version` 回傳 `version: "1.0.0", env: "staging"`

---

## ⚠️ 注意事項

### DNS 設定

部署後，您需要在 Cloudflare DNS 中設定：

1. 前往 Cloudflare Dashboard → 您的域名 → DNS
2. 新增 CNAME 記錄：
   - **Name**: `api-staging`
   - **Target**: `pos-backend-staging.<your-subdomain>.workers.dev`
   - **Proxy status**: Proxied（橘色雲朵）

或者，如果使用 Workers 自訂域名：
- 在 Workers → pos-backend-staging → Settings → Triggers
- 新增自訂域名：`api-staging.example.com`

### 如果 curl 測試失敗

**可能原因 1**: DNS 尚未生效
```bash
# 檢查 DNS 解析
nslookup api-staging.example.com
dig api-staging.example.com
```

**可能原因 2**: 使用 Workers.dev 域名測試
```bash
# 先用 workers.dev 域名測試
curl https://pos-backend-staging.<your-subdomain>.workers.dev/health | jq
```

**可能原因 3**: Routes 設定問題
```bash
# 檢查 wrangler.toml 中的 routes 配置
cat wrangler.toml | grep -A 3 "env.staging.routes"
```

---

## 🔄 回滾（如需要）

```bash
# 查看部署歷史
wrangler deployments list --env staging

# 回滾到上一個版本
wrangler rollback --env staging --message "Rollback reason"
```

---

## 📝 完整命令（一次性複製）

```bash
# === 步驟 1-3: 建立資源 ===
wrangler d1 create pos-db-staging
# ⚠️ 記錄 database_id 並更新 wrangler.toml

wrangler r2 bucket create pos-assets-staging

# === 步驟 4-6: 部署 ===
cd packages/backend
pnpm run d1:migrate:staging
pnpm run deploy:staging

# === 步驟 7: 驗證 ===
curl https://api-staging.example.com/health | jq
curl https://api-staging.example.com/version | jq
```

---

**下一步**: 部署完成後，請執行前端部署。
