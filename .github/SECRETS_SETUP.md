# GitHub Secrets 設定指南

**狀態**: ⚠️ 需要立即設定  
**原因**: 部署失敗，因為缺少必要的 Cloudflare 認證資訊

## 🚨 錯誤訊息

```
✘ [ERROR] In a non-interactive environment, it's necessary to set a 
CLOUDFLARE_API_TOKEN environment variable for wrangler to work.
```

## 📋 需要設定的 Secrets

您需要在 GitHub Repository 中設定兩個 secrets：

1. **CLOUDFLARE_API_TOKEN** - Cloudflare API Token
2. **CLOUDFLARE_ACCOUNT_ID** - Cloudflare Account ID

## 🔑 步驟 1: 取得 Cloudflare API Token

### 1.1 登入 Cloudflare Dashboard

前往：https://dash.cloudflare.com/

### 1.2 建立 API Token

1. 點擊右上角的頭像
2. 選擇 **"My Profile"**
3. 左側選單選擇 **"API Tokens"**
4. 點擊 **"Create Token"**

### 1.3 選擇模板或自訂權限

**方式一：使用模板（推薦）**

選擇 **"Edit Cloudflare Workers"** 模板，然後點擊 "Use template"

**方式二：自訂權限**

建立自訂 Token，需要以下權限：

| 資源類型 | 權限 | 範圍 |
|---------|------|------|
| **Workers Scripts** | Edit | 特定帳號或所有帳號 |
| **Workers KV Storage** | Edit | 特定帳號或所有帳號 |
| **D1** | Edit | 特定帳號或所有帳號 |
| **R2** | Edit | 特定帳號或所有帳號 |
| **Account Settings** | Read | 特定帳號或所有帳號 |

### 1.4 設定 Token 細節

- **Token name**: `GitHub Actions - POS Deployment`
- **Account**: 選擇您的帳號
- **Zone**: 不需要（或選擇 All zones）
- **TTL**: Start now, Never expire（或自訂）

### 1.5 建立並複製 Token

1. 點擊 **"Continue to summary"**
2. 檢查權限設定
3. 點擊 **"Create Token"**
4. **⚠️ 重要**: 立即複製 Token（只會顯示一次！）

保存格式範例：
```
Token: cloudflare_api_token_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

## 🆔 步驟 2: 取得 Cloudflare Account ID

### 2.1 前往 Workers & Pages

1. 在 Cloudflare Dashboard 左側選單
2. 選擇 **"Workers & Pages"**

### 2.2 複製 Account ID

右側會顯示 **Account ID**，點擊複製按鈕

格式範例：
```
Account ID: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6
```

## 🔐 步驟 3: 在 GitHub 設定 Secrets

### 3.1 前往 Repository Settings

1. 開啟您的 GitHub Repository
   ```
   https://github.com/linmiepii-2049/POS
   ```

2. 點擊頂部的 **"Settings"** 標籤

### 3.2 導航到 Secrets 設定

1. 左側選單展開 **"Secrets and variables"**
2. 點擊 **"Actions"**

### 3.3 新增 CLOUDFLARE_API_TOKEN

1. 點擊 **"New repository secret"**
2. **Name**: `CLOUDFLARE_API_TOKEN`
3. **Secret**: 貼上步驟 1.5 複製的 Token
4. 點擊 **"Add secret"**

### 3.4 新增 CLOUDFLARE_ACCOUNT_ID

1. 再次點擊 **"New repository secret"**
2. **Name**: `CLOUDFLARE_ACCOUNT_ID`
3. **Secret**: 貼上步驟 2.2 複製的 Account ID
4. 點擊 **"Add secret"**

## ✅ 步驟 4: 驗證設定

### 4.1 檢查 Secrets 列表

在 Settings > Secrets and variables > Actions 頁面，應該看到：

```
Repository secrets
├─ CLOUDFLARE_API_TOKEN     (Updated X minutes ago)
└─ CLOUDFLARE_ACCOUNT_ID    (Updated X minutes ago)
```

### 4.2 測試部署

1. 前往 **Actions** 標籤
2. 選擇 **"Deploy to Staging"**
3. 點擊 **"Run workflow"**
4. 輸入部署原因
5. 點擊 **"Run workflow"** 執行

## 🔍 驗證 Token 權限（可選）

在設定 Secrets 之前，可以先在本地測試 Token：

```bash
# 設定環境變數（臨時測試）
export CLOUDFLARE_API_TOKEN="your_token_here"
export CLOUDFLARE_ACCOUNT_ID="your_account_id_here"

