# POS 系統 Monorepo

本專案使用 pnpm workspaces 管理的 monorepo 架構，包含後端、前端與共用模組。

## 工作區結構

```
packages/
├── backend/          # 後端服務 (Cloudflare Workers + Hono)
├── frontend/         # POS 前端應用 (Vite + React + TypeScript)
├── survey-frontend/  # 🆕 Survey 問卷前端 (GitHub Pages)
├── sdk/              # 共用 SDK (自動產生)
└── shared/           # 共用模組與工具
```

## 技術棧

- **包管理**: pnpm workspaces
- **後端**: Cloudflare Workers + Hono + D1 (SQLite)
- **前端**: Vite + React + TypeScript
- **Survey 前端**: Vite + React + LINE LIFF SDK (GitHub Pages)
- **SDK**: 自動產生 (OpenAPI → Spectral → Orval)
- **測試**: Vitest
- **代碼品質**: ESLint + Prettier
- **建構工具**: Turbo (可選)

## 📋 專案特色

- **統一 API 後端**: 使用 Cloudflare Workers 提供高效能、低延遲的 API
- **多前端架構**: POS 前端（Cloudflare Pages）+ Survey 前端（GitHub Pages）
- **LIFF 整合**: 完整的 LINE Front-end Framework 問卷調查系統
- **自動化 SDK**: 從 OpenAPI 自動產生型別安全的 SDK
- **完整測試**: 單元測試、整合測試、E2E 測試

## 🆕 Survey 問卷調查系統

本專案已整合 LIFF 問卷調查系統，採用獨立前端部署架構：

- **快速開始**: 參考 [SURVEY_QUICKSTART.md](./SURVEY_QUICKSTART.md)
- **完整文件**: 參考 [SURVEY_INTEGRATION.md](./SURVEY_INTEGRATION.md)
- **Survey 前端**: `packages/survey-frontend/`
- **部署方式**: GitHub Pages（自動部署）

## 開發環境需求

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Cloudflare 帳戶（用於部署後端）
- GitHub 帳戶（用於部署 Survey 前端）

## 安裝依賴

```bash
pnpm install
```

## 常用指令

### 根目錄指令

```bash
# 代碼檢查
pnpm run lint

# 代碼格式化
pnpm run fmt

# 執行測試
pnpm run test

# 預檢 (lint + test)
pnpm run preflight
```

### 工作區指令

```bash
# 在特定工作區執行指令
pnpm --filter backend run dev
pnpm --filter frontend run build

# 在所有工作區執行指令
pnpm -r run build
pnpm -r run test
```

### 依賴管理

```bash
# 在根目錄新增依賴
pnpm add -w <package>

# 在特定工作區新增依賴
pnpm --filter backend add <package>
pnpm --filter frontend add <package>
```

## 開發流程

1. 在根目錄執行 `pnpm install` 安裝所有依賴
2. 使用 `pnpm run preflight` 確保代碼品質
3. 在各個工作區中開發功能
4. 提交前確保所有測試通過

## SDK 更新流程

根據 SSOT 原則，所有 API 定義來自後端 Zod schema，SDK 自動產生：

```bash
# 在 packages/backend 目錄中執行
pnpm run sdk:update
```

這會執行：
1. 生成 OpenAPI 文檔 (`pnpm run openapi`)
2. 執行 Spectral 檢查 (`pnpm run spectral`)
3. 產生 TypeScript SDK (`pnpm run client:gen`)

## 專案規範

- 使用 ESM 模組系統
- 代碼風格遵循 ESLint + Prettier 配置
- 所有新功能必須包含測試
- 使用 TypeScript 進行型別檢查
- 遵循 Conventional Commits 規範
- **SSOT 原則**: 所有 API 定義來自後端 Zod schema

---

## 部署 Runbook

### 環境概覽

| 環境 | 前端域名 | API 域名 | 說明 |
|------|----------|----------|------|
| **Development** | `http://localhost:3000` | `http://localhost:8787` | 本地開發 |
| **Staging** | `https://app-staging.example.com` | `https://api-staging.example.com` | 測試環境 |
| **Production** | `https://app.example.com` | `https://api.example.com` | 生產環境（尚未配置） |

---

### 🚀 Staging 部署流程

#### 前置準備（首次部署）

```bash
# 1. 登入 Cloudflare
wrangler login && wrangler whoami
# Account ID: 090a04034814d8905c2a759afa46d73e

# 2. 建立 Staging D1 Database
wrangler d1 create pos-db-staging
# 記錄輸出的 database_id

# 3. 建立 Staging R2 Bucket
wrangler r2 bucket create pos-assets-staging

# 4. 更新 packages/backend/wrangler.toml
# 填入 database_id 到 [env.staging.d1_databases]
```

#### 後端部署

