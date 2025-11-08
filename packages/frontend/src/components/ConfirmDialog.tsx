/**
 * 確認對話框組件
 * 顯示訂單確認資訊、會員查詢、優惠券選擇
 */

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../store/cart.tsx';
import { formatMoney, calculateDiscountedAmount } from '../utils/money';
import { useUsersGetByPhone, useUsersGetAvailableCoupons } from '../api/posClient';

/**
 * 優惠券介面
 */
export interface AvailableCoupon {
  id: number;
  name: string;
  description: string;
  discountType: 'fixed' | 'percentage';
  discountValue: number;
  minOrderAmount?: number;
  isAvailable: boolean;
  reason?: string;
}

/**
 * 確認對話框 Props
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderData: {
    items: CartItem[];
    userId?: number;
    couponIds: number[];
    totalAmount: number;
    finalAmount: number;
  }) => void;
  onReset?: () => void; // 新增重置回調函數
}

/**
 * 確認對話框組件
 */
export const ConfirmDialog = forwardRef<any, ConfirmDialogProps>(({ isOpen, onClose, onConfirm }, ref) => {
  const { state } = useCart();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCoupons, setSelectedCoupons] = useState<number[]>([]);
  const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [userData, setUserData] = useState<any>(null);
  
  // 查詢會員
  const { data: userQueryData, refetch: refetchUser } = useUsersGetByPhone(
    { phone: phoneNumber },
    { query: { enabled: false } }
  );
  
  // 查詢可用優惠券
  const { data: couponsData, refetch: refetchCoupons } = useUsersGetAvailableCoupons(
    userData?.data?.data?.id || 0,
    { order_amount: Math.round(state.totalAmount) }, // 使用元
    { query: { enabled: false } }
  );

  /**
   * 查詢會員
   */
  const handleSearchUser = useCallback(async () => {
    if (!phoneNumber.trim()) return;
    
    try {
      console.log('開始查詢會員:', phoneNumber);
      const userResult = await refetchUser();
      console.log('會員查詢結果:', userResult.data);
      
      if (userResult.data?.data?.data) {
        // 正確設置 userData，包含完整的 API 回應結構
        setUserData(userResult.data);
        console.log('設置 userData:', userResult.data);
        console.log('userData.data.data.name:', userResult.data.data.data.name);
      } else {
        setUserData(null);
        console.log('未找到會員資料');
      }
    } catch (error) {
      console.error('查詢會員失敗:', error);
      setUserData(null);
    }
  }, [phoneNumber, refetchUser]);

  // 當 userData 變化時，自動查詢優惠券
  useEffect(() => {
    if (userData?.data?.data?.id) {
      console.log('userData 變化，查詢優惠券:', userData.data.data);
      refetchCoupons();
    }
  }, [userData, refetchCoupons]);

  // 自動偵測手機號碼輸入
  useEffect(() => {
    if (phoneNumber.length === 10 && /^09\d{8}$/.test(phoneNumber)) {
      console.log('自動偵測到10位手機號碼，開始查詢:', phoneNumber);
      handleSearchUser();
    }
  }, [phoneNumber, handleSearchUser]);

  // 暴露重置函數給父組件
  useImperativeHandle(ref, () => ({
    resetForm
  }), []);

  // 當優惠券數據變化時，轉換並設置到狀態
  useEffect(() => {
    if (couponsData?.data?.data) {
      console.log('優惠券數據變化:', couponsData.data);
      // 轉換優惠券格式並檢查可用性
      const coupons: AvailableCoupon[] = couponsData.data.data.map((coupon: Record<string, unknown>) => {
        const minOrderAmount = typeof coupon.min_order_twd === 'number' ? coupon.min_order_twd : 0;
        const isAvailable = coupon.isUsable === true;
        const discountType = coupon.discount_type === 'FIXED' ? 'fixed' : 'percentage';
        const discountValue = discountType === 'fixed' 
          ? (typeof coupon.amount_off_twd === 'number' ? coupon.amount_off_twd : 0)
          : (typeof coupon.percent_off_bps === 'number' ? coupon.percent_off_bps / 100 : 0);
        
        return {
          id: typeof coupon.coupon_code_id === 'number' ? coupon.coupon_code_id : 0,
          name: typeof coupon.coupon_name === 'string' ? coupon.coupon_name : '',
          description: `${coupon.coupon_code} - ${coupon.coupon_name}`,
          discountType: discountType as 'fixed' | 'percentage',
          discountValue,
          minOrderAmount,
          isAvailable,
          reason: !isAvailable ? (typeof coupon.reason === 'string' ? coupon.reason : `最低消費 ${formatMoney(minOrderAmount)}`) : undefined,
        };
      });
      setAvailableCoupons(coupons);
    }
  }, [couponsData?.data]);

  /**
   * 重置表單
   */
  const resetForm = () => {
    setPhoneNumber('');
    setSelectedCoupons([]);
    setAvailableCoupons([]);
    setUserData(null);
  };

  /**
   * 關閉對話框
   */
  const handleClose = () => {
    // 只清空選中的優惠券，保留會員查詢結果
    setSelectedCoupons([]);
    onClose();
  };

  /**
   * 切換優惠券選擇
   */
  const toggleCoupon = (couponId: number) => {
    setSelectedCoupons(prev => 
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  /**
   * 計算優惠金額
   */
  const calculateDiscount = () => {
    let totalDiscount = 0;
    
    selectedCoupons.forEach(couponId => {
      const coupon = availableCoupons.find(c => c.id === couponId);
      if (coupon && coupon.isAvailable) {
        if (coupon.discountType === 'fixed') {
          totalDiscount += coupon.discountValue;
        } else if (coupon.discountType === 'percentage') {
          totalDiscount += state.totalAmount * (coupon.discountValue / 100);
        }
      }
    });
    
    return Math.min(totalDiscount, state.totalAmount);
  };

  /**
   * 計算最終金額
   */
  const discountAmount = calculateDiscount();
  const finalAmount = calculateDiscountedAmount(state.totalAmount, discountAmount);

  /**
   * 確認訂單
   */
  const handleConfirm = () => {
    onConfirm({
      items: state.items,
      userId: userData?.data?.data?.id,
      couponCodeId: selectedCoupons.length > 0 ? selectedCoupons[0] : undefined, // 只傳遞第一個選中的優惠券代碼 ID
      totalAmount: finalAmount, // 使用折扣後的最終金額
      finalAmount,
    });
    handleClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* 標題 */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">確認訂單</h2>
        </div>

        <div className="p-6 space-y-6">
          {/* 商品清單 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">商品清單</h3>
            <div className="space-y-2">
              {state.items.map((item) => (
                <div key={item.id} className="flex justify-between items-center py-2 border-b border-gray-100">
                  <div className="flex-1">
                    <span className="text-gray-900">{item.name}</span>
                    <span className="text-gray-500 ml-2">x{item.quantity}</span>
                  </div>
                  <span className="text-gray-900 font-medium">
                    {formatMoney(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex justify-between items-center mt-3 pt-3 border-t border-gray-200">
              <span className="text-lg font-semibold text-gray-900">小計</span>
              <span className="text-lg font-semibold text-gray-900">
                {formatMoney(state.totalAmount)}
              </span>
            </div>
          </div>

          {/* 會員查詢 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-3">會員查詢</h3>
            <div className="flex space-x-3">
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="請輸入手機號碼"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleSearchUser}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                查詢
              </button>
            </div>
            
            {userData?.data && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg shadow-sm">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                  </div>
                  <div className="flex-1">
                    <h4 className="text-lg font-semibold text-green-800">
                      很高興看到你, {userData.data.data.name}
                    </h4>
                    {availableCoupons.length > 0 && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                          </svg>
                          {availableCoupons.length} 張優惠券
                        </span>
                        {availableCoupons.filter(c => c.isAvailable).length > 0 && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {availableCoupons.filter(c => c.isAvailable).length} 張可用
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* 優惠券選擇 */}
          {availableCoupons.length > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">優惠券</h3>
              <div className="space-y-2">
                {availableCoupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className={`flex items-center space-x-3 p-3 border rounded-md transition-colors cursor-pointer ${
                      coupon.isAvailable
                        ? selectedCoupons.includes(coupon.id)
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                        : 'border-gray-200 bg-gray-50 opacity-60'
                    }`}
                    onClick={() => coupon.isAvailable && toggleCoupon(coupon.id)}
                  >
                    {coupon.isAvailable && (
                      <input
                        type="checkbox"
                        checked={selectedCoupons.includes(coupon.id)}
                        onChange={() => toggleCoupon(coupon.id)}
                        className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    )}
                    {!coupon.isAvailable && (
                      <div className="w-4 h-4 border border-gray-300 rounded bg-gray-100"></div>
                    )}
                    <div className="flex-1">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-gray-900">
                            {coupon.name}
                          </p>
                          <p className="text-sm text-gray-600">
                            {coupon.description}
                          </p>
                          {!coupon.isAvailable && coupon.reason && (
                            <p className="text-xs text-red-500 mt-1">
                              {coupon.reason}
                            </p>
                          )}
                        </div>
                        <span className={`text-sm font-medium ${
                          coupon.isAvailable ? 'text-green-600' : 'text-gray-400'
                        }`}>
                          {coupon.discountType === 'fixed' 
                            ? formatMoney(coupon.discountValue)
                            : `${coupon.discountValue}%`
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 金額計算 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">優惠前金額</span>
                <span className="text-gray-900">{formatMoney(state.totalAmount)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">優惠折扣</span>
                  <span className="text-red-600">-{formatMoney(discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                <span className="text-lg font-semibold text-gray-900">最終金額</span>
                <span className="text-xl font-bold text-green-600">
                  {formatMoney(finalAmount)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 按鈕 */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={handleClose}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
          >
            取消
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            確認訂單
          </button>
        </div>
      </div>
    </div>
  );
});
