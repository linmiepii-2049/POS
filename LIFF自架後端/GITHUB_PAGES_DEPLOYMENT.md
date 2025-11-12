# GitHub Pages 部署指南

## 📋 需要 Push 到 GitHub 的檔案清單

### ✅ 必須 Push 的檔案

1. **前端檔案**
   ```
   frontend/index.html  ✅ 已修改 - 主要問卷頁面
   ```

2. **專案文檔**
   ```
   README.md           ✅ 已更新 - 專案說明
   .gitignore          ✅ 已存在 - Git忽略設定
   ```

3. **腳本檔案（可選，用於示範）**
   ```
   start.sh            ✅ 包裝腳本
   status.sh           ✅ 包裝腳本
   stop.sh             ✅ 包裝腳本
   ```

### 🔧 部署前需要修改的設定

在 `frontend/index.html` 中，請將以下兩處的 URL 替換為您的實際後端網址：

```javascript
// 第 533 行和第 131 行附近
const API_BASE_URL = 'https://your-backend-domain.com'; // 請替換為您的後端域名
```

**替換為您的實際後端 URL，例如：**
- `https://your-domain.herokuapp.com`
- `https://your-domain.vercel.app`
- `https://your-domain.railway.app`
- 或其他您部署後端的網址

### 🚀 GitHub Pages 部署步驟

1. **推送檔案到 GitHub**
   ```bash
   git add frontend/index.html
   git add README.md
   git add GITHUB_PAGES_DEPLOYMENT.md
   git commit -m "Update frontend for GitHub Pages deployment"
   git push origin main
   ```

2. **設定 GitHub Pages**
   - 前往您的 GitHub repository
   - 點擊 "Settings" 標籤
   - 滾動到 "Pages" 部分
   - 在 "Source" 選擇 "Deploy from a branch"
   - 選擇 "main" branch 和 "/ (root)" folder
   - 點擊 "Save"

3. **自訂網址路徑**
   GitHub Pages 會在 `https://username.github.io/repository-name/frontend/` 提供您的問卷頁面

   **建議：將 index.html 移到根目錄**
   ```bash
   # 可選：將前端檔案移到根目錄以獲得更簡潔的 URL
   cp frontend/index.html ./index.html
   git add index.html
   git commit -m "Add index.html to root for GitHub Pages"
   git push origin main
   ```

### 📝 重要注意事項

1. **CORS 設定**
   - 確認您的後端服務器已正確設定 CORS headers
   - 允許來自 GitHub Pages 域名的請求

2. **HTTPS 要求**
   - GitHub Pages 使用 HTTPS
   - 確認您的後端 API 也支援 HTTPS

3. **API URL 配置**
   - 務必將 `API_BASE_URL` 更新為您的實際後端網址
   - 測試確認 API 可以從瀏覽器正常訪問

### 🔍 檔案用途說明

- **frontend/index.html**: 主要的問卷頁面，包含完整的麵包店問卷
- **README.md**: 專案說明文檔
- **腳本檔案**: 後端管理腳本（不影響前端部署）

### 🌐 預期的訪問網址

部署成功後，您的問卷將可在以下網址訪問：
- `https://username.github.io/repository-name/` (如果將 index.html 放在根目錄)
- `https://username.github.io/repository-name/frontend/` (如果保持在 frontend 目錄)

### ✅ 部署檢查清單

- [ ] 修改 `frontend/index.html` 中的 `API_BASE_URL`
- [ ] 確認後端 API 可以正常訪問並支援 CORS
- [ ] 推送檔案到 GitHub
- [ ] 在 GitHub 設定頁面啟用 GitHub Pages
- [ ] 測試問卷頁面是否正常載入
- [ ] 測試問卷提交功能是否正常運作 