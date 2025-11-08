#!/bin/bash

# Preflight 檢查腳本
# 執行 lint、typecheck 和 test

set -e

echo "🚀 開始 Preflight 檢查..."
echo ""

# 檢查當前目錄
if [ ! -f "package.json" ]; then
  echo "❌ 錯誤：請在 packages/backend 目錄下執行此腳本"
  exit 1
fi

echo "📦 檢查專案結構..."
echo "   當前目錄: $(pwd)"
echo "   Package: $(grep '"name"' package.json | cut -d'"' -f4)"
echo ""

# 1. Lint 檢查
echo "🔍 執行 ESLint 檢查..."
pnpm run lint
echo "✅ Lint 檢查通過"
echo ""

# 2. TypeScript 型別檢查
echo "🔍 執行 TypeScript 型別檢查..."
pnpm run typecheck
echo "✅ 型別檢查通過"
echo ""

# 3. 單元測試
echo "🔍 執行單元測試..."
pnpm run test
echo "✅ 測試通過"
echo ""

echo "🎉 Preflight 檢查全部通過！"
echo ""
echo "📋 檢查項目："
echo "   ✅ ESLint 程式碼風格檢查"
echo "   ✅ TypeScript 型別檢查"
echo "   ✅ Vitest 單元測試"
echo ""
echo "🚀 可以安全部署或繼續開發"
