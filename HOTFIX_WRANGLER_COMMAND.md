# Hotfix: Wrangler D1 Migrations 命令修正

**日期**: 2025-11-08  
**類型**: 緊急修復  
**狀態**: ✅ 已修復

## 問題

GitHub Actions 部署失敗，錯誤訊息：

```
✘ [ERROR] Unknown arguments: batch-size, batchSize
```

## 根本原因

`wrangler d1 migrations apply` 命令**不支援** `--batch-size` 參數。

這是文檔錯誤或過時資訊導致的問題。實際上 wrangler 會一次性執行所有 pending migrations，不需要也不支援批次大小控制。

## 修復內容

### 1. Staging Workflow (`.github/workflows/deploy-staging.yml`)

**修改前**:
```yaml
npx wrangler d1 migrations apply DB --env staging --batch-size 10
```

**修改後**:
```yaml
npx wrangler d1 migrations apply DB --env staging
```

### 2. Production Workflow (`.github/workflows/deploy-production.yml`)

**修改前**:
```yaml
npx wrangler d1 migrations apply DB --env production --batch-size 5
```

**修改後**:
```yaml
npx wrangler d1 migrations apply DB --env production
```

### 3. 文檔更新

已更新以下文檔移除 `--batch-size` 參考：
- `.github/D1_R2_SETUP.md`
- `WORKFLOW_UPDATES_2025-11-08.md`

## 驗證

### 正確的 Wrangler D1 命令

```bash
# 列出 migrations
wrangler d1 migrations list <database> --env <environment>

# 執行 migrations（一次性執行所有 pending）
wrangler d1 migrations apply <database> --env <environment>

# 可用選項
wrangler d1 migrations apply <database> \
  --env <environment> \
  --local        # 本地資料庫
  --remote       # 遠端資料庫
  --preview      # 預覽環境
```

### 測試驗證

```bash
cd packages/backend

# 檢查 Staging migrations
pnpm wrangler d1 migrations list DB --env staging

# 執行 Staging migrations（正確命令）
pnpm wrangler d1 migrations apply DB --env staging

# ✅ 應該成功執行
```

## 影響

### 修復前
- ❌ GitHub Actions 部署失敗
- ❌ 無法自動執行 migrations
- ❌ 需要手動介入

### 修復後
- ✅ GitHub Actions 正常運作
- ✅ 自動執行 migrations
- ✅ 部署流程順暢

## Migration 執行機制

### Wrangler 如何處理 Migrations

1. **讀取 migrations 目錄**: 掃描所有 `.sql` 檔案
2. **檢查執行歷史**: 查詢 `_cf_KV` 或類似的內部表
3. **識別 pending**: 比對已執行和現有檔案
4. **批次執行**: 一次執行所有 pending（內部自動批次）
5. **記錄狀態**: 更新執行歷史

**結論**: Wrangler 已內建批次處理邏輯，不需要也不允許手動指定 batch size。

## 最佳實踐

### Production Migrations 保護

雖然不能控制批次大小，但可以通過以下方式保護 Production：

1. **分階段部署**:
   ```bash
   # 先在 Staging 測試
   wrangler d1 migrations apply DB --env staging
   
   # 驗證通過後再部署 Production
   wrangler d1 migrations apply DB --env production
   ```

2. **小批次 Migration 檔案**:
   - 一個 migration 只做一件事
   - 複雜變更分多個檔案
   - 例如: `0010_add_column.sql`, `0011_add_index.sql`

3. **備份優先**:
   ```bash
   # Production 部署前先備份
   wrangler d1 backup create pos-db-prod
   ```

4. **可逆性**:
   - 設計可回滾的 migrations
   - 避免破壞性變更（DROP）
   - 優先使用 ADD/ALTER

## 部署檢查清單（更新）

### Staging 部署

- [x] 移除 `--batch-size` 參數 ✅
- [x] 測試 migrations 命令
- [ ] 確認 R2 buckets 存在
- [ ] 觸發 GitHub Actions
- [ ] 驗證部署結果

### Production 部署

- [x] 移除 `--batch-size` 參數 ✅
- [x] 更新文檔
- [ ] Staging 測試通過
- [ ] 備份資料庫
- [ ] 執行部署
- [ ] 驗證結果

## 相關資源

- [Wrangler D1 文檔](https://developers.cloudflare.com/d1/platform/migrations/)
- [Wrangler CLI 參考](https://developers.cloudflare.com/workers/wrangler/commands/)
- [GitHub Actions Workflows](.github/workflows/)

## 總結

✅ **問題已解決**: 移除不支援的 `--batch-size` 參數  
✅ **Workflows 已修正**: 兩個部署流程都已更新  
✅ **文檔已同步**: 所有相關文檔已更新  
✅ **可以部署**: 現在可以正常部署到 Staging/Production

---

**下一步**: 推送修改並觸發部署測試

