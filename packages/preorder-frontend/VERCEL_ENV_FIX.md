# 🔧 Vercel 環境變數修正指南

## ⚠️ 重要發現

從截圖中看到，您設定的環境變數名稱有誤：

### ❌ 錯誤的變數名稱
- `VITE_API_BASE` ← 這個是錯誤的

### ✅ 正確的變數名稱
- `VITE_API_BASE_URL` ← 必須使用這個名稱

## 🔧 修正步驟

### 步驟 1：刪除錯誤的環境變數

1. 進入 Vercel Dashboard → `pos-preorder-frontend` 專案
2. 前往 **Settings** → **Environment Variables**
3. 找到 `VITE_API_BASE`
4. 點擊 **⋯** → **Delete** 刪除它

### 步驟 2：添加正確的環境變數

添加以下環境變數（**必須包含所有必要的變數**）：

#### 必需的環境變數

```env
VITE_API_BASE_URL=https://pos-backend-staging.survey-api.workers.dev
```

#### 建議的環境變數（用於 LIFF）

```env
VITE_ENV=staging
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=你的-LIFF-ID（您已經設定了）
```

### 步驟 3：確認環境變數完整列表

請確認以下環境變數都已設定：

| 變數名稱 | 值 | 狀態 |
|---------|-----|------|
| `VITE_API_BASE_URL` | `https://pos-backend-staging.survey-api.workers.dev` | ⚠️ **需要添加** |
| `VITE_ENV` | `staging` | ⚠️ 建議添加 |
| `VITE_ENABLE_LIFF` | `true` | ⚠️ 建議添加 |
| `VITE_LIFF_ID` | 您的 LIFF ID | ✅ 已設定 |

### 步驟 4：選擇正確的環境

在添加環境變數時，請確保：
- **Production** 環境：使用 production 後端 URL
- **Preview** 環境：使用 staging 後端 URL

### 步驟 5：重新部署

1. 刪除舊的環境變數並添加新的後
2. 前往 **Deployments** 頁面
3. 找到最新的部署
4. 點擊 **⋯** → **Redeploy**
5. 或在重新部署前，確保選擇正確的環境變數套用到哪些環境

## ✅ 驗證

重新部署後，打開瀏覽器 Console，執行：

```javascript
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);
```

應該顯示：
```
API Base URL: https://pos-backend-staging.survey-api.workers.dev
```

而不是：
```
API Base URL: undefined
```

## 🚨 常見錯誤

1. **變數名稱拼寫錯誤**
   - ❌ `VITE_API_BASE`
   - ✅ `VITE_API_BASE_URL`

2. **忘記重新部署**
   - 環境變數修改後必須重新部署才會生效

3. **環境選擇錯誤**
   - 確保 Production/Preview 環境都正確設定了對應的變數

## 📝 完整環境變數設定範例

### Production 環境

```env
VITE_API_BASE_URL=https://pos-backend-prod.survey-api.workers.dev
VITE_ENV=production
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=您的-Production-LIFF-ID
```

### Preview/Staging 環境

```env
VITE_API_BASE_URL=https://pos-backend-staging.survey-api.workers.dev
VITE_ENV=staging
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=您的-Staging-LIFF-ID
```

