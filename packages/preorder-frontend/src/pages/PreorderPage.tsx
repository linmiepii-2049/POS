import { useMemo, useState, useEffect, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import {
  usePreordersGetActive,
  usePreordersCreateOrder,
  useUsersGetByLineId,
  type PreordersGetActive200,
  type PreordersGetActive200Data,
  type PreordersGetActive404,
  type PreordersCreateOrder201,
  type PreordersCreateOrder409,
  type UsersGetByLineId200,
} from '@pos/sdk';
import { useLiff } from '../hooks/useLiff';

interface CartItem {
  productId: number;
  productName: string;
  productPriceTwd: number;
  productImageUrl: string | null;
  quantity: number;
  remainingQuantity: number;
}

interface PreorderFormState {
  pickupDate: string;
}

const INITIAL_FORM: PreorderFormState = {
  pickupDate: '',
};

interface UserInfo {
  id: number;
  name: string;
  points: number;
  points_yuan_equivalent: number;
}

/**
 * 生成未來5天的日期選項
 */
const generatePickupDateOptions = () => {
  const options: Array<{ value: string; label: string }> = [];
  const today = new Date();
  const weekdays = ['日', '一', '二', '三', '四', '五', '六'];
  
  for (let i = 1; i <= 5; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = weekdays[date.getDay()];
    
    const value = `${date.getFullYear()}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const label = `${month}/${day}(${weekday})`;
    
    options.push({ value, label });
  }
  
  return options;
};

type PreorderCampaign = PreordersGetActive200Data;

const isActiveResponse = (
  response: PreordersGetActive200 | PreordersGetActive404 | undefined,
): response is PreordersGetActive200 => Boolean(response && 'data' in response);

const isCreateOrderSuccess = (
  response: PreordersCreateOrder201 | PreordersCreateOrder409 | undefined,
): response is PreordersCreateOrder201 => Boolean(response && 'data' in response);

/**
 * 預購頁面：顯示檔期資訊並提供訂單建立表單
 */
export function PreorderPage() {
  const pickupDateOptions = generatePickupDateOptions();
  const [formState, setFormState] = useState<PreorderFormState>({
    pickupDate: pickupDateOptions[0]?.value || '',
  });
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderSummary, setOrderSummary] = useState<PreordersCreateOrder201['data'] | null>(null);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [pointsRedeemAmount, setPointsRedeemAmount] = useState(0); // 要折抵的金額（元）

  // LIFF 整合
  const { isReady, profile, isLoggedIn, shouldUseLiff } = useLiff();

  // 查詢用戶資訊（當有 LINE ID 時）
  const { data: userResponse, refetch: refetchUser } = useUsersGetByLineId(
    profile?.userId || 'dummy',
    {
      query: {
        enabled: false, // 手動觸發
        queryKey: ['users', 'by-line-id', profile?.userId] as const,
      },
    },
  );

  const { data: campaignResponse, isLoading, isError, error, refetch } = usePreordersGetActive({
    query: {
      // 404 不應該被視為錯誤，這是正常的業務邏輯（沒有活躍檔期）
      retry: (failureCount: number, error: any) => {
        // 如果響應狀態是 404，不重試
        if (error?.status === 404 || error?.response?.status === 404) {
          return false;
        }
        // 網絡錯誤不重試（可能是 CORS 或其他配置問題）
        if (error?.message?.includes('fetch') || error?.message?.includes('network') || error?.message?.includes('Load failed')) {
          console.error('網絡錯誤，不重試:', error);
          return false;
        }
        // 其他錯誤最多重試 1 次
        return failureCount < 1;
      },
      // 不要將非 2xx 響應視為錯誤
      // React Query 會自動將拋出的錯誤視為錯誤，但我們的 SDK 不會拋出錯誤
      // 所以需要自定義錯誤判斷邏輯
      throwOnError: false,
      // 確保不會因為缺少 queryKey 而報錯
    } as any,
  });
  
  // 調試日誌（生產環境也記錄，以便診斷問題）
  useEffect(() => {
    console.log('🔍 預購檔期查詢狀態:', {
      isLoading,
      isError,
      hasResponse: !!campaignResponse,
      responseStatus: campaignResponse?.status,
      error: error ? {
        message: error instanceof Error ? error.message : String(error),
        type: error?.constructor?.name,
        stack: error instanceof Error ? error.stack : undefined,
      } : null,
      apiBaseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787',
    });
    
    if (campaignResponse) {
      console.log('📦 Campaign Response:', campaignResponse);
    }
    
    if (error) {
      console.error('❌ Campaign Query Error:', error);
    }
  }, [campaignResponse, isLoading, isError, error]);
  
  // 調試日誌：記錄完整響應結構
  useEffect(() => {
    if (import.meta.env.DEV && campaignResponse) {
      console.log('Full Campaign Response:', JSON.stringify(campaignResponse, null, 2));
      console.log('Campaign Response Data:', campaignResponse?.data);
      console.log('Campaign Response Status:', campaignResponse?.status);
    }
  }, [campaignResponse]);
  
  const campaignPayload = campaignResponse?.data as PreordersGetActive200 | PreordersGetActive404 | undefined;

  const campaign = useMemo<PreorderCampaign | null>(() => {
    if (!campaignPayload) {
      if (import.meta.env.DEV) {
        console.log('No campaign payload');
      }
      return null;
    }
    
    // 調試日誌
    if (import.meta.env.DEV) {
      console.log('Campaign Payload:', campaignPayload);
      console.log('Has data field:', 'data' in campaignPayload);
      console.log('Is active response:', isActiveResponse(campaignPayload));
    }
    
    // 檢查是否是成功響應（200）- 有 data 字段表示成功
    if (isActiveResponse(campaignPayload)) {
      if (import.meta.env.DEV) {
        console.log('Campaign data:', campaignPayload.data);
      }
      return campaignPayload.data;
    }
    
    // 如果是 404 錯誤響應
    if (campaignPayload && 'code' in campaignPayload) {
      if (import.meta.env.DEV) {
        console.log('404 Response:', campaignPayload);
      }
      return null;
    }
    
    // 其他情況返回 null
    return null;
  }, [campaignPayload]);

  // 當 LIFF 準備好且有 LINE ID 時，查詢用戶資訊
  useEffect(() => {
    if (isReady && shouldUseLiff && isLoggedIn && profile?.userId) {
      refetchUser();
    }
  }, [isReady, shouldUseLiff, isLoggedIn, profile?.userId, refetchUser]);

  // 處理用戶查詢結果
  useEffect(() => {
    if (userResponse?.data && 'data' in userResponse.data) {
      const userData = userResponse.data as UsersGetByLineId200;
      if (userData.success && userData.data) {
        setUserInfo({
          id: userData.data.id,
          name: userData.data.name,
          points: userData.data.points,
          points_yuan_equivalent: userData.data.points_yuan_equivalent,
        });
      }
    }
  }, [userResponse]);

  const orderMutation = usePreordersCreateOrder({
    mutation: {
      onSuccess: (response) => {
        const payload = response?.data as PreordersCreateOrder201 | PreordersCreateOrder409 | undefined;
        if (isCreateOrderSuccess(payload)) {
          setOrderSummary(payload.data);
          toast.success('預購成功，系統已送出網站通知');
          setCart([]);
          setFormState(INITIAL_FORM);
          refetch();
        }
      },
    },
  });

  /**
   * 加入購物車
   */
  const handleAddToCart = (product: PreorderCampaign['products'][0]) => {
    if (product.remainingQuantity <= 0) {
      toast.error('該商品已售罄');
      return;
    }

    const existingItem = cart.find((item) => item.productId === product.productId);
    
    if (existingItem) {
      // 如果商品已在購物車中，增加數量
      if (existingItem.quantity >= product.remainingQuantity) {
        toast.error('已達該商品最大可預購數量');
        return;
      }
      setCart((prev) =>
        prev.map((item) =>
          item.productId === product.productId
            ? { ...item, quantity: item.quantity + 1 }
            : item
        )
      );
    } else {
      // 新增商品到購物車
      setCart((prev) => [
        ...prev,
        {
          productId: product.productId,
          productName: product.productName,
          productPriceTwd: product.productPriceTwd,
          productImageUrl: product.productImageUrl,
          quantity: 1,
          remainingQuantity: product.remainingQuantity,
        },
      ]);
    }
    toast.success('已加入購物車');
  };

  /**
   * 更新購物車商品數量
   */
  const handleUpdateQuantity = (productId: number, newQuantity: number) => {
    if (newQuantity <= 0) {
      handleRemoveFromCart(productId);
      return;
    }

    const item = cart.find((item) => item.productId === productId);
    if (item && newQuantity > item.remainingQuantity) {
      toast.error('超過該商品最大可預購數量');
      return;
    }

    setCart((prev) =>
      prev.map((item) =>
        item.productId === productId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  /**
   * 從購物車移除商品
   */
  const handleRemoveFromCart = (productId: number) => {
    setCart((prev) => prev.filter((item) => item.productId !== productId));
  };

  /**
   * 計算總金額
   */
  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.productPriceTwd * item.quantity, 0);
  }, [cart]);

  // 計算點數折抵後的金額
  const pointsDiscount = useMemo(() => {
    return pointsRedeemAmount; // 點數折抵金額（元）
  }, [pointsRedeemAmount]);

  // 最終金額 = 總金額 - 點數折抵
  const finalAmount = useMemo(() => {
    return Math.max(0, totalAmount - pointsDiscount);
  }, [totalAmount, pointsDiscount]);

  const handleChange = (field: keyof PreorderFormState, value: string) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  /**
   * 處理點擊送出預購按鈕
   */
  const handleCheckoutClick = () => {
    if (cart.length === 0) {
      toast.error('請至少選擇一個商品');
      return;
    }
    setIsFormDialogOpen(true);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaign) {
      toast.error('目前無可預購檔期');
      return;
    }
    if (cart.length === 0) {
      toast.error('請至少選擇一個商品');
      return;
    }
    if (!formState.pickupDate) {
      toast.error('請選擇取貨時間');
      return;
    }

    // 驗證所有購物車商品
    for (const item of cart) {
      const product = campaign.products.find((p) => p.productId === item.productId);
      if (!product) {
        toast.error(`商品「${item.productName}」已不存在`);
        return;
      }
      if (item.quantity > product.remainingQuantity) {
        toast.error(`商品「${item.productName}」預購名額不足`);
        return;
      }
    }

    // 串接 LINE Pay API
    try {
      const apiBase = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8787';
      
      // 構建商品列表
      const items = cart.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
      }));
      
      // 計算點數折抵（20點 = 1元）
      const pointsToRedeem = pointsRedeemAmount > 0 ? pointsRedeemAmount * 20 : 0;

      // 1. 請求 LINE Pay 支付
      const paymentResponse = await fetch(`${apiBase}/api/preorders/payment/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignId: campaign.id,
          items,
          pickupDate: formState.pickupDate,
          userId: userInfo?.id, // 如果有用戶資訊，傳遞 user_id
          pointsToRedeem: pointsToRedeem > 0 ? pointsToRedeem : undefined, // 如果有折抵，傳遞點數
        }),
      });
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json().catch(() => ({}));
        console.error('支付請求失敗:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          errorData,
        });
        
        // 顯示詳細的錯誤訊息
        let errorMessage = '支付請求失敗';
        if (errorData.details && Array.isArray(errorData.details)) {
          // Zod 驗證錯誤
          const validationErrors = errorData.details.map((d: any) => `${d.field}: ${d.message}`).join(', ');
          errorMessage = `請求參數錯誤: ${validationErrors}`;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        }
        
        throw new Error(errorMessage);
      }
      
      const paymentData = await paymentResponse.json();
      
      if (!paymentData.success || !paymentData.data?.paymentUrl) {
        throw new Error('支付請求失敗：無效的回應');
      }
      
      // 2. 跳轉到 LINE Pay 支付頁面
      // 注意：LINE Pay 會在回調 URL 中添加 transactionId 和 orderId 參數
      // 不需要存儲到 sessionStorage（業界最佳實踐：只依賴 URL 參數和後端查詢）
      window.location.href = paymentData.data.paymentUrl;
      
      setIsFormDialogOpen(false);
    } catch (error) {
      const message =
        typeof error === 'object' && error !== null && 'response' in error
          ? ((error as { response?: { data?: { message?: string; code?: string } } }).response?.data?.message ??
            (error as { response?: { data?: { message?: string; code?: string } } }).response?.data?.code ??
            '支付請求失敗')
          : error instanceof Error
            ? error.message
            : '支付請求失敗';
      toast.error(message);
    }
  };

  const resetForm = () => {
    setOrderSummary(null);
    setCart([]);
    setFormState({
      pickupDate: pickupDateOptions[0]?.value || '',
    });
    setIsFormDialogOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="animate-pulse space-y-4 w-full max-w-md">
          <div className="h-8 bg-slate-200 rounded w-1/3" />
          <div className="h-48 bg-slate-100 rounded" />
        </div>
      </div>
    );
  }

  // 顯示空狀態：只有在加載完成且確實沒有數據時才顯示
  if (!isLoading && !campaign) {
    // 判斷是真實的 404（沒有檔期）還是其他錯誤
    const isReal404 = campaignResponse?.status === 404 || 
                     (campaignPayload && 'code' in campaignPayload && campaignPayload.code === 'PREORDER_INACTIVE');
    const isNetworkError = isError && error && (
      error instanceof TypeError || 
      (error instanceof Error && (
        error.message.includes('fetch') || 
        error.message.includes('network') || 
        error.message.includes('Load failed') ||
        error.message.includes('Failed to fetch')
      ))
    );
    
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white rounded-2xl shadow p-6 text-center space-y-4 max-w-md w-full">
          <p className="text-4xl">🥐</p>
          <h1 className="text-xl font-bold text-gray-900">目前沒有預購檔期</h1>
          <p className="text-sm text-gray-600">請稍後再回來看看，或加入官方 LINE 以獲得最新通知。</p>
          
          {/* 顯示網絡錯誤 */}
          {isNetworkError && (
            <div className="text-xs text-red-600 mt-2 space-y-1">
              <p className="font-semibold">⚠️ 連線錯誤：</p>
              <p>
                {error instanceof Error ? error.message : String(error)}
              </p>
              <p className="text-gray-500 mt-1">
                API URL: {import.meta.env.VITE_API_BASE_URL || '未設定'}
              </p>
            </div>
          )}
          
          {/* 顯示其他錯誤 */}
          {isError && error && !isNetworkError && !isReal404 && (
            <div className="text-xs text-red-600 mt-2 space-y-1">
              <p className="font-semibold">錯誤：</p>
              <p>
                {error instanceof Error 
                  ? error.message 
                  : typeof error === 'object' && error !== null
                    ? JSON.stringify(error, null, 2)
                    : String(error)
                }
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // 如果還在加載中或沒有 campaign，不渲染內容（由上面的條件處理）
  if (isLoading || !campaign) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white pb-20">
      {/* 檔期資訊 */}
      <div className="bg-white shadow-sm sticky top-0 z-10 px-4 py-3 border-b border-gray-200">
        <p className="text-xs text-blue-600 font-semibold">官方預購檔期</p>
        <h1 className="text-xl font-bold text-gray-900 mt-1">{campaign.campaignName}</h1>
        <p className="text-sm text-gray-600 mt-1 line-clamp-2">{campaign.campaignCopy}</p>
        <p className="text-xs text-gray-500 mt-2">
          {campaign.startsAtTaipei.split(' ')[0]} 至 {campaign.endsAtTaipei.split(' ')[0]}
        </p>
      </div>

      {orderSummary ? (
        /* 訂單成功頁面 */
        <div className="px-4 py-6">
          <div className="bg-white rounded-2xl shadow-lg p-6 text-center space-y-4 max-w-md mx-auto">
            <div className="text-green-600 text-5xl">✓</div>
            <h2 className="text-xl font-bold text-gray-900">預購成功</h2>
            <p className="text-sm text-gray-600">系統已同步網站通知，請保留以下資訊以利取貨。</p>
            <div className="bg-gray-50 rounded-xl p-4 space-y-2 text-sm">
              <p>訂單編號：<span className="font-semibold">{orderSummary.orderNumber}</span></p>
              <p>預購數量：{orderSummary.quantity}</p>
              <p>應付金額：NT${orderSummary.totalTwd}</p>
            </div>
            <button
              type="button"
              onClick={resetForm}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors"
            >
              再預購一筆
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* 商品列表 */}
          <div className="px-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              {campaign.products.map((product) => {
                const cartItem = cart.find((item) => item.productId === product.productId);
                const isOutOfStock = product.remainingQuantity <= 0;
                
                return (
                  <div
                    key={product.productId}
                    onClick={() => !isOutOfStock && handleAddToCart(product)}
                    className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 ${
                      isOutOfStock
                        ? 'opacity-50 cursor-not-allowed'
                        : 'cursor-pointer hover:shadow-lg active:scale-95'
                    }`}
                  >
                    {/* 商品圖片 */}
                    <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                      {product.productImageUrl ? (
                        <img
                          src={product.productImageUrl}
                          alt={product.productName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                          <svg className="w-12 h-12 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      {cartItem && (
                        <div className="absolute top-2 right-2 bg-blue-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                          {cartItem.quantity}
                        </div>
                      )}
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <span className="text-white text-sm font-semibold">已售罄</span>
                        </div>
                      )}
                    </div>

                    {/* 商品資訊 */}
                    <div className="p-3">
                      <h3 className="text-sm font-semibold text-gray-900 mb-1 line-clamp-2">
                        {product.productName}
                      </h3>
                      <p className="text-base font-bold text-blue-600 mb-1">NT${product.productPriceTwd}</p>
                      <p className="text-xs text-gray-500">
                        剩餘：{product.remainingQuantity}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* 購物車 */}
          {cart.length > 0 && (
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-20">
              <div className="px-4 py-3 max-h-64 overflow-y-auto">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">購物車 ({cart.length} 項)</h3>
                <div className="space-y-2">
                  {cart.map((item) => (
                    <div key={item.productId} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                      {item.productImageUrl && (
                        <img
                          src={item.productImageUrl}
                          alt={item.productName}
                          className="w-12 h-12 object-cover rounded"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.productName}</p>
                        <p className="text-xs text-gray-600">NT${item.productPriceTwd}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(item.productId, item.quantity - 1);
                          }}
                          className="w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleUpdateQuantity(item.productId, item.quantity + 1);
                          }}
                          className="w-7 h-7 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full flex items-center justify-center text-sm"
                          disabled={item.quantity >= item.remainingQuantity}
                        >
                          +
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleRemoveFromCart(item.productId);
                          }}
                          className="w-6 h-6 text-red-500 hover:text-red-700"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between gap-3 mt-3 pt-3 border-t border-gray-200">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-semibold text-gray-900">
                      {pointsRedeemAmount > 0 ? '應付' : '總計'}
                    </span>
                    <span className="text-lg font-bold text-blue-600">
                      NT${pointsRedeemAmount > 0 ? finalAmount : totalAmount}
                    </span>
                    {pointsRedeemAmount > 0 && (
                      <span className="text-xs text-gray-500 line-through">
                        NT${totalAmount}
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={handleCheckoutClick}
                    disabled={cart.length === 0}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors text-sm whitespace-nowrap"
                  >
                    送出預購
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* 表單對話框 */}
          {isFormDialogOpen && (
            <div className="fixed inset-0 bg-black/50 z-30 flex items-end md:items-center justify-center">
              <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-xl w-full max-w-md">
                <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                  <h2 className="text-lg font-bold text-gray-900">選擇取貨時間</h2>
                  <button
                    type="button"
                    onClick={() => setIsFormDialogOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={handleSubmit} className="p-4 space-y-4">
                  {/* 取貨時間 */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">取貨時間</label>
                    <div className="relative">
                      <select
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-base focus:border-blue-500 focus:ring-2 focus:ring-blue-200 appearance-none bg-white"
                        value={formState.pickupDate}
                        onChange={(event) => handleChange('pickupDate', event.target.value)}
                        required
                      >
                        {pickupDateOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                      <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>
                  </div>

                  {/* 點數折抵（僅在有用戶資訊且有點數時顯示） */}
                  {userInfo && userInfo.points > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h3 className="text-sm font-medium text-gray-900 mb-3">點數折抵</h3>
                      <div className="space-y-3">
                        <div className="flex items-center space-x-3">
                          <span className="text-gray-600">$</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={pointsRedeemAmount || ''}
                            onChange={(e) => {
                              const value = e.target.value.replace(/[^0-9]/g, ''); // 只允許數字
                              const numValue = value ? parseInt(value) : 0;
                              const maxAmount = Math.min(userInfo.points_yuan_equivalent, totalAmount); // 最大可折抵金額（不能超過總金額）
                              setPointsRedeemAmount(Math.min(numValue, maxAmount));
                            }}
                            placeholder="輸入要折抵的金額"
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 text-center text-lg font-semibold"
                          />
                          <span className="text-gray-600">元</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">使用點數：</span>
                          <span className="font-medium text-purple-600">{pointsRedeemAmount * 20} 點</span>
                        </div>
                        <div className="text-xs text-gray-500">
                          * 1元 = 20點，最多可折抵 ${Math.min(userInfo.points_yuan_equivalent, totalAmount)} 元（{userInfo.points} 點）
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 金額摘要 */}
                  <div className="border-t border-gray-200 pt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">商品總額</span>
                      <span className="text-gray-900">NT${totalAmount}</span>
                    </div>
                    {pointsRedeemAmount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">點數折抵</span>
                        <span className="text-purple-600">-NT${pointsDiscount}</span>
                      </div>
                    )}
                    <div className="flex justify-between text-base font-bold border-t border-gray-200 pt-2">
                      <span className="text-gray-900">應付金額</span>
                      <span className="text-blue-600">NT${finalAmount}</span>
                    </div>
                  </div>

                  {/* 按鈕 */}
                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={() => {
                        setIsFormDialogOpen(false);
                        setPointsRedeemAmount(0); // 重置點數折抵
                      }}
                      className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors"
                    >
                      取消
                    </button>
                    <button
                      type="submit"
                      disabled={orderMutation.isPending || finalAmount <= 0}
                      className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                      {orderMutation.isPending ? '送出中...' : 'LINE PAY結帳'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
