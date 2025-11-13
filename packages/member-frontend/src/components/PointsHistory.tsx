import { useState, useEffect } from 'react';
import { formatInTimeZone } from 'date-fns-tz';
import { getPointsHistory, type PointsTransaction } from '../api/memberClient';
import { Loading } from './Loading';

interface PointsHistoryProps {
  userId: number;
}

export function PointsHistory({ userId }: PointsHistoryProps) {
  const [transactions, setTransactions] = useState<PointsTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    total_pages: 0,
  });

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await getPointsHistory(userId, page, 10);
        setTransactions(response.data);
        setPagination(response.pagination);
      } catch (err) {
        setError(err instanceof Error ? err.message : '載入失敗');
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [userId, page]);

  const formatDate = (dateString: string) => {
    return formatInTimeZone(
      new Date(dateString),
      'Asia/Taipei',
      'yyyy/MM/dd HH:mm'
    );
  };

  const getTransactionTypeLabel = (type: string) => {
    return type === 'EARNED' ? '獲得' : '折抵';
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">點數交易歷史</h2>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">點數交易歷史</h2>
        <div className="text-red-600 text-center py-4">{error}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">點數交易歷史</h2>
      
      {transactions.length === 0 ? (
        <div className="text-center text-gray-500 py-8">尚無交易記錄</div>
      ) : (
        <>
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded text-sm font-medium ${
                        transaction.transaction_type === 'EARNED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {getTransactionTypeLabel(transaction.transaction_type)}
                    </span>
                    <span
                      className={`text-lg font-semibold ${
                        transaction.points_change > 0 ? 'text-green-600' : 'text-red-600'
                      }`}
                    >
                      {transaction.points_change > 0 ? '+' : ''}
                      {transaction.points_change.toLocaleString()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    餘額: {transaction.balance_after.toLocaleString()}
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm text-gray-500">
                  <span>{formatDate(transaction.created_at)}</span>
                  {transaction.order_id && (
                    <span className="text-blue-600">訂單 #{transaction.order_id}</span>
                  )}
                </div>
              </div>
            ))}
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