# 測試列出 Workers
cd packages/backend
pnpm wrangler whoami

# 測試列出 D1 資料庫
pnpm wrangler d1 list

# 測試列出 R2 buckets
pnpm wrangler r2 bucket list
```

如果這些命令都能正常執行，表示 Token 權限正確。

## 🛡️ 安全性最佳實踐

### DO ✅

- ✅ 使用最小權限原則（只授予必要權限）
- ✅ 為不同用途建立不同的 Token
- ✅ 定期輪換 Token（建議每 90 天）
- ✅ 限制 Token 的 IP 範圍（如果可能）
- ✅ 設定 Token 過期時間

### DON'T ❌

- ❌ 將 Token 提交到 Git repository
- ❌ 在公開的地方分享 Token
- ❌ 使用 Global API Key（改用 API Token）
- ❌ 授予超過需要的權限
- ❌ 在多個系統使用同一個 Token

## 🔄 Token 洩露時的處理

如果 Token 不慎洩露：

1. **立即撤銷 Token**
   - 前往 Cloudflare Dashboard > My Profile > API Tokens
   - 找到洩露的 Token
   - 點擊 "..." > "Revoke"

2. **建立新 Token**
   - 按照步驟 1 建立新的 Token
   - 使用不同的名稱（例如加上版本號）

3. **更新 GitHub Secrets**
   - 在 GitHub Secrets 中更新 `CLOUDFLARE_API_TOKEN`

4. **檢查使用記錄**
   - 在 Cloudflare Dashboard 檢查是否有異常活動

## 📝 常見問題

### Q: Token 和 API Key 有什麼不同？

**A**: 
- **API Token**: 更安全，可以細粒度控制權限，建議使用
- **Global API Key**: 有完全權限，不建議使用

### Q: 為什麼需要 Account ID？

**A**: Account ID 用於識別您的 Cloudflare 帳號，讓 wrangler 知道要操作哪個帳號的資源。

### Q: Token 過期了怎麼辦？

**A**: 重新建立 Token 並更新 GitHub Secrets。建議設定提醒，在 Token 過期前更新。

### Q: 可以在本地使用相同的 Token 嗎？

**A**: 可以，但建議為不同環境建立不同的 Token：
- 本地開發：一個 Token
- GitHub Actions：另一個 Token
- CI/CD 系統：各自獨立的 Token

### Q: 如何測試 Secrets 是否正確？

**A**: 觸發一次 GitHub Actions workflow，查看日誌輸出。如果仍然看到 "CLOUDFLARE_API_TOKEN environment variable" 錯誤，表示 Secrets 未正確設定。

## 📚 相關資源

- [Cloudflare API Tokens 文檔](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
- [Wrangler 認證文檔](https://developers.cloudflare.com/workers/wrangler/commands/#authentication)
- [GitHub Secrets 文檔](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [部署流程指南](.github/QUICK_SETUP.md)

## 🎯 完成檢查清單

設定完成後，確認以下項目：

- [ ] ✅ 已建立 Cloudflare API Token
- [ ] ✅ 已取得 Cloudflare Account ID
- [ ] ✅ 已在 GitHub 設定 `CLOUDFLARE_API_TOKEN`
- [ ] ✅ 已在 GitHub 設定 `CLOUDFLARE_ACCOUNT_ID`
- [ ] ✅ 已在 Secrets 頁面看到兩個 secrets
- [ ] ✅ 已測試執行 GitHub Actions workflow
- [ ] ✅ 部署成功完成

---

**設定完成後，返回 GitHub Actions 重新執行部署！** 🚀

