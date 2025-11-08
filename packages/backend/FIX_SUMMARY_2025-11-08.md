# localhost health 端點修復總結

**日期**: 2025-11-08  
**問題**: localhost health 端點回傳 `{"ok": false, "d1_status": "error"}`  
**狀態**: ✅ 已修復

## 問題診斷

### 原始問題

執行 `curl http://localhost:8787/health` 時回傳：
```json
{
  "ok": false,
  "env": "development",
  "d1_status": "error",
  "now_utc": "2025-11-08T06:17:37.944Z",
  "now_local": "2025-11-08T06:17:37.000Z"
}
```

### 根本原因

經過診斷發現兩個主要問題：

1. **本地 D1 資料庫未初始化**
   - 19 個 migration 檔案尚未套用到本地資料庫
   - 資料庫檔案存在於 `.wrangler/state/v3/d1/`，但 schema 為空
   
2. **開發伺服器端口衝突**
   - 8787 端口被舊的 wrangler 進程佔用
   - 導致新的開發伺服器無法啟動

## 修復步驟

### 1. 套用 D1 Migrations

```bash
# 查看 pending migrations
pnpm wrangler d1 migrations list DB --local

# 套用所有 migrations（19 個）
pnpm wrangler d1 migrations apply DB --local
```

執行結果：
- ✅ 0001_init.sql
- ✅ 0002_add_coupon_description.sql
- ✅ 0003_make_user_id_nullable_v2.sql
- ✅ 0003_add_expires_after_days.sql
- ... (共 19 個 migrations)

### 2. 清理端口佔用

```bash
# 終止佔用 8787 端口的進程
lsof -ti:8787 | xargs kill -9

# 重新啟動開發伺服器
pnpm run dev
```

### 3. 驗證修復

```bash
curl -s http://localhost:8787/health | jq .
```

修復後的輸出：
```json
{
  "ok": true,
  "env": "development",
  "d1_status": "ok",
  "now_utc": "2025-11-08T06:23:47.523Z",
  "now_local": "2025-11-08T06:23:47.000Z"
}
```

✅ `ok` 從 `false` 變為 `true`  
✅ `d1_status` 從 `error` 變為 `ok`

## 新增工具與文檔

為了預防類似問題再次發生，新增了以下工具和文檔：

### 1. 快速設置腳本

**檔案**: `scripts/setup-local.sh`

此腳本會自動：
- 檢查並釋放被佔用的 8787 端口
- 檢查並套用所有 pending 的 D1 migrations
- 檢查資料庫是否需要 seed 資料

使用方式：
```bash
bash scripts/setup-local.sh
```

### 2. 故障排除指南

**檔案**: `TROUBLESHOOTING.md`

包含：
- localhost health 端點失敗的完整診斷流程
- 端口衝突的解決方案
- D1 migration 執行失敗的處理方法
- 開發最佳實踐
- 清理與重置指南

### 3. README 更新

**檔案**: `README.md`

新增章節：
- **快速設置（推薦）**: 說明如何使用 setup-local.sh 腳本
- **Health Check 失敗**: 在常見問題中新增此問題的說明

## 測試結果

所有端點測試通過：

### Health Endpoint
```bash
$ curl http://localhost:8787/health
✅ {"ok": true, "d1_status": "ok", ...}
```

### Version Endpoint
```bash
$ curl http://localhost:8787/version
✅ {"version": "1.0.0", "env": "development"}
```

### Users API
```bash
$ curl http://localhost:8787/api/users
✅ {"success": true, "data": [...], "pagination": {...}}
```

## 開發建議

### 首次設置

```bash
# 1. 執行快速設置
bash scripts/setup-local.sh

# 2. 填充測試資料（可選）
bash scripts/seed-data.sh

# 3. 啟動開發伺服器
pnpm run dev

# 4. 驗證健康狀態
curl http://localhost:8787/health
```

### 拉取最新程式碼後

```bash
# 1. 安裝/更新依賴
pnpm install

# 2. 檢查並執行快速設置
bash scripts/setup-local.sh

# 3. 重新啟動開發伺服器
pnpm run dev
```

### 遇到問題時

```bash
# 方法一：使用快速設置腳本（推薦）
bash scripts/setup-local.sh

# 方法二：完全重置
pkill -f "wrangler"
rm -rf .wrangler/
bash scripts/setup-local.sh
bash scripts/seed-data.sh
pnpm run dev
```

## 相關文件

- [README.md](./README.md) - 專案主要文檔
- [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - 完整的故障排除指南
- [scripts/setup-local.sh](./scripts/setup-local.sh) - 快速設置腳本

## 結論

問題已完全修復，並新增了工具和文檔以預防未來類似問題。建議所有開發者在首次設置或遇到問題時使用 `bash scripts/setup-local.sh` 腳本。

