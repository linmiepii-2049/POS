#!/bin/bash
set -e

if [ $# -eq 0 ]; then
    echo "❌ 請指定備份檔案名稱"
    echo "用法: $0 <backup_file.tar.gz>"
    echo "範例: $0 pos_backup_20250128_143022.tar.gz"
    exit 1
fi

BACKUP_FILE="$1"
BACKUP_DIR="./backups"

if [ ! -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
    echo "❌ 找不到備份檔案: ${BACKUP_DIR}/${BACKUP_FILE}"
    echo "可用的備份檔案："
    ls -la "${BACKUP_DIR}"/*.tar.gz 2>/dev/null || echo "沒有找到任何備份檔案"
    exit 1
fi

echo "🔄 開始還原 POS 系統資料..."
echo "📁 備份檔案: ${BACKUP_FILE}"

# 建立臨時目錄
TEMP_DIR=$(mktemp -d)
echo "📂 解壓縮到: ${TEMP_DIR}"

# 解壓縮備份檔案
tar -xzf "${BACKUP_DIR}/${BACKUP_FILE}" -C "${TEMP_DIR}"
BACKUP_NAME=$(basename "${BACKUP_FILE}" .tar.gz)

echo "🛑 停止服務..."
# 停止可能運行的服務
pkill -f "wrangler dev" 2>/dev/null || true
pkill -f "vite" 2>/dev/null || true

echo "🗄️ 還原資料庫..."
cd packages/backend

# 備份現有資料庫
if [ -f ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"/*.sqlite ]; then
    echo "💾 備份現有資料庫..."
    cp .wrangler/state/v3/d1/miniflare-D1DatabaseObject/*.sqlite .wrangler/state/v3/d1/miniflare-D1DatabaseObject/backup_$(date +%Y%m%d_%H%M%S).sqlite
fi

# 還原資料庫
if [ -f "${TEMP_DIR}/${BACKUP_NAME}/database.sqlite" ]; then
    mkdir -p .wrangler/state/v3/d1/miniflare-D1DatabaseObject
    cp "${TEMP_DIR}/${BACKUP_NAME}/database.sqlite" .wrangler/state/v3/d1/miniflare-D1DatabaseObject/
    echo "✅ 資料庫還原完成"
else
    echo "⚠️  找不到資料庫檔案，嘗試從 SQL 匯入..."
    if [ -f "${TEMP_DIR}/${BACKUP_NAME}/database_export.sql" ]; then
        pnpm run d1:reset
        pnpm run d1:import < "${TEMP_DIR}/${BACKUP_NAME}/database_export.sql" || echo "❌ SQL 匯入失敗"
    else
        echo "❌ 找不到任何資料庫備份檔案"
        exit 1
    fi
fi

cd ../..

echo "📁 還原上傳檔案..."
if [ -d "${TEMP_DIR}/${BACKUP_NAME}/uploads" ]; then
    rm -rf packages/backend/uploads
    cp -r "${TEMP_DIR}/${BACKUP_NAME}/uploads" packages/backend/
    echo "✅ 上傳檔案還原完成"
fi

echo "🧹 清理臨時檔案..."
rm -rf "${TEMP_DIR}"

echo "✅ 還原完成！"
echo "🚀 現在可以啟動服務："
echo "   後端: pnpm -w --filter @pos/backend run dev"
echo "   前端: pnpm -w --filter @pos/frontend run dev"
