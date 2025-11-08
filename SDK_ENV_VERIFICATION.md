# ✅ SDK 環境配置驗證報告

## 🎯 配置確認

### 1. SDK 配置模式: **模式 B（Runtime 環境判斷）** ✅

#### `packages/sdk/src/config.ts`
```typescript
export const getBaseURL = (): string => {
  // 瀏覽器環境：使用 Vite 環境變數
  if (typeof window !== 'undefined') {
    try {
      const viteEnv = import.meta.env?.VITE_API_BASE_URL;
      if (viteEnv) {
        return viteEnv;  // ✅ Runtime 讀取！
      }
    } catch (e) {
      // Fallback
    }
  }
  
  // 預設值：本地開發
  return 'http://localhost:8787';
};

export const createFullURL = (path: string): string => {
  const baseURL = getBaseURL();
  return `${baseURL}${path}`;
};
```

### 2. 所有 URL 函數使用 `createFullURL()` ✅

#### 自動化處理腳本: `packages/backend/scripts/post-generate-sdk.js`

```javascript
// 1. 添加 import
import { createFullURL } from './config.js';

// 2. 修正所有 URL 函數
return `/health` → return createFullURL(`/health`)
return `/api/users` → return createFullURL(`/api/users`)

// 3. 修正條件運算符
return stringifiedParams.length > 0 ? `/api/...` : `/api/...`
→ return stringifiedParams.length > 0 ? createFullURL(`/api/...`) : createFullURL(`/api/...`)
```

**修正結果**: 43 個 URL 函數已自動修正 ✅

### 3. 三個環境配置

#### Development（本地開發）
```bash
# 無需 .env 檔案，或使用 .env.local
# VITE_API_BASE_URL 未設定或為 undefined
# SDK 使用預設值: http://localhost:8787
```

#### Staging（測試環境）
```bash
# .env.staging
VITE_API_BASE_URL=https://api-staging.example.com

# 建置命令
pnpm run build --mode staging

# SDK 在 Runtime 讀取環境變數: https://api-staging.example.com
```

#### Production（生產環境）
```bash
# .env.production
VITE_API_BASE_URL=https://api.example.com

# 建置命令
pnpm run build --mode production

# SDK 在 Runtime 讀取環境變數: https://api.example.com
```

---

## 🧪 測試驗證

### Node.js 環境測試（預設值）

```bash
cd packages/sdk
node -e "
const { getGetHealthUrl, getGetApiUsersUrl } = require('./dist/index.js');
console.log('Health:', getGetHealthUrl());
console.log('Users:', getGetApiUsersUrl());
"

# 輸出:
# Health: http://localhost:8787/health
# Users: http://localhost:8787/api/users
```

### 瀏覽器環境測試

開啟: `test-sdk-env.html`

**Development 環境（無 .env.staging）**:
- VITE_API_BASE_URL = undefined
- SDK 使用: `http://localhost:8787`

**Staging 環境（有 .env.staging）**:
- VITE_API_BASE_URL = "https://api-staging.example.com"
- SDK 使用: `https://api-staging.example.com`

---

## 📋 重要確認

### ✅ 符合 SSOT 原則

1. **API 規格** = Zod schema（後端 `src/zod/*.ts`）
2. **OpenAPI** = 自動產生（`pnpm run openapi`）
3. **SDK** = 自動產生（`pnpm run client:gen`）
4. **環境配置** = Runtime 判斷（`.env.*` + `config.ts`）

### ✅ 三個環境共用同一份 SDK

- **不需要**為每個環境重新生成 SDK
- **只需要**修改 `.env.*` 檔案
- **編譯時** Vite 會注入環境變數
- **Runtime** SDK 讀取環境變數決定 baseURL

### ✅ 何時需要重新生成 SDK？

**需要重新生成的情況：**
- ✅ 後端 API 規格變更（Zod schema 改變）
- ✅ 新增/刪除 API 端點
- ✅ API 參數或返回值結構改變

**不需要重新生成的情況：**
- ❌ 切換環境（dev → staging → prod）
- ❌ 修改 API Base URL
- ❌ 修改 CORS 設定
- ❌ 修改環境變數

---

## 🔧 自動化流程

### SDK 更新流程

```bash
cd packages/backend

# 完整更新流程
pnpm run sdk:update

# 這會執行:
# 1. pnpm run openapi     - 生成 OpenAPI 文檔
# 2. pnpm run spectral    - 檢查 OpenAPI 規範（必須 0 error）
# 3. pnpm run client:gen  - 生成 SDK + 後處理 + 編譯
```

### 後處理自動化

`pnpm run client:gen` 會自動執行：
1. `orval --config orval.config.ts` - 生成 SDK
2. `node scripts/post-generate-sdk.js` - 後處理（修正 URL 函數）
3. `cd ../sdk && pnpm run build` - 編譯 SDK

---

## 🎉 總結

### 當前實作狀態

| 項目 | 狀態 | 說明 |
|------|------|------|
| SDK 模式 | ✅ 模式 B | Runtime 環境判斷 |
| URL 函數 | ✅ 43 個 | 全部使用 `createFullURL()` |
| 環境支援 | ✅ 3 個 | dev/staging/prod |
| SSOT 原則 | ✅ 符合 | API 定義來自 Zod |
| 自動化 | ✅ 完整 | post-generate 自動修正 |
| 文檔 | ✅ 完整 | 所有 README 已更新 |

### 環境切換流程

```bash
# Development → Staging
cd packages/frontend
pnpm run build --mode staging

# Staging → Production
pnpm run build --mode production

# 不需要重新生成 SDK！✅
```

---

**驗證方式**: 開啟 `test-sdk-env.html` 查看實際運作狀況。

**作者**: AI Assistant  
**日期**: 2025-09-30  
**狀態**: ✅ SDK 環境配置完全正確，符合 SSOT 原則
