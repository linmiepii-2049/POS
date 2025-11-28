# POS 系統後端 API

POS 系統後端 API 服務，基於 Cloudflare Workers + Hono 架構。

## 技術棧

- **運行環境**: Cloudflare Workers
- **框架**: Hono + @hono/zod-openapi
- **資料驗證**: Zod v4
- **資料庫**: Cloudflare D1 (SQLite)
- **測試**: Vitest
- **程式碼品質**: ESLint + Prettier
- **API 文檔**: OpenAPI 3.0 + Spectral
- **SDK 生成**: Orval

## 開發環境設定

### 必要條件

- Node.js >= 18.0.0
- pnpm >= 8.0.0
- Wrangler CLI

### 安裝依賴

```bash
pnpm install
```

### D1 資料庫設定

本專案使用 Cloudflare D1 (SQLite) 作為資料庫，支援本地開發。

#### 本地 D1 初始化

```bash
# 1. 套用資料庫遷移（建立表結構）
pnpm run d1:apply

# 2. 匯入測試資料
pnpm run d1:seed

# 3. 驗證資料庫狀態（可選）
pnpm run d1:console
```

#### D1 相關指令

```bash
# 套用遷移檔案
pnpm run d1:apply

# 重置資料庫並重新套用遷移
pnpm run d1:reset

# 匯入測試資料
pnpm run d1:seed

# 開啟 D1 控制台（手動執行 SQL）
pnpm run d1:console
```

#### 資料庫檔案位置

- 遷移檔案: `migrations/0001_init.sql`
- 測試資料: `seeds/0001_seed.sql`
- 本地資料庫: `.wrangler/state/v3/d1/`

### 快速設置（推薦）

如果您是第一次設置本地開發環境，或遇到 health check 失敗的問題，請執行：

```bash
# 自動檢查並修復常見問題
bash scripts/setup-local.sh
```

此腳本會自動：
- 檢查並釋放被佔用的 8787 端口
- 套用所有 pending 的 D1 migrations
- 檢查資料庫是否需要 seed 資料

### 本地開發

```bash
# 啟動開發伺服器
pnpm run dev

# 執行測試
pnpm run test

# 程式碼檢查
pnpm run lint

# 型別檢查
pnpm run typecheck

# 完整檢查（lint + typecheck + test）
pnpm run preflight
```

## API 端點

### 系統端點

- `GET /health` - 健康檢查
- `GET /version` - 版本資訊
- `GET /openapi.json` - OpenAPI 文檔

### 資料端點

- `GET /api/data` - 取得各表資料摘要
  - 回傳所有主要資料表的記錄數量和樣本資料
  - 包含 users, products, orders, order_items, coupons 等表

### 預購模組

預購功能透過 `preorder_campaigns` 與 `preorder_orders` 兩張資料表管理：

- `preorder_campaigns`
  - `starts_at`、`ends_at` 儲存 UTC 時間，建立或查詢前須使用共用 `time` util 進行台北時間轉換
  - 以 `is_active` 和唯一索引 `idx_preorder_campaigns_active` 確保同時間僅一個啟用檔期
  - `pickup_time_slots` 為 JSON 字串，後端由 `PreorderService` 負責序列化/反序列化
- `preorder_orders`
  - 每筆訂單綁定單一檔期與 D1 `orders` 訂單，包含備註與取餐時段
  - 透過外鍵與 `reserved_quantity`觸發器確保名額正確扣減

路由位於 `src/routes/preorders.ts`，主要端點：

- `GET /api/admin/preorders`：管理端列表，支援狀態篩選與分頁
- `POST /api/admin/preorders`：建立檔期，若 `isActive=true` 會自動停用其他檔期
- `PUT /api/admin/preorders/:id`、`DELETE /api/admin/preorders/:id`：更新/刪除檔期
- `GET /api/preorders/active`：前台取得目前有效檔期
- `POST /api/preorders/order`：建立預購訂單，包含備註與取餐時段驗證，成功後交由 `NotificationService` 記錄網站通知

如需調整 API，可修改 `src/zod/preorders.ts` 的 schema，重新跑 `pnpm run openapi && pnpm run spectral && pnpm run client:gen` 以更新 SDK。

