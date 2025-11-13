import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { getUserOrders, type Order } from '../api/memberClient';
import { Loading } from './Loading';

interface OrderHistoryProps {
  userId: number;
}

export function OrderHistory({ userId }: OrderHistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });
  const [expandedOrders, setExpandedOrders] = useState<Set<number>>(new Set());

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getUserOrders(userId, page, 10);
        setOrders(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userId, page]);

  const formatDate = (dateString: string) => {
    return formatInTimeZone(
      new Date(dateString),
      'Asia/Taipei',
      'yyyy/MM/dd HH:mm'
    );
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { text: string; className: string }> = {
      created: { text: '已建立', className: 'bg-gray-100 text-gray-800' },
      confirmed: { text: '已確認', className: 'bg-blue-100 text-blue-800' },
      paid: { text: '已付款', className: 'bg-green-100 text-green-800' },
      cancelled: { text: '已取消', className: 'bg-red-100 text-red-800' },
    };
    return labels[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  const toggleOrder = (orderId: number) => {
    const newExpanded = new Set(expandedOrders);
    if (newExpanded.has(orderId)) {
      newExpanded.delete(orderId);
    } else {
      newExpanded.add(orderId);
    }
    setExpandedOrders(newExpanded);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">購買記錄</h2>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">購買記錄</h2>
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">購買記錄</h2>
      
      {orders.length === 0 ? (
        <div className="text-center text-gray-500 py-8">尚無訂單記錄</div>
      ) : (
        <>
          <div className="space-y-3">
            {orders.map((order) => {
              const statusInfo = getStatusLabel(order.status);
              const isExpanded = expandedOrders.has(order.id);
              
              return (
                <div
                  key={order.id}
                  className="border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div
                    className="p-4 cursor-pointer"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-sm text-gray-600">
                          {order.order_number}
                        </span>
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${statusInfo.className}`}
                        >
                          {statusInfo.text}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-gray-900">
                          NT$ {order.total_twd.toLocaleString()}
                        </div>
                        {(order.discount_twd > 0 || order.points_discount_twd > 0) && (
                          <div className="text-xs text-gray-500 mt-1">
                            {order.discount_twd > 0 && `折扣: -${order.discount_twd}`}
                            {order.discount_twd > 0 && order.points_discount_twd > 0 && ' / '}
                            {order.points_discount_twd > 0 && `點數: -${order.points_discount_twd}`}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>{formatDate(order.created_at_taipei)}</span>
                      <span className="text-blue-600">
                        {isExpanded ? '收起' : '查看詳情'} ▼
                      </span>
                    </div>
                  </div>
                  
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-200 bg-gray-50">
                      <div className="text-sm space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">小計</span>
                          <span className="text-gray-900">NT$ {order.subtotal_twd.toLocaleString()}</span>
                        </div>
                        {order.discount_twd > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">折扣</span>
                            <span className="text-red-600">-NT$ {order.discount_twd.toLocaleString()}</span>
                          </div>
                        )}
                        {order.points_discount_twd > 0 && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">點數折抵</span>
                            <span className="text-red-600">-NT$ {order.points_discount_twd.toLocaleString()}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t border-gray-300 font-semibold">
                          <span className="text-gray-900">總計</span>
                          <span className="text-gray-900">NT$ {order.total_twd.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {pagination.total_pages > 1 && (
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-600">
                第 {pagination.page} / {pagination.total_pages} 頁，共 {pagination.total} 筆
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  上一頁
                </button>
                <button
                  onClick={() => setPage((p) => Math.min(pagination.total_pages, p + 1))}
                  disabled={page === pagination.total_pages}
                  className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  下一頁
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

