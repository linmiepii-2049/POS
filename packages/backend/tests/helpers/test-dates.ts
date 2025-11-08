/**
 * 測試日期輔助函數
 * 提供動態日期生成，避免使用固定的過期日期
 */

/**
 * 取得當前年份
 */
export const getCurrentYear = (): number => {
  return new Date().getFullYear();
};

/**
 * 取得明年年份
 */
export const getNextYear = (): number => {
  return getCurrentYear() + 1;
};

/**
 * 生成未來的開始日期（本年1月1日）
 */
export const getFutureStartDate = (): string => {
  const year = getNextYear(); // 使用明年確保不會過期
  return `${year}-01-01T00:00:00.000Z`;
};

/**
 * 生成未來的結束日期（本年12月31日）
 */
export const getFutureEndDate = (): string => {
  const year = getNextYear();
  return `${year}-12-31T23:59:59.000Z`;
};

/**
 * 生成未來的結束日期（16:00 UTC = 台北時間 23:59:59）
 */
export const getFutureEndDateTaipei = (): string => {
  const year = getNextYear();
  return `${year}-12-31T15:59:59.000Z`;
};

/**
 * 生成當前時間戳（UTC）
 */
export const getCurrentTimestamp = (): string => {
  return new Date().toISOString();
};

/**
 * 生成過去的日期（去年）
 */
export const getPastDate = (): string => {
  const year = getCurrentYear() - 1;
  return `${year}-01-01T00:00:00.000Z`;
};

/**
 * 將 UTC 時間轉換為台北時間字符串（ISO 格式）
 */
export const utcToTaipeiISO = (utcTime: string): string => {
  const date = new Date(utcTime);
  // UTC 時間 + 8 小時 = 台北時間
  const taipeiTime = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return taipeiTime.toISOString();
};

/**
 * 生成測試用的優惠券時間範圍
 */
export const getCouponDateRange = () => {
  const year = getNextYear();
  return {
    starts_at: `${year}-01-01T00:00:00.000Z`,
    ends_at: `${year}-12-31T15:59:59.000Z`, // UTC 15:59:59 = 台北 23:59:59
    starts_at_taipei: `${year}-01-01T08:00:00.000Z`,
    ends_at_taipei: `${year}-12-31T23:59:59.000Z`,
  };
};

/**
 * 生成測試用的建立時間
 */
export const getCreatedTimestamps = () => {
  const year = getNextYear();
  return {
    created_at: `${year}-01-01T00:00:00.000Z`,
    updated_at: `${year}-01-01T00:00:00.000Z`,
    created_at_taipei: `${year}-01-01T08:00:00.000Z`,
    updated_at_taipei: `${year}-01-01T08:00:00.000Z`,
  };
};

