import { type GetApiUsers200DataItem } from '../api/posClient';
import { Button } from './Form';
import { clsx } from 'clsx';
import { formatDateOnly } from '../utils/time';

interface UserViewDialogProps {
  isOpen: boolean;
  onClose: () => void;
  user: GetApiUsers200DataItem | null;
}

export function UserViewDialog({ isOpen, onClose, user }: UserViewDialogProps) {
  if (!isOpen || !user) return null;

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

        {/* 點數資訊區域 */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">點數資訊</h3>
          <div className="bg-gradient-to-br from-purple-50 to-indigo-50 p-6 rounded-lg border border-purple-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="bg-purple-100 p-3 rounded-full">
                  <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm text-gray-600">目前點數</p>
                  <p className="text-3xl font-bold text-purple-900">{user.points || 0}</p>
                  <p className="text-sm text-purple-600 mt-1">
                    可折抵金額：${user.points_yuan_equivalent || 0} 元
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-500 mb-1">換算比例</p>
                <div className="bg-white px-3 py-2 rounded-lg shadow-sm">
                  <p className="text-sm font-medium text-gray-700">20 點 = 1 元</p>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-purple-200">
              <p className="text-xs text-gray-600">
                💡 消費金額 1:1 獲得點數，使用 LINE ID 查詢即可在結帳時折抵
              </p>
            </div>
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
