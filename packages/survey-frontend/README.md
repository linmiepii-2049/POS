# Survey Frontend - LIFF 問卷調查前端

這是獨立部署到 GitHub Pages 的 LIFF 問卷調查前端應用程式。

## 🎯 專案特色

- **LIFF 整合**: 完整的 LINE Front-end Framework 整合
- **React + TypeScript**: 使用現代化前端技術棧
- **Tailwind CSS**: 美觀的響應式設計
- **獨立部署**: 部署到 GitHub Pages，與 POS 前端分離
- **統一 API**: 使用 POS 後端的統一 API 端點

## 📦 技術棧

- React 18
- TypeScript
- Vite
- Tailwind CSS
- @line/liff SDK
- @pos/sdk (共用 SDK)

## 🚀 開發

### 安裝依賴

```bash
pnpm install
```

### 本地開發

```bash
pnpm dev
```

應用程式會在 `http://localhost:3001` 啟動。

### 建置

```bash
# 一般建置
pnpm build

# GitHub Pages 建置（包含 base path）
pnpm build:gh-pages
```

### 預覽建置產物

```bash
pnpm preview
```

## ⚙️ 環境變數

建立 `.env.development` 和 `.env.production` 檔案：

```bash
# API 後端位址
VITE_API_BASE=http://localhost:8787

# LINE LIFF ID
VITE_LIFF_ID=your-liff-id-here
```

## 📋 問卷內容

### 基本資料
- 手機號碼（必填，10位數字）
- 年齡（必填）
- 性別（必填）
- 居住地

### 購買習慣
- 購買頻率
- 購買地點（可複選）
- 購買時間
- 用餐時機

### 選購考量
- 選購因素（可複選）
- 健康考量
- 天然食材偏好

### 口味偏好
- 口味偏好（可複選）
- 麵包種類（可複選）
- 最喜歡的麵包（選填）
- 想吃的麵包（選填）

## 🌐 部署到 GitHub Pages

### 自動部署

推送到 `main` 分支後，GitHub Actions 會自動建置並部署到 GitHub Pages。

### 手動部署

1. 建置專案：
```bash
pnpm build:gh-pages
```

2. 部署到 GitHub Pages（需要先設定 GitHub Actions）

### 設定 LIFF

在 LINE Developers Console 中設定 LIFF Endpoint URL：

```
https://YOUR_USERNAME.github.io/POS_0922/
```

## 🔧 程式碼結構

```
src/
├── components/         # React 元件
│   ├── SurveyForm.tsx # 主表單元件
│   ├── SurveySection.tsx
│   ├── RadioGroup.tsx
│   ├── CheckboxGroup.tsx
│   └── Loading.tsx
├── hooks/             # React Hooks
│   └── useLiff.ts    # LIFF SDK Hook
├── api/              # API 客戶端
│   └── surveyClient.ts
├── styles/           # 樣式檔案
│   └── index.css
├── App.tsx           # 主應用程式元件
└── main.tsx          # 應用程式入口
```

## 📝 注意事項

1. **LIFF ID**: 務必在環境變數中設定正確的 LIFF ID
2. **API Base**: 確認 API 後端位址正確
3. **CORS**: 後端需要將 GitHub Pages 域名加入 CORS 白名單
4. **Base Path**: GitHub Pages 部署時需要設定正確的 base path

## 🔗 相關連結

- [POS Backend API](https://pos-backend-prod.survey-api.workers.dev)
- [LINE Developers Console](https://developers.line.biz/)
- [LIFF Documentation](https://developers.line.biz/en/docs/liff/)

## 📄 授權

MIT License

