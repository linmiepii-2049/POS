# Survey 問卷調查整合文件

## 📋 整合概述

本專案已成功整合 LIFF 問卷調查系統到 POS 專案中，採用前後端分離架構：

- **Survey 前端**: 獨立部署到 GitHub Pages（`packages/survey-frontend/`）
- **POS 後端**: 統一的 API 端點，提供問卷 API（`packages/backend/`）
- **共用 SDK**: 兩個前端使用相同的 SDK（`packages/sdk/`）

## 🏗️ 架構圖

```
┌─────────────────────────────────────────┐
│  LINE User (LIFF App)                   │
└────────────────┬────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────┐
│  Survey Frontend                        │
│  (GitHub Pages)                         │
│  https://username.github.io/POS/   │
└────────────────┬────────────────────────┘
                 │
                 │ POST /api/surveys
                 v
┌─────────────────────────────────────────┐
│  POS Backend API                        │
│  (Cloudflare Workers)                   │
│  統一的 API 端點                         │
└────────────────┬────────────────────────┘
                 │
                 v
┌─────────────────────────────────────────┐
│  D1 Database                            │
│  - users                                │
│  - survey_responses (new)               │
│  - orders, products...                  │
└─────────────────────────────────────────┘
```

## 📦 專案結構

```
POS_0922/
├── packages/
│   ├── backend/                  # Cloudflare Workers 後端
│   │   ├── migrations/
│   │   │   └── 0019_add_survey_responses.sql  # 新增問卷表
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   │   └── surveys.ts   # 問卷 API 路由
│   │   │   ├── services/
│   │   │   │   └── surveys.ts   # 問卷業務邏輯
│   │   │   └── zod/
│   │   │       └── surveys.ts   # 問卷資料驗證
│   │   └── wrangler.toml        # 已更新 CORS 設定
│   │
│   ├── frontend/                 # POS 前端 (Cloudflare Pages)
│   │   └── ...                  # 保持不變
│   │
│   ├── survey-frontend/          # 🆕 Survey 前端 (GitHub Pages)
│   │   ├── src/
│   │   │   ├── components/      # React 元件
│   │   │   ├── hooks/           # useLiff Hook
│   │   │   ├── api/             # API 客戶端
│   │   │   ├── App.tsx
│   │   │   └── main.tsx
│   │   ├── package.json
│   │   ├── vite.config.ts
│   │   └── README.md
│   │
│   └── sdk/                      # 共用 SDK
│       └── ...                  # 保持不變
│
└── .github/
    └── workflows/
        └── deploy-survey.yml     # 🆕 Survey 自動部署
```

## 🚀 部署指南

### 1. 後端部署

#### 執行 Migration

```bash
cd packages/backend

# 本地開發（執行 migration）
pnpm wrangler d1 execute pos-local --local --file=migrations/0019_add_survey_responses.sql

# Staging 環境
pnpm wrangler d1 execute pos-db-staging --remote --file=migrations/0019_add_survey_responses.sql --env staging

# Production 環境
pnpm wrangler d1 execute pos-db-prod --remote --file=migrations/0019_add_survey_responses.sql --env production
```

#### 產生 OpenAPI 和 SDK

```bash
cd packages/backend

# 產生 OpenAPI 文件
pnpm run openapi

# 驗證 OpenAPI（確保無錯誤）
npx @stoplight/spectral-cli lint docs/openapi.json --ruleset docs/.spectral.yaml

# 產生 SDK
pnpm run gen-sdk
```

#### 部署後端

```bash
# Staging
pnpm wrangler deploy --env staging

# Production
pnpm wrangler deploy --env production
```

### 2. Survey 前端部署

#### 本地測試

```bash
cd packages/survey-frontend

# 安裝依賴
pnpm install

# 本地開發（port 3001）
pnpm dev

# 建置測試
pnpm build:gh-pages
```

#### GitHub Pages 設定

1. **啟用 GitHub Pages**
   - 前往 GitHub Repository → Settings → Pages
   - Source: 選擇 `GitHub Actions`

2. **設定 Secrets**
   - Settings → Secrets and variables → Actions
   - 新增以下 secrets:
     - `VITE_API_BASE_PROD`: `https://pos-backend-prod.survey-api.workers.dev`
     - `VITE_LIFF_ID`: `2007900041-O9ayn5JW`（你的 LIFF ID）

3. **更新 CORS**
   - 編輯 `packages/backend/wrangler.toml`
   - 將 `YOUR_USERNAME` 替換成你的 GitHub username
   - 例如: `https://your-username.github.io`

4. **部署**
   - 推送到 `main` 分支即可自動部署
   - 或手動觸發: Actions → Deploy Survey Frontend → Run workflow

### 3. LIFF 設定

