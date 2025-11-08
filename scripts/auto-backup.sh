#!/bin/bash
set -e

# 設定備份參數
BACKUP_DIR="./backups"
KEEP_DAYS=7  # 保留 7 天的備份

echo "🔄 執行自動備份..."

# 執行備份
./scripts/backup.sh

echo "🧹 清理舊備份檔案..."
# 刪除超過指定天數的備份
find "${BACKUP_DIR}" -name "pos_backup_*.tar.gz" -mtime +${KEEP_DAYS} -delete 2>/dev/null || true

echo "📊 備份統計："
echo "📁 備份目錄: ${BACKUP_DIR}"
echo "📈 備份數量: $(ls -1 "${BACKUP_DIR}"/*.tar.gz 2>/dev/null | wc -l)"
echo "💾 總大小: $(du -sh "${BACKUP_DIR}" 2>/dev/null | cut -f1)"

echo "✅ 自動備份完成！"
