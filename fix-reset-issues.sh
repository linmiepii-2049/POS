#!/bin/bash

# POS 系統 Reset 修復腳本
# 用於修復「reset 回到可運行版本但卻無法執行」的問題

set -e  # 遇到錯誤立即退出

echo "🔧 開始修復 POS 系統..."

# 1. 清理快取與產物
echo "📦 清理快取與產物..."
rm -rf packages/backend/.wrangler/state
rm -rf packages/backend/.wrangler/tmp
rm -rf packages/frontend/dist
rm -rf packages/frontend/.vite
rm -rf packages/backend/src/client
find . -name "*.tsbuildinfo" -delete
find . -name ".turbo" -type d -exec rm -rf {} + 2>/dev/null || true

# 2. 重新安裝依賴
echo "📥 重新安裝依賴..."
pnpm -w install --frozen-lockfile

# 3. 生成 OpenAPI 文檔
echo "📋 生成 OpenAPI 文檔..."
cd packages/backend
pnpm run openapi

# 4. 執行 Spectral 檢查
echo "🔍 執行 Spectral 檢查..."
pnpm run spectral

# 5. 生成 SDK
echo "⚙️ 生成 SDK..."
pnpm run client:gen

# 6. 回到根目錄
cd ../..

# 7. 重置並重新建立資料庫
echo "🗄️ 重置資料庫..."
cd packages/backend
pnpm run d1:reset

# 8. 執行種子資料
echo "🌱 執行種子資料..."
pnpm run d1:seed

# 9. 回到根目錄
cd ../..

# 10. 執行類型檢查與 Lint
echo "✅ 執行類型檢查與 Lint..."
pnpm -w run typecheck
pnpm -w run lint

# 11. 執行測試
echo "🧪 執行測試..."
pnpm -w run test

echo "🎉 修復完成！現在可以啟動服務："
echo "   後端: pnpm -w --filter @pos/backend run dev"
echo "   前端: pnpm -w --filter @pos/frontend run dev"