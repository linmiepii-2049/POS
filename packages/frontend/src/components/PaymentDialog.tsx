/**
 * 付款對話框組件
 * 處理現金付款和手機支付
 */

import { useState } from 'react';
import { formatMoney, calculateChange } from '../utils/money';
import { QRCode } from './QRCode';

/**
 * 付款方式
 */
export type PaymentMethod = 'cash' | 'mobile';

/**
 * 付款對話框 Props
 */
export interface PaymentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onPaymentComplete: (paymentData: {
    method: PaymentMethod;
    paidAmount: number;
    changeAmount?: number;
  }) => void;
  totalAmount: number;
  qrCodeImageUrl?: string; // 自定義 QR Code 圖片 URL
}

/**
 * 付款對話框組件
 */
export function PaymentDialog({ 
  isOpen, 
  onClose, 
  onPaymentComplete, 
  totalAmount,
  qrCodeImageUrl
}: PaymentDialogProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash');
  const [cashAmount, setCashAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  /**
   * 重置表單
   */
  const resetForm = () => {
    setPaymentMethod('cash');
    setCashAmount('');
    setIsProcessing(false);
  };

  /**
   * 關閉對話框
   */
  const handleClose = () => {
    resetForm();
    onClose();
  };

  /**
   * 處理付款完成
   */
  const handlePaymentComplete = async () => {
    setIsProcessing(true);
    
    try {
      if (paymentMethod === 'cash') {
        const paidAmount = parseFloat(cashAmount) || 0;
        const changeAmount = calculateChange(paidAmount, totalAmount);
        
        if (paidAmount < totalAmount) {
          alert(`付款金額不足，還需要 ${formatMoney(totalAmount - paidAmount)}`);
          setIsProcessing(false);
          return;
        }
        
        onPaymentComplete({
          method: 'cash',
          paidAmount,
          changeAmount,
        });
      } else {
        // 手機支付 - 模擬處理時間
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        onPaymentComplete({
          method: 'mobile',
          paidAmount: totalAmount,
        });
      }
    } catch (error) {
      console.error('付款處理失敗:', error);
      alert('付款處理失敗，請重試');
    } finally {
      setIsProcessing(false);
    }
  };


  /**
   * 計算找零
   */
  const paidAmount = parseFloat(cashAmount) || 0;
  const changeAmount = calculateChange(paidAmount, totalAmount);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        {/* 標題 */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">付款</h2>
          <p className="text-sm text-gray-600 mt-1">
            應付金額：<span className="font-semibold text-green-600">{formatMoney(totalAmount)}</span>
          </p>
        </div>

        <div className="p-6">
          {/* 付款方式選擇 */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">選擇付款方式</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setPaymentMethod('cash')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'cash'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <p className="font-medium">現金</p>
              </button>
              
              <button
                onClick={() => setPaymentMethod('mobile')}
                className={`p-4 border-2 rounded-lg text-center transition-colors ${
                  paymentMethod === 'mobile'
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <svg className="w-8 h-8 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
                <p className="font-medium">手機支付</p>
              </button>
            </div>
          </div>

          {/* 現金付款 */}
          {paymentMethod === 'cash' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  收款金額
                </label>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    value={cashAmount}
                    onChange={(e) => setCashAmount(e.target.value)}
                    placeholder="請輸入收款金額"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    min="0"
                    step="1"
                  />
                  <span className="px-3 py-2 bg-gray-100 border border-gray-300 rounded-md text-gray-700">
                    元
                  </span>
                </div>
              </div>


              {/* 找零顯示 */}
              {paidAmount > 0 && (
                <div className="bg-blue-50 p-4 rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-700">找零</span>
                    <span className="text-xl font-bold text-blue-600">
                      {formatMoney(changeAmount)}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 手機支付 */}
          {paymentMethod === 'mobile' && (
            <div className="text-center">
              <QRCode size={160} imageUrl={qrCodeImageUrl} />
            </div>
          )}
        </div>

        {/* 按鈕 */}
        <div className="p-6 border-t border-gray-200 flex space-x-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            取消
          </button>
          <button
            onClick={handlePaymentComplete}
            disabled={
              isProcessing || 
              (paymentMethod === 'cash' && (paidAmount < totalAmount || paidAmount <= 0))
            }
            className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {isProcessing ? '處理中...' : '確認付款'}
          </button>
        </div>
      </div>
    </div>
  );
}
