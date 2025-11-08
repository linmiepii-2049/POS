# POS 系統共用 SDK

這是 POS 系統的共用 TypeScript SDK，根據 SSOT（Single Source of Truth）原則，從後端 Zod schema 自動產生。

## 特性

- ✅ **SSOT 原則**: 所有 API 定義來自後端 Zod schema
- ✅ **自動產生**: 透過 OpenAPI → Spectral → Orval 流程自動產生
- ✅ **型別安全**: 完整的 TypeScript 支援
- ✅ **React Query 整合**: 內建 React Query hooks
- ✅ **環境無關**: dev/staging/prod 都使用同一個 SDK

## 安裝

```bash
# 在 monorepo 中，SDK 已自動安裝
pnpm install

# 或手動安裝
pnpm add @pos/sdk
```

## 使用方式

### 前端使用

```typescript
import { useGetHealth, useGetVersion } from '@pos/sdk';

function App() {
  const { data: health } = useGetHealth();
  const { data: version } = useGetVersion();
  
  return (
    <div>
      <p>健康狀態: {health?.ok ? '正常' : '異常'}</p>
      <p>版本: {version?.version}</p>
    </div>
  );
}
```

### 後端使用

```typescript
import { getHealth, getVersion } from '@pos/sdk';

async function checkSystem() {
  const health = await getHealth();
  const version = await getVersion();
  
  console.log('系統狀態:', health);
  console.log('版本資訊:', version);
}
```

## 環境配置

SDK 會根據環境自動選擇正確的 API 端點：

### 環境變數優先級

1. **`VITE_API_BASE_URL`** - Vite 前端專案（瀏覽器環境）
2. **預設值** - `http://localhost:8787`（本地開發）

### 前端環境配置

在 `packages/frontend/` 目錄下創建環境檔案：

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

### 部署指令

```bash
# 開發環境
pnpm run dev

# Staging 部署
pnpm run build --mode staging

# Production 部署
pnpm run build --mode production
```

### ✅ 優點

- **一份 SDK，多環境共用** - 不需要為每個環境重新生成 SDK
- **符合 SSOT 原則** - API 規格（OpenAPI）是唯一真相來源
- **環境隔離** - 各環境配置獨立，不會互相干擾

詳細配置說明請參考 [ENV.md](./ENV.md)

## 更新 SDK

當後端 API 有變更時，執行以下命令更新 SDK：

```bash
# 在 packages/backend 目錄中執行
pnpm run sdk:update
```

這會執行完整的更新流程：
1. 生成 OpenAPI 文檔
2. 執行 Spectral 檢查
3. 產生新的 TypeScript SDK
4. 編譯 SDK

## 檔案結構

```
packages/sdk/
├── src/
│   ├── index.ts          # 自動產生的 SDK 原始碼
│   └── config.ts         # SDK 配置
├── dist/
│   ├── index.js          # 編譯後的 JavaScript
│   └── index.d.ts        # TypeScript 型別定義
├── package.json
├── tsconfig.json
└── README.md
```

## 注意事項

- SDK 檔案是自動產生的，請勿手動修改
- 如需修改 API 定義，請更新後端的 Zod schema
- 所有變更都必須通過 Spectral 檢查才能產生 SDK
- 產生的 SDK 已加入 `.gitignore`，不會被提交到版本控制
