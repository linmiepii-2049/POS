# 真真家 POS 系統 - PWA 前端應用

## 概述

真真家 POS 系統是一個基於 React + TypeScript + Vite 的現代化 Progressive Web App (PWA)，支援離線使用、桌面安裝，並提供完整的點餐與管理功能。

## PWA 功能特色

### 🚀 核心 PWA 功能
- ✅ **離線支援**: 完整的 Service Worker 快取策略
- ✅ **桌面安裝**: 支援 iOS/Android/Windows 桌面安裝
- ✅ **離線頁面**: 優雅的離線體驗與連線狀態提示
- ✅ **自動更新**: 新版本自動提示與更新
- ✅ **快取策略**: 智能快取 API 與靜態資源

### 📱 平台支援
- **iOS Safari**: 完整的 PWA 支援，可安裝到主畫面
- **Android Chrome**: 原生 PWA 體驗，支援推送通知
- **Windows Edge**: 完整的 PWA 功能，可安裝為應用程式
- **桌面瀏覽器**: 響應式設計，適配各種螢幕尺寸

### 🔧 開發工具
- **Icons 生成**: 自動生成各種尺寸的 PWA icons
- **健康檢查**: API 連線狀態與 CORS 設定檢查
- **自動修復**: Icons 損壞時自動重新生成
- **品質驗證**: Lighthouse PWA 分數檢查

## 快速開始

### 安裝依賴

```bash
pnpm install
```

### PWA 準備工作

```bash
# 生成 PWA icons
pnpm run pwa:icons

# 驗證 icons 完整性
pnpm run pwa:icons:verify

# 檢查 API 連線狀態
pnpm run pwa:api:check

# 執行完整的 PWA 準備流程
pnpm run pwa:prep
```

### 開發模式

```bash
# 啟動開發伺服器 (localhost:3000)
pnpm run dev

# 類型檢查
pnpm run typecheck

# 程式碼檢查
pnpm run lint

# 執行測試
pnpm run test
```

### 建置與預覽

```bash
# 建置 PWA 應用
pnpm run build

# 預覽建置結果
pnpm run preview

# 完整的 PWA 建置與預覽流程
pnpm run pwa:full
```

## PWA 安裝指南

### iOS Safari 安裝

1. 在 Safari 中開啟應用程式
2. 點擊分享按鈕 (📤)
3. 選擇「加入主畫面」
4. 確認安裝，應用程式圖示將出現在主畫面

**注意**: iOS 的 PWA 限制：
- 不支援推送通知
- 某些 API 功能受限
- 需要手動重新整理來檢查更新

### Android Chrome 安裝

1. 在 Chrome 中開啟應用程式
2. 瀏覽器會自動顯示安裝橫幅
3. 點擊「安裝」按鈕
4. 或點擊選單中的「安裝應用程式」

**Android 優勢**：
- 完整的 PWA 功能支援
- 支援推送通知
- 自動更新機制

### Windows Edge 安裝

1. 在 Edge 中開啟應用程式
2. 點擊網址列右側的「安裝」圖示
3. 確認安裝選項
4. 應用程式將安裝為桌面應用程式

## 技術架構

### 前端技術棧
- **React 18**: 現代化 UI 框架
- **TypeScript**: 類型安全的 JavaScript
- **Vite**: 快速的建置工具
- **Tailwind CSS**: 實用優先的 CSS 框架
- **React Router**: 客戶端路由
- **React Query**: 伺服器狀態管理
- **React Hook Form**: 表單處理

### PWA 技術
- **Service Worker**: 離線快取與背景同步
- **Web App Manifest**: PWA 配置與安裝
- **Cache API**: 智能快取策略
- **Background Sync**: 背景資料同步
- **Push Notifications**: 推送通知 (Android)

### 快取策略
- **靜態資源**: Cache First (JS, CSS, 圖片)
- **API 請求**: Network First (產品資料、訂單)
- **頁面請求**: Network First + Offline Fallback
- **版本控制**: 自動快取失效與更新

## API 配置

### 環境變數

建立 `.env` 檔案：

