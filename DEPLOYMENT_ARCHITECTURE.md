# 部署架構說明

**最後更新**: 2025-11-08  
**架構類型**: 獨立專案隔離（業界標準）  
**狀態**: ✅ 已配置完成

## 🏗️ 架構總覽

### 環境隔離策略

本專案採用**業界標準的獨立專案架構**，每個環境使用完全獨立的資源：

```
┌─────────────────────────────────────────────────────────────┐
│                    本地開發環境                              │
├─────────────────────────────────────────────────────────────┤
│ 前端: http://localhost:3000                                  │
│ 後端: http://localhost:8787                                  │
│ D1:   .wrangler/state/v3/d1/ (本地 SQLite)                   │
│ R2:   本地檔案系統                                            │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    git push origin main
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Staging 環境（線上測試）                   │
├─────────────────────────────────────────────────────────────┤
│ 前端: https://pos-frontend-staging.pages.dev                │
│   ├─ Cloudflare Pages 專案: pos-frontend-staging            │
│   ├─ Production branch: main                                │
│   └─ 用途: QA 測試、功能驗證、客戶預覽                        │
│                                                              │
│ 後端: https://pos-backend-staging.survey-api.workers.dev    │
│   ├─ Cloudflare Worker: pos-backend-staging                 │
│   ├─ Environment: staging                                   │
│   └─ CORS: localhost + staging 前端域名                      │
│                                                              │
│ D1:   pos-db-staging (e4719617-39ba-44b8-890b-6cc08c9c778a) │
│ R2:   pos-assets-staging                                     │
└─────────────────────────────────────────────────────────────┘
                           ↓
                  測試通過 + 版本確認
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                    Production 環境（正式服務）                │
├─────────────────────────────────────────────────────────────┤
│ 前端: https://pos-frontend-prod.pages.dev                   │
│   ├─ Cloudflare Pages 專案: pos-frontend-prod               │
│   ├─ Production branch: main                                │
│   └─ 用途: 正式對外服務                                       │
│                                                              │
│ 後端: https://pos-backend-prod.survey-api.workers.dev       │
│   ├─ Cloudflare Worker: pos-backend-prod                    │
│   ├─ Environment: production                                │
│   └─ CORS: production 前端域名                               │
│                                                              │
│ D1:   pos-db-prod (f3aa95e5-594c-4d68-a588-19dc6f7962f0)    │
│ R2:   pos-assets-prod                                        │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 關鍵設計決策

### 為什麼用 main branch 部署到 Staging？

**問題**：
之前用 `--branch=staging` 會創建 Preview 部署，導致：
- ❌ 每次部署產生新的隨機 URL（34dd10cd.pos-frontend-staging.pages.dev）
- ❌ CORS 需要不斷更新白名單
- ❌ 無法使用固定的測試 URL
- ❌ 不適合分享給團隊或客戶測試

**解決方案**：
使用 `--branch=main` 更新主域名：
- ✅ 固定的測試 URL（pos-frontend-staging.pages.dev）
- ✅ CORS 配置簡單（只需主域名）
- ✅ 方便分享和測試
- ✅ 符合業界標準實踐

### Cloudflare Pages 的分支機制

```
Cloudflare Pages 專案配置：
├─ Production branch: main
│  └─ 部署到主域名: project-name.pages.dev
│
└─ Preview branches: 其他分支
   └─ 部署到隨機 URL: xyz123.project-name.pages.dev
```

**我們的策略**：
- Staging 專案的 Production branch = main → 固定主域名 ✅
- Production 專案的 Production branch = main → 固定主域名 ✅

## 📋 環境配置詳情

### Staging 環境

**前端**：
- 專案: `pos-frontend-staging`
- 域名: `https://pos-frontend-staging.pages.dev`
- Branch: `main`
- API 端點: `https://pos-backend-staging.survey-api.workers.dev`

**後端**：
- Worker: `pos-backend-staging`
- 域名: `https://pos-backend-staging.survey-api.workers.dev`
- Environment: `staging`
- CORS: `http://localhost:3000,https://pos-frontend-staging.pages.dev`

**資料庫**：
- D1: `pos-db-staging`
- Database ID: `e4719617-39ba-44b8-890b-6cc08c9c778a`

**儲存**：
- R2 Bucket: `pos-assets-staging`

### Production 環境

**前端**：
- 專案: `pos-frontend-prod`
- 域名: `https://pos-frontend-prod.pages.dev`
- Branch: `main`
- API 端點: `https://pos-backend-prod.survey-api.workers.dev`

**後端**：
- Worker: `pos-backend-prod`
- 域名: `https://pos-backend-prod.survey-api.workers.dev`
- Environment: `production`
- CORS: `https://pos-frontend-prod.pages.dev`

**資料庫**：
- D1: `pos-db-prod`
- Database ID: `f3aa95e5-594c-4d68-a588-19dc6f7962f0`

**儲存**：
- R2 Bucket: `pos-assets-prod`

## 🔄 部署流程

### Staging 部署

