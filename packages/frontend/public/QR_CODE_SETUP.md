# QR Code 設定說明

## 如何設定你的 QR Code 圖片

### 方法一：使用外部圖片 URL
1. 將你的 QR Code 圖片上傳到任何圖片託管服務（如 Imgur、Google Drive、AWS S3 等）
2. 在 `packages/frontend/src/pages/POS/index.tsx` 中修改：
   ```typescript
   const qrCodeImageUrl = 'https://your-domain.com/your-qr-code.png';
   ```

### 方法二：使用本地圖片（推薦）
1. 將你的 QR Code 圖片檔案放在 `packages/frontend/public/` 資料夾中
2. 建議命名為 `qr-code.png` 或 `payment-qr.png`
3. 在 `packages/frontend/src/pages/POS/index.tsx` 中修改：
   ```typescript
   const qrCodeImageUrl = '/qr-code.png'; // 或你選擇的檔案名
   ```

### 方法三：使用 Base64 編碼
1. 將你的 QR Code 圖片轉換為 Base64 編碼
2. 在 `packages/frontend/src/pages/POS/index.tsx` 中修改：
   ```typescript
   const qrCodeImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';
   ```

## 圖片規格建議
- **格式**：PNG、JPG、SVG 或 WebP
- **尺寸**：建議 200x200 或 300x300 像素（正方形）
- **檔案大小**：建議小於 1MB
- **內容**：確保 QR Code 清晰可掃描

## 測試步驟
1. 將你的 QR Code 圖片放在 `public` 資料夾
2. 修改 `qrCodeImageUrl` 變數
3. 重新啟動前端服務
4. 在 POS 系統中選擇「手機支付」查看效果

## 注意事項
- 確保圖片 URL 是公開可訪問的
- 建議使用 HTTPS URL 以確保安全性
- 本地圖片會被打包到最終的建置檔案中