## 如何更新 SDK

本專案使用 OpenAPI 規格驅動的開發流程，確保 API 文檔與 SDK 保持同步。

### 更新流程

1. **生成 OpenAPI 文檔**
   ```bash
   pnpm run openapi
   ```
   此指令會：
   - 啟動本地開發伺服器
   - 抓取 `/openapi.json` 端點
   - 轉換為 YAML 格式並儲存到 `docs/openapi.yaml`

2. **驗證 OpenAPI 文檔**
   ```bash
   pnpm run spectral
   ```
   此指令會：
   - 使用 Spectral 檢查 OpenAPI 文檔品質
   - 確保符合 API 設計規範
   - 檢查必填欄位、描述、標籤等

3. **生成 TypeScript SDK**
   ```bash
   pnpm run client:gen
   ```
   此指令會：
   - 讀取 `docs/openapi.yaml`
   - 使用 Orval 生成 TypeScript SDK
   - 包含 React Query hooks 設定
   - 輸出到 `src/client/` 目錄

### 完整更新流程

```bash
# 一次性執行完整更新流程
pnpm run openapi && pnpm run spectral && pnpm run client:gen
```

### 注意事項

- 修改 API 路由後，必須重新執行更新流程
- 生成的 SDK 檔案位於 `src/client/` 目錄，已加入 `.gitignore`
- Spectral 檢查必須通過 0 錯誤才能繼續
- SDK 包含自定義的 HTTP 客戶端和 React Query 整合

## 專案結構

```
packages/backend/
├── src/
│   ├── app.ts              # 主應用程式（使用 OpenAPIHono）
│   ├── index.ts            # 入口點
│   ├── env.d.ts            # 環境變數與 D1 綁定類型定義
│   ├── utils/
│   │   └── time.ts         # 時間工具函式
│   ├── routes/
│   │   ├── docs.ts         # API 文檔路由
│   │   └── data.ts         # 資料 API 路由
│   └── client/             # 生成的 SDK（gitignore）
├── migrations/
│   └── 0001_init.sql       # 初始資料庫遷移
├── seeds/
│   └── 0001_seed.sql       # 測試資料
├── scripts/
│   └── gen-openapi.ts      # OpenAPI 生成腳本
├── docs/
│   ├── openapi.yaml        # OpenAPI 文檔
│   └── .spectral.yaml      # Spectral 規則配置
├── orval.config.ts         # Orval 配置
├── wrangler.toml           # Wrangler 配置（包含 D1 綁定）
├── package.json
└── README.md
```

## 部署與環境管理

### 環境配置

本專案支援三個環境：

- **Development（本地）**: `http://localhost:8787`
- **Staging**: `https://api-staging.example.com`
- **Production**: `https://api.example.com`（尚未配置）

### 初始化 Staging 環境

#### 1. 建立 Cloudflare 資源

```bash
# 登入 Cloudflare
wrangler login && wrangler whoami

# 建立 Staging D1 Database
wrangler d1 create pos-db-staging
# 輸出會包含 database_id，記錄下來

# 建立 Staging R2 Bucket
wrangler r2 bucket create pos-assets-staging
```

#### 2. 更新 `wrangler.toml`

將 D1 Database ID 填入 `wrangler.toml` 中的 `[env.staging.d1_databases]` 區塊：

```toml
[[env.staging.d1_databases]]
binding = "DB"
database_name = "pos-db-staging"
database_id = "<填入上一步取得的 database_id>"
migrations_dir = "migrations"
```

#### 3. 執行資料庫遷移

```bash
# 套用 migrations 到 Staging
pnpm run d1:migrate:staging

# 匯入測試資料（選用）
pnpm run d1:seed:staging
```

#### 4. 部署到 Staging

```bash
# 部署後端到 Staging
pnpm run deploy:staging
```

### 部署指令

```bash
# 本地開發
pnpm run dev

# 部署到 Staging
pnpm run deploy:staging

# 部署到 Production（尚未配置）
# pnpm run deploy:prod
```

### 環境變數管理

#### wrangler.toml 中的環境變數

