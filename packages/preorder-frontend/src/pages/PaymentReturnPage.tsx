import { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

interface PaymentStatus {
  status: 'loading' | 'success' | 'error';
  orderNumber?: string;
  message?: string;
}

/**
 * LINE Pay 支付完成回調頁面
 */
/**
 * 從 URL 查詢參數中獲取值
 */
function getQueryParam(name: string): string | null {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

export function PaymentReturnPage() {
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus>({ status: 'loading' });
  const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
  const isProcessingRef = useRef(false);
  const hasCompletedRef = useRef(false); // 标记是否已经完成（成功或失败）
  const toastShownRef = useRef(false); // 标记是否已经显示过 toast

  useEffect(() => {
    // 防止重复调用（React Strict Mode 会执行两次）
    // 1. 检查是否正在处理
    // 2. 检查是否已经完成（成功或失败）
    if (isProcessingRef.current || hasCompletedRef.current) {
      return;
    }

    const confirmPayment = async () => {
      isProcessingRef.current = true;
      // LINE Pay 回调时会在 URL 中添加 transactionId 和 orderId 参数
      // 业界最佳实践：只从 URL 参数获取，不依赖 sessionStorage
      const transactionId = getQueryParam('transactionId');
      const orderId = getQueryParam('orderId');

      // 必须要有 transactionId（LINE Pay 会提供）
      if (!transactionId) {
        setPaymentStatus({
          status: 'error',
          message: '缺少交易 ID，請重新下單',
        });
        return;
      }

      try {
        // 优先使用仅 transactionId 查询（业界标准做法）
        // 后端应该能够仅通过 transactionId 查询到完整信息
        let infoResponse = await fetch(
          `${apiBase}/api/preorders/payment/info/by-transaction?transactionId=${transactionId}`,
        );
        
        // 如果仅 transactionId 查询失败，且有 orderId，尝试使用完整参数（向后兼容）
        if (!infoResponse.ok && orderId) {
          console.warn('僅使用 transactionId 查詢失敗，嘗試使用完整參數', {
            transactionId,
            orderId,
          });
          infoResponse = await fetch(
            `${apiBase}/api/preorders/payment/info?transactionId=${transactionId}&orderId=${orderId}`,
          );
        }
        
        if (!infoResponse.ok) {
          const errorText = await infoResponse.text();
          let errorData: any = {};
          try {
            errorData = JSON.parse(errorText);
          } catch (e) {
            // 忽略解析錯誤
          }
          
          console.error('從後端獲取支付資訊失敗', {
            status: infoResponse.status,
            statusText: infoResponse.statusText,
            errorData,
            transactionId,
            orderId,
          });
          
          throw new Error(
            errorData.message || 
            `無法獲取支付資訊（${infoResponse.status}），請重新下單`
          );
        }
        
        const infoData = await infoResponse.json();
        if (!infoData.success || !infoData.data) {
          throw new Error('後端返回的支付資訊格式錯誤');
        }
        
        const paymentInfo = infoData.data;
        console.log('從後端獲取支付資訊成功', paymentInfo);

        // 從後端返回的數據中獲取 orderId（如果 URL 中沒有）
        const finalOrderId = orderId || paymentInfo.orderId;
        if (!finalOrderId) {
          throw new Error('無法獲取訂單 ID');
        }

        // 確認支付並創建訂單（不傳遞 body，讓後端從數據庫獲取）
        console.log('發送支付確認請求:', {
          transactionId,
          orderId: finalOrderId,
        });

        const response = await fetch(
          `${apiBase}/api/preorders/payment/confirm?transactionId=${transactionId}&orderId=${finalOrderId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}), // 空 body，後端會從數據庫獲取資訊
          },
        );

        if (!response.ok) {
          let errorData: any = {};
          try {
            const text = await response.text();
            console.log('支付確認失敗 - 原始回應:', text);
            if (text) {
              errorData = JSON.parse(text);
            }
          } catch (parseError) {
            console.error('解析錯誤回應失敗:', parseError);
          }
          
          console.error('支付確認失敗:', {
            status: response.status,
            statusText: response.statusText,
            errorData,
            transactionId,
            orderId: finalOrderId,
            errorCode: errorData.code || errorData.error,
            errorMessage: errorData.message || errorData.error,
            errorDetails: errorData.details,
          });
          
          // 如果是 400 或 500 錯誤，可能是 LINE Pay 還沒處理完，嘗試重試
          if (response.status === 400 || response.status === 500) {
            const errorCode = errorData.code || '';
            const errorMessage = errorData.message || '';
            
            // 檢查是否是因為 LINE Pay 還沒準備好（常見錯誤碼）
            if (
              errorCode.includes('LINE_PAY') ||
              errorMessage.includes('LINE Pay') ||
              errorMessage.includes('交易') ||
              errorMessage.includes('transaction')
            ) {
              console.log('LINE Pay 可能還在處理中，等待 2 秒後重試...');
              await new Promise((resolve) => setTimeout(resolve, 2000));
              
              // 重試一次（使用從後端獲取的 orderId）
              const retryResponse = await fetch(
                `${apiBase}/api/preorders/payment/confirm?transactionId=${transactionId}&orderId=${finalOrderId}`,
                {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({}),
                },
              );
              
              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                if (retryData.success && retryData.data) {
                  setPaymentStatus({
                    status: 'success',
                    orderNumber: retryData.data.orderNumber,
                  });
                  
                  if (!toastShownRef.current) {
                    toast.success('預購成功，系統已送出網站通知');
                    toastShownRef.current = true;
                  }
                  hasCompletedRef.current = true;
                  isProcessingRef.current = false;
                  return;
                }
              }
            }
          }
          
          // 檢查是否是重複請求錯誤（支付已經成功，但重複調用）
          if (errorData.code === 'LINE_PAY_ERROR' && 
              (errorData.message?.includes('Duplicated') || 
               errorData.message?.includes('Existing same orderId'))) {
            // 這是重複請求，但支付可能已經成功
            // 嘗試查詢支付資訊，如果已經確認，直接返回成功
            console.warn('檢測到重複請求錯誤，嘗試查詢支付狀態', {
              transactionId,
              orderId: finalOrderId,
            });
            
            try {
              const statusResponse = await fetch(
                `${apiBase}/api/preorders/payment/info/by-transaction?transactionId=${transactionId}`,
              );
              
              if (statusResponse.ok) {
                const statusData = await statusResponse.json();
                if (statusData.success && statusData.data) {
                  // 支付資訊存在，嘗試再次確認（後端會處理已確認的情況）
                  const finalConfirmResponse = await fetch(
                    `${apiBase}/api/preorders/payment/confirm?transactionId=${transactionId}&orderId=${statusData.data.orderId}`,
                    {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({}),
                    },
                  );
                  
                  if (finalConfirmResponse.ok) {
                    const finalConfirmData = await finalConfirmResponse.json();
                    if (finalConfirmData.success && finalConfirmData.data) {
                      setPaymentStatus({
                        status: 'success',
                        orderNumber: finalConfirmData.data.orderNumber,
                      });
                      if (!toastShownRef.current) {
                        toast.success('預購成功，系統已送出網站通知');
                        toastShownRef.current = true;
                      }
                      hasCompletedRef.current = true; // 標記已完成（成功）
                      isProcessingRef.current = false;
                      return;
                    }
                  }
                }
              }
            } catch (statusError) {
              console.error('查詢支付狀態失敗', statusError);
            }
          }
          
          // 顯示詳細的錯誤訊息
          let errorMessage = '支付確認失敗';
          if (errorData.details && Array.isArray(errorData.details)) {
            // Zod 驗證錯誤
            const validationErrors = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
            errorMessage = `請求參數錯誤: ${validationErrors}`;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (errorData.code) {
            errorMessage = errorData.code;
          }
          
          throw new Error(errorMessage);
        }

        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error('支付確認失敗：無效的回應');
        }

        setPaymentStatus({
          status: 'success',
          orderNumber: data.data.orderNumber,
        });

        if (!toastShownRef.current) {
          toast.success('預購成功，系統已送出網站通知');
          toastShownRef.current = true;
        }
        hasCompletedRef.current = true; // 標記已完成（成功）
        isProcessingRef.current = false;
      } catch (error) {
        const message = error instanceof Error ? error.message : '支付確認失敗';
        setPaymentStatus({
          status: 'error',
          message,
        });
        if (!toastShownRef.current) {
          toast.error(message);
          toastShownRef.current = true;
        }
        hasCompletedRef.current = true; // 標記已完成（失敗）
        isProcessingRef.current = false;
      }
    };

    confirmPayment();
    
    // 清理函数：组件卸载时取消处理
    return () => {
      // 注意：不要在这里重置 hasCompletedRef，因为即使组件重新挂载，也不应该重复处理
      isProcessingRef.current = false;
    };
  }, [apiBase]); // 只在组件挂载时执行一次，不依赖 paymentStatus.status（避免状态改变时重复执行）

  if (paymentStatus.status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 max-w-md w-full">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto" />
          <p className="text-gray-600">正在確認支付...</p>
          <p className="text-xs text-gray-500">請稍候，這可能需要幾秒鐘</p>
        </div>
      </div>
    );
  }

  if (paymentStatus.status === 'error') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 max-w-md w-full">
          <div className="text-red-600 text-5xl">✗</div>
          <h2 className="text-xl font-bold text-gray-900">支付失敗</h2>
          <p className="text-sm text-gray-600">{paymentStatus.message || '支付過程中發生錯誤'}</p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
          >
            返回首頁
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 max-w-md w-full">
        <div className="text-green-600 text-5xl">✓</div>
        <h2 className="text-xl font-bold text-gray-900">預購成功</h2>
        <p className="text-sm text-gray-600">系統已同步網站通知，請保留以下資訊以利取貨。</p>
        {paymentStatus.orderNumber && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
            <p>
              訂單編號：<span className="font-semibold">{paymentStatus.orderNumber}</span>
            </p>
          </div>
        )}
        <button
          type="button"
          onClick={() => (window.location.href = '/')}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
        >
          再預購一筆
        </button>
      </div>
    </div>
  );
}

