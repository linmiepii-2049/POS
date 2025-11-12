import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useGetApiUsers,
  usePostApiUsers,
  usePutApiUsersId,
  useDeleteApiUsersId,
  type GetApiUsers200DataItem,
  type PostApiUsersBody,
  type PutApiUsersIdBody,
} from '../../api/posClient';
import { Table, type TableColumn } from '../../components/Table';
import { FormField, Input, Select, Button } from '../../components/Form';
import { UserDialog } from '../../components/UserDialog';
import { UserViewDialog } from '../../components/UserViewDialog';
import { clsx } from 'clsx';
import { formatDateOnly } from '../../utils/time';

/**
 * 用戶表單資料類型
 */
interface UserFormData {
  line_id: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  is_active: string;
}

/**
 * 用戶列表篩選條件
 */
interface UserFilters {
  search: string;
  is_active: string;
}

/**
 * Admin Users 頁面元件
 */
export function AdminUsers() {
  const [showDialog, setShowDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [editingUser, setEditingUser] = useState<GetApiUsers200DataItem | null>(null);
  const [viewingUser, setViewingUser] = useState<GetApiUsers200DataItem | null>(null);
  const [filters, setFilters] = useState<UserFilters>({
    search: '',
    is_active: '',
  });
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  // API hooks
  const { data: usersResponse, isLoading, refetch } = useGetApiUsers({
    page: 1,
    limit: 100,
    nameOrPhone: filters.search || undefined,
    is_active: filters.is_active ? (filters.is_active === '1' ? 1 : 0) : undefined,
    sortBy: sortBy as any,
    sortDir: sortDir,
  });

  // 從響應中提取實際資料
  const usersData = usersResponse?.data;

  const createUserMutation = usePostApiUsers({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const updateUserMutation = usePutApiUsersId({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const deleteUserMutation = useDeleteApiUsersId();

  /**
   * 處理表單提交
   */
  const handleSubmit = async (data: UserFormData) => {
    try {
      console.log('=== 表單提交開始 ===');
      console.log('原始表單資料:', data);
      console.log('編輯中的用戶:', editingUser);
      
      const userData: PostApiUsersBody | PutApiUsersIdBody = {
        line_id: data.line_id && data.line_id.trim() !== '' ? data.line_id : undefined,
        name: data.name,
        phone: data.phone && data.phone.trim() !== '' ? data.phone : undefined,
        role: data.role,
        is_active: data.is_active === 'true' ? 1 : 0,
      };
      
      console.log('準備發送的用戶資料:', userData);

      if (editingUser) {
        console.log('=== 更新用戶 ===');
        console.log('用戶 ID:', editingUser.id);
        console.log('更新請求參數:', { id: editingUser.id, data: userData });
        
        await updateUserMutation.mutateAsync({
          id: editingUser.id,
          data: userData,
        });
        console.log('用戶更新成功');
        toast.success('用戶更新成功');
      } else {
        console.log('=== 創建用戶 ===');
        console.log('創建請求參數:', { data: userData });
        
        await createUserMutation.mutateAsync({
          data: userData as PostApiUsersBody,
        });
        console.log('用戶創建成功');
        toast.success('用戶建立成功');
      }

      setShowDialog(false);
      setEditingUser(null);
    } catch (error: any) {
      console.error('=== 用戶操作錯誤 ===');
      console.error('錯誤物件:', error);
      console.error('錯誤訊息:', error?.message);
      console.error('錯誤響應:', error?.response);
      console.error('錯誤狀態碼:', error?.response?.status);
      console.error('錯誤資料:', error?.response?.data);
      
      const errorMessage = error?.response?.data?.error || error?.message || '操作失敗';
      console.error('顯示錯誤訊息:', errorMessage);
      toast.error(errorMessage);
      throw error; // 重新拋出錯誤，讓 UserDialog 知道提交失敗
    }
  };

  /**
   * 編輯用戶
   */
  const handleEdit = (user: GetApiUsers200DataItem) => {
    setEditingUser(user);
    setShowDialog(true);
  };

  /**
   * 檢視用戶
   */
  const handleView = (user: GetApiUsers200DataItem) => {
    setViewingUser(user);
    setShowViewDialog(true);
  };

  /**
   * 刪除用戶
   */
  const handleDelete = async (user: GetApiUsers200DataItem) => {
    if (!confirm(`確定要刪除用戶「${user.name}」嗎？`)) return;

    try {
      await deleteUserMutation.mutateAsync({
        id: user.id,
      });
      toast.success('用戶刪除成功');
      refetch();
    } catch (error: any) {
      toast.error(error?.response?.data?.error || '刪除失敗');
    }
  };

  /**
   * 關閉對話框
   */
  const handleCloseDialog = () => {
    setShowDialog(false);
    setEditingUser(null);
  };

  /**
   * 處理排序
   */
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortDir(direction);
  };

  /**
   * 表格欄位定義
   */
  const columns: TableColumn<GetApiUsers200DataItem>[] = [
    {
      key: 'name',
      label: '姓名',
      render: (value) => (
        <div className="font-medium text-gray-900">{value}</div>
      ),
    },
    {
      key: 'phone',
      label: '手機',
    },
    {
      key: 'role',
      label: '角色',
      render: (value) => (
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full',
          value === 'ADMIN' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
        )}>
          {value === 'ADMIN' ? '管理員' : '客戶'}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      render: (value) => (
        <span className={clsx(
          'px-2 py-1 text-xs font-medium rounded-full',
          value ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        )}>
          {value ? '啟用' : '停用'}
        </span>
      ),
    },
    {
      key: 'last_purchase_at',
      label: '最後消費時間',
      sortable: true,
      render: (value) => value ? formatDateOnly(value) : '從未消費',
    },
    {
      key: 'current_month_spending',
      label: '本月消費金額',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium">
          NT$ {value?.toLocaleString() || '0'}
        </div>
      ),
    },
    {
      key: 'last_month_spending',
      label: '上月消費金額',
      sortable: true,
      render: (value) => (
        <div className="text-right font-medium">
          NT$ {value?.toLocaleString() || '0'}
        </div>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleView(record)}
          >
            檢視
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Button
            size="sm"
            variant="danger"
            onClick={() => handleDelete(record)}
          >
            刪除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* 頁面標題 */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">用戶管理</h2>
          <p className="text-gray-600">管理系統用戶資料</p>
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
          <Button
            onClick={() => {
              setEditingUser(null);
              setShowDialog(true);
            }}
            disabled={showDialog}
          >
            新增用戶
          </Button>
        </div>
      </div>

      {/* 篩選條件 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="搜尋">
            <Input
              placeholder="搜尋姓名或手機號碼"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </FormField>
          <FormField label="狀態">
            <Select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
              options={[
                { value: '', label: '全部' },
                { value: '1', label: '啟用' },
                { value: '0', label: '停用' },
              ]}
            />
          </FormField>
        </div>
      </div>

      {/* 用戶對話框 */}
      <UserDialog
        isOpen={showDialog}
        onClose={handleCloseDialog}
        onSubmit={handleSubmit}
        editingUser={editingUser}
        isLoading={createUserMutation.isPending || updateUserMutation.isPending}
      />

      {/* 用戶檢視對話框 */}
      <UserViewDialog
        isOpen={showViewDialog}
        onClose={() => {
          setShowViewDialog(false);
          setViewingUser(null);
        }}
        user={viewingUser}
      />

      {/* 用戶列表 */}
      <Table
        columns={columns}
        data={(usersData && 'data' in usersData) ? (usersData.data || []) : []}
        loading={isLoading}
        emptyText="暫無用戶資料"
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </div>
  );
}