/**
 * 時區工具模組
 * 提供 UTC 與 Asia/Taipei 時區轉換功能
 */

const TAIWAN_TIMEZONE = 'Asia/Taipei';

/**
 * 取得當前 UTC 時間的 ISO 字串
 */
export const getCurrentUTC = (): string => {
  return new Date().toISOString();
};

/**
 * 取得當前台灣時間的 ISO 字串
 */
export const getCurrentTaiwanTime = (): string => {
  const now = new Date();
  // 轉換為台灣時區的 Date 物件
  const taiwanDate = new Date(
    now.toLocaleString('en-US', { timeZone: TAIWAN_TIMEZONE })
  );
  return taiwanDate.toISOString();
};

/**
 * 將 UTC 時間轉換為台灣時間
 */
export const utcToTaiwan = (utcDate: Date | string): string => {
  const date = typeof utcDate === 'string' ? new Date(utcDate) : utcDate;
  // 轉換為台灣時區的 Date 物件
  const taiwanDate = new Date(
    date.toLocaleString('en-US', { timeZone: TAIWAN_TIMEZONE })
  );
  return taiwanDate.toISOString();
};

/**
 * 取得當前時間資訊（包含 UTC 和台灣時間）
 */
export const getCurrentTimeInfo = () => {
  const nowUTC = getCurrentUTC();
  const nowTaiwan = getCurrentTaiwanTime();

  return {
    tz: TAIWAN_TIMEZONE,
    now_utc: nowUTC,
    now_local: nowTaiwan,
  };
};

/**
 * 取得當前台北時間的 SQLite 格式字串
 * 用於資料庫插入和更新操作
 */
export const getCurrentTaipeiSQLite = (): string => {
  const now = new Date();
  const taipeiTime = new Date(now.toLocaleString('en-US', { timeZone: TAIWAN_TIMEZONE }));
  return taipeiTime.toISOString().replace('T', ' ').replace('Z', '');
};

/**
 * 將台北時間轉換為 UTC 時間（用於資料庫查詢）
 */
export const taipeiToUtc = (taipeiTime: string): string => {
  // 如果輸入是日期格式 (YYYY-MM-DD)，添加台北時區信息
  if (/^\d{4}-\d{2}-\d{2}$/.test(taipeiTime)) {
    return `${taipeiTime}T00:00:00+08:00`;
  }
  // 如果輸入是日期時間格式 (YYYY-MM-DDTHH:mm)，添加台北時區信息
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(taipeiTime)) {
    return `${taipeiTime}:00+08:00`;
  }
  // 如果已經是完整的 ISO 格式，直接返回
  return taipeiTime;
};

/**
 * 將台北時間轉換為 UTC 結束時間（用於日期範圍查詢）
 */
export const taipeiToUtcEnd = (taipeiTime: string): string => {
  // 如果輸入是日期格式 (YYYY-MM-DD)，添加台北時區的結束時間
  if (/^\d{4}-\d{2}-\d{2}$/.test(taipeiTime)) {
    return `${taipeiTime}T23:59:59+08:00`;
  }
  // 如果輸入是日期時間格式 (YYYY-MM-DDTHH:mm)，添加台北時區信息
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(taipeiTime)) {
    return `${taipeiTime}:59+08:00`;
  }
  // 如果已經是完整的 ISO 格式，直接返回
  return taipeiTime;
};

/**
 * 將 UTC 時間轉換為台北時間顯示格式
 * 使用簡單的時間計算，避免在 Cloudflare Workers 中使用 toLocaleString
 */
export const utcToTaipei = (utcTime: string): string => {
  // 如果時間字符串沒有時區信息，假設它是 UTC 時間
  let dateStr = utcTime;
  if (!utcTime.includes('Z') && !utcTime.includes('+') && !utcTime.includes('-')) {
    dateStr = utcTime + 'Z'; // 添加 UTC 標識
  }
  
  // 創建 UTC 日期對象
  const date = new Date(dateStr);
  
  // 轉換為台北時間 (UTC+8)
  const taipeiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  
  // 格式化為顯示字符串 (YYYY-MM-DD HH:mm:ss)
  const year = taipeiTime.getUTCFullYear();
  const month = String(taipeiTime.getUTCMonth() + 1).padStart(2, '0');
  const day = String(taipeiTime.getUTCDate()).padStart(2, '0');
  const hours = String(taipeiTime.getUTCHours()).padStart(2, '0');
  const minutes = String(taipeiTime.getUTCMinutes()).padStart(2, '0');
  const seconds = String(taipeiTime.getUTCSeconds()).padStart(2, '0');
  const milliseconds = String(taipeiTime.getUTCMilliseconds()).padStart(3, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}.${milliseconds}`;
};

/**
 * 格式化日期為 YYYY-MM-DD 格式
 */
export const formatDateOnly = (dateStr: string): string => {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    // 轉換為台北時間 (UTC+8)
    const taipeiDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return taipeiDate.toISOString().split('T')[0];
  } catch {
    return dateStr.split('T')[0];
  }
};
