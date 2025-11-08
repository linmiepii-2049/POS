# SDK 實作總結 - 符合 SSOT 原則

## ✅ 最終實作：模式 B（共用 SDK）

我們採用的是 **模式 B：SDK 透過 env 決定 URL**，這是推薦的做法。

---

## 🎯 核心原則

### SSOT（Single Source of Truth）

1. **API 規格的唯一真相來源** = 後端 Zod schema
2. **SDK 自動產生** = OpenAPI → Spectral → Orval
3. **環境配置與 SDK 分離** = 同一份 SDK，不同環境使用不同 `.env.*`

---

## 📌 兩種模式的差異

### ❌ 模式 A：SDK 內嵌固定 URL（不推薦）

```typescript
// config.ts
export const getBaseURL = (): string => {
  return 'https://api-staging.example.com'; // ❌ 寫死了！
};
```

**缺點：**
- 每換環境都要重新生成 SDK
- 違反 SSOT 原則（URL 應該是配置，不是代碼）
- 無法在 dev/staging/prod 間靈活切換

---

### ✅ 模式 B：SDK 透過 env 決定 URL（推薦）

```typescript
// config.ts
export const getBaseURL = (): string => {
  // 瀏覽器環境：使用 Vite 環境變數
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore
      const viteEnv = import.meta.env?.VITE_API_BASE_URL;
      if (viteEnv) {
        return viteEnv;
      }
    } catch (e) {
      // Fallback
    }
  }
  
  // 預設值：本地開發
  return 'http://localhost:8787';
};
```

**優點：**
- ✅ **一份 SDK，多環境共用** - 不需要為每個環境重新生成
- ✅ **符合 SSOT 原則** - URL 是配置，不是代碼
- ✅ **環境隔離** - dev/staging/prod 只需改 `.env.*`
- ✅ **靈活部署** - 同一個 build 可以部署到不同環境

---

## 🔧 實作細節

### 1. SDK 配置 (`packages/sdk/src/config.ts`)

```typescript
/**
 * SDK 配置
 * 環境變數優先級：
 * 1. VITE_API_BASE_URL (Vite 前端專案)
 * 2. 預設值：http://localhost:8787 (本地開發)
 */
export const getBaseURL = (): string => {
  // Runtime 讀取環境變數
  if (typeof window !== 'undefined') {
    try {
      const viteEnv = import.meta.env?.VITE_API_BASE_URL;
      if (viteEnv) {
        return viteEnv;
      }
    } catch (e) {
      // Fallback
    }
  }
  return 'http://localhost:8787';
};

export const createFullURL = (path: string): string => {
  const baseURL = getBaseURL();
  return `${baseURL}${path}`;
};
```

### 2. 所有 URL 函數使用 `createFullURL()`

```typescript
// 自動生成的 SDK (packages/sdk/src/index.ts)
export const getGetHealthUrl = () => {
  return createFullURL('/health');
}

export const getGetApiUsersUrl = () => {
  return createFullURL('/api/users');
}

// ... 其他 30+ 個 URL 函數都使用 createFullURL()
```

### 3. 前端環境配置

**開發環境 (`.env.local`)**
```env
VITE_API_BASE_URL=http://localhost:8787
```

**Staging 環境 (`.env.staging`)**
```env
VITE_API_BASE_URL=https://api-staging.example.com
```

**Production 環境 (`.env.production`)**
```env
VITE_API_BASE_URL=https://api.example.com
```

### 4. 部署流程

```bash
# 開發環境
pnpm run dev

# Staging 部署
pnpm run build --mode staging

# Production 部署
pnpm run build --mode production
```

---

## 🔄 何時需要重新生成 SDK？

### ✅ 需要重新生成的情況

1. **後端 API 規格變更**（Zod schema 改變）
2. **新增/刪除 API 端點**
3. **API 參數或返回值結構改變**

**執行命令：**
```bash
cd packages/backend
pnpm run sdk:update
```

這會執行：
1. `pnpm run openapi` - 生成 OpenAPI 文檔
2. `pnpm run spectral` - 執行 OpenAPI 規範檢查
3. `pnpm run client:gen` - 產生 TypeScript SDK 並編譯

### ❌ 不需要重新生成的情況

1. **切換環境**（dev → staging → prod）
2. **修改 API Base URL**
3. **修改 CORS 設定**
4. **修改環境變數**

**只需要修改 `.env.*` 檔案即可！**

---

## 📊 實作成果

### 修正的檔案

1. **`packages/sdk/src/config.ts`** - 環境變數配置
2. **`packages/sdk/src/index.ts`** - 所有 URL 函數使用 `createFullURL()`（30+ 個函數）
3. **`packages/sdk/README.md`** - 更新文檔
4. **`packages/sdk/ENV.md`** - 環境變數配置說明

### 測試結果

```bash
✅ SDK 測試:
Health URL: http://localhost:8787/health
Version URL: http://localhost:8787/version
Data URL: http://localhost:8787/api/data

📌 預設使用 http://localhost:8787
💡 前端可透過 VITE_API_BASE_URL 環境變數切換環境
```

---

## 🎉 總結

### 符合 SSOT 原則 ✅

1. **API 規格** = Zod schema（後端）
2. **OpenAPI 文檔** = 自動產生
3. **SDK** = 自動產生
4. **環境配置** = 獨立於 SDK（`.env.*`）

### 優勢

- 🔄 **一次生成，多環境使用** - 不需要為每個環境重新生成 SDK
- 📦 **版本控制友善** - SDK 產物可以提交，環境配置分離
- 🚀 **部署靈活** - 同一個 build 可以部署到不同環境
- 🛡️ **型別安全** - 完整的 TypeScript 支援
- 🎯 **維護簡單** - 只需修改 `.env.*`，不需要改代碼

---

## 📝 注意事項

1. `.env.local` 僅用於本地開發，**不要提交到 Git**
2. `.env.staging` 和 `.env.production` 可以提交（如果不包含敏感資訊）
3. 確保 CORS 設定允許對應環境的前端域名
4. Cloudflare Workers 部署時，URL 通常是固定的（例如：`https://your-worker.workers.dev`）

---

**作者**: AI Assistant  
**日期**: 2025-09-30  
**狀態**: ✅ 已完成並測試