```env
# API 配置
VITE_API_BASE_URL=http://localhost:8787
VITE_API_TIMEOUT=5000

# 應用程式配置
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=真真家

# 開發模式
VITE_DEV_MODE=true
VITE_DEBUG=false

# 生產環境 (取消註解)
# VITE_API_BASE_URL=https://api.example.com
# VITE_DEV_MODE=false
```

### CORS 設定

確保後端 API 正確設定 CORS：

```typescript
// wrangler.toml 或後端設定
[[headers]]
for = "/*"
[headers.values]
Access-Control-Allow-Origin = "http://localhost:3000"
Access-Control-Allow-Methods = "GET, POST, PUT, DELETE, OPTIONS"
Access-Control-Allow-Headers = "Content-Type, Authorization"
Access-Control-Allow-Credentials = "true"
```

## 部署指南

### Cloudflare Pages 部署

1. **建置設定**:
   ```
   Build command: pnpm run build
   Build output directory: dist
   Root directory: packages/frontend
   ```

2. **環境變數**:
   ```
   VITE_API_BASE_URL=https://api.example.com
   VITE_APP_VERSION=1.0.0
   ```

3. **自訂 Headers**:
   ```yaml
   # _headers 檔案
   /sw.js
     Cache-Control: no-cache, no-store, must-revalidate
   
   /manifest.webmanifest
     Content-Type: application/manifest+json
   
   /offline.html
     Cache-Control: no-cache
   ```

### 其他平台部署

- **Vercel**: 支援 PWA，自動 HTTPS
- **Netlify**: 完整的 PWA 支援
- **Firebase Hosting**: Google 原生 PWA 平台

## 品質檢查

### Lighthouse PWA 檢查

```bash
# 使用 Chrome DevTools
# 1. 開啟應用程式
# 2. 開啟 DevTools (F12)
# 3. 切換到 Lighthouse 分頁
# 4. 選擇 PWA 類別
# 5. 執行檢查

# 目標分數: ≥ 90
```

### 自動化檢查

```bash
# 檢查 icons 完整性
pnpm run pwa:icons:verify

# 檢查 API 連線
pnpm run pwa:api:check

# 執行所有測試
pnpm run test:run
```

## 故障排除

### 常見問題

#### 1. Icons 無法載入
```bash
# 重新生成 icons
pnpm run pwa:icons

# 驗證 icons
pnpm run pwa:icons:verify
```

#### 2. Service Worker 未註冊
- 檢查 `sw.js` 是否正確複製到 `dist` 目錄
- 確認伺服器支援 Service Worker
- 檢查 HTTPS 設定 (PWA 需要 HTTPS)

#### 3. API 連線失敗
```bash
# 檢查 API 狀態
pnpm run pwa:api:check

# 確認後端服務運行
pnpm run dev # 在後端目錄
```

#### 4. PWA 安裝失敗
- 確認 `manifest.webmanifest` 可存取
- 檢查 icons 是否正確生成
- 驗證 HTTPS 設定

#### 5. 離線功能異常
- 清除瀏覽器快取
- 檢查 Service Worker 快取策略
- 確認 `offline.html` 可存取

### 除錯工具

```bash
# 開發者工具
# 1. Application > Service Workers
# 2. Application > Manifest
# 3. Application > Storage
# 4. Network > Offline 模擬
```

## 更新 SDK

當後端 API 變更時，需要重新生成 SDK：

```bash
# 在後端目錄執行
cd ../backend

# 重新生成 OpenAPI 文件
pnpm run openapi:generate

# 執行 Spectral 檢查
pnpm run openapi:check

# 重新生成 SDK
pnpm run sdk:generate

# 回到前端目錄
cd ../frontend

# 重新安裝依賴
pnpm install
```

## 貢獻指南

### 開發流程

1. **功能開發**:
   ```bash
   # 建立功能分支
   git checkout -b feature/pwa-enhancement
   
   # 開發並測試
   pnpm run dev
   pnpm run test
   
   # 提交變更
   git add .
   git commit -m "feat: 新增 PWA 離線功能"
   ```

2. **品質檢查**:
   ```bash
   # 程式碼檢查
   pnpm run lint
   pnpm run typecheck
   
   # PWA 檢查
   pnpm run pwa:prep
   
   # 測試覆蓋率
   pnpm run test:coverage
   ```

