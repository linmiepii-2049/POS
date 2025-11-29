# 如何取得 LINE Pay Sandbox Channel ID 和 Channel Secret

## ⚠️ 重要說明

**Channel ID 和 Channel Secret 不是登入帳號和密碼！**

- ❌ 登入帳號：`test_202511281251@line.pay`
- ❌ 登入密碼：`V5gOZ*01gD`
- ✅ Channel ID：需要從商户中心獲取（通常是數字或字母數字組合）
- ✅ Channel Secret：需要從商户中心獲取（通常是長字串）

## 取得步驟

### 1. 登入 LINE Pay 商户中心

1. 訪問：https://pay.line.me
2. 使用以下帳號登入：
   - **帳號**：`test_202511281251@line.pay`
   - **密碼**：`V5gOZ*01gD`

### 2. 進入管理連結金鑰頁面

1. 登入後，在左側選單找到：**管理付款連結**
2. 點擊展開後，選擇：**管理連結金鑰**

### 3. 查詢並驗證

1. 點擊頁面上的「**查詢**」按鈕
2. 系統會發送驗證碼到註冊信箱（`test_202511281251@line.pay`）
3. 檢查信箱，找到驗證碼
4. 在彈出的「驗證電子郵件」視窗中輸入驗證碼
5. 點擊「確認」

### 4. 取得認證資訊

驗證成功後，您將看到：

- **Channel ID**：一串數字或字母數字組合（例如：`1234567890`）
- **Channel Secret Key**：一長串字元（例如：`abcdefghijklmnopqrstuvwxyz1234567890abcdef`）

### 5. 更新配置

將獲取的 Channel ID 和 Channel Secret 填入 `packages/backend/wrangler.toml`：

```toml
LINE_PAY_CHANNEL_ID = "你的實際ChannelID"
LINE_PAY_CHANNEL_SECRET = "你的實際ChannelSecret"
```

### 6. 重新啟動後端

更新配置後，需要重新啟動後端服務器：

```bash
# 停止當前的後端（在運行後端的終端按 Ctrl+C）
# 然後重新啟動
cd packages/backend
pnpm run dev
```

## 常見問題

### Q: 找不到「管理付款連結」選單？
A: 確認您已正確登入 Sandbox 帳號，並且帳號已通過驗證。

### Q: 沒有收到驗證碼？
A: 
- 檢查信箱（包括垃圾郵件）
- 確認信箱地址是否正確
- 等待幾分鐘後重試

### Q: Channel ID 和 Channel Secret 的格式是什麼？
A:
- Channel ID：通常是純數字或字母數字組合，長度約 10-20 個字元
- Channel Secret：通常是長字串，包含字母和數字，長度約 30-50 個字元

### Q: 更新配置後仍然出錯？
A:
1. 確認已重新啟動後端服務器
2. 確認配置文件中沒有多餘的空格或引號
3. 檢查後端控制台是否有 "LINE Pay Channel ID 未配置" 的錯誤

## 驗證配置是否正確

啟動後端後，查看控制台輸出。如果看到：

```
LINE Pay Service 初始化 { apiBase: 'https://sandbox-api-pay.line.me', ... }
```

表示配置正確。如果看到：

```
LINE Pay Channel ID 未配置
```

表示需要更新配置。


