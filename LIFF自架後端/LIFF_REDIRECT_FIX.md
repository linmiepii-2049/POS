# LIFF 重定向問題解決方案

## 問題描述
使用 LINE LIFF 登入時出現一直跳轉的現象，這通常是由於重定向循環導致的。

## 問題原因分析

### 1. 自動登入循環
- 前端在檢測到用戶未登入時自動調用 `liff.login()`
- 這可能導致重定向循環，特別是在外部瀏覽器中

### 2. LIFF ID 硬編碼
- 原本在 Cloudflare Worker 中硬編碼了 LIFF ID
- 應該從環境變數讀取，便於管理和部署

### 3. 缺少狀態檢查
- 沒有檢查 LIFF 是否已經初始化過
- 可能導致重複初始化

## 解決方案

### 1. 移除自動登入
```javascript
// 修改前（會導致重定向循環）
if (!liff.isLoggedIn()) {
    liff.login(); // 自動登入
}

// 修改後（手動登入）
if (!liff.isLoggedIn()) {
    console.log('用戶未登入，需要手動授權');
    // 移除自動登入
}
```

### 2. 環境變數配置
在 `cloudflare-worker/wrangler.toml` 中添加：
```toml
[vars]
LIFF_ID = "your_liff_id_here"
NODE_ENV = "production"
```

### 3. 防止重複初始化
```javascript
// 檢查是否已經初始化過
if (liffInitialized) {
    log('⚠️ LIFF 已經初始化過，跳過重複初始化', 'warning');
    return;
}
```

### 4. 改進的錯誤處理
```javascript
// 檢查是否在 LINE App 內
if (!liff.isInClient()) {
    log('⚠️ 當前在外部瀏覽器，登入可能會有重定向', 'warning');
}
```

## 部署步驟

### 1. 更新 Cloudflare Worker
```bash
cd cloudflare-worker
wrangler deploy
```

### 2. 測試 LIFF 功能
- 使用 `frontend/test-liff.html` 測試頁面
- 檢查登入流程是否正常
- 確認沒有重定向循環

### 3. 驗證配置
- 確認 LIFF ID 正確設定
- 檢查環境變數是否生效
- 測試問卷提交功能

## 注意事項

### 1. 外部瀏覽器登入
- 在外部瀏覽器中登入 LIFF 會有重定向
- 這是正常行為，但需要用戶手動操作
- 避免自動觸發登入

### 2. 環境變數管理
- 不要將敏感資訊硬編碼在代碼中
- 使用環境變數管理配置
- 不同環境使用不同的配置

### 3. 用戶體驗
- 提供清晰的登入按鈕
- 顯示當前登入狀態
- 給用戶明確的操作指引

## 測試檢查清單

- [ ] LIFF 初始化成功
- [ ] 沒有重定向循環
- [ ] 登入按鈕正常工作
- [ ] 用戶資料獲取成功
- [ ] 問卷提交功能正常
- [ ] 環境變數配置正確

## 相關文件
- [LIFF 官方文檔](https://developers.line.biz/zh-hant/docs/liff/)
- [Cloudflare Workers 文檔](https://developers.cloudflare.com/workers/)
- [問卷調查系統說明](./README.md) 