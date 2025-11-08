# 圖片上傳配置說明

## 📋 環境配置

### 開發環境（Local）
- **API Base**: `http://localhost:8787`
- **圖片 URL 格式**: `http://localhost:8787/assets/{key}`
- **R2 Bucket**: `pos-assets` (本地)

### Staging 環境
- **API Base**: `https://pos-backend-staging.survey-api.workers.dev`
- **圖片 URL 格式**: `https://pos-backend-staging.survey-api.workers.dev/assets/{key}`
- **R2 Bucket**: `pos-assets-staging`

### Production 環境（尚未配置）
- **API Base**: `https://api.example.com`
- **圖片 URL 格式**: `https://api.example.com/assets/{key}`
- **R2 Bucket**: `pos-assets-prod`

---

## 🔧 運作原理

1. **上傳流程**：
   - 前端將圖片上傳到 `/api/uploads/products`
   - 後端將圖片儲存到 R2 bucket
   - 後端根據環境變數 `API_BASE` 生成正確的圖片 URL
   - 返回圖片 URL: `{API_BASE}/assets/{key}`

2. **讀取流程**：
   - 前端請求 `{API_BASE}/assets/{key}`
   - 後端從 R2 讀取檔案並回傳
   - 支援快取 (Cache-Control: 1 year)

3. **環境自動偵測**：
   - 後端根據 `ENV_NAME` 和 `API_BASE` 環境變數
   - 自動生成對應環境的圖片 URL
   - 無需手動修改程式碼

---

## ✅ 測試圖片上傳

### 在本地環境測試
1. 開啟 `http://localhost:3000/admin?tab=products`
2. 點擊「編輯商品」
3. 上傳圖片
4. 圖片 URL 應為: `http://localhost:8787/assets/products/{timestamp}-{random}.webp`

### 在 Staging 環境測試
1. 開啟 `https://pos-frontend-staging.pages.dev/admin?tab=products`
2. 點擊「編輯商品」
3. 上傳圖片
4. 圖片 URL 應為: `https://pos-backend-staging.survey-api.workers.dev/assets/products/{timestamp}-{random}.webp`

---

## 📝 重要提醒

- ✅ 圖片上傳已支援跨環境自動配置
- ✅ 每個環境使用獨立的 R2 bucket
- ✅ 圖片 URL 由後端根據環境自動生成
- ✅ 支援 WebP, JPEG, PNG 等圖片格式
- ✅ 檔案大小限制: 10MB
- ✅ 自動快取 1 年

---

## 🐛 常見問題

### Q: 圖片上傳後顯示 404？
A: 檢查 R2 bucket 是否已建立，且後端有正確的綁定。

### Q: CORS 錯誤？
A: 確認前端域名已加入 `CORS_ORIGINS` 環境變數。

### Q: 圖片 URL 不正確？
A: 檢查 `API_BASE` 環境變數是否正確設定。
