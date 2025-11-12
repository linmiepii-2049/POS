# LIFF 問卷調查系統

這是一個完整的 LINE Front-end Framework (LIFF) 問卷調查系統，包含前端問卷表單、Node.js 後端 API，以及 Cloudflare Workers + D1 資料庫的完整解決方案。

## 專案特色

- **LIFF 問卷表單**: 美觀的響應式問卷介面，支援手機號碼、年齡、性別資料收集
- **Node.js 後端 API**: 處理問卷資料驗證與轉發，具備完整的錯誤處理和安全機制
- **Cloudflare Workers**: 無伺服器處理問卷資料並儲存至 D1 資料庫
- **D1 資料庫**: Cloudflare 的 SQLite 資料庫，提供快速且可靠的資料儲存
- **CORS 安全**: 實作安全的跨來源請求處理機制
- **會員系統**: 以手機號碼作為會員 ID，支援資料更新

## 技術架構

```
LIFF 問卷表單 (frontend/)
    ↓ (提交問卷資料)
Node.js 後端 API (backend/)
    ↓ (轉發並驗證)
Cloudflare Worker (cloudflare-worker/)
    ↓ (儲存資料)
D1 SQLite 資料庫
```

## 問卷內容

- **手機號碼**: 作為會員 ID 使用，必填欄位，10位數字格式
- **年齡**: 25歲以下 / 26-45歲 / 46歲以上
- **性別**: 男 / 女

## 環境需求

- Node.js 16+ 
- npm 或 yarn
- Cloudflare 帳戶 (免費方案即可)
- Wrangler CLI (Cloudflare Workers 開發工具)
- LINE Developers 帳戶 (用於建立 LIFF 應用)

## 安裝指引

### 1. 複製專案
```bash
git clone <repository-url>
cd LIFF自架後端
```

### 2. 安裝後端依賴
```bash
cd backend
npm install
```

### 3. 設定環境變數
```bash
cp .env.example .env
```
編輯 `backend/.env` 檔案：
```env
PORT=3000
NODE_ENV=development
HTTPS_PORT=3443
FRONTEND_URL=https://liff.line.me
CLOUDFLARE_WORKER_URL=https://your-worker.your-subdomain.workers.dev
WORKER_API_KEY=your-secure-api-key
LIFF_ID=your-liff-id
LIFF_CHANNEL_ID=your-liff-channel-id
LIFF_CHANNEL_SECRET=your-liff-channel-secret
```

### 4. 部署 Cloudflare Worker
```bash
# 安裝 Wrangler CLI (如果尚未安裝)
npm install -g wrangler

# 登入 Cloudflare
wrangler login

# 部署 Worker 和 D1 資料庫
cd cloudflare-worker
chmod +x deploy.sh
./deploy.sh
```

### 5. 建立 LIFF 應用
1. 登入 [LINE Developers Console](https://developers.line.biz/)
2. 建立新的 Channel (LINE Login)
3. 在 LIFF 頁籤新增 LIFF 應用
4. 設定 Endpoint URL 為後端服務位址
5. 記錄 LIFF ID

### 6. 更新 LIFF 設定
將取得的 LIFF ID 加入 `backend/.env` 檔案：
```env
LIFF_ID= 你的LIFF_ID
```
前端會自動從 `/api/config` 端點取得 LIFF ID，無需手動修改 HTML 檔案

### 7. 啟動後端服務
```bash
cd backend
npm run dev
```

## 使用方法

### 訪問問卷
1. 在 LINE 中開啟 LIFF 應用
2. 填寫問卷表單（手機號碼、年齡、性別）
3. 提交問卷
4. 系統會自動儲存到 D1 資料庫

### API 端點

#### 後端 API (Node.js)

**健康檢查**
```http
GET /health
```

**問卷頁面**
```http
GET /
```

**提交問卷**
```http
POST /api/survey
Content-Type: application/json

{
  "phone": "0912345678",
  "age": "26-45歲",
  "gender": "男"
}
```

**查詢問卷資料**
```http
GET /api/survey/{memberId}
```

#### Cloudflare Worker API

**健康檢查**
```http
GET https://your-worker.workers.dev/health
```

**問卷資料處理**
```http
POST https://your-worker.workers.dev/
Authorization: Bearer your-api-key
Content-Type: application/json

{
  "memberId": "0912345678",
  "phone": "0912345678",
  "age": "26-45歲",
  "gender": "男",
  "timestamp": "2024-08-09T12:00:00.000Z"
}
```

## CORS 設定

專案已預設安全的 CORS 設定，遵循以下原則：

- ✅ 明確指定允許的來源域名
- ✅ 列出具體的 HTTP 方法和標頭
- ✅ 適當處理憑證攜帶請求
- ❌ 避免使用通配符 `*` 搭配憑證
- ❌ 禁止 `null` 來源

## 部署

### Cloudflare Workers (推薦)
```bash
cd cloudflare-worker
./deploy.sh
```

### 後端服務 - PM2 (生產環境)
```bash
cd backend
npm install -g pm2
npm run build
pm2 start ecosystem.config.js
```

### 後端服務 - Docker
```bash
cd backend
docker build -t liff-survey-backend .
docker run -p 3000:3000 -e NODE_ENV=production liff-survey-backend
```

### 前端部署
```bash
# 將 frontend/ 目錄部署到任意靜態網站託管服務
# 或透過後端的靜態檔案服務訪問
```

## 開發規範

### 程式碼品質
- 使用繁體中文撰寫所有註解與文件
- 遵循單一職責原則
- 避免硬編碼資料
- 集中管理錯誤處理

### 安全考量
- 驗證所有輸入參數
- 實作適當的 CORS 政策
- 保護敏感資訊
- 記錄重要操作

## 故障排除

### 常見問題

**Q: LIFF 初始化失敗**
```
解決方案：
1. 檢查 LIFF ID 是否正確
2. 確認 LIFF Endpoint URL 設定正確
3. 檢查 LINE Channel 設定
```

**Q: 問卷提交失敗**
```
解決方案：
1. 檢查手機號碼格式（必須為 10 位數字）
2. 確認 Cloudflare Worker URL 設定正確
3. 檢查 API 金鑰是否匹配
```

**Q: 資料庫連線錯誤**
```
解決方案：
1. 確認 D1 資料庫已正確建立和綁定
2. 檢查 wrangler.toml 設定
3. 重新執行資料庫遷移
```

**Q: CORS 錯誤**
```
解決方案：檢查 FRONTEND_URL 環境變數是否正確設定 LIFF 域名
```

## 貢獻指引

1. Fork 專案
2. 建立功能分支 (`git checkout -b feature/amazing-feature`)
3. 提交變更 (`git commit -m 'Add amazing feature'`)
4. 推送分支 (`git push origin feature/amazing-feature`)
5. 建立 Pull Request

## 授權條款

本專案採用 MIT 授權條款。詳見 [LICENSE](LICENSE) 檔案。

## 聯絡資訊

如有問題或建議，請建立 Issue 或聯絡專案維護者。

---

*最後更新：2024年8月* 