3. **建置驗證**:
   ```bash
   # 完整建置流程
   pnpm run pwa:full
   
   # Lighthouse 檢查 (手動)
   # 目標: PWA 分數 ≥ 90
   ```

### 程式碼規範

- 使用 TypeScript 嚴格模式
- 遵循 ESLint 規則
- 編寫單元測試
- 保持 PWA 最佳實踐

## 部署與環境管理

### 環境配置

本專案支援多環境部署，透過環境變數控制 API 端點。

#### 環境變數設定

請在 `packages/frontend/` 目錄下創建以下檔案：

**開發環境 (`.env.local`)**
```env
VITE_API_BASE_URL=http://localhost:8787
```

**Staging 環境 (`.env.staging`)**
```env
VITE_API_BASE_URL=https://api-staging.example.com
```

**Production 環境 (`.env.production`)**
```env
VITE_API_BASE_URL=https://api.example.com
```

詳細說明請參考 [ENV_SETUP.md](./ENV_SETUP.md)

### 部署方式：Cloudflare Pages

#### 本地建置

```bash
# Development (使用 .env.local 或預設值)
pnpm run build

# Staging
pnpm run build --mode staging

# Production
pnpm run build --mode production
```

#### 部署到 Cloudflare Pages

```bash
# 1. 安裝 Wrangler CLI（若尚未安裝）
npm install -g wrangler

# 2. 登入 Cloudflare
wrangler login

# 3. 部署到 Pages
wrangler pages deploy dist --project-name=pos-frontend-staging

# 或使用 Cloudflare Dashboard 連接 Git 自動部署
```

### Debug Checklist

部署後若遇到問題，請依序檢查：

#### 1. 確認 API_BASE_URL 正確

```javascript
// 在瀏覽器 Console 中執行
console.log(import.meta.env.VITE_API_BASE_URL);

// 應該輸出：
// Staging: https://api-staging.example.com
// Production: https://api.example.com
```

如果輸出為 `undefined`，表示環境變數未正確設定。

#### 2. 確認 CORS_ORIGINS 正確

後端 CORS 設定必須包含前端域名：

```bash
# 檢查後端 wrangler.toml
# [env.staging]
# vars = { CORS_ORIGINS = "http://localhost:3000,https://app-staging.example.com" }
```

#### 3. 確認 SDK 已正確生成並包含在 build

```bash
# 檢查 SDK 是否存在
ls -la ../../sdk/dist/

# 重新生成 SDK（如有需要）
cd ../backend && pnpm run sdk:update
```

#### 4. 確認 /health 直接回 JSON 而非 HTML

```bash
# 測試 health endpoint
curl https://api-staging.example.com/health

# 應該回傳 JSON：
# {"ok":true,"env":"staging","d1_status":"ok",...}

# 如果回傳 HTML，表示 DNS 或路由設定錯誤
```

### 常見錯誤

#### API 請求回傳 HTML 而非 JSON

**症狀**: Console 出現 `SyntaxError: Unexpected token '<', "<!doctype "... is not valid JSON`

**原因**: 前端請求被路由到 Pages 的 HTML 而不是後端 API

**解決方案**:
1. 確認 `VITE_API_BASE_URL` 指向正確的 API 子網域（`https://api-staging.example.com`）
2. 確認 SDK 的 `createFullURL()` 正確使用環境變數
3. 確認 DNS 已設定 API 子網域指向 Workers

#### CORS 錯誤

**症狀**: Console 出現 `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**原因**: 後端 CORS 白名單未包含前端域名

**解決方案**:
1. 更新後端 `wrangler.toml` 中的 `CORS_ORIGINS`
2. 重新部署後端: `cd ../backend && pnpm run deploy:staging`

#### 健康檢查失敗

**症狀**: UI 顯示「異常」狀態

**原因**: 後端服務未啟動或 D1 資料庫連線失敗

**解決方案**:
1. 確認後端已部署: `curl https://api-staging.example.com/health`
2. 檢查 D1 Database ID 是否正確
3. 確認 migrations 已執行: `cd ../backend && pnpm run d1:migrate:staging`

## 授權

本專案採用 MIT 授權條款。

## 支援

如有問題或建議，請聯絡開發團隊或建立 Issue。
