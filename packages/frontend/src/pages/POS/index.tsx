/**
 * POS 系統主頁面
 * 整合商品展示、購物車、確認訂單、付款流程
 */

import { useState, useRef } from 'react';
import { useProductsList, useOrdersCreate, useOrdersGetTodayStats } from '../../api/posClient';
import type { OrdersCreate201 } from '@pos/sdk';
import { useCart } from '../../hooks/useCart';
import { useErrorHandler } from '../../hooks/useErrorHandler';
import { ProductCard } from '../../components/ProductCard';
import { Cart } from '../../components/Cart';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { PaymentDialog } from '../../components/PaymentDialog';
import toast from 'react-hot-toast';

/**
 * 訂單狀態
 */
type OrderStep = 'shopping' | 'confirming' | 'paying' | 'completed';

/**
 * 訂單完成頁面 Props
 */
interface OrderCompleteProps {
  orderNumber: string;
  onNewOrder: () => void;
  dailyOrderCount: number;
}

/**
 * 訂單完成頁面
 */
function OrderComplete({ orderNumber, onNewOrder, dailyOrderCount }: OrderCompleteProps) {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-8 text-center">
        <div className="mb-6">
          <svg className="w-16 h-16 text-green-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">訂單完成</h1>
          <p className="text-gray-600">感謝您的購買！</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-gray-600">訂單編號</p>
          <p className="text-lg font-mono font-bold text-gray-900">{orderNumber}</p>
        </div>

        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-blue-600">今日已完成</p>
          <p className="text-2xl font-bold text-blue-700">{dailyOrderCount} 筆訂單</p>
        </div>

        <button
          onClick={onNewOrder}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          開始新訂單
        </button>
      </div>
    </div>
  );
}

/**
 * POS 主頁面
 */
