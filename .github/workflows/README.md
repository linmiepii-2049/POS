# GitHub Actions Workflows 說明

## 📋 Workflow 架構概覽

### CI/CD 策略

本專案使用**統一 CI + 分離 Deploy** 的策略：

```
CI（統一品質檢查）
  ├─ Backend
  ├─ Frontend (POS)
  └─ Survey Frontend

Deploy（依部署目標分離）
  ├─ POS → Cloudflare Pages
  └─ Survey → GitHub Pages
```

---

## 🔧 Workflow 檔案說明

### CI Workflows

#### 1. `ci.yml` - 統一品質檢查 ✅

**用途**: 所有專案的品質檢查（Lint + TypeScript + Build）

**觸發條件**:
- Pull Request 到 `main` 或 `develop`
- 推送到 `main` 或 `develop`

**檢查項目**:
- ✅ Backend: ESLint + TypeScript + OpenAPI + Spectral + Tests
- ✅ Frontend (POS): ESLint + TypeScript + Tests
- ✅ Survey Frontend: ESLint + TypeScript
- ✅ Build 測試: SDK + Frontend + Survey

**執行時間**: 約 3-5 分鐘

**為什麼統一？**
- 品質標準應該一致
- 減少重複代碼
- 降低維護成本
- 一次看到所有專案的狀態

---

### Deploy Workflows

#### 2. `deploy-staging.yml` - POS Staging 部署

**用途**: 手動部署 POS 系統到 Staging 環境

**部署目標**:
- Backend: Cloudflare Workers (Staging)
- Frontend: Cloudflare Pages (Staging)

**觸發**: 手動觸發（workflow_dispatch）

**步驟**:
1. 品質檢查
2. 執行 D1 Migrations
3. 檢查 R2 Bucket
4. 部署 Backend (Workers)
5. 部署 Frontend (Pages)

**執行時間**: 約 8-10 分鐘

---

#### 3. `deploy-production.yml` - POS Production 部署

**用途**: 手動部署 POS 系統到 Production 環境

**部署目標**:
- Backend: Cloudflare Workers (Production)
- Frontend: Cloudflare Pages (Production)

**觸發**: 手動觸發（需要版本號）

**額外功能**:
- 建立 Git Tag
- 資料庫備份提醒
- 完整的驗證步驟

**執行時間**: 約 10-12 分鐘

---

#### 4. `deploy-survey.yml` - Survey 自動部署 🆕

**用途**: 自動部署 Survey 問卷前端到 GitHub Pages

**部署目標**:
- Survey Frontend: GitHub Pages

**觸發條件**:
- 推送到 `main` 且變更 `packages/survey-frontend/**` 或 `packages/sdk/**`
- 手動觸發（workflow_dispatch）

**為什麼分開？**
- ✅ 部署平台不同（GitHub Pages vs Cloudflare）
- ✅ 使用不同的 Actions (`deploy-pages` vs `wrangler`)
- ✅ 需要不同的權限（`pages: write` vs Cloudflare API）
- ✅ 自動觸發邏輯不同（Survey 推送即部署，POS 手動部署）

**執行時間**: 約 3-5 分鐘

---

### Preview Workflows

#### 5. `survey-preview.yml` - Survey PR 預覽

**用途**: 為 Survey PR 建立預覽版本

**觸發條件**:
- Pull Request 到 `main`
- 變更 `packages/survey-frontend/**` 或 `packages/sdk/**`

**功能**:
- 建置 PR 預覽
- 上傳為 Artifact（保留 7 天）
- 自動在 PR 留言提供下載連結

**執行時間**: 約 2-3 分鐘

---

## 🎯 為什麼這樣設計？

### CI 統一的原因

```yaml
# ✅ 好的設計
ci.yml                     # 所有專案的品質檢查

# ❌ 不好的設計
ci.yml                     # Backend + Frontend
survey-ci.yml              # Survey（重複邏輯）
```

**原因**：
- 品質標準應該統一
- 減少 Actions 數量和執行時間
- 一個 PR 只觸發一個 CI workflow
- 容易在一個地方查看所有檢查結果

### Deploy 分離的原因

```yaml
# ✅ 好的設計
deploy-staging.yml         # POS → Cloudflare Pages
deploy-production.yml      # POS → Cloudflare Pages
deploy-survey.yml          # Survey → GitHub Pages

# ❌ 不好的設計（如果合併）
deploy-all.yml             # 混合不同部署目標
  - if: cloudflare...
  - if: github pages...
```

