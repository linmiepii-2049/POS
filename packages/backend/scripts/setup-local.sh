#!/bin/bash

# 本地開發環境快速設置腳本
# 用於初始化本地 D1 資料庫和開發伺服器

set -e

echo "=============================="
echo "本地開發環境設置"
echo "=============================="

# 切換到 backend 目錄
cd "$(dirname "$0")/.."

echo ""
echo "步驟 1: 檢查並終止佔用 8787 端口的進程..."
if lsof -ti:8787 > /dev/null 2>&1; then
  echo "  發現佔用 8787 端口的進程，正在終止..."
  lsof -ti:8787 | xargs kill -9 2>/dev/null || true
  sleep 1
  echo "  ✅ 端口已釋放"
else
  echo "  ✅ 端口 8787 空閒"
fi

echo ""
echo "步驟 2: 檢查本地 D1 資料庫 migrations 狀態..."
# 檢查是否有 pending migrations (grep "Migrations to be applied" 存在表示有 pending)
if pnpm wrangler d1 migrations list DB --local 2>&1 | grep -q "Migrations to be applied"; then
  echo "  發現 pending migrations，正在應用..."
  pnpm wrangler d1 migrations apply DB --local --yes
  echo "  ✅ Migrations 已應用"
else
  echo "  ✅ 所有 migrations 已是最新"
fi

echo ""
echo "步驟 3: 檢查是否需要執行 seed..."
# 檢查 users 表是否有資料（使用 jq 解析 JSON 輸出）
if command -v jq &> /dev/null; then
  USER_COUNT=$(pnpm wrangler d1 execute DB --local --command "SELECT COUNT(*) as cnt FROM users;" 2>/dev/null | jq -r '.[0].results[0].cnt // 0' 2>/dev/null || echo "0")
else
  # 如果沒有 jq，使用簡單的 grep 方法
  USER_COUNT=$(pnpm wrangler d1 execute DB --local --command "SELECT COUNT(*) as cnt FROM users;" 2>/dev/null | grep -oP '"cnt":\s*\K\d+' || echo "0")
fi

# 驗證是否為數字，並設定預設值
if ! [[ "$USER_COUNT" =~ ^[0-9]+$ ]] || [ -z "$USER_COUNT" ]; then
  USER_COUNT=0
fi

if [ "$USER_COUNT" -lt 1 ]; then
  echo "  資料庫為空或資料不足，建議執行 seed..."
  echo "  提示：您可以手動執行 'bash scripts/seed-data.sh' 來填充測試資料"
else
  echo "  ✅ 資料庫已有資料 ($USER_COUNT 個使用者)"
fi

echo ""
echo "=============================="
echo "✅ 設置完成！"
echo "=============================="
echo ""
echo "您現在可以執行以下指令啟動開發伺服器："
echo "  pnpm dev"
echo ""
echo "或者手動執行："
echo "  pnpm wrangler dev --port 8787"
echo ""

