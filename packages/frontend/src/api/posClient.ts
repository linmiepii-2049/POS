/**
 * POS 系統 API 客戶端
 * 重新匯出共用 SDK
 */

// 從共用 SDK 重新匯出所有類型和 hooks
export * from '@pos/sdk';

// 手動設定 baseUrl 為當前域名
export const setBaseUrl = (baseUrl: string) => {
  // 這個函數可以讓前端動態設定 baseUrl
  return baseUrl;
};