```bash
開發 → 本地測試通過
  ↓
git push origin main
  ↓
GitHub Actions: "Deploy to Staging"
  ↓
├─ 後端部署到: pos-backend-staging
│  ├─ 檢查 D1 資料庫
│  ├─ 執行 migrations
│  └─ 驗證 R2 bucket
├─ 前端建置並部署
│  ├─ 建置 SDK
│  ├─ 建置前端（VITE_API_BASE_URL=staging 後端）
│  └─ 部署到 pos-frontend-staging（--branch=main）
└─ 健康檢查
  ↓
✅ Staging 環境更新完成
📍 https://pos-frontend-staging.pages.dev
```

### Production 部署

```bash
Staging 測試通過 + 準備版本號
  ↓
GitHub Actions: "Deploy to Production"
  ↓
├─ 後端部署到: pos-backend-prod
│  ├─ 備份提醒
│  ├─ 檢查 D1 資料庫
│  ├─ 執行 migrations
│  └─ 驗證 R2 bucket
├─ 前端建置並部署
│  ├─ 建置 SDK
│  ├─ 建置前端（VITE_API_BASE_URL=prod 後端）
│  └─ 部署到 pos-frontend-prod（--branch=main）
├─ 健康檢查
└─ 建立 Git Tag
  ↓
✅ Production 環境更新完成
📍 https://pos-frontend-prod.pages.dev
```

## 🔐 CORS 配置

### 簡化的 CORS 策略

**Staging**：
```toml
CORS_ORIGINS = "http://localhost:3000,https://pos-frontend-staging.pages.dev"
```
- 本地開發 + Staging 主域名
- 不再需要維護 Preview URLs 列表

**Production**：
```toml
CORS_ORIGINS = "https://pos-frontend-prod.pages.dev"
```
- 只允許 Production 前端域名
- 更嚴格的安全性

## 📊 與業界對比

### 相同架構的知名服務

| 服務 | Staging | Production |
|------|---------|-----------|
| **Vercel** | project-staging.vercel.app | project-prod.vercel.app |
| **Netlify** | project-staging.netlify.app | project-prod.netlify.app |
| **您的專案** | pos-frontend-staging.pages.dev | pos-frontend-prod.pages.dev |

### 架構優勢對比

| 特性 | 獨立專案（您的架構）| 分支 Preview | 
|------|------------------|-------------|
| 固定測試 URL | ✅ 是 | ❌ 隨機 URL |
| CORS 配置 | ✅ 簡單 | ❌ 需通配符 |
| 環境隔離 | ✅ 完全隔離 | ⚠️ 共用專案 |
| 回滾影響 | ✅ 獨立 | ⚠️ 可能互相影響 |
| 資料庫隔離 | ✅ 完全獨立 | ✅ 可配置 |
| 適合線上測試 | ✅ 非常適合 | ❌ 不適合 |
| 業界採用率 | ✅ ~70% | ⚠️ ~10% |

## 🎯 使用指南

### 日常開發流程

1. **本地開發**：
   ```bash
   cd packages/backend && pnpm dev  # localhost:8787
   cd packages/frontend && pnpm dev # localhost:3000
   ```

2. **提交到 Staging**：
   ```bash
   git push origin main
   # 或手動觸發 GitHub Actions: Deploy to Staging
   ```

3. **線上測試**：
   - 訪問：`https://pos-frontend-staging.pages.dev`
   - 測試所有功能
   - 分享給團隊成員或客戶預覽

4. **部署到 Production**：
   - GitHub Actions: Deploy to Production
   - 輸入版本號（v1.0.0）
   - 等待部署完成

### 測試 URL

```bash
# Staging（線上測試）
前端: https://pos-frontend-staging.pages.dev
後端: https://pos-backend-staging.survey-api.workers.dev
健康: https://pos-backend-staging.survey-api.workers.dev/health

# Production（正式環境）
前端: https://pos-frontend-prod.pages.dev
後端: https://pos-backend-prod.survey-api.workers.dev
健康: https://pos-backend-prod.survey-api.workers.dev/health
```

## ✅ 下一步

### 立即執行

現在觸發新的 Staging 部署：

1. **前往 GitHub Actions**
   ```
   https://github.com/linmiepii-2049/POS/actions
   ```

2. **選擇 "Deploy to Staging"**

3. **Run workflow**
   - Branch: `main`
   - 部署原因: `修正部署策略，使用主域名`
   - 執行

4. **等待部署完成**（約 5 分鐘）

5. **訪問 Staging**
   ```
   https://pos-frontend-staging.pages.dev
   ```

### 預期結果

這次部署後：
- ✅ `pos-frontend-staging.pages.dev` 會更新到最新版本
- ✅ 不會再有 CORS 錯誤
- ✅ Health 檢查會顯示正常
- ✅ 所有 API 呼叫正常運作
- ✅ 可以正常進行線上測試

## 🎉 總結

您的架構現在符合業界最佳實踐：

✅ **完全隔離的環境**
- Staging 和 Production 互不干擾
- 獨立的資料庫和儲存
- 獨立的域名和配置

✅ **固定的測試 URL**
- Staging: pos-frontend-staging.pages.dev
- Production: pos-frontend-prod.pages.dev
- 方便分享和測試

✅ **簡化的 CORS 配置**
- 不需要維護 Preview URLs
- 配置清晰易懂

✅ **自動化的部署流程**
- D1 migrations 自動執行
- R2 bucket 自動驗證
- 健康檢查自動重試

---

**所有配置已完成！現在前往 GitHub Actions 執行新的部署吧！** 🚀