```bash
cd packages/backend

# 1. 確保代碼品質
pnpm run preflight

# 2. 更新 SDK（如 API 有變更）
pnpm run sdk:update

# 3. 執行 D1 migrations（首次或 schema 變更時）
pnpm run d1:migrate:staging

# 4. 匯入測試資料（選用）
pnpm run d1:seed:staging

# 5. 部署到 Staging
pnpm run deploy:staging

# 6. 驗證部署
curl https://api-staging.example.com/health
curl https://api-staging.example.com/version
```

#### 前端部署

```bash
cd packages/frontend

# 1. 創建 .env.staging（首次）
cat > .env.staging << 'EOF'
VITE_API_BASE_URL=https://api-staging.example.com
EOF

# 2. 建置 Staging 版本
pnpm run build --mode staging

# 3. 部署到 Cloudflare Pages
wrangler pages deploy dist --project-name=pos-frontend-staging --branch=staging

# 4. 驗證部署
# 開啟 https://app-staging.example.com
# 檢查健康狀態與版本資訊
```

---

### 🔄 回滾（Rollback）

#### 後端回滾

```bash
cd packages/backend

# 1. 查看部署歷史
wrangler deployments list --env staging

# 2. 回滾到上一個版本
wrangler rollback --env staging --message "Rollback due to XXX issue"
```

#### 前端回滾

```bash
# 在 Cloudflare Dashboard 中：
# 1. 進入 Pages → pos-frontend-staging
# 2. 選擇 Deployments
# 3. 找到上一個穩定版本
# 4. 點擊 "Rollback to this deployment"
```

---

### 🔍 健康檢查

部署後必須驗證以下端點：

```bash
# 健康檢查（應回傳 ok: true）
curl https://api-staging.example.com/health

# 預期回應：
# {
#   "ok": true,
#   "env": "staging",
#   "d1_status": "ok",
#   "now_utc": "2025-09-30T03:00:00.000Z",
#   "now_local": "2025-09-30 11:00:00"
# }

# 版本資訊
curl https://api-staging.example.com/version

# 預期回應：
# {
#   "version": "1.0.0",
#   "env": "staging"
# }
```

**檢查項目：**
- ✅ `ok: true` - 系統健康
- ✅ `env: "staging"` - 環境正確
- ✅ `d1_status: "ok"` - 資料庫連線正常
- ✅ `now_local` 使用 `Asia/Taipei` 時區

---

### ⚠️ 常見錯誤與解決方案

#### 1. API 回傳 HTML 而非 JSON

**症狀**: 
```
SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON
```

**原因**: 前端請求被路由到 Cloudflare Pages 的 HTML，而不是 Workers API

**解決方案**:
1. **檢查前端環境變數**:
   ```bash
   # 確認 .env.staging 存在且正確
   cat packages/frontend/.env.staging
   # 應輸出: VITE_API_BASE_URL=https://api-staging.example.com
   ```

2. **檢查 SDK 配置**:
   ```bash
   # 確認 SDK 使用環境變數
   cat packages/sdk/src/config.ts
   # 應包含 import.meta.env.VITE_API_BASE_URL 邏輯
   ```

3. **檢查瀏覽器 Console**:
   ```javascript
   console.log(import.meta.env.VITE_API_BASE_URL);
   // 應輸出完整的 API URL，不是 undefined
   ```

4. **重新建置前端**:
   ```bash
   cd packages/frontend
   pnpm run build --mode staging
   wrangler pages deploy dist --project-name=pos-frontend-staging
   ```

#### 2. 403 CORS 錯誤

**症狀**: 
```
Access to fetch at 'https://api-staging.example.com/...' from origin 'https://app-staging.example.com' has been blocked by CORS policy
```

**原因**: 後端 CORS 白名單未包含前端域名

**解決方案**:
1. **檢查後端 CORS 設定**:
   ```bash
   # 檢查 wrangler.toml
   cat packages/backend/wrangler.toml | grep CORS_ORIGINS
   # 應包含: CORS_ORIGINS = "http://localhost:3000,https://app-staging.example.com"
   ```

2. **更新 CORS 設定**:
   ```toml
   # 在 wrangler.toml 的 [env.staging] 中
   vars = { 
     ENV_NAME = "staging", 
     API_BASE = "https://api-staging.example.com", 
     CORS_ORIGINS = "http://localhost:3000,https://app-staging.example.com" 
   }
   ```

3. **重新部署後端**:
   ```bash
   cd packages/backend
   pnpm run deploy:staging
   ```

#### 3. 400 Bad Request（JSON 解析錯誤）

**原因**: SDK 參數鍵名與後端 Zod schema 不匹配

**解決方案**:
1. **重新生成 SDK**:
   ```bash
   cd packages/backend
   pnpm run sdk:update
   ```

2. **檢查 Spectral 報告**:
   ```bash
   pnpm run spectral
   # 必須 0 error
   ```

