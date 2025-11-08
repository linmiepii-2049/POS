# 前端環境變數設定

## 📝 環境變數檔案

請在 `packages/frontend/` 目錄下創建以下檔案：

### 開發環境 (`.env.local`)

```env
# API Base URL（本地開發）
VITE_API_BASE_URL=http://localhost:8787
```

### Staging 環境 (`.env.staging`)

```env
# API Base URL（Staging 環境）
VITE_API_BASE_URL=https://api-staging.example.com
```

### Production 環境 (`.env.production`)

```env
# API Base URL（Production 環境）
VITE_API_BASE_URL=https://api.example.com
```

---

## 🚀 使用方式

### 本地開發
```bash
pnpm run dev
# 使用 .env.local 或預設值 http://localhost:8787
```

### Staging 部署
```bash
pnpm run build --mode staging
# 使用 .env.staging
```

### Production 部署
```bash
pnpm run build --mode production
# 使用 .env.production
```

---

## ⚠️ 注意事項

1. `.env.local` 僅用於本地開發，**不要提交到 Git**
2. `.env.staging` 和 `.env.production` 可以提交（不包含敏感資訊）
3. Vite 會在編譯時將環境變數注入到代碼中
4. 環境變數必須以 `VITE_` 開頭才能在前端使用
