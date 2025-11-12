# Survey 整合部署檢查清單

## ✅ 完成項目

### 後端整合
- [x] 建立 Migration (`0019_add_survey_responses.sql`)
- [x] 建立 Zod Schema (`src/zod/surveys.ts`)
- [x] 建立 Service 層 (`src/services/surveys.ts`)
- [x] 建立 Route 層 (`src/routes/surveys.ts`)
- [x] 在 `app.ts` 註冊路由
- [x] 更新 `wrangler.toml` CORS 設定

### 前端建立
- [x] 建立 Survey 前端專案結構 (`packages/survey-frontend/`)
- [x] 建立配置檔案 (package.json, vite.config.ts, tsconfig.json)
- [x] 建立 LIFF Hook (`useLiff.ts`)
- [x] 建立 API 客戶端 (`surveyClient.ts`)
- [x] 建立 UI 元件 (Loading, RadioGroup, CheckboxGroup, SurveySection, SurveyForm)
- [x] 建立主應用程式 (`App.tsx`)

### CI/CD
- [x] 建立 GitHub Actions 工作流程 (`.github/workflows/deploy-survey.yml`)

### 文件
- [x] 建立整合文件 (`SURVEY_INTEGRATION.md`)
- [x] 建立快速開始指南 (`SURVEY_QUICKSTART.md`)
- [x] 更新主 README (`README.md`)

---

## 📋 部署前檢查清單

### 1. 本地測試
- [ ] 執行 Migration（本地）
  ```bash
  cd packages/backend
  pnpm wrangler d1 execute pos-local --local --file=migrations/0019_add_survey_responses.sql
  ```

- [ ] 啟動後端測試
  ```bash
  cd packages/backend
  pnpm dev
  ```

- [ ] 啟動 Survey 前端測試
  ```bash
  cd packages/survey-frontend
  pnpm install
  pnpm dev
  ```

- [ ] 測試 API
  ```bash
  # 健康檢查
  curl http://localhost:8787/health
  
  # 提交問卷測試
  curl -X POST http://localhost:8787/api/surveys \
    -H "Content-Type: application/json" \
    -d '{"memberId":"0912345678","phone":"0912345678","age":"26-45歲","gender":"男"}'
  ```

### 2. 後端部署

- [ ] 產生 OpenAPI
  ```bash
  cd packages/backend
  pnpm run openapi
  ```

- [ ] 驗證 OpenAPI（確保無錯誤）
  ```bash
  npx @stoplight/spectral-cli lint docs/openapi.json --ruleset docs/.spectral.yaml
  ```

- [ ] 產生 SDK
  ```bash
  pnpm run gen-sdk
  ```

- [ ] 執行 Migration（Staging）
  ```bash
  pnpm wrangler d1 execute pos-db-staging --remote --file=migrations/0019_add_survey_responses.sql --env staging
  ```

- [ ] 部署後端到 Staging
  ```bash
  pnpm wrangler deploy --env staging
  ```

- [ ] 測試 Staging API
  ```bash
  curl https://pos-backend-staging.survey-api.workers.dev/health
  ```

### 3. GitHub Pages 設定

- [ ] 更新 `packages/backend/wrangler.toml`
  - 將 `YOUR_USERNAME` 替換成你的 GitHub username

- [ ] 更新 `packages/survey-frontend/vite.config.ts`（如果 repo 名稱不是 POS_0922）
  - 將 `base` 路徑改成正確的 repo 名稱

- [ ] 在 GitHub Repository 啟用 Pages
  - Settings → Pages
  - Source: GitHub Actions

- [ ] 設定 GitHub Secrets
  - Settings → Secrets and variables → Actions
  - `VITE_API_BASE_PROD`: `https://pos-backend-prod.survey-api.workers.dev`
  - `VITE_LIFF_ID`: 你的 LIFF ID

### 4. 生產環境部署

- [ ] 執行 Migration（Production）
  ```bash
  cd packages/backend
  pnpm wrangler d1 execute pos-db-prod --remote --file=migrations/0019_add_survey_responses.sql --env production
  ```

- [ ] 部署後端到 Production
  ```bash
  pnpm wrangler deploy --env production
  ```

- [ ] 推送程式碼觸發 Survey 前端部署
  ```bash
  git add .
  git commit -m "feat: 整合 Survey 問卷調查系統"
  git push origin main
  ```

- [ ] 檢查 GitHub Actions 部署狀態
  - 前往 Actions 標籤
  - 確認 "Deploy Survey Frontend to GitHub Pages" 成功

### 5. LIFF 設定

- [ ] 登入 [LINE Developers Console](https://developers.line.biz/)

- [ ] 更新 LIFF Endpoint URL
  ```
  https://YOUR_USERNAME.github.io/POS_0922/
  ```

- [ ] 確認 Scope 設定
  - [x] profile
  - [x] openid

### 6. 驗證部署

- [ ] 測試 Production API
  ```bash
  # 健康檢查
  curl https://pos-backend-prod.survey-api.workers.dev/health
  
  # OpenAPI 文件
  curl https://pos-backend-prod.survey-api.workers.dev/openapi.json
  ```

- [ ] 訪問 Survey 前端
  - URL: `https://YOUR_USERNAME.github.io/POS_0922/`
  - 應該顯示問卷表單

- [ ] 測試 LIFF 整合
  - 從 LINE 應用開啟 LIFF
  - 填寫問卷
  - 提交成功

- [ ] 檢查資料庫
  ```bash
  pnpm wrangler d1 execute pos-db-prod --remote --command="SELECT COUNT(*) FROM survey_responses" --env production
  ```

---

## 🛠️ 常見問題排查

### CORS 錯誤
**症狀**: 瀏覽器 Console 顯示 CORS 錯誤

**檢查**:
1. `wrangler.toml` 的 `CORS_ORIGINS` 包含正確的域名
2. 重新部署後端
3. 清除瀏覽器快取

### LIFF 初始化失敗
**症狀**: 前端顯示 "LIFF 初始化失敗"

**檢查**:
1. `VITE_LIFF_ID` 環境變數正確
2. LINE Developers Console 的 Endpoint URL 正確
3. 從 LINE 應用開啟（不是直接在瀏覽器）

### 提交失敗
**症狀**: 提交時出現錯誤

**檢查**:
1. Migration 已執行（資料庫有 `survey_responses` 表）
2. 檢查後端 logs: `pnpm wrangler tail --env production`
3. 檢查 API 回應: 打開瀏覽器開發者工具 → Network

### GitHub Actions 失敗
**症狀**: 部署失敗

**檢查**:
1. GitHub Secrets 設定正確
2. 依賴安裝成功
3. 建置錯誤訊息

---

## 📞 需要協助

如遇到問題：
1. 查看 [SURVEY_INTEGRATION.md](./SURVEY_INTEGRATION.md)
2. 查看 `packages/backend/TROUBLESHOOTING.md`
3. 檢查 GitHub Actions logs
4. 檢查 Cloudflare Workers logs

---

**最後更新**: 2025-01-12