#### 4. 409 Conflict / 422 Unprocessable Entity

**原因**: Zod 驗證失敗或唯一鍵衝突

**解決方案**:
1. 檢查 API 回應中的 `details` 欄位
2. 確認輸入資料符合 Zod schema 定義
3. 檢查資料庫唯一鍵約束

#### 5. 500 Internal Server Error（D1 錯誤）

**原因**: D1 Database ID 不正確或 migrations 未執行

**解決方案**:
1. **檢查 D1 連線**:
   ```bash
   curl https://api-staging.example.com/health
   # 檢查 d1_status 欄位
   ```

2. **確認 database_id**:
   ```bash
   # 列出所有 D1 databases
   wrangler d1 list
   ```

3. **重新執行 migrations**:
   ```bash
   cd packages/backend
   pnpm run d1:migrate:staging
   ```

---

### 📊 日誌檢查

#### 後端日誌

```bash
# 查看 Staging 日誌（Cloudflare Dashboard）
# Workers → pos-backend-staging → Logs

# 日誌格式：
# [staging] GET /api/users 200 OK (15ms)
# [staging] POST /api/orders 201 Created (28ms)
```

**檢查重點**:
- 日誌前綴應為 `[staging]`
- 回應時間應在合理範圍內
- 無 D1 連線錯誤

#### 前端日誌

開啟瀏覽器 Console，檢查：
- 無 CORS 錯誤
- 無 JSON 解析錯誤
- API 請求的 URL 正確（應為 `https://api-staging.example.com/...`）

---

### 🔐 環境變數管理

#### 前端環境變數（.env.*）

```bash
# 開發環境（.env.local）
VITE_API_BASE_URL=http://localhost:8787

# Staging 環境（.env.staging）
VITE_API_BASE_URL=https://api-staging.example.com

# Production 環境（.env.production）
VITE_API_BASE_URL=https://api.example.com
```

#### 後端環境變數（wrangler.toml）

```toml
# Staging
[env.staging]
vars = { 
  ENV_NAME = "staging", 
  API_BASE = "https://api-staging.example.com", 
  CORS_ORIGINS = "http://localhost:3000,https://app-staging.example.com" 
}
```

**⚠️ 注意**:
- `.env.local` 不要提交到 Git（已在 .gitignore）
- `.env.staging` 和 `.env.production` 可以提交（無敏感資訊）
- 修改環境變數後前端需要重新建置，後端需要重新部署

---

### 📝 部署檢查清單

#### 後端部署

- [ ] D1 Database 已建立並填入 `wrangler.toml`
- [ ] R2 Bucket 已建立
- [ ] Migrations 已執行（`pnpm run d1:migrate:staging`）
- [ ] CORS 設定正確（包含前端域名）
- [ ] `pnpm run preflight` 全部通過
- [ ] `pnpm run deploy:staging` 成功
- [ ] `/health` 回傳 `ok: true, env: "staging", d1_status: "ok"`
- [ ] `/version` 回傳正確版本與環境

#### 前端部署

- [ ] `.env.staging` 已創建且 `VITE_API_BASE_URL` 正確
- [ ] SDK 已更新（如 API 有變更）
- [ ] `pnpm run build --mode staging` 成功
- [ ] 部署到 Cloudflare Pages 成功
- [ ] 瀏覽器中健康檢查顯示「正常」
- [ ] Network 標籤顯示請求 URL 為 `https://api-staging.example.com/...`
- [ ] Console 無 CORS 或 JSON 解析錯誤

---

### 🛠️ 故障排除

#### 快速診斷

```bash
# 1. 檢查後端健康狀態
curl https://api-staging.example.com/health | jq

# 2. 檢查前端能否訪問後端
curl -H "Origin: https://app-staging.example.com" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     https://api-staging.example.com/api/users

# 3. 檢查 D1 連線
wrangler d1 execute pos-db-staging --command "SELECT COUNT(*) FROM users"
```

#### 日誌追蹤

```bash
# 後端即時日誌（開發環境）
cd packages/backend
pnpm run dev
# 日誌格式: [development] GET /api/users 200 OK (15ms)

# Staging 日誌
# 前往 Cloudflare Dashboard → Workers → pos-backend-staging → Logs
```

---

### 📚 相關文件

- [後端 README](./packages/backend/README.md) - 後端開發與部署
- [前端 README](./packages/frontend/README.md) - 前端 PWA 開發
- [SDK README](./packages/sdk/README.md) - 共用 SDK 使用
- [前端環境變數設定](./packages/frontend/ENV_SETUP.md) - 環境變數配置
- [SDK 環境變數說明](./packages/sdk/ENV.md) - SDK 配置
- [SDK 實作總結](./SDK_IMPLEMENTATION.md) - SSOT 原則實作

---