在 [LINE Developers Console](https://developers.line.biz/) 中設定：

1. 前往你的 LIFF 應用
2. 更新 Endpoint URL:
   ```
   https://YOUR_USERNAME.github.io/POS/
   ```
3. 確認 Scope 包含: `profile`, `openid`

## 🔧 環境變數設定

### Backend (`packages/backend/wrangler.toml`)

```toml
# 開發環境
[vars]
CORS_ORIGINS = "http://localhost:3000,http://localhost:3001"

# Staging
[env.staging]
vars = { 
  CORS_ORIGINS = "http://localhost:3000,http://localhost:3001,https://pos-frontend-staging.pages.dev" 
}

# Production
[env.production]
vars = { 
  CORS_ORIGINS = "https://pos-frontend-prod.pages.dev,https://YOUR_USERNAME.github.io" 
}
```

### Survey Frontend 環境變數

建立以下檔案（.env.* 檔案會被 .gitignore 忽略，需要手動建立）:

**`.env.development`**
```bash
VITE_API_BASE=http://localhost:8787
VITE_LIFF_ID=2007900041-O9ayn5JW
```

**`.env.production`** (GitHub Actions 會自動建立)
```bash
VITE_API_BASE=https://pos-backend-prod.survey-api.workers.dev
VITE_LIFF_ID=2007900041-O9ayn5JW
```

## 📡 API 端點

### Survey APIs

| 方法 | 路徑 | 說明 |
|------|------|------|
| `POST` | `/api/surveys` | 提交問卷 |
| `GET` | `/api/surveys/{memberId}` | 查詢問卷（根據手機號碼） |
| `GET` | `/api/surveys` | 查詢問卷列表（支援分頁/篩選） |
| `GET` | `/api/surveys/stats/summary` | 問卷統計資料 |
| `DELETE` | `/api/surveys/:id` | 刪除問卷（管理功能） |

### 提交問卷範例

```bash
curl -X POST https://pos-backend-prod.survey-api.workers.dev/api/surveys \
  -H "Content-Type: application/json" \
  -d '{
    "memberId": "0912345678",
    "phone": "0912345678",
    "age": "26-45歲",
    "gender": "男",
    "location": "附近",
    "purchaseFrequency": "每週1~3次",
    "purchaseLocation": ["麵包店", "便利商店"],
    "lineUserId": "U1234567890abcdef",
    "displayName": "王小明"
  }'
```

## 🗄️ 資料庫結構

### survey_responses 表

| 欄位 | 型別 | 說明 |
|------|------|------|
| `id` | INTEGER | 主鍵 |
| `member_id` | TEXT | 會員 ID（手機號碼）UNIQUE |
| `phone` | TEXT | 手機號碼 |
| `age` | TEXT | 年齡範圍 |
| `gender` | TEXT | 性別 |
| `location` | TEXT | 居住地 |
| `purchase_frequency` | TEXT | 購買頻率 |
| `purchase_location` | TEXT | 購買地點（JSON） |
| `purchase_time` | TEXT | 購買時間 |
| `meal_type` | TEXT | 用餐時機 |
| `purchase_factors` | TEXT | 選購考量（JSON） |
| `health_price` | TEXT | 健康考量 |
| `natural_preference` | TEXT | 天然食材偏好 |
| `taste_preference` | TEXT | 口味偏好（JSON） |
| `bread_types` | TEXT | 麵包種類（JSON） |
| `bread_types_other` | TEXT | 其他麵包種類 |
| `favorite_bread` | TEXT | 最喜歡的麵包 |
| `desired_bread` | TEXT | 想吃的麵包 |
| `line_user_id` | TEXT | LINE 用戶 ID |
| `display_name` | TEXT | LINE 顯示名稱 |
| `user_id` | INTEGER | 關聯到 users 表 |
| `created_at` | TEXT | 建立時間（UTC） |
| `updated_at` | TEXT | 更新時間（UTC） |

## 🧪 測試

### 本地測試流程

1. **啟動後端**
   ```bash
   cd packages/backend
   pnpm dev  # port 8787
   ```

2. **啟動 Survey 前端**
   ```bash
   cd packages/survey-frontend
   pnpm dev  # port 3001
   ```

3. **測試 LIFF**
   - 使用 ngrok 或類似工具將本地服務暴露到公網
   - 在 LINE Developers Console 設定臨時 Endpoint URL
   - 從 LINE 應用開啟測試

### API 測試

```bash
# 健康檢查
curl http://localhost:8787/health

# 提交問卷
curl -X POST http://localhost:8787/api/surveys \
  -H "Content-Type: application/json" \
  -d @test-survey.json

# 查詢問卷
curl http://localhost:8787/api/surveys/0912345678

# 問卷列表
curl "http://localhost:8787/api/surveys?page=1&limit=20"

# 問卷統計
curl http://localhost:8787/api/surveys/stats/summary
```

## 📝 維護注意事項

### 更新 Schema 流程

1. 修改 `packages/backend/src/zod/surveys.ts`
2. 執行 `pnpm run openapi` 產生新的 OpenAPI 文件
3. 執行 `pnpm run gen-sdk` 更新 SDK
4. 如需修改資料庫結構，建立新的 migration

### 新增問卷欄位

1. 建立新的 migration（例如：`0020_add_survey_field.sql`）
2. 更新 `src/zod/surveys.ts` Schema
3. 更新 `src/services/surveys.ts` 處理邏輯
4. 更新 Survey 前端表單元件
5. 執行 migration 和重新產生 SDK

### CORS 問題排查

如果遇到 CORS 錯誤：

1. 確認 `wrangler.toml` 的 `CORS_ORIGINS` 包含前端域名
2. 確認 Survey 前端的 `VITE_API_BASE` 設定正確
3. 檢查瀏覽器開發者工具的 Network 標籤
4. 確認 OPTIONS 預檢請求回傳 204

## 🔗 相關連結

- **POS Backend API**: https://pos-backend-prod.survey-api.workers.dev
- **Survey Frontend**: https://YOUR_USERNAME.github.io/POS/
- **LINE Developers Console**: https://developers.line.biz/
- **LIFF Documentation**: https://developers.line.biz/en/docs/liff/

## 📞 支援

如有問題，請參考：

- `packages/backend/README.md` - 後端文件
- `packages/survey-frontend/README.md` - Survey 前端文件
- `packages/backend/TROUBLESHOOTING.md` - 故障排除

---

**最後更新**: 2025-01-12
**版本**: 1.0.0