export function POSPage() {
  const { state, clearCart } = useCart();
  const { handleError, handleSuccess } = useErrorHandler();
  const confirmDialogRef = useRef<any>(null);
  
  // 今日訂單統計
  const { data: todayStatsResponse, refetch: refetchTodayStats } = useOrdersGetTodayStats();
  
  const [currentStep, setCurrentStep] = useState<OrderStep>('shopping');
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
  const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');
  const [finalAmount, setFinalAmount] = useState(0); // 存儲折扣後的最終金額
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(undefined);
  const [pointsToRedeem, setPointsToRedeem] = useState(0); // 要折抵的點數
  // const [selectedCouponCodeId, setSelectedCouponCodeId] = useState<number | undefined>(undefined); // TODO: 優惠券功能已停用
  
  // QR Code 圖片 URL - 可以在這裡設定你的 QR Code 圖片
  // 方法一：使用外部圖片 URL
  // const qrCodeImageUrl = 'https://your-domain.com/your-qr-code.png';
  
  // 方法二：使用本地圖片（放在 packages/frontend/public/ 資料夾）
  const qrCodeImageUrl = '/qr-code.png'; // 將你的 QR Code 圖片放在 public 資料夾並命名為 qr-code.png
  
  // 方法三：使用 Base64 編碼
  // const qrCodeImageUrl = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...';

  // 查詢商品列表
  const { data: productsResponse, isLoading: isLoadingProducts } = useProductsList({
    page: 1,
    limit: 50,
    sortBy: 'name',
    sortDir: 'asc',
    is_active: 1, // 只顯示啟用的商品
  });

  // 從響應中提取實際資料
  const productsData = productsResponse?.data;

  // 建立訂單
  const createOrderMutation = useOrdersCreate();

  /**
   * 開始結帳流程
   */
  const handleCheckout = () => {
    if (state.items.length === 0) return;
    setIsConfirmDialogOpen(true);
  };

  /**
   * 確認訂單
   */
  const handleConfirmOrder = (orderData: {
    items: Array<{ id: number; name: string; price: number; quantity: number }>;
    userId?: number;
    // couponCodeId?: number; // TODO: 優惠券功能已停用
    pointsToRedeem?: number;
    totalAmount: number;
    finalAmount: number;
  }) => {
    // 存儲折扣後的最終金額、用戶ID和點數折抵
    setFinalAmount(orderData.finalAmount);
    setSelectedUserId(orderData.userId);
    setPointsToRedeem(orderData.pointsToRedeem || 0);
    // setSelectedCouponCodeId(orderData.couponCodeId); // TODO: 優惠券功能已停用
    setIsConfirmDialogOpen(false);
    setCurrentStep('paying');
    setIsPaymentDialogOpen(true);
  };

  /**
   * 完成付款
   */
  const handlePaymentComplete = async () => {
    const requestId = `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    console.log(`📦 [建立訂單] 開始:`, {
      requestId,
      itemCount: state.items.length,
      totalAmount: state.totalAmount,
      finalAmount,
      userId: selectedUserId,
      pointsToRedeem,
      timestamp: new Date().toISOString(),
    });
    
    try {
      // 建立訂單
      const orderData: any = {
        items: state.items.map(item => ({
          product_id: item.id,
          quantity: item.quantity,
        })),
      };

      // 只有在有會員時才添加 user_id
      if (selectedUserId) {
        orderData.user_id = selectedUserId;
        console.log(`👤 [建立訂單] 包含會員 ID: ${selectedUserId}`);
      } else {
        console.log(`👤 [建立訂單] 非會員訂單`);
      }

      // 添加點數折抵（如果有的話）
      if (pointsToRedeem > 0) {
        orderData.points_to_redeem = pointsToRedeem;
        console.log(`💰 [建立訂單] 點數折抵: ${pointsToRedeem} 元`);
      }

      // TODO: 優惠券功能已停用
      // 添加優惠券代碼 ID（如果有的話）
      // if (selectedCouponCodeId) {
      //   orderData.coupon_code_id = selectedCouponCodeId;
      // }

      console.log(`📤 [建立訂單] 發送訂單資料:`, {
        ...orderData,
        items: orderData.items.map((i: any) => ({ product_id: i.product_id, quantity: i.quantity })),
      });

      const orderResponse = await createOrderMutation.mutateAsync({
        data: orderData,
      });

      console.log(`✅ [建立訂單] API 回應:`, {
        success: orderResponse.data?.success,
        status: orderResponse.status,
        fullResponse: orderResponse.data,
      });

      // 設定訂單編號和重新獲取統計
      // 檢查是否為成功響應（201）並包含 order_number
      let newOrderNumber = `ORD-${Date.now()}`;
      if (orderResponse.status === 201 && orderResponse.data) {
        const orderData = orderResponse.data as OrdersCreate201;
        if (orderData.success && orderData.data && 'order_number' in orderData.data) {
          newOrderNumber = String(orderData.data.order_number);
        }
      }
      setOrderNumber(newOrderNumber);
      refetchTodayStats(); // 重新獲取今日訂單統計
      
      console.log(`🎉 [建立訂單] 訂單建立成功: ${newOrderNumber}`);
      
      // 清空購物車、用戶選擇和點數折抵
      clearCart();
      setSelectedUserId(undefined);
      setPointsToRedeem(0);
      // setSelectedCouponCodeId(undefined); // TODO: 優惠券功能已停用
      
      // 關閉付款對話框
      setIsPaymentDialogOpen(false);
      
      // 進入完成頁面
      setCurrentStep('completed');
      
      handleSuccess('訂單建立成功！');
    } catch (error: any) {
      console.error(`❌ [建立訂單] 錯誤:`, {
        requestId,
        error,
        errorType: error?.constructor?.name,
        errorMessage: error?.message,
        errorStack: error?.stack,
        response: error?.response,
        responseData: error?.response?.data,
        status: error?.response?.status,
        statusText: error?.response?.statusText,
      });
      
      // 解析詳細錯誤訊息
      let errorMessage = '建立訂單失敗';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
          if (errorData.details) {
            if (Array.isArray(errorData.details)) {
              // Zod validation errors
              const validationErrors = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
              errorMessage = `驗證錯誤: ${validationErrors}`;
            } else if (typeof errorData.details === 'string') {
              errorMessage += `: ${errorData.details}`;
            } else if (errorData.details.message) {
              errorMessage = errorData.details.message;
            }
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage, { duration: 6000 });
      handleError(error, '建立訂單');
    }
  };

  /**
   * 開始新訂單
   */
  const handleNewOrder = () => {
    setCurrentStep('shopping');
    setOrderNumber('');
    clearCart();
    setSelectedUserId(undefined);
    setPointsToRedeem(0);
    // setSelectedCouponCodeId(undefined); // TODO: 優惠券功能已停用
    // 重置確認對話框
    if (confirmDialogRef.current) {
      confirmDialogRef.current.resetForm();
    }
  };

  /**
   * 重新結帳（等同於 Cmd+R）
   */
  const handleRefreshPage = () => {
    window.location.reload();
  };

  // 訂單完成頁面
  if (currentStep === 'completed') {
    return (
        <OrderComplete
          orderNumber={orderNumber}
          onNewOrder={handleNewOrder}
          dailyOrderCount={(todayStatsResponse && 'data' in todayStatsResponse && todayStatsResponse.data && 'data' in todayStatsResponse.data) ? (todayStatsResponse.data.data?.todayOrderCount || 0) : 0}
        />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題列 */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <h1 className="text-xl font-semibold text-gray-900">POS 收銀系統</h1>
            <div className="flex items-center space-x-4">
              <button
                onClick={handleRefreshPage}
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                title="重新結帳 (Cmd+R)"
              >
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                重新結帳
              </button>
              <div className="text-sm text-gray-600">
                今日訂單：<span className="font-semibold">{(todayStatsResponse && 'data' in todayStatsResponse && todayStatsResponse.data && 'data' in todayStatsResponse.data) ? (todayStatsResponse.data.data?.todayOrderCount || 0) : 0}</span>
              </div>
              <div className="text-sm text-gray-600">
                購物車：<span className="font-semibold">{state.itemCount} 項</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 商品區域 */}
          <div className="lg:col-span-2">
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">商品選擇</h2>
              
              {isLoadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, index) => (
                    <div key={index} className="bg-white rounded-lg shadow-md overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-200"></div>
                      <div className="p-4">
                        <div className="h-4 bg-gray-200 rounded mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-2/3 mb-3"></div>
                        <div className="h-8 bg-gray-200 rounded"></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {(productsData && 'data' in productsData && productsData.data) && productsData.data.map((product: Record<string, unknown>) => (
                    <ProductCard
                      key={typeof product.id === 'number' ? product.id : 0}
                      product={{
                        id: typeof product.id === 'number' ? product.id : 0,
                        name: typeof product.name === 'string' ? product.name : '',
                        price: typeof product.unit_price_twd === 'number' ? product.unit_price_twd : 0,
                        thumbnail: typeof product.img_url === 'string' ? product.img_url : undefined,
                        description: typeof product.description === 'string' ? product.description : undefined,
                        category: typeof product.category === 'string' ? product.category : undefined,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 購物車區域 */}
          <div className="lg:col-span-1">
            <Cart onCheckout={handleCheckout} />
          </div>
        </div>
      </div>

      {/* 確認訂單對話框 */}
      <ConfirmDialog
        ref={confirmDialogRef}
        isOpen={isConfirmDialogOpen}
        onClose={() => setIsConfirmDialogOpen(false)}
        onConfirm={handleConfirmOrder}
      />

      {/* 付款對話框 */}
      <PaymentDialog
        isOpen={isPaymentDialogOpen}
        onClose={() => {
          setIsPaymentDialogOpen(false);
          setCurrentStep('confirming');
          setIsConfirmDialogOpen(true);
        }}
        onPaymentComplete={handlePaymentComplete}
        totalAmount={finalAmount || state.totalAmount}
        qrCodeImageUrl={qrCodeImageUrl}
      />
    </div>
  );
}
