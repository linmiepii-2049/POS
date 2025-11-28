# 預購前台應用程式

獨立的預購網站，使用 Vite + React + TypeScript + Tailwind 建置，串接 `@pos/sdk` 以顯示當前檔期並建立預購訂單。

## 環境變數

| 變數 | 說明 | 預設值 | 備註 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 後端 API 基底 URL | `http://localhost:8787` | 必填 |
| `VITE_LIFF_ID` | LINE LIFF ID | - | 僅在需要 LIFF 時設定（staging/production） |
| `VITE_ENABLE_LIFF` | 是否啟用 LIFF | `false` | `'true'` 或 `'false'`，明確控制是否啟用 LIFF |
| `VITE_ENV` | 環境標識 | - | `'dev'` / `'staging'` / `'production'`，用於自動判斷是否需要 LIFF |

### 環境配置範例

**開發環境（dev）- 不需要 LIFF：**
```bash
VITE_API_BASE_URL=http://localhost:8787
VITE_ENV=dev
VITE_ENABLE_LIFF=false
# VITE_LIFF_ID 不需要設定
```

**Staging 環境 - 需要 LIFF：**
```bash
VITE_API_BASE_URL=https://your-staging-api.com
VITE_ENV=staging
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=your-liff-id-here
```

### LIFF 啟用邏輯

1. 如果明確設定了 `VITE_ENABLE_LIFF`，則使用該值
2. 如果未設定 `VITE_ENABLE_LIFF`，則根據 `VITE_ENV` 判斷：
   - `dev` 或 `development`：不啟用 LIFF
   - `staging` 或 `production`：如果有 `VITE_LIFF_ID` 則啟用 LIFF
3. 如果啟用 LIFF 但未設定 `VITE_LIFF_ID`，會顯示錯誤訊息但不會阻止頁面顯示

## 開發指令

```bash
# 安裝依賴
pnpm install

# 啟動本地開發伺服器（預設 http://localhost:3100）
pnpm --filter @pos/preorder-frontend dev

# 編譯正式版
pnpm --filter @pos/preorder-frontend build

# 執行測試
pnpm --filter @pos/preorder-frontend test

# 型別檢查 / Lint
pnpm --filter @pos/preorder-frontend typecheck
pnpm --filter @pos/preorder-frontend lint
```

## 功能說明

- 從 `/api/preorders/active` 取得目前唯一有效檔期，顯示商品名稱、文案、備註與剩餘名額
- 支援輸入備註、取餐時段、預購數量並呼叫 `/api/preorders/order`
- 成功建立訂單後顯示成功卡片並觸發 `react-hot-toast` 網站通知
- 透過 React Query 管理快取，避免重複請求
- **LIFF 整合**：根據環境變數自動判斷是否需要 LINE 登入
  - 開發環境：不需要 LINE 登入即可使用
  - Staging/Production：需要 LINE 登入才能使用

## 測試

使用 Vitest + Testing Library，主要覆蓋：

- 檔期資訊渲染
- 表單提交流程與 API 呼叫