**原因**：
- 部署目標完全不同（Cloudflare vs GitHub）
- 需要不同的 API Token 和權限
- 觸發邏輯不同（手動 vs 自動）
- 環境變數不同
- 失敗處理策略不同

---

## 📊 觸發矩陣

| 事件 | ci.yml | deploy-survey.yml | deploy-staging.yml | deploy-production.yml | survey-preview.yml |
|------|--------|-------------------|--------------------|-----------------------|--------------------|
| PR 到 main | ✅ | ❌ | ❌ | ❌ | ✅ (Survey 變更) |
| 推送到 main | ✅ | ✅ (Survey 變更) | ❌ | ❌ | ❌ |
| 推送到 develop | ✅ | ❌ | ❌ | ❌ | ❌ |
| 手動觸發 | ❌ | ✅ | ✅ | ✅ | ❌ |

---

## 🚀 使用場景

### 場景 1: 開發 Survey 功能

```
1. 建立 feature branch
2. 修改 packages/survey-frontend/
3. 推送並建立 PR
   → ci.yml 執行（所有檢查）✅
   → survey-preview.yml 執行（建立預覽）✅
4. Merge 到 main
   → ci.yml 執行（最終驗證）✅
   → deploy-survey.yml 執行（自動部署）✅
```

### 場景 2: 開發 POS 功能

```
1. 建立 feature branch
2. 修改 packages/frontend/ 或 packages/backend/
3. 推送並建立 PR
   → ci.yml 執行（所有檢查）✅
4. Merge 到 main
   → ci.yml 執行（最終驗證）✅
5. 手動觸發部署
   → deploy-staging.yml（測試環境）✅
   → deploy-production.yml（生產環境）✅
```

### 場景 3: 修改 SDK

```
1. 修改 packages/sdk/
2. 推送到 main
   → ci.yml 執行（檢查所有依賴 SDK 的專案）✅
   → deploy-survey.yml 執行（如果 Survey 依賴變更）✅
```

---

## 🔍 最佳實踐

### ✅ Do（推薦做法）

1. **統一 CI 檢查** - 所有專案使用同一個 CI workflow
2. **分離 Deploy** - 不同部署目標使用不同 workflow
3. **智能觸發** - 使用 `paths` filter 避免不必要的執行
4. **清晰命名** - workflow 名稱明確表達用途
5. **環境隔離** - 使用 GitHub Environments 管理敏感資訊

### ❌ Don't（避免做法）

1. ❌ 為每個專案建立獨立的 CI（造成重複）
2. ❌ 混合不同部署目標在同一個 workflow
3. ❌ 過度使用 `|| true`（掩蓋錯誤）
4. ❌ 在 workflow 中硬編碼敏感資訊

---

## 📈 效能優化

### 目前的策略

```yaml
on:
  push:
    branches: [main]
    paths:
      - 'packages/survey-frontend/**'  # 只在 Survey 變更時觸發
      - 'packages/sdk/**'
```

### 可選的進階優化

如果想要更精細的控制，可以使用 `dorny/paths-filter`：

```yaml
jobs:
  detect-changes:
    runs-on: ubuntu-latest
    outputs:
      backend: ${{ steps.filter.outputs.backend }}
      frontend: ${{ steps.filter.outputs.frontend }}
      survey: ${{ steps.filter.outputs.survey }}
    steps:
      - uses: actions/checkout@v4
      - uses: dorny/paths-filter@v2
        id: filter
        with:
          filters: |
            backend:
              - 'packages/backend/**'
            frontend:
              - 'packages/frontend/**'
            survey:
              - 'packages/survey-frontend/**'

  check-backend:
    needs: detect-changes
    if: needs.detect-changes.outputs.backend == 'true'
    # 只檢查 backend
```

**但目前不需要**：
- 現有的 `paths` filter 已經夠用
- 過度優化會增加複雜度
- CI 執行時間可接受（3-5 分鐘）

---

## 🎯 結論

### 目前架構（最佳實踐）✅

```
.github/workflows/
├── ci.yml                   # ✅ 統一 CI（Backend + Frontend + Survey）
├── deploy-staging.yml       # ✅ POS Staging 部署
├── deploy-production.yml    # ✅ POS Production 部署
├── deploy-survey.yml        # ✅ Survey 自動部署（GitHub Pages）
└── survey-preview.yml       # ✅ Survey PR 預覽
```

**設計原則**：
- ✅ CI 統一：品質檢查邏輯相同
- ✅ Deploy 分離：部署目標不同
- ✅ 智能觸發：使用 paths filter
- ✅ 清晰維護：職責明確

---

**最後更新**: 2025-01-12

