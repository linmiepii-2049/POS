import { QueryClient } from '@tanstack/react-query';

/**
 * React Query 共用客戶端
 */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: (failureCount, error: any) => {
        // 404 錯誤不重試（這是正常的業務邏輯，表示沒有數據）
        // SDK 返回的錯誤可能包含 status 字段
        if (error?.status === 404 || error?.response?.status === 404) {
          return false;
        }
        // 其他錯誤最多重試 1 次
        return failureCount < 1;
      },
      refetchOnWindowFocus: false,
      // 不要將 404 視為錯誤，因為這是正常的業務邏輯響應
      // React Query 會將非 2xx 狀態碼視為錯誤，但我們需要在查詢中處理 404
      throwOnError: false,
    },
  },
});




