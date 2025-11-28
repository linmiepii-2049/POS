# LINE Pay Sandbox 設定指南

## 已完成的工作

✅ 已建立 LINE Pay 服務 (`src/services/linepay.ts`)
✅ 已建立支付路由 (`src/routes/payments.ts`)
✅ 已更新環境變數定義 (`src/env.d.ts`)
✅ 已更新前端支付流程 (`packages/preorder-frontend/src/pages/PreorderPage.tsx`)
✅ 已建立支付回調頁面 (`packages/preorder-frontend/src/pages/PaymentReturnPage.tsx`)

## 需要完成的設定步驟

### 1. 取得 LINE Pay Sandbox 認證資訊

1. 使用提供的帳號登入 [LINE Pay 沙盒頁面](https://developers-pay.line.me/zh/sandbox)
   - 帳號：`test_202511281251@line.pay`
   - 密碼：`V5gOZ*01gD`

2. 登入後，前往 [LINE Pay 商户中心](https://pay.line.me)

3. 在左側選單選擇：**管理付款連結** > **管理連結金鑰**

4. 點擊「查詢」按鈕，系統會發送驗證碼到註冊信箱

5. 輸入驗證碼後，您將看到：
   - **Channel ID**（沙盒）
   - **Channel Secret Key**（沙盒）

### 2. 更新 wrangler.toml 配置

編輯 `packages/backend/wrangler.toml`，將以下內容中的 `YOUR_SANDBOX_CHANNEL_ID` 和 `YOUR_SANDBOX_CHANNEL_SECRET` 替換為實際值：

```toml
[vars]
# ... 其他配置 ...
# LINE Pay Sandbox 配置
LINE_PAY_CHANNEL_ID = "YOUR_SANDBOX_CHANNEL_ID"  # 替換為實際的 Channel ID
LINE_PAY_CHANNEL_SECRET = "YOUR_SANDBOX_CHANNEL_SECRET"  # 替換為實際的 Channel Secret
LINE_PAY_API_BASE = "https://sandbox-api-pay.line.me"
LINE_PAY_RETURN_URL = "http://localhost:5173/preorder/payment/return"
LINE_PAY_CANCEL_URL = "http://localhost:5173/preorder/payment/cancel"
```

**注意**：如果前端運行在不同的端口，請相應調整 `LINE_PAY_RETURN_URL` 和 `LINE_PAY_CANCEL_URL`。

### 3. 設定前端環境變數（可選）

如果前端需要連接到不同的後端 API，可以在 `packages/preorder-frontend` 目錄下建立 `.env` 檔案：

```env
VITE_API_BASE_URL=http://localhost:8787
```

### 4. 測試流程

1. **啟動後端**：
   ```bash
   cd packages/backend
   pnpm run dev
   ```

2. **啟動前端**：
   ```bash
   cd packages/preorder-frontend
   pnpm run dev
   ```

3. **測試支付流程**：
   - 訪問前端頁面（預設：http://localhost:3100）
   - 選擇商品並加入購物車
   - 點擊「LINE PAY結帳」按鈕
   - 選擇取貨時間
   - 點擊「LINE PAY結帳」按鈕
   - 系統會跳轉到 LINE Pay 支付頁面
   - 使用 Sandbox 測試卡號完成支付
   - 支付完成後會跳轉回前端並顯示訂單成功訊息

### 5. LINE Pay Sandbox 測試卡號

在 Sandbox 環境中，可以使用以下測試卡號：

- **卡號**：`4111111111111111`
- **CVV**：任意 3 位數字（如 `123`）
- **有效期限**：未來日期（如 `12/25`）

具體測試卡號請參考 [LINE Pay Sandbox 文檔](https://developers-pay.line.me/zh/sandbox)

## API 端點

### 請求支付
- **POST** `/api/preorders/payment/request`
- **請求體**：
  ```json
  {
    "campaignId": 1,
    "productId": 1,
    "quantity": 2,
    "pickupDate": "2024-12-01"
  }
  ```
- **回應**：
  ```json
  {
    "success": true,
    "data": {
      "paymentUrl": "https://sandbox-api-pay.line.me/...",
      "transactionId": 1234567890,
      "orderId": "PREORDER-..."
    }
  }
  ```

### 確認支付
- **POST** `/api/preorders/payment/confirm?transactionId=123&orderId=...`
- **請求體**：
  ```json
  {
    "campaignId": 1,
    "productId": 1,
    "quantity": 2,
    "pickupDate": "2024-12-01",
    "customerName": "測試用戶",
    "customerPhone": "0912345678"
  }
  ```

## 注意事項

1. **安全性**：
   - Channel Secret 是敏感資訊，請勿提交到公開程式碼庫
   - 使用環境變數或 Cloudflare Workers Secrets 儲存

2. **測試環境**：
   - 目前配置為 Sandbox 環境
   - 正式環境需要：
     - 註冊正式 LINE Pay 商户帳號
     - 更新 `LINE_PAY_API_BASE` 為 `https://api-pay.line.me`
     - 更新 Channel ID 和 Channel Secret

3. **回調 URL**：
   - 開發環境：`http://localhost:5173/preorder/payment/return`
   - 部署環境：需要更新為實際的前端域名

4. **待完成功能**：
   - [ ] 從 LINE Pay 或 LINE 登入取得客戶姓名和電話
   - [ ] 建立 `preorder_payments` 表儲存支付狀態
   - [ ] 處理支付取消流程
   - [ ] 添加支付狀態查詢 API

## 故障排除

### 錯誤：Channel ID 或 Channel Secret 無效
- 確認已正確從 LINE Pay 商户中心取得認證資訊
- 確認 wrangler.toml 中的值沒有多餘的空格

### 錯誤：簽名驗證失敗
- 確認 Channel Secret 正確
- 檢查 API Base URL 是否正確（Sandbox 使用 `https://sandbox-api-pay.line.me`）

### 支付頁面無法載入
- 確認回調 URL 配置正確
- 檢查前端是否正常運行
- 查看後端日誌確認 API 請求是否成功

## 參考資源

- [LINE Pay Sandbox 文檔](https://developers-pay.line.me/zh/sandbox)
- [LINE Pay API 參考文檔](https://pay.line.me/documents/online_v3_cn.html)
- [LINE Pay 開發者網站](https://developers-pay.line.me/zh/)

