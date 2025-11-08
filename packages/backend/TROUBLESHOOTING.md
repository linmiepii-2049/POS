# 故障排除指南

本文檔記錄常見問題及其解決方案。

## localhost health 端點失敗

### 問題描述

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

1. **本地 D1 資料庫未初始化**：migrations 尚未套用到本地資料庫
2. **端口衝突**：8787 端口被其他進程佔用

### 診斷步驟

#### 1. 檢查 D1 資料庫狀態

```bash
# 查看 pending migrations
pnpm wrangler d1 migrations list DB --local

# 檢查本地資料庫檔案是否存在
ls -la .wrangler/state/v3/d1/miniflare-D1DatabaseObject/
```

#### 2. 檢查端口佔用

```bash
# 查看 8787 端口是否被佔用
lsof -ti:8787

# 如果有輸出，表示端口被佔用
```

### 解決方案

#### 方案一：使用快速設置腳本（推薦）

```bash
bash scripts/setup-local.sh
```

此腳本會自動處理所有常見問題。

#### 方案二：手動修復

```bash
# 1. 終止佔用端口的進程
lsof -ti:8787 | xargs kill -9

# 2. 套用所有 pending 的 migrations
pnpm wrangler d1 migrations apply DB --local

# 3. 重新啟動開發伺服器
pnpm run dev
```

### 驗證修復

```bash
# 測試 health endpoint
curl -s http://localhost:8787/health | jq .

# 預期輸出
{
  "ok": true,
  "env": "development",
  "d1_status": "ok",
  "now_utc": "2025-11-08T06:19:32.235Z",
  "now_local": "2025-11-08T06:19:32.000Z"
}
```

### 預防措施

1. **初次設置時**，務必執行完整的設置流程：
   ```bash
   bash scripts/setup-local.sh
   pnpm run d1:seed:full
   ```

2. **拉取最新程式碼後**，檢查是否有新的 migrations：
   ```bash
   pnpm wrangler d1 migrations list DB --local
   # 如果有 pending migrations，執行：
   pnpm wrangler d1 migrations apply DB --local
   ```

3. **關閉開發伺服器時**，使用 Ctrl+C 正常終止，避免端口殘留

## 其他常見問題

### Wrangler 啟動失敗（Address already in use）

**錯誤訊息**：
```
*** Fatal uncaught kj::Exception: kj/async-io-unix.c++:945: failed: ::bind(sockfd, &addr.generic, addrlen): Address already in use; toString() = 127.0.0.1:8787
```

**原因**：端口 8787 被佔用

**解決方案**：
```bash
# 方法一：終止佔用端口的進程
lsof -ti:8787 | xargs kill -9

# 方法二：使用不同端口
pnpm wrangler dev --port 8788
```

### D1 Migration 執行失敗

**可能原因**：
1. SQL 語法錯誤
2. Migration 檔案重複或順序錯誤
3. 本地資料庫檔案損壞

**解決方案**：
```bash
# 1. 檢查 migration 檔案語法
cat migrations/XXXX_xxx.sql

# 2. 如果懷疑資料庫損壞，可以重置：
rm -rf .wrangler/state/v3/d1/
pnpm wrangler d1 migrations apply DB --local

# 3. 重新匯入測試資料
pnpm run d1:seed:full
```

### API 回傳空值或錯誤

**診斷步驟**：
1. 檢查 health endpoint 是否正常：`curl http://localhost:8787/health`
2. 查看開發伺服器日誌
3. 檢查資料庫是否有資料：`pnpm run d1:console`

**常見解決方案**：
```bash
# 確保資料庫有測試資料
pnpm run d1:seed:full

# 重新啟動開發伺服器
pkill -f "wrangler dev" && pnpm run dev
```

## 開發最佳實踐

### 啟動開發環境

每次開始開發前：
```bash
# 1. 確保本地環境正確設置
bash scripts/setup-local.sh

# 2. 啟動開發伺服器
pnpm run dev

# 3. 在另一個終端驗證健康狀態
curl http://localhost:8787/health
```

### 更新專案依賴

```bash
# 1. 更新依賴
pnpm install

# 2. 檢查並套用新的 migrations
pnpm wrangler d1 migrations list DB --local
pnpm wrangler d1 migrations apply DB --local

# 3. 執行測試
pnpm run test

# 4. 重新啟動開發伺服器
pnpm run dev
```

### 清理與重置

如果遇到無法解決的問題，嘗試完全重置：
```bash
# 1. 終止所有相關進程
pkill -f "wrangler"

# 2. 清理本地資料庫
rm -rf .wrangler/

# 3. 重新初始化
bash scripts/setup-local.sh
pnpm run d1:seed:full

# 4. 啟動開發伺服器
pnpm run dev
```

## 相關資源

- [Wrangler 官方文檔](https://developers.cloudflare.com/workers/wrangler/)
- [D1 資料庫文檔](https://developers.cloudflare.com/d1/)
- [Hono 框架文檔](https://hono.dev/)
- [專案 README](./README.md)

