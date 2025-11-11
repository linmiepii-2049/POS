/**
 * 確認對話框組件
 * 顯示訂單確認資訊、會員查詢
 * Note: 優惠券功能已隱藏 (2024-11-11) - May be restored in the future
 */

import { useState, useEffect, useCallback, useRef, useImperativeHandle, forwardRef } from 'react';
import { useCart } from '../hooks/useCart';
import { CartItem } from '../store/cart.tsx';
import { formatMoney, calculateDiscountedAmount } from '../utils/money';
import { useUsersGetByPhone, useUsersGetByLineId } from '../api/posClient';
import { Html5Qrcode } from 'html5-qrcode';
import toast from 'react-hot-toast';
// Coupon feature hidden - 優惠券功能已隱藏 (2024-11-11)
// import { useUsersGetAvailableCoupons } from '../api/posClient';

/**
 * 優惠券介面 (Hidden - may be restored)
 */
/* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11)
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
*/

/**
 * 確認對話框 Props
 */
export interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (orderData: {
    items: CartItem[];
    userId?: number;
    // couponIds: number[]; // Coupon feature hidden
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
  const [searchType, setSearchType] = useState<'phone' | 'lineId'>('phone'); // 查詢類型
  const [phoneNumber, setPhoneNumber] = useState('');
  const [lineId, setLineId] = useState('');
  const [redeemAmount, setRedeemAmount] = useState(0); // 要折抵的金額（元）
  const [isScanning, setIsScanning] = useState(false); // QR code 掃描狀態
  const scannerRef = useRef<Html5Qrcode | null>(null); // QR code 掃描器實例
  // Coupon feature hidden - 優惠券功能已隱藏 (2024-11-11)
  // const [selectedCoupons, setSelectedCoupons] = useState<number[]>([]);
  // const [availableCoupons, setAvailableCoupons] = useState<AvailableCoupon[]>([]);
  const [userData, setUserData] = useState<any>(null);
  
  // 查詢會員（手機號碼）
  const { data: userQueryData, refetch: refetchUser } = useUsersGetByPhone(
    { phone: phoneNumber },
    { query: { enabled: false } }
  );

  // 查詢會員（LINE ID）
  const { data: lineIdQueryData, refetch: refetchLineIdUser } = useUsersGetByLineId(
    lineId || 'dummy',
    { query: { enabled: false } }
  );
  
  /* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11)
  // 查詢可用優惠券
  const { data: couponsData, refetch: refetchCoupons } = useUsersGetAvailableCoupons(
    userData?.data?.data?.id || 0,
    { order_amount: Math.round(state.totalAmount) }, // 使用元
    { query: { enabled: false } }
  );
  */

  /**
   * 查詢會員
   */
  const handleSearchUser = useCallback(async () => {
    if (searchType === 'phone') {
      if (!phoneNumber.trim()) return;
      
      try {
        console.log('開始查詢會員（手機）:', phoneNumber);
        const userResult = await refetchUser();
        console.log('會員查詢結果:', userResult.data);
        
        if (userResult.data?.data?.data) {
          // 正確設置 userData，包含完整的 API 回應結構
          setUserData(userResult.data);
          setRedeemAmount(0); // 重置點數折抵
          console.log('設置 userData:', userResult.data);
        } else {
          setUserData(null);
          console.log('未找到會員資料');
        }
      } catch (error) {
        console.error('查詢會員失敗:', error);
        setUserData(null);
      }
    } else {
      // LINE ID 查詢
      if (!lineId.trim()) return;
      
      try {
        console.log('開始查詢會員（LINE ID）:', lineId);
        const userResult = await refetchLineIdUser();
        console.log('LINE ID 查詢結果:', userResult.data);
        
        if (userResult.data?.data?.data) {
          setUserData(userResult.data);
          setRedeemAmount(0); // 重置點數折抵
          console.log('設置 LINE ID userData:', userResult.data);
        } else {
          setUserData(null);
          console.log('未找到 LINE ID 會員資料');
        }
      } catch (error) {
        console.error('LINE ID 查詢會員失敗:', error);
        setUserData(null);
      }
    }
  }, [searchType, phoneNumber, lineId, refetchUser, refetchLineIdUser]);

  // 自動偵測 LINE ID 輸入（當有輸入時自動查詢）
  useEffect(() => {
    if (searchType === 'lineId' && lineId.trim().length > 0) {
      console.log('LINE ID 輸入變化，自動查詢:', lineId);
      const timer = setTimeout(() => {
        handleSearchUser();
      }, 500); // 延遲 500ms 以避免頻繁查詢
      
      return () => clearTimeout(timer);
    }
  }, [lineId, searchType, handleSearchUser]);

  /**
   * 開始 QR code 掃描
   */
  const startScanning = async () => {
    try {
      setIsScanning(true);
      
      // 創建掃描器實例
      const scanner = new Html5Qrcode('qr-reader');
      scannerRef.current = scanner;
      
      // 開始掃描（使用後置鏡頭）
      await scanner.start(
        { facingMode: 'environment' }, // 使用後置鏡頭
        {
          fps: 10, // 每秒掃描 10 次
          qrbox: { width: 250, height: 250 }, // 掃描框大小
        },
        (decodedText) => {
          // 掃描成功
          console.log('QR code 解析成功:', decodedText);
          setLineId(decodedText);
          toast.success('QR code 掃描成功');
          stopScanning(); // 自動停止掃描
        },
        (errorMessage) => {
          // 掃描中的錯誤（持續掃描中）
          // 不顯示錯誤，因為會頻繁觸發
        }
      );
    } catch (error: any) {
      console.error('無法啟動相機:', error);
      setIsScanning(false);
      
      // 提供更詳細的錯誤訊息
      const errorMsg = error?.message || error?.toString() || '';
      
      if (errorMsg.includes('Permission') || errorMsg.includes('NotAllowedError')) {
        toast.error(
          '相機權限被拒絕\n\n請至手機設定 → Safari → 相機，允許存取相機',
          { duration: 6000 }
        );
      } else if (errorMsg.includes('NotFoundError')) {
        toast.error('找不到相機設備');
      } else if (errorMsg.includes('NotReadableError')) {
        toast.error('相機正在被其他應用程式使用');
      } else {
        toast.error('無法啟動相機，請檢查權限設定或稍後再試');
      }
    }
  };

  /**
   * 停止 QR code 掃描
   */
  const stopScanning = async () => {
    try {
      if (scannerRef.current) {
        await scannerRef.current.stop();
        scannerRef.current.clear();
        scannerRef.current = null;
      }
    } catch (error) {
      console.error('停止掃描時發生錯誤:', error);
    } finally {
      setIsScanning(false);
    }
  };

  /**
   * 組件卸載時清理掃描器
   */
  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  /* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11)
  // 當 userData 變化時，自動查詢優惠券
  useEffect(() => {
    if (userData?.data?.data?.id) {
      console.log('userData 變化，查詢優惠券:', userData.data.data);
      refetchCoupons();
    }
  }, [userData, refetchCoupons]);
  */

  // 自動偵測手機號碼輸入
  useEffect(() => {
    if (searchType === 'phone' && phoneNumber.length === 10 && /^09\d{8}$/.test(phoneNumber)) {
      console.log('自動偵測到10位手機號碼，開始查詢:', phoneNumber);
      handleSearchUser();
    }
  }, [phoneNumber, searchType, handleSearchUser]);

  // 暴露重置函數給父組件
  useImperativeHandle(ref, () => ({
    resetForm
  }), []);

  /* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11)
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
  */

  /**
   * 重置表單
   */
  const resetForm = () => {
    setPhoneNumber('');
    setLineId('');
    setRedeemAmount(0);
    setSearchType('phone');
    // setSelectedCoupons([]); // Coupon feature hidden
    // setAvailableCoupons([]); // Coupon feature hidden
    setUserData(null);
    
    // 如果正在掃描，停止掃描
    if (isScanning) {
      stopScanning();
    }
  };

  /**
   * 關閉對話框
   */
  const handleClose = () => {
    // 只清空選中的優惠券，保留會員查詢結果
    // setSelectedCoupons([]); // Coupon feature hidden
    setRedeemAmount(0); // 重置點數折抵
    
    // 如果正在掃描，停止掃描
    if (isScanning) {
      stopScanning();
    }
    
    onClose();
  };

  /* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11)
  // 切換優惠券選擇
  const toggleCoupon = (couponId: number) => {
    setSelectedCoupons(prev => 
      prev.includes(couponId)
        ? prev.filter(id => id !== couponId)
        : [...prev, couponId]
    );
  };

  // 計算優惠金額
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
  */

  /**
   * 計算最終金額（包含點數折抵）
   */
  // const discountAmount = calculateDiscount(); // Coupon feature hidden
  const pointsDiscount = redeemAmount; // 直接使用輸入的折抵金額
  const pointsToRedeem = redeemAmount * 20; // 金額轉換為點數（1元 = 20點）
  const discountAmount = pointsDiscount;
  const finalAmount = calculateDiscountedAmount(state.totalAmount, discountAmount);

  /**
   * 確認訂單
   */
  const handleConfirm = () => {
    onConfirm({
      items: state.items,
      userId: userData?.data?.data?.id,
      // couponCodeId: selectedCoupons.length > 0 ? selectedCoupons[0] : undefined, // Coupon feature hidden
      pointsToRedeem: pointsToRedeem,
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
            
            {/* 查詢類型切換 */}
            <div className="flex space-x-2 mb-3">
              <button
                onClick={() => {
                  if (isScanning) stopScanning();
                  setSearchType('phone');
                  setUserData(null);
                  setRedeemAmount(0);
                }}
                className={`px-4 py-2 rounded-md ${
                  searchType === 'phone'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
                disabled={isScanning}
              >
                手機號碼
              </button>
              <button
                onClick={() => {
                  if (isScanning) stopScanning();
                  setSearchType('lineId');
                  setUserData(null);
                  setRedeemAmount(0);
                }}
                className={`px-4 py-2 rounded-md ${
                  searchType === 'lineId'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                LINE ID（可用點數）
              </button>
            </div>

            <div className="flex space-x-2">
              {searchType === 'phone' ? (
                <>
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
                </>
              ) : (
                <>
                  <input
                    type="text"
                    value={lineId}
                    onChange={(e) => setLineId(e.target.value)}
                    placeholder="請輸入 LINE ID"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isScanning}
                  />
                  <button
                    onClick={isScanning ? stopScanning : startScanning}
                    className={`px-4 py-2 text-white rounded-md focus:outline-none focus:ring-2 flex items-center space-x-2 ${
                      isScanning 
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                        : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'
                    }`}
                    title={isScanning ? '停止掃描' : '掃描 QR Code'}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {isScanning ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                      )}
                    </svg>
                    <span>{isScanning ? '停止' : '掃描'}</span>
                  </button>
                  <button
                    onClick={handleSearchUser}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isScanning}
                  >
                    查詢
                  </button>
                </>
              )}
            </div>

            {/* QR code 掃描器容器 */}
            {isScanning && (
              <div className="mt-4 p-4 bg-gray-900 rounded-lg">
                <div className="mb-2 text-center">
                  <p className="text-white text-sm font-medium">請將 QR code 對準掃描框</p>
                </div>
                <div id="qr-reader" className="rounded-lg overflow-hidden"></div>
              </div>
            )}
            
            {userData?.data?.data && (
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
                    {/* 顯示點數信息（所有會員都顯示） */}
                    {userData.data.data.points !== undefined && (
                      <div className="mt-2 flex items-center space-x-2">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                          </svg>
                          {userData.data.data.points} 點數（可折抵 ${userData.data.data.points_yuan_equivalent}）
                        </span>
                        {/* 電話查詢時提示 */}
                        {searchType === 'phone' && (
                          <span className="text-xs text-gray-500">
                            （使用 LINE ID 查詢可折抵點數）
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
            
          </div>

          {/* 點數折抵（僅 LINE ID 查詢且有點數時顯示） */}
          {searchType === 'lineId' && userData?.data?.data && userData.data.data.points > 0 && (
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">點數折抵</h3>
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <span className="text-gray-600">$</span>
                  <input
                    type="number"
                    value={redeemAmount}
                    onChange={(e) => {
                      const value = Math.max(0, parseInt(e.target.value) || 0);
                      const maxAmount = userData.data.data.points_yuan_equivalent; // 最大可折抵金額
                      setRedeemAmount(Math.min(value, maxAmount));
                    }}
                    placeholder="輸入要折抵的金額"
                    step="1"
                    min="0"
                    max={userData.data.data.points_yuan_equivalent}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500"
                  />
                  <span className="text-gray-600">元</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">使用點數：</span>
                  <span className="font-medium text-purple-600">{redeemAmount * 20} 點</span>
                </div>
                <div className="text-xs text-gray-500">
                  * 1元 = 20點，最多可折抵 ${userData.data.data.points_yuan_equivalent}（{userData.data.data.points} 點）
                </div>
              </div>
            </div>
          )}

          {/* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11) - May be restored in the future
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
          */}

          {/* 金額計算 */}
          <div className="bg-gray-50 p-4 rounded-md">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">訂單金額</span>
                <span className="text-gray-900">{formatMoney(state.totalAmount)}</span>
              </div>
              {redeemAmount > 0 && (
                <div className="flex justify-between text-purple-600">
                  <span>點數折抵（{redeemAmount * 20}點）</span>
                  <span>-{formatMoney(redeemAmount)}</span>
                </div>
              )}
              {/* COUPON FEATURE HIDDEN - 優惠券功能已隱藏 (2024-11-11)
              {discountAmount > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">優惠折扣</span>
                  <span className="text-red-600">-{formatMoney(discountAmount)}</span>
                </div>
              )}
              */}
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
