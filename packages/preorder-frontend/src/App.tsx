import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { queryClient } from './lib/queryClient';
import { PreorderPage } from './pages/PreorderPage';
import { PaymentReturnPage } from './pages/PaymentReturnPage';

/**
 * 預購前台應用程式入口
 */
export function App() {
  // 根據 URL 路徑決定顯示哪個頁面
  const isPaymentReturn = window.location.pathname.includes('/preorder/payment/return');
  const isPaymentCancel = window.location.pathname.includes('/preorder/payment/cancel');

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



