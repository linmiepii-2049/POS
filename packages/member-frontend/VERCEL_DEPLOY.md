# Member Frontend Vercel 部署指南

## 前置需求

1. Vercel 帳號
2. GitHub Secrets 設定

## 設定步驟

### 1. 在 Vercel 建立專案

1. 登入 [Vercel Dashboard](https://vercel.com/dashboard)
2. 點擊 "Add New Project"
3. 選擇 GitHub repository
4. 設定專案：
   - **Framework Preset**: Vite
   - **Root Directory**: `packages/member-frontend`
   - **Build Command**: `cd ../.. && pnpm install --frozen-lockfile && cd packages/sdk && pnpm run build && cd ../member-frontend && pnpm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `cd ../.. && pnpm install --frozen-lockfile`

### 2. 設定環境變數

在 Vercel 專案設定中新增以下環境變數：

- `VITE_API_BASE`: 後端 API 位址（例如：`https://pos-backend-staging.survey-api.workers.dev`）
- `VITE_LIFF_ID`: LINE LIFF ID

### 3. 設定 GitHub Secrets

在 GitHub Repository Settings > Secrets and variables > Actions 中新增：

- `VERCEL_TOKEN`: Vercel Access Token（在 [Vercel Settings > Tokens](https://vercel.com/account/tokens) 建立）
- `VERCEL_ORG_ID`: Vercel Organization ID（在 Vercel Dashboard URL 或 API 中取得）
- `VERCEL_PROJECT_ID_MEMBER`: Vercel Project ID（在專案設定 > General 中取得）
- `VITE_API_BASE`: 後端 API 位址
- `VITE_LIFF_ID`: LINE LIFF ID

### 4. 取得 Vercel IDs

#### VERCEL_ORG_ID
```bash
# 使用 Vercel CLI
vercel whoami
vercel teams ls
# 或從 Vercel Dashboard URL 取得
```

#### VERCEL_PROJECT_ID_MEMBER
1. 在 Vercel Dashboard 中選擇專案
2. 進入 Settings > General
3. 找到 "Project ID"

### 5. 自動部署

當以下檔案變更時，GitHub Actions 會自動觸發部署：

- `packages/member-frontend/**`
- `packages/sdk/**`
- `.github/workflows/deploy-member.yml`

## 手動部署

### 使用 Vercel CLI

```bash
# 安裝 Vercel CLI
npm i -g vercel

# 登入
vercel login

# 在專案根目錄部署
cd packages/member-frontend
vercel --prod
```

### 使用 GitHub Actions

在 GitHub Actions 中手動觸發 "Deploy Member Frontend to Vercel" workflow。

## 後端 CORS 設定

確保後端的 `CORS_ORIGINS` 包含 Vercel 部署的域名：

```toml
# packages/backend/wrangler.toml
[env.staging]
vars = { 
  CORS_ORIGINS = "http://localhost:3000,http://localhost:3002,https://your-member-app.vercel.app"
}
```

## 故障排除

### 建置失敗

1. 檢查 `vercel.json` 配置是否正確
2. 確認 `buildCommand` 路徑正確
3. 檢查環境變數是否設定

### 環境變數未生效

1. 確認 Vercel 專案設定中的環境變數已設定
2. 重新部署專案
3. 檢查變數名稱是否正確（必須以 `VITE_` 開頭）

### SDK 建置失敗

確保 `packages/sdk` 已正確建置，可以在本地測試：

```bash
cd packages/sdk
pnpm run build
```

## 相關文件

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel CLI](https://vercel.com/docs/cli)
- [Vite on Vercel](https://vercel.com/docs/frameworks/vite)

