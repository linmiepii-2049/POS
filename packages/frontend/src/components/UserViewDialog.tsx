import { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  // useGetApiUsersIdCouponsOwned, // TODO: 優惠券功能已停用
  type GetApiUsers200DataItem,
  // type GetApiUsersIdCouponsOwned200DataItem, // TODO: 優惠券功能已停用
} from '../api/posClient';
import { Table, type TableColumn } from './Table';
import { Button } from './Form';
import { clsx } from 'clsx';
import { formatDateOnly } from '../utils/time';

interface UserViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: GetApiUsers200DataItem | null;
}

export function UserViewDialog({ isOpen, onClose, user }: UserViewDialogProps) {
  // TODO: 優惠券功能已停用
  // 獲取用戶擁有的優惠券
  // const { data: couponsResponse, refetch: refetchCoupons } = useGetApiUsersIdCouponsOwned(...);
  const couponsData: any[] = [];

  // useEffect(() => {
  //   if (isOpen && user) {
  //     refetchCoupons();
  //   }
  // }, [isOpen, user, refetchCoupons]);

  if (!isOpen || !user) return null;

  // TODO: 優惠券代碼表格欄位（暫時停用）
  const couponCodeColumns: TableColumn<any>[] = [
    {
      key: 'coupon_name',
      label: '優惠券名稱',
      render: (_, record) => (
        <span className="font-medium text-gray-900">{record.coupon_name || '未知優惠券'}</span>
      ),
    },
    {
      key: 'coupon_code',
      label: '代碼',
      render: (value) => (
        <span className="font-mono font-medium text-blue-600">{value}</span>
      ),
    },
    {
      key: 'usage_stats',
      label: '使用統計',
      render: (_, record) => (
        <div className="text-sm">
          <div className="text-gray-600">
            獲得: {record.allowed_uses || 0} 次
          </div>
          <div className="text-gray-600">
            已用: {record.used_count || 0} 次
          </div>
        </div>
      ),
    },
    {
      key: 'valid_period',
      label: '有效時間',
      render: (_, record) => {
        const grantedTime = record.granted_at ? formatDateOnly(record.granted_at) : '未知';
        // 使用優惠券的結束時間，而不是授權的過期時間
        const expiresTime = record.ends_at ? formatDateOnly(record.ends_at) : '無限制';
        return (
          <div className="text-sm">
            <div className="text-gray-600">獲得: {grantedTime}</div>
            <div className="text-gray-600">到期: {expiresTime}</div>
          </div>
        );
      },
    },
  ];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        {/* 標題欄 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">用戶詳細資料</h2>
          <Button variant="ghost" onClick={onClose}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </Button>
        </div>

        {/* 用戶基本資料 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">基本資料</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <p className="text-gray-900">{user.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">手機號碼</label>
                <p className="text-gray-900">{user.phone}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">LINE ID</label>
                <p className="text-gray-900 font-mono">{user.line_id}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                )}>
                  {user.role === 'ADMIN' ? '管理員' : '客戶'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
                <span className={clsx(
                  'px-2 py-1 text-xs font-medium rounded-full',
                  user.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                )}>
                  {user.is_active ? '啟用' : '停用'}
                </span>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">建立時間</label>
                <p className="text-gray-900">{formatDateOnly(user.created_at)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* 優惠券代碼區域 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">優惠券代碼</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {couponsData.length > 0 ? (
              <Table
                columns={couponCodeColumns}
                data={couponsData}
                loading={false}
                emptyText="暫無優惠券代碼"
                rowKey="grant_id"
              />
            ) : (
              <div className="text-center py-8 text-gray-500">
                <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="mt-2">此用戶暫無優惠券代碼</p>
              </div>
            )}
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            關閉
          </Button>
        </div>
      </div>
    </div>
  );
}
