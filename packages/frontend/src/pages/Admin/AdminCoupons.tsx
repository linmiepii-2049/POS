import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useCouponsList,
  useCouponsCreate,
  useCouponsUpdate,
  useCouponsDelete,
  type CouponsList200DataItem,
  type CouponsCreateBody,
  type CouponsUpdateBody,
} from '../../api/posClient';
import { Table, type TableColumn } from '../../components/Table';
import { FormField, Select, Button } from '../../components/Form';
import { CouponDialog } from '../../components/CouponDialog';
import { CouponCodeDialog } from '../../components/CouponCodeDialog';
import { formatDateOnly, convertToUTCISO } from '../../utils/time';

/**
 * 優惠券表單資料類型
 */
interface CouponFormData {
  name: string;
  description?: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_spend: number;
  max_discount?: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  is_active: string;
}


/**
 * 優惠券列表篩選條件
 */
interface CouponFilters {
  is_active: string;
}

/**
 * Admin Coupons 頁面元件
 */
export function AdminCoupons() {
  const [showDialog, setShowDialog] = useState(false);
  const [showCodeDialog, setShowCodeDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<CouponsList200DataItem | null>(null);
  const [selectedCoupon, setSelectedCoupon] = useState<CouponsList200DataItem | null>(null);
  const [filters, setFilters] = useState<CouponFilters>({
    is_active: '',
  });



  // API hooks
  const { data: couponsResponse, isLoading, refetch } = useCouponsList({
    page: 1,
    limit: 100,
    // 只傳送基本的 is_active 篩選，其他狀態在前端處理
    is_active: filters.is_active === 'inactive' ? 0 : filters.is_active === 'active' ? 1 : undefined,
  });

  // 從響應中提取實際資料並進行前端篩選
  const allCoupons = couponsResponse?.data?.data || [];
  
  // 根據狀態篩選優惠券
  const filteredCoupons = allCoupons.filter((coupon: CouponsList200DataItem) => {
    if (!filters.is_active) return true;
    
    switch (filters.is_active) {
      case 'active':
        return coupon.is_active === 1 && !coupon.is_not_started && !coupon.is_expired && !coupon.is_fully_redeemed;
      case 'not_started':
        return coupon.is_active === 1 && coupon.is_not_started;
      case 'expired':
        return coupon.is_active === 1 && coupon.is_expired;
      case 'fully_redeemed':
        return coupon.is_active === 1 && coupon.is_fully_redeemed;
      case 'inactive':
        return coupon.is_active === 0;
      default:
        return true;
    }
  });
  
  const couponsData = {
    ...couponsResponse?.data,
    data: filteredCoupons,
  };


  const createCouponMutation = useCouponsCreate();
  const updateCouponMutation = useCouponsUpdate({
    mutation: {
      onSuccess: () => {
        // 更新成功後重新獲取數據
        refetch();
      },
    },
  });
  const deleteCouponMutation = useCouponsDelete();

  /**
   * 處理優惠券表單提交
   */
  const handleCouponSubmit = async (data: CouponFormData) => {
    try {
      const couponData: CouponsCreateBody | CouponsUpdateBody = {
        name: data.name,
        discount_type: data.discount_type,
        // 根據折扣類型只設定對應的欄位，其他欄位不包含在請求中
        ...(data.discount_type === 'PERCENT' 
          ? { 
              percent_off_bps: data.discount_value * 100
            }
          : { 
              amount_off_twd: data.discount_value
            }
        ),
        min_order_twd: data.min_spend,
        max_uses_total: data.usage_limit || undefined,
        is_active: data.is_active === 'true' ? 1 : 0,
      };

      // 只有編輯時才檢查日期欄位是否有變化
      if (editingCoupon) {
        // 檢查開始日期是否有變化
        const currentStartsAt = editingCoupon.starts_at ? formatDateOnly(editingCoupon.starts_at) : '';
        const formStartsAt = data.valid_from ? formatDateOnly(data.valid_from) : '';
        if (formStartsAt !== currentStartsAt) {
          couponData.starts_at = data.valid_from ? convertToUTCISO(data.valid_from) : undefined;
        }

        // 檢查結束日期是否有變化
        const currentEndsAt = editingCoupon.ends_at ? formatDateOnly(editingCoupon.ends_at) : '';
        const formEndsAt = data.valid_to ? formatDateOnly(data.valid_to) : '';
        if (formEndsAt !== currentEndsAt) {
          couponData.ends_at = data.valid_to ? convertToUTCISO(data.valid_to, true) : undefined;
        }
      } else {
        // 新增時總是包含日期欄位
        couponData.starts_at = data.valid_from ? convertToUTCISO(data.valid_from) : undefined;
        couponData.ends_at = data.valid_to ? convertToUTCISO(data.valid_to, true) : undefined;
      }

      if (editingCoupon) {
        await updateCouponMutation.mutateAsync({
          id: editingCoupon.id,
          data: couponData,
        });
        toast.success('優惠券更新成功');
      } else {
        await createCouponMutation.mutateAsync({
          data: couponData,
        });
        toast.success('優惠券建立成功');
        // 新增成功後重新獲取數據
        refetch();
      }

      setEditingCoupon(null);
    } catch (error: any) {
      console.error('優惠券操作錯誤:', error);
      
      // 改善錯誤訊息處理
      let errorMessage = '操作失敗';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.error('顯示錯誤訊息:', errorMessage);
      toast.error(errorMessage);
    }
  };


  /**
   * 編輯優惠券
   */
  const handleEdit = (coupon: CouponsList200DataItem) => {
    setEditingCoupon(coupon);
    setShowDialog(true);
  };

  /**
   * 刪除優惠券
   */
  const handleDelete = async (coupon: CouponsList200DataItem) => {
    if (!confirm(`確定要刪除優惠券「${coupon.name || coupon.id}」嗎？`)) return;

    try {
      const response = await deleteCouponMutation.mutateAsync({
        id: coupon.id,
      });
      
      // 檢查響應狀態碼
      if (response.status === 200) {
        toast.success('優惠券刪除成功');
        refetch();
      } else if (response.status === 409) {
        // 處理衝突錯誤
        const errorData = response.data as any;
        const errorMessage = errorData?.error || '無法刪除此優惠券';
        
        if (errorMessage.includes('無法刪除有優惠券代碼的優惠券')) {
          toast.error('無法刪除：此優惠券已有代碼，請先刪除所有相關代碼');
        } else if (errorMessage.includes('無法刪除有兌換記錄的優惠券')) {
          toast.error('無法刪除：此優惠券已有兌換記錄，請先處理相關訂單');
        } else {
          toast.error(`無法刪除：${errorMessage}`);
        }
      } else if (response.status === 404) {
        toast.error('優惠券不存在');
      } else {
        toast.error('刪除優惠券失敗');
      }
    } catch (error: any) {
      console.error('刪除優惠券失敗:', error);
      toast.error('刪除優惠券失敗');
    }
  };




  /**
   * 格式化日期顯示（只顯示日期，不顯示時間）
   */
  const formatDate = (dateStr: string) => {
    return formatDateOnly(dateStr);
  };

  /**
   * 優惠券表格欄位定義
   */
  const couponColumns: TableColumn<CouponsList200DataItem>[] = [
    {
      key: 'name',
      label: '優惠券名稱',
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{value || `優惠券 #${record.id}`}</div>
          <div className="text-sm text-gray-500 mt-1">
            {(record as any).description || '無描述'}
          </div>
        </div>
      ),
    },
    {
      key: 'discount_type',
      label: '優惠內容',
      render: (_, record) => (
        <div>
          <div className="font-medium text-green-600">
            {record.discount_type === 'PERCENT' 
              ? `${record.percent_off_bps ? record.percent_off_bps / 100 : 0}% 折扣`
              : `NT$ ${record.amount_off_twd || 0} 折扣`
            }
          </div>
          <div className="text-sm text-gray-500">
            最低消費: NT$ {record.min_order_twd || 0}
          </div>
        </div>
      ),
    },
    {
      key: 'valid_from',
      label: '有效期間',
      render: (_, record) => (
        <div className="text-sm">
          <div className="font-medium">
            {record.starts_at ? formatDate(record.starts_at) : '無限制'}
          </div>
          <div className="text-gray-500">
            至 {record.ends_at ? formatDate(record.ends_at) : '無限制'}
          </div>
        </div>
      ),
    },
    {
      key: 'usage_limit',
      label: '使用限制',
      render: (_, record) => (
        <div className="text-sm">
          <div>
            總量: {record.max_uses_total ? record.max_uses_total : '無限制'}
          </div>
          <div className="text-gray-500">
            剩餘: {record.remaining_uses !== null ? record.remaining_uses : '無限制'}
          </div>
        </div>
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      render: (value, record) => {
        // 根據優惠券的各種狀態來決定顯示
        if (!value) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
              停用
            </span>
          );
        }
        
        // 如果啟用，檢查其他狀態
        if (record.is_not_started) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800">
              尚未開始
            </span>
          );
        }
        
        if (record.is_expired) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
              已過期
            </span>
          );
        }
        
        if (record.is_fully_redeemed) {
          return (
            <span className="px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
              已用罄
            </span>
          );
        }
        
        // 預設啟用狀態
        return (
          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
            啟用
          </span>
        );
      },
    },
    {
      key: 'actions',
      label: '操作',
      render: (_, record) => (
        <div className="flex space-x-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => handleEdit(record)}
          >
            編輯
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setSelectedCoupon(record);
              setShowCodeDialog(true);
            }}
          >
            管理代碼
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
          <h2 className="text-2xl font-bold text-gray-900">優惠券管理</h2>
          <p className="text-gray-600">管理系統優惠券與代碼</p>
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
              setEditingCoupon(null);
              setShowDialog(true);
            }}
          >
            新增優惠券
          </Button>
        </div>
      </div>

      {/* 篩選條件 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="狀態">
            <Select
              value={filters.is_active}
              onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
              options={[
                { value: '', label: '全部' },
                { value: 'active', label: '啟用' },
                { value: 'not_started', label: '尚未開始' },
                { value: 'expired', label: '已過期' },
                { value: 'fully_redeemed', label: '已用罄' },
                { value: 'inactive', label: '停用' },
              ]}
            />
          </FormField>
        </div>
      </div>

      {/* 優惠券對話框 */}
      <CouponDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingCoupon(null);
        }}
        onSubmit={handleCouponSubmit}
        editingCoupon={editingCoupon}
        isLoading={createCouponMutation.isPending || updateCouponMutation.isPending}
      />

      {/* 優惠券代碼管理彈出視窗 */}
      {selectedCoupon && (
        <CouponCodeDialog
          isOpen={showCodeDialog}
          onClose={() => {
            setShowCodeDialog(false);
            setSelectedCoupon(null);
          }}
          couponId={selectedCoupon.id}
          couponName={selectedCoupon.name || `優惠券 #${selectedCoupon.id}`}
        />
      )}

      {/* 優惠券列表 */}
      <Table
        columns={couponColumns}
        data={couponsData?.data || []}
        loading={isLoading}
        emptyText="暫無優惠券資料"
      />
    </div>
  );
}
