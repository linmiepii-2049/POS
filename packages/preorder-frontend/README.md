# 預購前台應用程式

獨立的預購網站，使用 Vite + React + TypeScript + Tailwind 建置，串接 `@pos/sdk` 以顯示當前檔期並建立預購訂單。

## 環境變數

| 變數 | 說明 | 預設值 |
| --- | --- | --- |
| `VITE_API_BASE_URL` | 後端 API 基底 URL | `http://localhost:8787` |

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

## 測試

使用 Vitest + Testing Library，主要覆蓋：

- 檔期資訊渲染
- 表單提交流程與 API 呼叫



