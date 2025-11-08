/**
 * 全域錯誤處理 Hook
 * 提供統一的錯誤處理機制
 */
import { useCallback } from 'react';
import toast from 'react-hot-toast';

export interface ApiError {
  message: string;
  status?: number;
  statusText?: string;
  code?: string;
  details?: unknown;
}

/**
 * 錯誤處理 Hook
 */
export function useErrorHandler() {
  const handleError = useCallback((error: unknown, context?: string) => {
    console.error(`Error in ${context || 'unknown context'}:`, error);

    let errorMessage = '發生未知錯誤';

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object') {
      // 處理 API 錯誤回應
      const apiError = error as any;
      if (apiError?.response?.data?.message) {
        errorMessage = apiError.response.data.message;
      } else if (apiError?.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError?.message) {
        errorMessage = apiError.message;
      }
    }

    // 顯示錯誤 toast
    toast.error(errorMessage);

    return errorMessage;
  }, []);

  const handleSuccess = useCallback((message: string) => {
    toast.success(message);
  }, []);

  const handleWarning = useCallback((message: string) => {
    toast(message, {
      icon: '⚠️',
      style: {
        background: '#F59E0B',
        color: '#fff',
      },
    });
  }, []);

  return {
    handleError,
    handleSuccess,
    handleWarning,
  };
}
