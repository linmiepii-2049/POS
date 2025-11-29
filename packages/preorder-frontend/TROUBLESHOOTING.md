# 預購前台問題診斷指南

## 問題：新增預購活動後，LIFF 登入仍看不到

### 診斷步驟

#### 1. 檢查瀏覽器 Console 日誌

打開瀏覽器開發工具（F12），查看 Console 標籤，應該會看到以下調試信息：

```
Campaign Response: {...}
Is Loading: false
Is Error: false
Error: undefined
Full Campaign Response: {...}
Campaign Response Data: {...}
Campaign Response Status: 200
Campaign Payload: {...}
Has data field: true
Is active response: true
Campaign data: {...}
```

#### 2. 檢查 API 響應

在 Console 中執行：

```javascript
// 檢查當前使用的 API Base URL
console.log('API Base URL:', import.meta.env.VITE_API_BASE_URL);

// 手動測試 API
fetch(`${import.meta.env.VITE_API_BASE_URL || 'https://pos-backend-staging.survey-api.workers.dev'}/api/preorders/active`)
  .then(r => r.json())
  .then(data => console.log('API Response:', data));
```

#### 3. 檢查環境變數

確認 Vercel 環境變數已正確設定：

```bash
# 應該設定：
VITE_API_BASE_URL=https://pos-backend-staging.survey-api.workers.dev
VITE_ENV=staging
VITE_ENABLE_LIFF=true
VITE_LIFF_ID=你的-LIFF-ID
```

#### 4. 檢查預購檔期狀態

確認後台顯示的預購檔期：
- ✅ 狀態為「啟用中」
- ✅ 檔期日期在當前時間範圍內
- ✅ 至少有一個商品的 `remainingQuantity > 0`

#### 5. 檢查 API 響應結構

API 應該返回以下結構：

```json
{
  "success": true,
  "data": {
    "id": 1,
    "campaignName": "W52",
    "campaignCopy": "...",
    "products": [...],
    "startsAt": "...",
    "endsAt": "...",
    "isActive": true,
    ...
  },
  "timestamp": "..."
}
```

### 常見問題

#### 問題 1：Console 顯示 `ERR_CONNECTION_REFUSED`

**原因**：環境變數 `VITE_API_BASE_URL` 未設定或設定錯誤

**解決**：
1. 檢查 Vercel Dashboard → Settings → Environment Variables
2. 確認 `VITE_API_BASE_URL` 已設定為正確的 staging 後端 URL
3. 重新部署應用

#### 問題 2：API 返回 404

**原因**：沒有符合條件的活躍檔期

**檢查**：
1. 確認檔期狀態為「啟用中」
2. 確認當前時間在檔期的 `starts_at` 和 `ends_at` 之間
3. 確認至少有一個商品的 `remainingQuantity > 0`

#### 問題 3：Console 顯示響應數據，但頁面仍顯示空狀態

**原因**：響應解析邏輯問題

**檢查**：
1. 查看 Console 中的 "Campaign Payload" 日誌
2. 確認 "Has data field" 為 `true`
3. 確認 "Is active response" 為 `true`
4. 查看 "Campaign data" 是否包含正確的檔期信息

#### 問題 4：LIFF 登入後仍看不到

**原因**：可能是 LIFF 初始化或權限問題

**檢查**：
1. 確認 LIFF ID 正確設定
2. 確認頁面在 LINE App 中開啟，或使用正確的 LIFF 環境
3. 檢查 Console 是否有 LIFF 相關錯誤

### 調試工具

#### 檢查響應結構

在 Console 中執行：

```javascript
// 獲取當前查詢狀態
const queryClient = window.__REACT_QUERY_CLIENT__; // 需要在代碼中暴露
const queryKey = ['/api/preorders/active'];
const query = queryClient.getQueryState(queryKey);
console.log('Query State:', query);
```

#### 手動觸發重新查詢

在 Console 中執行：

```javascript
// 清除緩存並重新查詢
window.location.reload();
```

### 下一步

如果以上步驟都無法解決問題，請提供以下信息：

1. Console 中的完整日誌輸出
2. Network 標籤中的 API 請求詳情（請求 URL、狀態碼、響應體）
3. Vercel 環境變數設定截圖
4. 後台預購檔期的詳細信息（ID、狀態、日期範圍）

