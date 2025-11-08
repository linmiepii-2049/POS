# GitHub Actions Workflow 更新總結

**日期**: 2025-11-08  
**類型**: D1 與 R2 自動化設定  
**狀態**: ✅ 已完成

## 更新內容

### 1. 測試日期修復

**問題**: 測試使用固定的 2024 年日期，導致優惠券被判定為已過期

**修復**:
- ✅ 所有測試日期更新為 2026/2027 年
- ✅ 統一時間格式為 `.000Z`（包含毫秒）
- ✅ 修正 `is_expired` 和 `is_valid` 判斷錯誤

**影響**: 
- `tests/coupons.route.test.ts` - 86 處日期更新
- 主要測試錯誤已修復

### 2. Staging 部署流程增強

**檔案**: `.github/workflows/deploy-staging.yml`

**新增步驟**:

```yaml
1. 🗄️ 檢查 D1 資料庫狀態
   - 驗證資料庫連線
   - 顯示資料庫資訊

2. 🔄 執行 D1 Migrations
   - 自動檢查 pending migrations
   - 批次執行（batch-size: 10）
   - 顯示執行結果

3. 📦 檢查 R2 Bucket 狀態
   - 驗證 bucket 存在
   - 失敗時提供建立指令

4. 🚀 部署 Workers
   - 加入 GIT_SHA 環境變數
```

**安全機制**:
- R2 bucket 不存在時會中止部署
- Migration 失敗會顯示錯誤但允許繼續
- 所有步驟都有清楚的日誌輸出

### 3. Production 部署流程增強

**檔案**: `.github/workflows/deploy-production.yml`

**新增步驟**:

```yaml
1. 🗄️ 檢查 D1 資料庫狀態
   - 驗證 Production 資料庫

2. 🔄 執行 D1 Migrations
   - 更保守的批次大小（batch-size: 5）
   - 顯示 pending migrations 列表
   - 詳細的執行日誌

3. 📦 檢查 R2 Bucket 狀態
   - 嚴格驗證（失敗即中止）

4. 💾 備份資料庫提醒
   - 提醒執行備份
   - 提供備份指令

5. 🚀 部署 Workers
   - 加入 VERSION 和 GIT_SHA
   - 顯示版本資訊
```

**Production 特殊保護**:
- 更小的 migration 批次大小
- 強制 R2 檢查
- 備份提醒
- 詳細的版本追蹤

### 4. 新增文檔

**檔案**: `.github/D1_R2_SETUP.md`

**內容**:
- 完整的 D1 與 R2 設定指南
- 部署流程說明
- Migration 最佳實踐
- 故障排除指南
- 環境變數設定說明
- 部署檢查清單

## 技術細節

### D1 Migration 處理

**Staging**:
```bash
# 檢查 pending
wrangler d1 migrations list DB --env staging

# 執行（如有需要）
wrangler d1 migrations apply DB --env staging --batch-size 10
```

**Production**:
```bash
# 更保守的批次大小
wrangler d1 migrations apply DB --env production --batch-size 5
```

### R2 Bucket 驗證

**Staging**:
```bash
# 檢查 bucket 存在
wrangler r2 bucket list | grep "pos-assets-staging"

# 不存在時提供建立指令
wrangler r2 bucket create pos-assets-staging
```

**Production**:
```bash
# 嚴格檢查，失敗即中止
wrangler r2 bucket list | grep "pos-assets-prod"
```

## 環境變數

### 新增的環境變數

**Staging**:
- `GIT_SHA`: Git commit SHA（自動注入）

**Production**:
- `GIT_SHA`: Git commit SHA（自動注入）
- `VERSION`: 版本號（從輸入取得）

### 必要的 GitHub Secrets

| Secret | 用途 |
|--------|------|
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 存取 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 帳號 ID |

## 部署流程圖

### Staging 部署

```
開始
  ↓
品質檢查（Preflight）
  ↓
檢查 D1 狀態
  ↓
執行 Migrations ← 自動偵測
  ↓
檢查 R2 Bucket ← 必須存在
  ↓
部署 Workers
  ↓
健康檢查 ← 重試 3 次
  ↓
完成 / 通知
```

### Production 部署

