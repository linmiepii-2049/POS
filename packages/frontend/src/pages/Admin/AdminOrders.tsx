import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useOrdersList,
  useOrdersUpdateStatus,
  useOrdersCancel,
  type OrdersList200DataItem,
} from '../../api/posClient';
import { formatMoney } from '../../utils/money';
import { Table, type TableColumn } from '../../components/Table';
import { FormField, Select, Button } from '../../components/Form';
import { OrderDetailDialog } from '../../components/OrderDetailDialog';
import { clsx } from 'clsx';
import { formatDateOnly } from '../../utils/time';

/**
 * 訂單列表篩選條件
 */
interface OrderFilters {
  status: string;
  date_from: string;
  date_to: string;
}

/**
 * Admin Orders 頁面元件
 */
export function AdminOrders() {
  const [filters, setFilters] = useState<OrderFilters>({
    status: '',
    date_from: '',
    date_to: '',
  });

  // 訂單詳情對話框狀態
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<number | null>(null);

  // API hooks
  const { data: ordersResponse, isLoading, refetch } = useOrdersList({
    page: 1,
    limit: 100,
    status: filters.status as any || undefined,
    from: filters.date_from || undefined,
    to: filters.date_to || undefined,
  });

  // 從響應中提取實際資料
  const ordersData = ordersResponse?.data;

  const updateStatusMutation = useOrdersUpdateStatus();
  const cancelOrderMutation = useOrdersCancel();

  /**
   * 更新訂單狀態
   */
  const handleUpdateStatus = async (order: OrdersList200DataItem, newStatus: string) => {
    if (!confirm(`確定要將訂單 ${order.order_number} 狀態更新為「${newStatus}」嗎？`)) return;

    try {
      await updateStatusMutation.mutateAsync({
        id: order.id,
        data: { status: newStatus as any },
      });
      toast.success('訂單狀態更新成功');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || '狀態更新失敗');
    }
  };

  /**
   * 取消訂單（暫時未使用）
   */
  // const handleCancelOrder = async (order: OrdersList200DataItem) => {
  //   if (!confirm(`確定要取消訂單 ${order.order_number} 嗎？`)) return;

  //   try {
  //     await cancelOrderMutation.mutateAsync({
  //       id: order.id,
  //     });
  //     toast.success('訂單取消成功');
  //     refetch();
  //   } catch (error: any) {
  //     toast.error(error?.response?.data?.error || '取消訂單失敗');
  //   }
  // };

  /**
   * 檢視訂單詳情
   */
  const handleViewOrderDetail = (order: OrdersList200DataItem) => {
    setSelectedOrderId(order.id);
    setIsDetailDialogOpen(true);
  };

  /**
   * 關閉訂單詳情對話框
   */
  const handleCloseDetailDialog = () => {
    setIsDetailDialogOpen(false);
    setSelectedOrderId(null);
  };


  /**
   * 格式化日期顯示
   */
  const formatDate = (dateStr: string) => {
    return formatDateOnly(dateStr);
  };

  /**
   * 取得狀態顯示文字和樣式
   */
  const getStatusDisplay = (status: string) => {
    const statusMap: Record<string, { text: string; className: string }> = {
      created: { text: '已建立', className: 'bg-blue-100 text-blue-800' },
      confirmed: { text: '已確認', className: 'bg-yellow-100 text-yellow-800' },
      paid: { text: '已付款', className: 'bg-green-100 text-green-800' },
    };

    return statusMap[status] || { text: status, className: 'bg-gray-100 text-gray-800' };
  };

  /**
   * 表格欄位定義
   */
  const columns: TableColumn<OrdersList200DataItem>[] = [
    {
      key: 'order_number',
      label: '訂單編號',
      render: (value, _record) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">訂單 ID: {_record.id}</div>
        </div>
      ),
    },
    {
      key: 'user_id',
      label: '客戶',
      render: (_value, record) => (
        <div>
          <div className="font-medium">{record.user_id ? `會員 #${record.user_id}` : '訪客'}</div>
          <div className="text-sm text-gray-500">ID: {record.user_id || '-'}</div>
        </div>
      ),
    },
    {
      key: 'amount',
      label: '金額明細',
      render: (_, record) => (
        <div className="text-sm">
          <div className="flex justify-between">
            <span>總計:</span>
            <span>NT$ {formatMoney(record.subtotal_twd || 0)}</span>
          </div>
          <div className="flex justify-between font-medium border-t pt-1 mt-1">
            <span>實收:</span>
            <span className="text-green-600">NT$ {formatMoney(record.total_twd || 0)}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'coupon_names',
      label: '使用優惠券',
      render: (value, _record) => (
        <div className="text-sm">
          {value ? (
            <span className="text-blue-600">{value}</span>
          ) : (
            <span className="text-gray-400">無</span>
          )}
        </div>
      ),
    },
    {
      key: 'status',
      label: '狀態',
      render: (value) => {
        const statusDisplay = getStatusDisplay(value);
        return (
          <span className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full',
            statusDisplay.className
          )}>
            {statusDisplay.text}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      label: '建立時間',
      render: (value) => formatDate(value),
    },
    {
      key: 'actions',
      label: '操作',
      render: (_, _record) => (
        <div className="flex space-x-2 items-center">
          <Button
            size="sm"
            variant="secondary"
            onClick={() => handleViewOrderDetail(_record)}
            className="flex-shrink-0"
          >
            檢視
          </Button>
          <Select
            value={_record.status}
            onChange={(e) => handleUpdateStatus(_record, e.target.value)}
            options={[
              { value: 'created', label: '已建立' },
              { value: 'paid', label: '已付款' },
              { value: 'cancelled', label: '已取消' },
            ]}
            className="text-sm w-[100px] flex-shrink-0"
          />
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">訂單管理</h2>
          <p className="text-gray-600">管理系統訂單資料</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="success"
            onClick={() => {
              window.location.reload();
            }}
          >
            更新頁面
          </Button>
        </div>
      </div>

      {/* 篩選條件 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <FormField label="訂單狀態">
            <Select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value })}
              options={[
                { value: '', label: '全部狀態' },
                { value: 'created', label: '已建立' },
                { value: 'paid', label: '已付款' },
                { value: 'cancelled', label: '已取消' },
              ]}
              className="text-sm"
            />
          </FormField>

          <FormField label="開始日期">
            <input
              type="date"
              value={filters.date_from}
              onChange={(e) => setFilters({ ...filters, date_from: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </FormField>

          <FormField label="結束日期">
            <input
              type="date"
              value={filters.date_to}
              onChange={(e) => setFilters({ ...filters, date_to: e.target.value })}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </FormField>

          <div className="flex items-end">
            <Button
              variant="secondary"
              onClick={() => setFilters({ status: '', date_from: '', date_to: '' })}
            >
              清除篩選
            </Button>
          </div>
        </div>
      </div>

      {/* 統計資訊 */}
      {ordersData && 'data' in ordersData && ordersData.data && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">總訂單數</div>
            <div className="text-2xl font-bold text-gray-900">
              {ordersData.data.length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">已建立</div>
            <div className="text-2xl font-bold text-blue-600">
              {ordersData.data.filter((order: any) => order.status === 'created').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">已確認</div>
            <div className="text-2xl font-bold text-yellow-600">
              {ordersData.data.filter((order: any) => order.status === 'confirmed').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">已付款</div>
            <div className="text-2xl font-bold text-green-600">
              {ordersData.data.filter((order: any) => order.status === 'paid').length}
            </div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-sm text-gray-500">已取消</div>
            <div className="text-2xl font-bold text-red-600">
              {ordersData.data.filter((order: any) => order.status === 'cancelled').length}
            </div>
          </div>
        </div>
      )}

      {/* 訂單列表 */}
      <Table
        columns={columns}
        data={(ordersData && 'data' in ordersData) ? (ordersData.data || []) : []}
        loading={isLoading}
        emptyText="暫無訂單資料"
      />

      {/* 訂單詳情對話框 */}
      <OrderDetailDialog
        isOpen={isDetailDialogOpen}
        onClose={handleCloseDetailDialog}
        orderId={selectedOrderId}
      />
    </div>
  );
}
