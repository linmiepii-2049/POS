#!/bin/bash
set -e

echo "🔄 開始備份 POS 系統資料..."

# 設定備份目錄
BACKUP_DIR="./backups"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_NAME="pos_backup_${DATE}"

# 建立備份目錄
mkdir -p "${BACKUP_DIR}/${BACKUP_NAME}"

echo "📦 備份資料庫..."
cd packages/backend

# 備份 D1 資料庫
if [ -f ".wrangler/state/v3/d1/miniflare-D1DatabaseObject"/*.sqlite ]; then
    DB_FILE=$(find .wrangler/state/v3/d1/miniflare-D1DatabaseObject -name "*.sqlite" | head -1)
    cp "$DB_FILE" "../../${BACKUP_DIR}/${BACKUP_NAME}/database.sqlite"
    echo "✅ 資料庫備份完成: ${BACKUP_DIR}/${BACKUP_NAME}/database.sqlite"
else
    echo "⚠️  找不到資料庫檔案，嘗試從 D1 匯出..."
    # 嘗試從 D1 匯出資料
    pnpm run d1:export > "../../${BACKUP_DIR}/${BACKUP_NAME}/database_export.sql" 2>/dev/null || echo "❌ D1 匯出失敗"
fi

cd ../..

echo "📋 備份設定檔案..."
# 備份重要設定檔案
cp packages/backend/wrangler.toml "${BACKUP_DIR}/${BACKUP_NAME}/"
cp packages/backend/package.json "${BACKUP_DIR}/${BACKUP_NAME}/backend_package.json"
cp packages/frontend/package.json "${BACKUP_DIR}/${BACKUP_NAME}/frontend_package.json"
cp package.json "${BACKUP_DIR}/${BACKUP_NAME}/root_package.json"

echo "📁 備份上傳檔案..."
# 備份上傳的檔案
if [ -d "packages/backend/uploads" ]; then
    cp -r packages/backend/uploads "${BACKUP_DIR}/${BACKUP_NAME}/"
    echo "✅ 上傳檔案備份完成"
fi

echo "📝 建立備份資訊..."
# 建立備份資訊檔案
cat > "${BACKUP_DIR}/${BACKUP_NAME}/backup_info.txt" << EOF
備份時間: $(date)
備份版本: $(git rev-parse HEAD 2>/dev/null || echo "unknown")
Node 版本: $(node --version)
pnpm 版本: $(pnpm --version)
備份內容:
- 資料庫檔案 (database.sqlite)
- 設定檔案 (wrangler.toml, package.json)
- 上傳檔案 (uploads/)
EOF

echo "🗜️ 壓縮備份檔案..."
cd "${BACKUP_DIR}"
tar -czf "${BACKUP_NAME}.tar.gz" "${BACKUP_NAME}"
rm -rf "${BACKUP_NAME}"
cd ..

echo "✅ 備份完成！"
echo "📁 備份位置: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "📊 備份大小: $(du -h "${BACKUP_DIR}/${BACKUP_NAME}.tar.gz" | cut -f1)"
