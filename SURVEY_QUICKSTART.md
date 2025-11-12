# Survey 問卷調查 - 快速開始指南

## 🚀 5 分鐘快速部署

### 步驟 1: 執行後端 Migration

```bash
cd packages/backend

# 本地開發
pnpm wrangler d1 execute pos-local --local --file=migrations/0019_add_survey_responses.sql

# Production（如果要部署到生產環境）
pnpm wrangler d1 execute pos-db-prod --remote --file=migrations/0019_add_survey_responses.sql --env production
```

### 步驟 2: 產生 OpenAPI 和 SDK

```bash
cd packages/backend

# 產生 OpenAPI 文件
pnpm run openapi

# 產生 SDK
pnpm run gen-sdk
```

### 步驟 3: 啟動後端（本地測試）

```bash
cd packages/backend
pnpm dev  # http://localhost:8787
```

### 步驟 4: 啟動 Survey 前端（本地測試）

開新終端：

```bash
cd packages/survey-frontend

# 安裝依賴（首次執行）
pnpm install

# 啟動開發伺服器
pnpm dev  # http://localhost:3001
```

### 步驟 5: 測試 API

```bash
# 測試提交問卷
curl -X POST http://localhost:8787/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "0912345678",
    "phone": "0912345678",
    "age": "26-45歲",
    "gender": "男"
  }'

# 查詢問卷
curl http://localhost:8787/api/surveys/0912345678
```

---

## 🌐 部署到 GitHub Pages

### 步驟 1: 更新 GitHub Username

編輯以下檔案，將 `YOUR_USERNAME` 替換成你的 GitHub username：

1. **`packages/backend/wrangler.toml`**
   ```toml
   [env.production]
   vars = { 
     CORS_ORIGINS = "https://pos-frontend-prod.pages.dev,https://YOUR_USERNAME.github.io" 
   }
   ```

2. **`packages/survey-frontend/vite.config.ts`** （如果 repo 名稱不是 POS_0922）
   ```typescript
   const base = mode === 'production' 
     ? '/YOUR_REPO_NAME/'  // 改成你的 repo 名稱
     : '/';
   ```

### 步驟 2: 設定 GitHub Secrets

前往 GitHub Repository → Settings → Secrets and variables → Actions

新增以下 secrets:
- `VITE_API_BASE_PROD`: `https://pos-backend-prod.survey-api.workers.dev`
- `VITE_LIFF_ID`: `2007900041-O9ayn5JW`（你的 LIFF ID）

### 步驟 3: 啟用 GitHub Pages

前往 Settings → Pages
- Source: 選擇 `GitHub Actions`

### 步驟 4: 部署

```bash
# 推送到 main 分支即可自動部署
git add .
git commit -m "feat: 新增 Survey 問卷調查系統"
git push origin main
```

前往 Actions 標籤查看部署進度。

### 步驟 5: 設定 LIFF

在 [LINE Developers Console](https://developers.line.biz/) 中：

1. 更新 LIFF Endpoint URL:
   ```
   https://YOUR_USERNAME.github.io/POS_0922/
   ```

2. 確認 Scope: `profile`, `openid`

---

## ✅ 驗證部署

### 1. 檢查後端 API

```bash
curl https://pos-backend-prod.survey-api.workers.dev/health
```

應該回傳：
```json
{
  "ok": true,
  "d1_status": "ok",
  ...
}
```

### 2. 檢查 Survey 前端

訪問: `https://YOUR_USERNAME.github.io/POS_0922/`

應該看到問卷表單頁面。

### 3. 測試 LIFF

從 LINE 應用開啟你的 LIFF 應用，填寫並提交問卷。

---

## 🛠️ 故障排除

### CORS 錯誤

**問題**: 瀏覽器顯示 CORS 錯誤

**解決**:
1. 確認 `wrangler.toml` 的 `CORS_ORIGINS` 包含 GitHub Pages 域名
2. 重新部署後端: `pnpm wrangler deploy --env production`

### LIFF 初始化失敗

**問題**: 前端顯示 "LIFF 初始化失敗"

**解決**:
1. 確認 `VITE_LIFF_ID` 設定正確
2. 確認在 LINE Developers Console 中的 Endpoint URL 正確
3. 確認從 LINE 應用開啟（不是直接在瀏覽器開啟）

### 問卷提交失敗

**問題**: 提交時出現 500 錯誤

**解決**:
1. 確認已執行 migration（檢查資料庫是否有 `survey_responses` 表）
2. 檢查後端 logs: `pnpm wrangler tail --env production`

---

## 📚 下一步

- 查看完整文件: [SURVEY_INTEGRATION.md](./SURVEY_INTEGRATION.md)
- 後端 API 文件: `packages/backend/README.md`
- Survey 前端文件: `packages/survey-frontend/README.md`

---

**需要協助？** 請參考 [SURVEY_INTEGRATION.md](./SURVEY_INTEGRATION.md) 的「維護注意事項」章節。

