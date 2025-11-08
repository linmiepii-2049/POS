# Cloudflare Pages 專案建立指南

**目的**: 為 Production 環境建立 Pages 專案  
**狀態**: ⚠️ 需要手動建立 `pos-frontend-prod` 專案

## 🚨 為什麼需要這個步驟？

當您首次部署 Production 時，會遇到錯誤：

```
✘ [ERROR] Project not found. The specified project name does not match 
any of your existing projects. [code: 8000007]
```

**原因**: `pos-frontend-prod` 專案還不存在，需要先在 Cloudflare Dashboard 建立。

## 📋 建立 Production Pages 專案

### 方式一：透過 Dashboard（推薦）

#### 步驟 1: 前往 Cloudflare Dashboard

1. 登入：https://dash.cloudflare.com/
2. 左側選單選擇 **"Workers & Pages"**
3. 點擊右上角 **"Create application"**

#### 步驟 2: 選擇建立 Pages

1. 選擇 **"Pages"** 標籤
2. 點擊 **"Connect to Git"** 或 **"Upload assets"**
3. 選擇 **"Direct Upload"**（我們用 wrangler 部署）

#### 步驟 3: 設定專案

1. **Project name**: `pos-frontend-prod`（必須完全匹配）
2. **Production branch**: `main`
3. 點擊 **"Create project"**

#### 步驟 4: 完成

專案建立後，會自動生成域名：
```
https://pos-frontend-prod.pages.dev
```

### 方式二：透過 Wrangler CLI

```bash
cd packages/frontend

# 建立 Production 專案
pnpm wrangler pages project create pos-frontend-prod \
  --production-branch=main

# 或者首次部署時自動建立
pnpm wrangler pages deploy dist \
  --project-name=pos-frontend-prod \
  --branch=main
```

## ✅ 驗證專案建立

### 檢查專案列表

```bash
cd packages/frontend

# 列出所有 Pages 專案
pnpm wrangler pages project list

# 應該看到：
# - pos-frontend-staging ✅ (已存在)
# - pos-frontend-prod ✅ (剛建立)
```

### 在 Dashboard 確認

前往 Workers & Pages，應該看到兩個專案：

```
Workers & Pages
├─ pos-frontend-staging
│  └─ https://pos-frontend-staging.pages.dev
│
└─ pos-frontend-prod
   └─ https://pos-frontend-prod.pages.dev
```

## 🔄 Production 專案配置

### 建議的設定

建立專案後，建議配置以下設定：

#### 1. Build 配置（可選）

由於我們使用 wrangler 部署已建置的檔案，這些設定不是必需的，但建議配置以保持一致性：

- **Build command**: `pnpm run build`
- **Build output directory**: `dist`
- **Root directory**: `packages/frontend`

#### 2. 環境變數

在 Settings > Environment variables 中設定：

| 變數名稱 | 值 | 用途 |
|---------|---|------|
| `VITE_API_BASE_URL` | `https://pos-backend-prod.survey-api.workers.dev` | Production API 端點 |

**注意**: 由於我們在 GitHub Actions 中已設定，這裡是可選的。

#### 3. 自訂域名（可選）

如果您有自己的域名，可以在 Custom domains 中加入：
- 例如：`app.yourcompany.com`

## 🎯 完整的專案結構

建立完成後，您會有：

### Staging 環境

**Frontend Pages 專案**:
- 名稱: `pos-frontend-staging`
- 域名: `pos-frontend-staging.pages.dev`
- Production branch: `main`
- 用途: 線上測試、QA 驗證

**Backend Worker**:
- 名稱: `pos-backend-staging`
- 域名: `pos-backend-staging.survey-api.workers.dev`
- Environment: `staging`

**資源**:
- D1: `pos-db-staging`
- R2: `pos-assets-staging`

### Production 環境

**Frontend Pages 專案**:
- 名稱: `pos-frontend-prod`
- 域名: `pos-frontend-prod.pages.dev`
- Production branch: `main`
- 用途: 正式對外服務

**Backend Worker**:
- 名稱: `pos-backend-prod`
- 域名: `pos-backend-prod.survey-api.workers.dev`
- Environment: `production`

**資源**:
- D1: `pos-db-prod`
- R2: `pos-assets-prod`

## 📝 首次 Production 部署流程

### 前置準備

1. **建立 Pages 專案**（本指南）
   ```bash
   pnpm wrangler pages project create pos-frontend-prod \
     --production-branch=main
   ```

2. **建立 R2 Bucket**（如需要）
   ```bash
   cd packages/backend
   pnpm wrangler r2 bucket create pos-assets-prod
   ```

3. **確認 D1 資料庫**
   ```bash
   pnpm wrangler d1 list | grep pos-db-prod
   # ✅ 應該已存在
   ```

4. **執行 Migrations**（首次）
   ```bash
   pnpm wrangler d1 migrations apply DB --env production
   ```

5. **匯入初始資料**（可選）
   ```bash
   pnpm wrangler d1 execute DB --env production \
     --file seeds/0005_complete_data_seed.sql
   ```

### 執行部署

1. **前往 GitHub Actions**
2. **選擇 "Deploy to Production"**
3. **Run workflow**:
   - 版本號: `v1.0.0`
   - 部署原因: `首次 Production 部署`
4. **監控部署過程**
5. **驗證結果**

## 🔍 常見問題

### Q: 為什麼需要手動建立專案？

**A**: Cloudflare Pages 專案是獨立的容器，需要先建立才能部署。第一次部署時 wrangler 可能會自動建立，但明確建立更安全。

### Q: 可以重新命名專案嗎？

**A**: 可以在 Dashboard 的 Settings 中重新命名，但需要同步更新：
- GitHub Actions workflows
- 前端的環境變數配置

### Q: Staging 專案為什麼已經存在？

**A**: 您之前已經建立過，可能是透過：
- Dashboard 手動建立
- 首次 wrangler 部署時自動建立

### Q: Production branch 一定要是 main 嗎？

**A**: 不一定，但建議使用 `main` 保持一致性。您也可以：
- 使用 `production` branch
- 使用 `release` branch
- 但要同步更新 workflow 中的 `--branch` 參數

## 🚀 立即行動

### 選項 1: 透過 Wrangler CLI（快速）

```bash
cd packages/frontend

# 建立 Production 專案
pnpm wrangler pages project create pos-frontend-prod \
  --production-branch=main

# 驗證建立成功
pnpm wrangler pages project list
```

### 選項 2: 透過 Dashboard（視覺化）

1. 前往 https://dash.cloudflare.com/
2. Workers & Pages > Create application
3. Pages > Direct Upload
4. Project name: `pos-frontend-prod`
5. Create project

### 建立後

重新觸發 Production 部署即可成功！

## 📚 相關文檔

- [部署架構說明](../DEPLOYMENT_ARCHITECTURE.md)
- [部署檢查清單](DEPLOYMENT_CHECKLIST.md)
- [Secrets 設定指南](SECRETS_SETUP.md)

---

**建立專案後，重新執行 Production 部署即可！** 🚀

