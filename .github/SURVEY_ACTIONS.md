# Survey GitHub Actions 工作流程說明

## 📋 已建立的 Actions

### 1. `deploy-survey.yml` - 生產環境部署

**觸發條件**:
- 推送到 `main` 分支
- 變更 `packages/survey-frontend/**` 或 `packages/sdk/**`
- 手動觸發（workflow_dispatch）

**流程**:
1. 安裝依賴
2. 建置 SDK
3. 建置 Survey 前端（使用 GitHub Pages base path）
4. 部署到 GitHub Pages

**環境變數需求**:
- `VITE_API_BASE_PROD`: Production API 位址
- `VITE_LIFF_ID`: LINE LIFF ID

**執行時間**: 約 3-5 分鐘

---

### 2. `survey-ci.yml` - CI 品質檢查

**觸發條件**:
- Pull Request 到 `main` 或 `develop` 分支
- 推送到 `main` 或 `develop` 分支
- 變更 `packages/survey-frontend/**` 或 `packages/sdk/**`

**檢查項目**:
- ✅ ESLint 檢查
- ✅ TypeScript 型別檢查
- ✅ 一般建置測試
- ✅ GitHub Pages 建置測試
- ✅ 建置產物完整性檢查

**執行時間**: 約 2-4 分鐘

---

### 3. `survey-preview.yml` - PR 預覽部署

**觸發條件**:
- Pull Request 到 `main` 分支
- 變更 `packages/survey-frontend/**` 或 `packages/sdk/**`

**功能**:
- 建置 PR 預覽版本
- 上傳建置產物為 Artifact（保留 7 天）
- 自動在 PR 中留言，提供下載連結
- 使用 Staging API 進行測試

**執行時間**: 約 2-3 分鐘

---

### 4. `ci.yml` - 更新主 CI（包含 Survey）

**新增檢查**:
- Survey 前端 ESLint 檢查
- Survey 前端 TypeScript 檢查
- Survey 前端建置檢查

---

## 🚀 使用方式

### 生產環境部署

```bash
# 方式 1: 自動觸發（推送到 main）
git add .
git commit -m "feat: 更新 Survey 功能"
git push origin main

# 方式 2: 手動觸發
# GitHub → Actions → Deploy Survey Frontend → Run workflow
```

### Pull Request 預覽

1. 建立 Pull Request
2. GitHub Actions 自動執行 `survey-ci.yml` 和 `survey-preview.yml`
3. 在 PR 中查看建置結果和預覽連結
4. 下載 Artifact 進行本地測試

### 本地測試 PR 預覽

```bash
# 1. 從 GitHub Actions 下載 Artifact
# 2. 解壓縮
unzip survey-preview-*.zip

# 3. 使用靜態伺服器預覽
npx serve dist
```

---

## ⚙️ GitHub Secrets 設定

前往 **Settings** → **Secrets and variables** → **Actions**

### 必需的 Secrets

| Name | 說明 | 範例 |
|------|------|------|
| `VITE_API_BASE_PROD` | Production API 位址 | `https://pos-backend-prod.survey-api.workers.dev` |
| `VITE_LIFF_ID` | LINE LIFF ID | `2007900041-O9ayn5JW` |

### 可選的 Secrets

| Name | 說明 | 預設值 |
|------|------|--------|
| `VITE_API_BASE_STAGING` | Staging API 位址 | `https://pos-backend-staging.survey-api.workers.dev` |

---

## 📊 工作流程狀態徽章

在 README 中顯示狀態徽章：

```markdown
![Deploy Survey](https://github.com/YOUR_USERNAME/POS_0922/actions/workflows/deploy-survey.yml/badge.svg)
![Survey CI](https://github.com/YOUR_USERNAME/POS_0922/actions/workflows/survey-ci.yml/badge.svg)
```

---

## 🔧 自訂設定

### 修改部署觸發條件

編輯 `.github/workflows/deploy-survey.yml`:

```yaml
on:
  push:
    branches: [main, production]  # 新增其他分支
    paths:
      - 'packages/survey-frontend/**'
      - 'packages/sdk/**'
  workflow_dispatch:
```

### 修改 Node.js 版本

```yaml
- name: 🔧 設定 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'  # 改成其他版本，如 '18' 或 '21'
```

### 修改建置命令

```yaml
- name: 🏗️ 建置 Survey 前端
  run: |
    cd packages/survey-frontend
    pnpm run build:gh-pages
    # 新增其他命令，如測試或優化
```

---

## 🐛 故障排除

### 部署失敗

**問題**: GitHub Pages 部署失敗

**解決方案**:
1. 確認 GitHub Pages 已啟用（Settings → Pages → Source: GitHub Actions）
2. 確認 Secrets 設定正確
3. 檢查 Actions logs 錯誤訊息
4. 確認 `vite.config.ts` 的 `base` 路徑正確

### CI 檢查失敗

**問題**: ESLint 或 TypeScript 檢查失敗

**解決方案**:
1. 本地執行檢查：
   ```bash
   cd packages/survey-frontend
   pnpm run lint
   pnpm run typecheck
   ```
2. 修正錯誤後重新推送

### 建置產物問題

**問題**: 建置成功但頁面無法載入

**解決方案**:
1. 確認 `vite.config.ts` 的 `base` 路徑正確
2. 檢查環境變數是否正確傳遞
3. 查看瀏覽器 Console 錯誤訊息

---

## 📈 效能優化

### 快取策略

Actions 已設定 pnpm 快取：

```yaml
- name: 🔧 設定 Node.js
  uses: actions/setup-node@v4
  with:
    node-version: '20'
    cache: 'pnpm'  # 自動快取 pnpm 依賴
```

### 平行執行

CI 檢查採用 Jobs 依賴關係，先執行品質檢查再執行建置：

```yaml
jobs:
  survey-quality-check:
    # ...
  
  survey-build-check:
    needs: survey-quality-check  # 依賴品質檢查
    # ...
```

---

## 🔐 安全性考量

### Secrets 管理

- ❌ 不要在程式碼中硬編碼敏感資訊
- ✅ 使用 GitHub Secrets 管理環境變數
- ✅ PR 預覽使用 Staging API，不暴露 Production 資料

### Permissions

部署 Action 使用最小權限原則：

```yaml
permissions:
  contents: read      # 讀取程式碼
  pages: write        # 寫入 GitHub Pages
  id-token: write     # OIDC 認證
```

---

## 📚 相關文件

- [GitHub Actions 文檔](https://docs.github.com/en/actions)
- [GitHub Pages 部署](https://docs.github.com/en/pages)
- [LIFF 文檔](https://developers.line.biz/en/docs/liff/)
- [Vite 部署指南](https://vitejs.dev/guide/static-deploy.html)

---

**最後更新**: 2025-01-12

