#!/bin/bash

# 快速檢查資料庫中的問卷資料
# 用途：快速驗證問卷資料是否正確儲存

set -e

# 顏色定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 設定
DATABASE_NAME="liff-survey-db"

echo -e "${BLUE}🔍 快速資料庫檢查${NC}"
echo "=================="

# 檢查 wrangler 是否可用
if ! command -v wrangler &> /dev/null; then
    echo -e "${RED}❌ 錯誤：未找到 wrangler CLI${NC}"
    echo "請先安裝 wrangler：npm install -g wrangler"
    exit 1
fi

# 檢查總行數
echo -e "${YELLOW}📊 檢查總行數...${NC}"
wrangler d1 execute "$DATABASE_NAME" --command "
    SELECT COUNT(*) as total_rows FROM survey_responses;
" --remote --format=table

# 檢查最近的資料
echo -e "${YELLOW}🕒 檢查最近的資料...${NC}"
wrangler d1 execute "$DATABASE_NAME" --command "
    SELECT 
        member_id,
        phone,
        age,
        gender,
        created_at,
        updated_at
    FROM survey_responses 
    ORDER BY created_at DESC 
    LIMIT 10;
" --remote --format=table

# 檢查特定測試手機號碼
echo -e "${YELLOW}📱 檢查測試手機號碼...${NC}"
wrangler d1 execute "$DATABASE_NAME" --command "
    SELECT 
        member_id,
        phone,
        age,
        gender,
        created_at
    FROM survey_responses 
    WHERE phone IN ('0999999999', '0888888888', '0933333335', '0912345678')
    ORDER BY created_at DESC;
" --remote --format=table

# 檢查時間戳記格式
echo -e "${YELLOW}⏰ 檢查時間戳記格式...${NC}"
wrangler d1 execute "$DATABASE_NAME" --command "
    SELECT 
        member_id,
        created_at,
        typeof(created_at) as created_type
    FROM survey_responses 
    ORDER BY created_at DESC 
    LIMIT 5;
" --remote --format=table

echo -e "${GREEN}✅ 快速檢查完成！${NC}" 