# SDK 環境變數配置

## 📌 環境變數優先級

SDK 會依照以下順序讀取 API Base URL：

1. **`VITE_API_BASE_URL`** - Vite 前端專案（瀏覽器環境）
2. **`SDK_BASE_URL`** - Node.js 環境（測試或 SSR）
3. **預設值** - `http://localhost:8787`（本地開發）

---

## 🔧 前端配置

在 `packages/frontend/` 目錄下創建對應的環境檔案：

### 開發環境 (`.env.local`)
```env
VITE_API_BASE_URL=http://localhost:8787
```

### Staging 環境 (`.env.staging`)
```env
VITE_API_BASE_URL=https://api-staging.example.com
```

### Production 環境 (`.env.production`)
```env
VITE_API_BASE_URL=https://api.example.com
```

---

## 🚀 使用方式

### 本地開發
```bash
cd packages/frontend
pnpm run dev
# 使用 .env.local 或預設值 http://localhost:8787
```

### Staging 部署
```bash
cd packages/frontend
pnpm run build --mode staging
# 使用 .env.staging
```

### Production 部署
```bash
cd packages/frontend
pnpm run build --mode production
# 使用 .env.production
```

---

## ✅ 優點

1. **一份 SDK，多環境共用** - 不需要為每個環境重新生成 SDK
2. **符合 SSOT 原則** - API 規格（OpenAPI）是唯一真相來源
3. **環境隔離** - 各環境配置獨立，不會互相干擾
4. **易於維護** - 只需修改 `.env.*` 檔案，不需要改代碼

---

## 🔄 何時需要重新生成 SDK？

**只有以下情況需要重新生成 SDK：**

1. 後端 API 規格（OpenAPI）變更
2. 修改 Zod schema
3. 新增/刪除 API 端點

**不需要重新生成 SDK 的情況：**

1. 切換環境（dev → staging → prod）
2. 修改 API Base URL
3. 修改 CORS 設定

---

## 📝 注意事項

1. `.env.local` 僅用於本地開發，不要提交到 Git
2. `.env.staging` 和 `.env.production` 可以提交（不包含敏感資訊的話）
3. Cloudflare Workers 部署時，URL 通常是固定的（例如：`https://your-worker.workers.dev`）
4. 確保 CORS 設定允許對應環境的前端域名
