import { Button } from './Form';
import { formatMoney } from '../utils/money';
import { formatDateOnly } from '../utils/time';
import { useOrdersGet } from '../api/posClient';

interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  product_name_snapshot: string;
  quantity: number;
  unit_price_twd: number;
  total_twd: number;
  created_at: string;
  updated_at: string;
}

interface CouponRedemption {
  id: number;
  order_id: number;
  coupon_id: number;
  coupon_code_id: number;
  user_id: number;
  redeemed_at: string;
  amount_applied_twd: number;
  created_at: string;
  updated_at: string;
  coupon_name: string | null;
  coupon_code: string | null;
}

interface OrderDetail {
  id: number;
  order_number: string;
  user_id: number;
  user_name?: string;
  user_phone?: string;
  subtotal_twd: number;
  discount_twd: number;
  total_twd: number;
  status: string;
  created_at: string;
  updated_at: string;
  order_items: OrderItem[];
  coupon_redemptions: CouponRedemption[];
}

interface OrderDetailDialogProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number | null;
}

export function OrderDetailDialog({ isOpen, onClose, orderId }: OrderDetailDialogProps) {
  // 使用 SDK hook 來獲取訂單詳情
  const { data: orderResponse, isLoading: loading, error: queryError, refetch } = useOrdersGet(
    orderId ?? 0,
    {
      query: {
        enabled: isOpen && orderId !== null,
      } as any,
    }
  );

  // SDK 返回的結構是 { data: { success, data, timestamp }, status, headers }
  // 所以訂單數據在 orderResponse.data.data
  const orderDetail = (orderResponse?.data as any)?.data as OrderDetail | undefined;
  const error = queryError ? '取得訂單詳情失敗' : null;

  const formatDate = (dateStr: string) => {
    return formatDateOnly(dateStr);
  };

  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      created: { text: '已建立', className: 'bg-blue-100 text-blue-800' },
      confirmed: { text: '已確認', className: 'bg-yellow-100 text-yellow-800' },
      paid: { text: '已付款', className: 'bg-green-100 text-green-800' },
    };
    return statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">訂單詳情</h2>
          <Button variant="ghost" onClick={onClose}>
            ✕
          </Button>
        </div>

        {loading && (
          <div className="flex justify-center items-center py-8">
            <div className="text-gray-500">載入中...</div>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-6">
            <div className="text-red-800">{error}</div>
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => refetch()}
              className="mt-2"
            >
              重試
            </Button>
          </div>
        )}

        {orderDetail && (
          <div className="space-y-6">
            {/* 訂單基本資訊 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">訂單資訊</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">訂單編號</label>
                  <div className="text-sm text-gray-900">{orderDetail.order_number}</div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">狀態</label>
                  <div className="mt-1">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusDisplay(orderDetail.status).className}`}>
                      {getStatusDisplay(orderDetail.status).text}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">客戶</label>
                  <div className="text-sm text-gray-900">
                    {orderDetail.user_name || '非會員'}
                    {orderDetail.user_phone && (
                      <div className="text-xs text-gray-500">{orderDetail.user_phone}</div>
                    )}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">建立時間</label>
                  <div className="text-sm text-gray-900">{formatDate(orderDetail.created_at)}</div>
                </div>
              </div>
            </div>

            {/* 訂單項目 */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">訂單項目</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        商品名稱
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        單價
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        數量
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        小計
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderDetail.order_items.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.product_name_snapshot}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          NT$ {formatMoney(item.unit_price_twd)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {item.quantity}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                          NT$ {formatMoney(item.total_twd)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50">
                    <tr>
                      <td colSpan={3} className="px-6 py-3 text-right text-sm font-medium text-gray-900">
                        商品小計
                      </td>
                      <td className="px-6 py-3 text-sm font-medium text-gray-900">
                        NT$ {formatMoney(orderDetail.subtotal_twd)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* 優惠券使用 */}
            {orderDetail.coupon_redemptions.length > 0 && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">使用優惠券</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          優惠券
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          折抵金額
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          使用時間
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderDetail.coupon_redemptions.map((redemption) => (
                        <tr key={redemption.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            <div>
                              <div className="font-medium text-gray-900">
                                {redemption.coupon_name || '未知優惠券'}
                              </div>
                              <div className="text-gray-500 text-xs">
                                代碼: {redemption.coupon_code || 'N/A'}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-medium">
                            -NT$ {formatMoney(redemption.amount_applied_twd)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(redemption.redeemed_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* 金額總結 */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">金額總結</h3>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">商品小計</span>
                  <span className="text-gray-900">NT$ {formatMoney(orderDetail.subtotal_twd)}</span>
                </div>
                {orderDetail.discount_twd > 0 && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">優惠折扣</span>
                    <span className="text-red-600">-NT$ {formatMoney(orderDetail.discount_twd)}</span>
                  </div>
                )}
                <div className="flex justify-between text-lg font-semibold border-t pt-2">
                  <span className="text-gray-900">實收金額</span>
                  <span className="text-green-600">NT$ {formatMoney(orderDetail.total_twd)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 底部按鈕 */}
        <div className="flex justify-end mt-6">
          <Button variant="secondary" onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </div>
  );
}