```
開始
  ↓
完整品質檢查
  ↓
版本號驗證
  ↓
檢查 D1 狀態
  ↓
執行 Migrations ← 批次 5
  ↓
檢查 R2 Bucket ← 嚴格檢查
  ↓
備份提醒
  ↓
部署 Workers ← 包含版本
  ↓
健康檢查 ← 重試 3 次
  ↓
建立 Git Tag
  ↓
完成 / 通知
```

## 使用方式

### 部署到 Staging

1. **透過 GitHub UI**:
   - 前往 Actions > Deploy to Staging
   - 點擊 "Run workflow"
   - 輸入部署原因
   - 執行

2. **自動化**:
   - 所有 D1 和 R2 檢查都會自動執行
   - Migration 會自動應用（如有需要）
   - 失敗時會有清楚的錯誤訊息

### 部署到 Production

1. **前置準備**:
   - 確認 Staging 測試通過
   - 準備版本號（格式：v1.0.0）
   - 考慮備份資料庫

2. **執行部署**:
   - 前往 Actions > Deploy to Production
   - 輸入版本號和部署原因
   - 系統會自動處理所有檢查
   - 部署成功後自動建立 Git Tag

## 安全性改進

### 失敗保護

- ✅ R2 bucket 不存在時中止部署
- ✅ Migration 執行狀態監控
- ✅ 健康檢查重試機制（3 次）
- ✅ 詳細的錯誤日誌

### 資料保護

- ✅ Production 使用更小的 migration 批次
- ✅ 備份提醒（Production）
- ✅ 版本追蹤（Git Tag）
- ✅ 部署前品質檢查

### 可追溯性

- ✅ Git SHA 記錄
- ✅ 版本號標記（Production）
- ✅ 部署原因記錄
- ✅ 詳細的日誌輸出

## 測試建議

### 首次部署測試

1. **Staging 環境**:
   ```bash
   # 確認 D1 migrations 狀態
   cd packages/backend
   pnpm wrangler d1 migrations list DB --env staging
   
   # 確認 R2 bucket 存在
   pnpm wrangler r2 bucket list | grep staging
   
   # 觸發部署
   # 透過 GitHub Actions UI
   ```

2. **驗證部署**:
   ```bash
   # 健康檢查
   curl https://pos-backend-staging.survey-api.workers.dev/health
   
   # 測試 API
   curl https://pos-backend-staging.survey-api.workers.dev/api/users?limit=1
   
   # 測試上傳（需要前端）
   ```

### Production 部署測試

1. **部署前檢查**:
   - [ ] Staging 環境正常運作
   - [ ] 所有測試通過
   - [ ] 資料庫已備份
   - [ ] 團隊已通知

2. **執行部署**:
   - 使用有意義的版本號（v1.0.0）
   - 填寫詳細的部署原因
   - 監控部署日誌

3. **部署後驗證**:
   - 健康檢查
   - 功能測試
   - 監控錯誤日誌

## 回滾計畫

### 如需回滾

1. **Workers 回滾**:
   ```bash
   cd packages/backend
   # 回到前一個版本
   pnpm wrangler rollback --env production
   ```

2. **D1 回滾**:
   - 如果 migration 有問題，需要手動處理
   - 建議事先備份資料庫

3. **前端回滾**:
   - 在 Cloudflare Pages 中選擇先前的部署版本

## 後續改進

### 短期

- [ ] 加入自動備份功能
- [ ] 整合 Slack/Discord 通知
- [ ] 加入 smoke tests

### 長期

- [ ] 藍綠部署支援
- [ ] 自動化回滾機制
- [ ] 效能監控整合
- [ ] 成本追蹤

## 相關文件

- [D1 與 R2 設定指南](.github/D1_R2_SETUP.md)
- [部署指南](DEPLOYMENT_GUIDE.md)
- [GitHub Actions 指南](.github/GITHUB_ACTIONS_GUIDE.md)
- [後端 README](packages/backend/README.md)

## 總結

✅ **已完成**:
- D1 自動 migration 執行
- R2 bucket 驗證
- 測試日期修復
- 完整的文檔

✅ **改進**:
- 更安全的部署流程
- 更好的錯誤處理
- 更詳細的日誌
- 更強的可追溯性

✅ **下一步**:
- 測試 Staging 部署
- 驗證所有功能正常
- 準備 Production 部署

---

**注意**: 這些更新已整合到部署流程中，下次部署時會自動生效。

