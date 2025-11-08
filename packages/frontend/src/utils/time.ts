/**
 * 時間工具函數
 * 處理 POS 系統中的時間轉換和格式化
 */

/**
 * 將日期格式轉換為 UTC 的 ISO 8601 格式
 * @param dateStr 日期字符串，格式為 YYYY-MM-DD 或已包含時間的 ISO 格式
 * @param isEndDate 是否為結束日期，結束日期會設為 23:59:59
 * @returns UTC 格式的 ISO 字符串
 */
export function convertToUTCISO(dateStr: string, isEndDate: boolean = false): string {
  if (!dateStr) return '';
  
  // 如果已經是完整的 datetime 格式，直接返回
  if (dateStr.includes('T')) {
    return dateStr;
  }
  
  // 如果是純日期格式，添加時間部分並轉換為 UTC
  const timeStr = isEndDate ? 'T23:59:59+08:00' : 'T00:00:00+08:00';
  const date = new Date(`${dateStr}${timeStr}`); // 先轉為台北時間
  return date.toISOString(); // 轉為 UTC ISO 格式
}

/**
 * 將日期格式轉換為台北時間的 ISO 8601 格式（用於顯示）
 * @param dateStr 日期字符串，格式為 YYYY-MM-DD 或已包含時間的 ISO 格式
 * @param isEndDate 是否為結束日期，結束日期會設為 23:59:59
 * @returns 台北時間格式的 ISO 字符串
 */
export function convertToTaipeiISO(dateStr: string, isEndDate: boolean = false): string {
  if (!dateStr) return '';
  
  // 如果已經是完整的 datetime 格式，直接返回
  if (dateStr.includes('T')) {
    return dateStr;
  }
  
  // 如果是純日期格式，添加時間部分
  const timeStr = isEndDate ? 'T23:59:59+08:00' : 'T00:00:00+08:00';
  return `${dateStr}${timeStr}`;
}

/**
 * 格式化日期顯示（僅顯示日期部分，台北時間）
 * @param dateStr ISO 日期字符串
 * @returns 格式化的日期字符串 YYYY-MM-DD
 */
export function formatDateOnly(dateStr: string): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    // 轉換為台北時間 (UTC+8)
    const taipeiDate = new Date(date.getTime() + (8 * 60 * 60 * 1000));
    return taipeiDate.toISOString().split('T')[0];
  } catch {
    return dateStr.split('T')[0];
  }
}

/**
 * 格式化日期時間顯示（台北時間）
 * @param dateStr ISO 日期字符串
 * @param showTime 是否顯示時間，預設為 false
 * @returns 格式化的日期時間字符串
 */
export function formatDateTime(dateStr: string, showTime: boolean = false): string {
  if (!dateStr) return '';
  
  try {
    const date = new Date(dateStr);
    const taipeiDate = new Date(date.getTime() + (8 * 60 * 60 * 1000)); // 轉為台北時間
    
    if (showTime) {
      return taipeiDate.toISOString().replace('T', ' ').replace(/\.\d{3}Z$/, '');
    } else {
      return taipeiDate.toISOString().split('T')[0];
    }
  } catch {
    return showTime ? dateStr : dateStr.split('T')[0];
  }
}

/**
 * 驗證日期範圍
 * @param startDate 開始日期
 * @param endDate 結束日期
 * @returns 驗證結果和錯誤訊息
 */
export function validateDateRange(startDate: string | undefined, endDate: string | undefined): { isValid: boolean; error?: string } {
  if (!startDate || !endDate) {
    return { isValid: true }; // 允許空值
  }
  
  const start = new Date(convertToUTCISO(startDate));
  const end = new Date(convertToUTCISO(endDate, true));
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    return { isValid: false, error: '日期格式無效' };
  }
  
  if (start > end) {
    return { isValid: false, error: '結束日期不得早於開始日期' };
  }
  
  return { isValid: true };
}

/**
 * 檢查日期是否在指定範圍內
 * @param date 要檢查的日期
 * @param startDate 開始日期
 * @param endDate 結束日期
 * @returns 是否在範圍內
 */
export function isDateInRange(date: string | undefined, startDate: string | undefined, endDate: string | undefined): boolean {
  if (!date || !startDate || !endDate) return true;
  
  const checkDate = new Date(convertToUTCISO(date));
  const start = new Date(convertToUTCISO(startDate));
  const end = new Date(convertToUTCISO(endDate, true));
  
  return checkDate >= start && checkDate <= end;
}
