#!/bin/bash

# POS 系統 Staging 環境部署腳本
# 此腳本會引導您完成完整的 Staging 部署流程

set -e  # 遇到錯誤立即停止

echo "🚀 POS 系統 Staging 環境部署"
echo "================================"
echo ""

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 檢查是否已登入 Cloudflare
echo "📋 步驟 1: 檢查 Cloudflare 登入狀態"
echo "--------------------------------"
if ! wrangler whoami > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  尚未登入 Cloudflare${NC}"
    echo "請執行: wrangler login"
    exit 1
fi

echo -e "${GREEN}✅ 已登入 Cloudflare${NC}"
wrangler whoami
echo ""

# 建立 D1 Database
echo "📋 步驟 2: 建立 Staging D1 Database"
echo "--------------------------------"
echo -e "${YELLOW}即將執行: wrangler d1 create pos-db-staging${NC}"
read -p "按 Enter 繼續，或 Ctrl+C 取消..."

wrangler d1 create pos-db-staging

echo ""
echo -e "${YELLOW}⚠️  請記錄上方輸出的 database_id${NC}"
echo -e "${YELLOW}    並填入 packages/backend/wrangler.toml 中的:${NC}"
echo -e "${YELLOW}    [[env.staging.d1_databases]]${NC}"
echo -e "${YELLOW}    database_id = \"<填入這裡>\"${NC}"
echo ""
read -p "填入完成後，按 Enter 繼續..."

# 建立 R2 Bucket
echo ""
echo "📋 步驟 3: 建立 Staging R2 Bucket"
echo "--------------------------------"
echo -e "${YELLOW}即將執行: wrangler r2 bucket create pos-assets-staging${NC}"
read -p "按 Enter 繼續，或 Ctrl+C 取消..."

wrangler r2 bucket create pos-assets-staging
echo -e "${GREEN}✅ R2 Bucket 建立成功${NC}"

# 執行 D1 Migrations
echo ""
echo "📋 步驟 4: 執行 D1 Migrations"
echo "--------------------------------"
cd packages/backend

echo -e "${YELLOW}即將執行: pnpm run d1:migrate:staging${NC}"
read -p "按 Enter 繼續，或 Ctrl+C 取消..."

pnpm run d1:migrate:staging
echo -e "${GREEN}✅ Migrations 執行成功${NC}"

# 匯入測試資料（選用）
echo ""
read -p "是否要匯入測試資料到 Staging？(y/N) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    pnpm run d1:seed:staging
    echo -e "${GREEN}✅ 測試資料匯入成功${NC}"
fi

# 部署後端
echo ""
echo "📋 步驟 5: 部署後端到 Staging"
echo "--------------------------------"
echo -e "${YELLOW}即將執行: pnpm run deploy:staging${NC}"
read -p "按 Enter 繼續，或 Ctrl+C 取消..."

pnpm run deploy:staging
echo -e "${GREEN}✅ 後端部署成功${NC}"

# 驗證後端部署
echo ""
echo "📋 步驟 6: 驗證後端部署"
echo "--------------------------------"
echo "測試健康檢查..."
sleep 3  # 等待部署生效

if curl -s https://api-staging.example.com/health | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 健康檢查成功${NC}"
    curl -s https://api-staging.example.com/health | jq .
else
    echo -e "${RED}❌ 健康檢查失敗${NC}"
    echo "請檢查:"
    echo "1. DNS 是否已設定 api-staging.example.com"
    echo "2. wrangler.toml 中的路由是否正確"
fi

echo ""
echo "測試版本資訊..."
if curl -s https://api-staging.example.com/version | jq . > /dev/null 2>&1; then
    echo -e "${GREEN}✅ 版本資訊正常${NC}"
    curl -s https://api-staging.example.com/version | jq .
else
    echo -e "${RED}❌ 版本資訊失敗${NC}"
fi

# 前端環境變數
echo ""
echo "📋 步驟 7: 設定前端環境變數"
echo "--------------------------------"
cd ../../packages/frontend

if [ ! -f .env.staging ]; then
    echo "建立 .env.staging..."
    cat > .env.staging << 'EOF'
VITE_API_BASE_URL=https://api-staging.example.com
EOF
    echo -e "${GREEN}✅ .env.staging 已建立${NC}"
else
    echo -e "${YELLOW}⚠️  .env.staging 已存在，跳過建立${NC}"
fi

# 建置前端
echo ""
echo "📋 步驟 8: 建置前端"
echo "--------------------------------"
echo -e "${YELLOW}即將執行: pnpm run build --mode staging${NC}"
read -p "按 Enter 繼續，或 Ctrl+C 取消..."

pnpm run build --mode staging
echo -e "${GREEN}✅ 前端建置成功${NC}"

# 部署前端
echo ""
echo "📋 步驟 9: 部署前端到 Cloudflare Pages"
echo "--------------------------------"
echo -e "${YELLOW}即將執行: wrangler pages deploy dist --project-name=pos-frontend-staging --branch=staging${NC}"
read -p "按 Enter 繼續，或 Ctrl+C 取消..."

wrangler pages deploy dist --project-name=pos-frontend-staging --branch=staging
echo -e "${GREEN}✅ 前端部署成功${NC}"

# 最終檢查
echo ""
echo "================================"
echo "🎉 部署完成！"
echo "================================"
echo ""
echo "請驗證以下項目："
echo ""
echo "1. 後端健康檢查："
echo "   curl https://api-staging.example.com/health | jq"
echo ""
echo "2. 後端版本資訊："
echo "   curl https://api-staging.example.com/version | jq"
echo ""
echo "3. 前端應用："
echo "   開啟瀏覽器: https://app-staging.example.com"
echo "   - 檢查健康狀態顯示「正常」（綠色圓點）"
echo "   - 檢查版本資訊顯示「1.0.0」"
echo "   - 開啟 Console，確認無 CORS 或 JSON 解析錯誤"
echo "   - 開啟 Network 標籤，確認請求 URL 為 https://api-staging.example.com/..."
echo ""
echo "📚 相關文檔："
echo "   - 部署指南: DEPLOYMENT_GUIDE.md"
echo "   - 完整 Runbook: README.md (部署 Runbook 章節)"
echo ""
