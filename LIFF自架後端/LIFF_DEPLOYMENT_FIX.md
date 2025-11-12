# LIFF 跳轉問題修復說明

## 問題描述
前後端重新部署後，經 LIFF 登入仍出現不斷跳轉的現象，一直登入。

## 問題原因分析

### 1. LIFF ID 硬編碼問題
- Cloudflare Worker 中仍有硬編碼的 LIFF ID 作為備用值
- 前端可能從硬編碼的 ID 初始化，導致配置不一致

### 2. 缺少重複初始化檢查
- 前端沒有檢查 LIFF 是否已經初始化過
- 可能導致重複初始化，觸發重定向循環

### 3. 環境變數配置問題
- 需要確保 LIFF ID 從環境變數正確讀取
- 避免使用預設值

## 已實施的修復

### 1. 前端修復 (frontend/index.html)
```javascript
// 添加重複初始化檢查
let liffInitialized = false;

// 檢查是否已經初始化過
if (liffInitialized) {
    console.log('⚠️ LIFF 已經初始化過，跳過重複初始化');
    initializeForm();
    return;
}

// 標記已初始化
liffInitialized = true;
```

### 2. 後端修復 (cloudflare-worker/src/index.js)
```javascript
// 移除硬編碼的備用值
liffId: env.LIFF_ID, // 使用環境變數
```

### 3. 環境變數配置 (cloudflare-worker/wrangler.toml)
```toml
[vars]
LIFF_ID = "2007900041-O9ayn5JW"
NODE_ENV = "production"
WORKER_API_KEY = "your_api_key_here"
```

## 部署步驟

### 1. 更新 Cloudflare Worker
```bash
cd cloudflare-worker
wrangler deploy
```

### 2. 驗證部署
```bash
# 檢查配置端點
curl "https://liff-survey-worker.survey-api.workers.dev/api/config"

# 檢查健康狀態
curl "https://liff-survey-worker.survey-api.workers.dev/health"
```

### 3. 測試 LIFF 功能
- 使用 `frontend/test-liff.html` 測試頁面
- 檢查登入流程是否正常
- 確認沒有重定向循環

## 測試檢查清單

- [x] Cloudflare Worker 部署成功
- [x] 配置端點返回正確的 LIFF ID
- [x] 健康檢查端點正常
- [x] 前端重複初始化檢查已添加
- [x] 後端硬編碼值已移除
- [x] 環境變數配置正確

## 重要注意事項

### 1. LIFF ID 管理
- **不要**在代碼中硬編碼 LIFF ID
- 使用環境變數管理配置
- 確保不同環境使用正確的 ID

### 2. 初始化檢查
- 前端必須檢查 LIFF 是否已初始化
- 避免重複初始化導致的問題
- 添加適當的錯誤處理

### 3. 環境變數
- 定期檢查 `wrangler.toml` 配置
- 使用 `check-env.sh` 腳本驗證配置
- 確保生產環境使用正確的設定

## 故障排除

### 如果仍有跳轉問題：

1. **檢查瀏覽器控制台**
   - 查看是否有 JavaScript 錯誤
   - 檢查 LIFF 初始化日誌

2. **驗證 LIFF 配置**
   - 確認 LINE Developers Console 中的設定
   - 檢查 Endpoint URL 是否正確

3. **測試環境**
   - 使用 `test-liff.html` 進行診斷
   - 檢查是否在 LINE App 內或外部瀏覽器

4. **清除瀏覽器快取**
   - 清除 cookies 和快取
   - 重新測試登入流程

## 相關文件

- [LIFF 重定向問題解決方案](./LIFF_REDIRECT_FIX.md)
- [Cloudflare Worker 部署說明](./cloudflare-worker/README.md)
- [問卷調查系統說明](./README.md)

## 聯繫支援

如果問題持續存在，請：
1. 檢查瀏覽器控制台錯誤訊息
2. 使用測試頁面進行診斷
3. 確認 LIFF 配置是否正確
4. 檢查環境變數設定 