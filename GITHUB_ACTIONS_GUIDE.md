# GitHub Actions 使用指南

## 🔍 如何查看 GitHub Actions Logs

### 方法 1: 從 Actions 標籤查看（推薦）

#### 步驟 1: 前往 Actions 頁面

```
https://github.com/linmiepii-2049/POS/actions
```

或在你的 Repository 頁面點擊頂部的 **"Actions"** 標籤。

#### 步驟 2: 選擇 Workflow

左側會顯示所有 Workflows：
- ✅ CI - 品質檢查
- ✅ Deploy Survey Frontend to GitHub Pages
- Deploy to Staging
- Deploy to Production
- Survey Preview - PR 預覽部署

**點擊 "Deploy Survey Frontend to GitHub Pages"**

#### 步驟 3: 選擇執行記錄

你會看到執行歷史列表，每一行顯示：
- Commit 訊息
- 執行狀態（✅ 成功 / ❌ 失敗 / 🔄 執行中）
- 觸發者
- 執行時間

**點擊最新的執行記錄**

#### 步驟 4: 查看 Jobs

你會看到兩個 Jobs：
1. **建置 Survey 前端** （build）
2. **部署到 GitHub Pages** （deploy）

**點擊 "建置 Survey 前端"** 查看詳細 logs

#### 步驟 5: 展開步驟查看 Logs

每個步驟左側有箭頭 `▶`，點擊展開：

- 📥 Checkout 程式碼
- 📦 安裝 pnpm
- 🔧 設定 Node.js
- 📚 安裝依賴
- 🔨 建置 SDK
- **🏗️ 建置 Survey 前端** ← 點擊這個查看環境變數

展開後會看到：
```bash
cd packages/survey-frontend
# 建立 .env.production 檔案
echo "VITE_API_BASE=***" > .env.production
echo "VITE_LIFF_ID=***" >> .env.production
pnpm run build:gh-pages
```

**注意：** GitHub 會自動遮蔽 Secret 值顯示為 `***`

---

### 方法 2: 從 Commit 頁面查看

#### 步驟 1: 前往 Commits 頁面

```
https://github.com/linmiepii-2049/POS/commits/main
```

#### 步驟 2: 找到你的提交

每個 commit 旁邊會有一個狀態圖示：
- ✅ 綠色勾勾 = 所有檢查通過
- ❌ 紅色叉叉 = 檢查失敗
- 🟡 黃色圓圈 = 執行中

**點擊狀態圖示**

#### 步驟 3: 查看詳情

會彈出一個小視窗顯示所有 Workflow 狀態。

**點擊 "Details"** 連結跳轉到詳細 logs。

---

### 方法 3: 快速連結（最快）

#### 查看最新的 Survey 部署

直接訪問：
```
https://github.com/linmiepii-2049/POS/actions/workflows/deploy-survey.yml
```

#### 查看 CI 狀態

```
https://github.com/linmiepii-2049/POS/actions/workflows/ci.yml
```

---

## 🔨 重新觸發部署

### 手動觸發（推薦）

1. 前往：
   ```
   https://github.com/linmiepii-2049/POS/actions/workflows/deploy-survey.yml
   ```

2. 點擊右上角 **"Run workflow"** 按鈕

3. 在彈出視窗中：
   - Branch: 選擇 `main`
   - 點擊綠色的 **"Run workflow"** 按鈕

4. 頁面會自動刷新，顯示新的執行記錄（最上方）

5. 點擊進入查看 logs

---

## 🔍 檢查環境變數是否正確

### 在建置 logs 中查找

展開 **"🏗️ 建置 Survey 前端"** 步驟，搜尋：

#### 看到這個 = Secrets 正確 ✅

```bash
echo "VITE_API_BASE=***" > .env.production
echo "VITE_LIFF_ID=***" >> .env.production
```

（`***` 表示有值但被遮蔽）

#### 看到這個 = Secrets 缺失 ❌

```bash
echo "VITE_API_BASE=" > .env.production
echo "VITE_LIFF_ID=" >> .env.production
```

（等號後面是空的）

---

## 🧪 驗證部署結果

### 檢查建置產物

在 logs 中搜尋 `dist/index.html` 或 `vite build`，應該看到：

```bash
✓ built in 10.5s
dist/index.html                   0.58 kB │ gzip: 0.35 kB
dist/assets/index-D_27EMU_.js   150.23 kB │ gzip: 48.52 kB
dist/assets/vendor-DEQ385Nk.js  142.18 kB │ gzip: 45.71 kB
dist/assets/liff-BizyFI0Z.js     89.45 kB │ gzip: 28.12 kB
✓ built in 10.5s
```

### 檢查部署狀態

展開 **"🚀 部署到 GitHub Pages"** 步驟，應該看到：

```bash
Created deployment for 583117d...
Deployment URL: https://linmiepii-2049.github.io/POS/
✅ Deployment successful
```

---

## 📱 常用快捷操作

### 快速跳轉到最新的 Survey 部署

```
https://github.com/linmiepii-2049/POS/actions/workflows/deploy-survey.yml?query=branch%3Amain
```

### 查看特定 Commit 的所有 Actions

```
https://github.com/linmiepii-2049/POS/commit/YOUR_COMMIT_SHA/checks
```

例如最新的：
```
https://github.com/linmiepii-2049/POS/commit/5d2edf0/checks
```

---

## 💡 小技巧

### 1. 搜尋 Logs

在 logs 頁面按 `Cmd + F` 可以搜尋關鍵字：
- 搜尋 `VITE_LIFF_ID` 看是否有值
- 搜尋 `error` 找錯誤訊息
- 搜尋 `✓` 或 `✅` 找成功訊息

### 2. 下載 Logs

點擊右上角的 `⋮` (三個點) → **"Download log archive"**

可以下載完整的 logs 到本地查看。

### 3. 查看 Artifact

如果有建置產物，會顯示在頁面底部的 "Artifacts" 區域。

點擊可以下載 zip 檔，解壓後查看建置內容。

---

## 🎯 現在就做

### 1. 確認 Secrets 已設定

前往：
```
https://github.com/linmiepii-2049/POS/settings/secrets/actions
```

應該看到：
- ✅ `VITE_API_BASE_PROD`
- ✅ `VITE_LIFF_ID`

### 2. 重新觸發部署

前往：
```
https://github.com/linmiepii-2049/POS/actions/workflows/deploy-survey.yml
```

點擊 **"Run workflow"** → 選擇 `main` → **"Run workflow"**

### 3. 等待並查看 Logs

點擊新建立的 workflow run，查看執行進度和 logs。

---

**跟著上面的步驟，你就能看到完整的 GitHub Actions logs 了！** 📊

如果設定正確，重新部署後問卷應該就能正常運作了！🎉
