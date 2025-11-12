# 時區設定說明 - Asia/Taipei

## 概述

本專案已統一使用 **Asia/Taipei** 時區來處理所有時間相關的查詢和顯示。這確保了時間的一致性，避免了時區差異導致的問題。

## 重要概念

### 1. 資料庫時間存儲
- **Cloudflare D1 資料庫** 內部存儲的是 **UTC 時間**
- 所有 `created_at` 和 `updated_at` 欄位都是 UTC 時間

### 2. 時區轉換
- 使用 `datetime(created_at, 'localtime')` 將 UTC 時間轉換為台北時間
- 台北時間 = UTC 時間 + 8 小時

### 3. 查詢語法
```sql
-- ❌ 錯誤：直接使用 UTC 時間查詢
WHERE created_at >= datetime('now', '-24 hours')

-- ✅ 正確：使用台北時間查詢
WHERE created_at >= datetime('now', '-24 hours', 'localtime')
```

## 腳本更新內容

### export-csv.sh
- ✅ 所有時間查詢都使用 `'localtime'` 參數
- ✅ CSV 標頭顯示「台北時間」
- ✅ 時間欄位轉換為台北時間顯示

### check-recent-surveys.sh
- ✅ 時間範圍查詢使用台北時間
- ✅ 顯示時間都轉換為台北時間
- ✅ 添加台北時間顯示

### quick-diagnosis.sh
- ✅ 時間查詢使用台北時間
- ✅ 顯示台北時間狀態

## 使用方法

### 1. 匯出最近資料
```bash
# 匯出最近7天資料（台北時間）
./export-csv.sh
# 選擇選項 4
```

### 2. 檢查剛提交的問卷
```bash
# 檢查最近1小時內的提交（台北時間）
./check-recent-surveys.sh
```

### 3. 測試時區轉換
```bash
# 測試時區轉換功能
./test-timezone.sh
```

### 4. 自訂查詢
```bash
# 自訂 SQL 查詢（記得使用 localtime）
./export-csv.sh
# 選擇選項 6
```

## 常用時區查詢語法

### 查詢最近1小時
```sql
WHERE created_at >= datetime('now', '-1 hour', 'localtime')
```

### 查詢最近24小時
```sql
WHERE created_at >= datetime('now', '-24 hours', 'localtime')
```

### 查詢最近7天
```sql
WHERE created_at >= datetime('now', '-7 days', 'localtime')
```

### 查詢最近30天
```sql
WHERE created_at >= datetime('now', '-30 days', 'localtime')
```

### 按日期分組（台北時間）
```sql
GROUP BY DATE(datetime(created_at, 'localtime'))
```

### 顯示台北時間
```sql
datetime(created_at, 'localtime') as created_at_taipei
```

## 時區差異說明

| 時間類型 | 說明 | 差異 |
|---------|------|------|
| UTC 時間 | 資料庫存儲時間 | 基準時間 |
| 台北時間 | 顯示和查詢時間 | UTC + 8 小時 |
| 本地時間 | 系統時間 | 根據系統設定 |

## 常見問題

### Q: 為什麼剛提交的問卷沒有出現在CSV中？
A: 可能的原因：
1. **時區差異**：查詢使用的是 UTC 時間，而您期望的是台北時間
2. **同步延遲**：問卷提交後需要幾秒到幾分鐘才能同步到資料庫
3. **查詢時間範圍**：檢查查詢的時間範圍是否正確

### Q: 如何確保查詢到最新的問卷？
A: 解決方法：
1. 使用 `'localtime'` 參數進行時間查詢
2. 適當延長查詢時間範圍
3. 檢查後端日誌確認問卷是否成功提交

### Q: 時區轉換是否會影響性能？
A: 不會，`datetime(created_at, 'localtime')` 是 SQLite 的內建函數，性能影響很小。

## 測試建議

1. **執行時區測試**：`./test-timezone.sh`
2. **檢查時間同步**：`./check-recent-surveys.sh`
3. **驗證 CSV 匯出**：`./export-csv.sh --all`

## 注意事項

⚠️ **重要**：所有新的查詢都必須使用 `'localtime'` 參數
⚠️ **重要**：不要直接使用 `created_at` 進行時間比較
⚠️ **重要**：CSV 匯出時記得檢查時間欄位是否正確轉換

## 技術細節

- **資料庫**：Cloudflare D1 (SQLite)
- **時區函數**：`datetime(timestamp, 'localtime')`
- **時區偏移**：UTC +8 小時
- **支援格式**：ISO 8601 標準時間格式 