```toml
[env.staging]
vars = { 
  ENV_NAME = "staging", 
  API_BASE = "https://api-staging.example.com", 
  CORS_ORIGINS = "http://localhost:3000,https://app-staging.example.com" 
}
```

#### CORS 配置

CORS 來源從 `CORS_ORIGINS` 環境變數讀取，支援多個來源（逗號分隔）：

- **Development**: `http://localhost:3000`
- **Staging**: `http://localhost:3000,https://app-staging.example.com`
- **Production**: `https://app.example.com`

修改 CORS 後需要重新部署。

### 健康檢查與版本資訊

#### GET `/health`

回傳系統健康狀態，包含：
- `ok`: 健康狀態（boolean）
- `env`: 環境名稱（development/staging/production）
- `git_sha`: Git commit SHA（選用，由 CI/CD 注入）
- `d1_status`: D1 資料庫狀態（ok/error）
- `now_utc`: 當前時間（UTC）
- `now_local`: 本地時間（Asia/Taipei）

範例：
```json
{
  "ok": true,
  "env": "staging",
  "git_sha": "abc123",
  "d1_status": "ok",
  "now_utc": "2025-09-30T03:00:00.000Z",
  "now_local": "2025-09-30 11:00:00"
}
```

#### GET `/version`

回傳版本資訊：
- `version`: 版本號
- `env`: 環境名稱
- `git_sha`: Git commit SHA（選用）

範例：
```json
{
  "version": "1.0.0",
  "env": "staging",
  "git_sha": "abc123"
}
```

### D1 資料庫管理

#### 本地開發

```bash
# 套用 migrations
pnpm run d1:apply

# 重置資料庫
pnpm run d1:reset

# 匯入測試資料
pnpm run d1:seed:full

# 開啟 D1 控制台
pnpm run d1:console
```

#### Staging 環境

```bash
# 套用 migrations 到 Staging
pnpm run d1:migrate:staging

# 匯入資料到 Staging
pnpm run d1:seed:staging
```

#### Migration 注意事項

- Migrations 必須可多次重跑（冪等性）
- 使用 `IF NOT EXISTS` 確保安全性
- 新增 migration 後需要在各環境執行
- DB 觸發器是最後防線，服務層應先行檢查

### 常見問題

#### Health Check 失敗（d1_status: error）

**原因**: 本地 D1 資料庫的 migrations 尚未套用，或資料庫檔案損壞

**解決方案**:
1. 執行快速設置腳本：`bash scripts/setup-local.sh`
2. 或手動套用 migrations：`pnpm wrangler d1 migrations apply DB --local`
3. 確認沒有其他進程佔用 8787 端口：`lsof -ti:8787`
4. 重新啟動開發伺服器：`pnpm run dev`

**驗證修復**:
```bash
curl http://localhost:8787/health
# 應該回傳: {"ok": true, "d1_status": "ok", ...}
```

#### 部署後 API 回傳 HTML 而非 JSON

**原因**: 前端請求的 URL 路徑錯誤，被 Cloudflare Pages 路由到前端應用

**解決方案**:
1. 確認前端 `VITE_API_BASE_URL` 正確指向 API 子網域
2. 確認 DNS 已正確設定 `api-staging.example.com`
3. 檢查瀏覽器 Network 標籤中的請求 URL

#### 403 CORS 錯誤

**原因**: 前端域名不在 CORS 白名單中

**解決方案**:
1. 檢查 `wrangler.toml` 中的 `CORS_ORIGINS` 設定
2. 確認包含正確的前端域名（含協議，如 `https://`）
3. 修改後需要重新部署: `pnpm run deploy:staging`

#### D1 Migration 失敗

**原因**: Database ID 不正確或 migrations 語法錯誤

**解決方案**:
1. 確認 `wrangler.toml` 中的 `database_id` 正確
2. 檢查 SQL 語法是否正確
3. 確保 migrations 具有冪等性

### 日誌規範

所有日誌都會包含環境前綴：
```
[development] GET /api/users 200 OK (15ms)
[staging] GET /health 200 OK (5ms)
[production] POST /api/orders 201 Created (28ms)
```

## 授權

MIT License
