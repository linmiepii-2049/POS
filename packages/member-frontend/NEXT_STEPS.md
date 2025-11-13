# Member Frontend 後續步驟

## ✅ 已完成

1. ✅ Vercel 專案已建立
2. ✅ 環境變數已設定（VITE_API_BASE, VITE_LIFF_ID）
3. ✅ 專案已部署到 Vercel

## 📋 接下來需要做的事

### 1. 取得 Vercel 部署 URL

在 Vercel Dashboard 中：
- 進入你的專案
- 查看 "Deployments" 頁面
- 複製 Production 部署的 URL（格式：`https://pos-member-frontend.vercel.app` 或類似）

### 2. 更新後端 CORS 設定

編輯 `packages/backend/wrangler.toml`：

**Staging 環境**（第 36 行）：
```toml
vars = { 
  ENV_NAME = "staging", 
  API_BASE = "https://pos-backend-staging.survey-api.workers.dev", 
  CORS_ORIGINS = "http://localhost:3000,http://localhost:3001,http://localhost:3002,https://pos-frontend-staging.pages.dev,https://linmiepii-2049.github.io,https://你的-vercel-域名.vercel.app" 
}
```

**Production 環境**（第 61 行）：
```toml
vars = { 
  ENV_NAME = "production", 
  API_BASE = "https://pos-backend-prod.survey-api.workers.dev", 
  CORS_ORIGINS = "https://pos-frontend-prod.pages.dev,https://linmiepii-2049.github.io,https://你的-vercel-域名.vercel.app" 
}
```

### 3. 重新部署後端

```bash
cd packages/backend

# 部署 Staging
pnpm run deploy:staging

# 或部署 Production（如果需要）
pnpm run deploy:production
```

### 4. 在 LINE Developers Console 設定 LIFF Endpoint

1. 登入 [LINE Developers Console](https://developers.line.biz/console/)
2. 選擇你的 Provider 和 Channel
3. 進入 "LIFF" 頁面
4. 新增或編輯 LIFF App：
   - **LIFF app name**: 會員資訊查詢（或你喜歡的名稱）
   - **Size**: Full（全螢幕）
   - **Endpoint URL**: `https://你的-vercel-域名.vercel.app`
   - **Scope**: profile, openid
   - **Bot link feature**: 啟用（如果需要）

5. 複製新的 LIFF ID
6. 更新 Vercel 環境變數中的 `VITE_LIFF_ID`

### 5. 測試應用

1. 在 LINE 中開啟 LIFF App
2. 確認可以正常載入
3. 測試會員資訊查詢功能
4. 檢查點數和訂單記錄是否正常顯示

## 🔍 故障排除

### CORS 錯誤

如果看到 CORS 錯誤：
1. 確認後端 CORS_ORIGINS 已包含 Vercel 域名
2. 確認後端已重新部署
3. 檢查 Vercel 域名是否正確（包含 `https://`）

### LIFF 初始化失敗

1. 確認 VITE_LIFF_ID 在 Vercel 環境變數中正確設定
2. 確認 LIFF Endpoint URL 與 Vercel 部署 URL 一致
3. 確認在 LINE 環境中開啟（不是一般瀏覽器）

### API 呼叫失敗

1. 確認 VITE_API_BASE 指向正確的後端 URL
2. 檢查瀏覽器 Console 是否有錯誤訊息
3. 確認後端 API 正常運作

## 📝 檢查清單

- [ ] 取得 Vercel 部署 URL
- [ ] 更新後端 CORS 設定（加入 Vercel 域名）
- [ ] 重新部署後端
- [ ] 在 LINE Developers Console 設定 LIFF Endpoint
- [ ] 更新 Vercel 環境變數中的 LIFF ID（如果需要）
- [ ] 測試應用功能

## 🎉 完成後

應用應該可以正常運作！用戶可以透過 LINE 開啟 LIFF App，查看自己的會員資訊、點數和購買記錄。

