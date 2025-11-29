# Vercel 環境變數設定指南

## 📋 問題說明

如果部署到 Vercel 後，前端仍嘗試連接 `http://localhost:8787`，表示環境變數未正確設定。

## 🔧 在 Vercel 設定環境變數

### 步驟 1：進入 Vercel 專案設定

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 選擇專案：`pos-preorder-frontend`
3. 點擊 **Settings** → **Environment Variables**

### 步驟 2：添加環境變數

添加以下環境變數（根據環境選擇對應的值）：

#### Staging 環境

```env
VITE_API_BASE_URL=https://pos-backend-staging.survey-api.workers.dev
VITE_ENV=staging
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=你的-LIFF-ID
```

#### Production 環境

```env
VITE_API_BASE_URL=https://pos-backend-prod.survey-api.workers.dev
VITE_ENV=production
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=你的-LIFF-ID
```

### 步驟 3：選擇環境

在 Vercel 環境變數設定中：
- 選擇對應的 **Environment**（Production、Preview、Development）
- 建議：
  - **Production**: 使用 production 值
  - **Preview**: 使用 staging 值（用於 PR preview）
  - **Development**: 可選，通常不需要（本地開發用）

### 步驟 4：重新部署

設定完成後：
1. 前往 **Deployments** 頁面
2. 找到最新的部署
3. 點擊 **⋯** → **Redeploy**
4. 或直接推送新的 commit 觸發重新部署

## ✅ 驗證設定

部署完成後，打開瀏覽器開發工具（Console），應該看到：
- ✅ 不再有 `ERR_CONNECTION_REFUSED` 錯誤
- ✅ API 請求指向正確的 staging/production URL
- ✅ 可以正常載入預購檔期資料

## 🚨 常見問題

### 問題 1：環境變數設定後仍然錯誤

**解決方法**：
1. 確認環境變數名稱正確（必須以 `VITE_` 開頭）
2. 確認已選擇正確的環境（Production/Preview）
3. 確認已重新部署（環境變數變更需要重新部署才會生效）

### 問題 2：如何知道當前使用的 API URL？

在瀏覽器 Console 中執行：
```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

或在代碼中檢查：
```typescript
const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
console.log('Using API Base:', apiBase);
```

## 📝 環境變數說明

| 變數 | 說明 | 必填 | 範例 |
| --- | --- | --- | --- |
| `VITE_API_BASE_URL` | 後端 API 基底 URL | ✅ 是 | `https://pos-backend-staging.survey-api.workers.dev` |
| `VITE_ENV` | 環境標識 | 建議 | `staging` / `production` |
| `VITE_ENABLE_LIFF` | 是否啟用 LIFF | 建議 | `true` / `false` |
| `VITE_LIFF_ID` | LINE LIFF ID | 選填 | 如果啟用 LIFF 則必填 |

## 🔗 相關連結

- [Vercel 環境變數文檔](https://vercel.com/docs/concepts/projects/environment-variables)
- [Staging 後端 URL](https://pos-backend-staging.survey-api.workers.dev)
- [Production 後端 URL](https://pos-backend-prod.survey-api.workers.dev)

