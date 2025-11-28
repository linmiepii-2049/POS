import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { PreorderPage } from './pages/PreorderPage';
import { PaymentReturnPage } from './pages/PaymentReturnPage';
import { useLiff } from './hooks/useLiff';

/**
 * 預購前台應用程式入口
 */
export function App() {
  const { isReady, shouldUseLiff, isLoggedIn, error: liffError } = useLiff();

  // 根據 URL 路徑決定顯示哪個頁面
  const isPaymentReturn = window.location.pathname.includes('/preorder/payment/return');
  const isPaymentCancel = window.location.pathname.includes('/preorder/payment/cancel');

  // 如果需要 LIFF 但未登入，显示登录提示（支付回调页面不需要 LIFF）
  if (shouldUseLiff && isReady && !isLoggedIn && !isPaymentReturn && !isPaymentCancel) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 max-w-md w-full">
            <div className="text-yellow-600 text-5xl">⚠️</div>
            <h2 className="text-xl font-bold text-gray-900">需要 LINE 登入</h2>
            <p className="text-sm text-gray-600">
              此頁面需要在 LINE App 中開啟，或請先登入 LINE 帳號。
            </p>
            {liffError && (
              <p className="text-xs text-red-600 mt-2">{liffError.message}</p>
            )}
          </div>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: '1rem',
            },
          }}
        />
      </QueryClientProvider>
    );
  }

  // LIFF 初始化中
  if (shouldUseLiff && !isReady) {
    return (
      <QueryClientProvider client={queryClient}>
        <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 max-w-md w-full">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
            <p className="text-gray-600">正在初始化...</p>
          </div>
        </div>
        <Toaster
          position="top-center"
          toastOptions={{
            style: {
              fontSize: '1rem',
            },
          }}
        />
      </QueryClientProvider>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      {isPaymentReturn || isPaymentCancel ? <PaymentReturnPage /> : <PreorderPage />}
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            fontSize: '1rem',
          },
        }}
      />
    </QueryClientProvider>
  );
}



