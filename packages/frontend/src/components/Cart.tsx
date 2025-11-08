/**
 * 購物車組件
 * 顯示購物車內容並提供數量調整和刪除功能
 */

import { useCart } from '../hooks/useCart';
import { formatMoney } from '../utils/money';

/**
 * 購物車 Props
 */
export interface CartProps {
  onCheckout?: () => void;
  className?: string;
}

/**
 * 購物車組件
 */
export function Cart({ onCheckout, className = '' }: CartProps) {
  const { state, updateQuantity, removeItem } = useCart();

  /**
   * 處理數量變更
   */
  const handleQuantityChange = (id: number, newQuantity: number) => {
    updateQuantity(id, newQuantity);
  };

  /**
   * 處理刪除商品
   */
  const handleRemoveItem = (id: number) => {
    removeItem(id);
  };

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* 購物車標題 */}
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-xl font-semibold text-gray-900">
          購物車 ({state.itemCount} 項)
        </h2>
      </div>

      {/* 購物車內容 */}
      <div className="p-4">
        {state.items.length === 0 ? (
          <div className="text-center py-8">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5 6m0 0h9.5" />
            </svg>
            <p className="text-gray-500">購物車是空的</p>
            <p className="text-sm text-gray-400">請選擇商品加入購物車</p>
          </div>
        ) : (
          <>
            {/* 商品列表 */}
            <div className="space-y-3 mb-4 max-h-96 overflow-y-auto">
              {state.items.map((item) => (
                <div key={item.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  {/* 商品圖片 */}
                  <div className="w-12 h-12 bg-gray-200 rounded-md flex-shrink-0 flex items-center justify-center">
                    {item.thumbnail ? (
                      <img
                        src={item.thumbnail}
                        alt={item.name}
                        className="w-full h-full object-cover rounded-md"
                      />
                    ) : (
                      <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>

                  {/* 商品資訊 */}
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-medium text-gray-900 truncate">
                      {item.name}
                    </h4>
                    <p className="text-sm text-gray-600">
                      {formatMoney(item.price)}
                    </p>
                  </div>

                  {/* 數量控制 */}
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity - 1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                      disabled={item.quantity <= 1}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                      </svg>
                    </button>
                    
                    <span className="w-8 text-center text-sm font-medium">
                      {item.quantity}
                    </span>
                    
                    <button
                      onClick={() => handleQuantityChange(item.id, item.quantity + 1)}
                      className="w-8 h-8 bg-gray-200 hover:bg-gray-300 text-gray-600 rounded-full flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </button>
                  </div>

                  {/* 小計和刪除按鈕 */}
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-900 min-w-0">
                      {formatMoney(item.price * item.quantity)}
                    </span>
                    
                    <button
                      onClick={() => handleRemoveItem(item.id)}
                      className="w-6 h-6 text-red-500 hover:text-red-700 transition-colors"
                      title="刪除商品"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* 總計 */}
            <div className="border-t border-gray-200 pt-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold text-gray-900">總計</span>
                <span className="text-xl font-bold text-green-600">
                  {formatMoney(state.totalAmount)}
                </span>
              </div>

              {/* 結帳按鈕 */}
              <button
                onClick={onCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed"
                disabled={state.items.length === 0}
              >
                確認結帳
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
