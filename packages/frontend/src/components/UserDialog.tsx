import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button, FormField, Input, Select } from './Form';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';
import { 
  // useCouponCodesList, // TODO: 優惠券功能暫時停用
  // useCouponsCreateGrant, // TODO: 優惠券功能暫時停用
  useGetApiUsersIdCouponsOwned,
  // useCouponsList, // TODO: 優惠券功能暫時停用
  // type CouponCodesList200DataItem, // TODO: 優惠券功能暫時停用
  // type CouponsCreateGrantBody, // TODO: 優惠券功能暫時停用
  type GetApiUsersIdCouponsOwned200DataItem
} from '../api/posClient';

interface UserFormData {
  line_id: string;
  name: string;
  phone: string;
  role: 'CLIENT' | 'ADMIN';
  is_active: string;
}

interface UserDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: UserFormData) => Promise<void>;
  editingUser?: any;
  isLoading?: boolean;
}

interface CouponCodeFormData {
  coupon_id: number;
  coupon_code_id: number;
}

export const UserDialog: React.FC<UserDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  isLoading = false,
}) => {
  const [showCouponCodes, setShowCouponCodes] = useState(false);
  const [couponCodeForm, setCouponCodeForm] = useState<CouponCodeFormData>({
    coupon_id: 0,
    coupon_code_id: 0,
  });

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    formState: { errors },
  } = useForm<UserFormData>({
    defaultValues: {
      line_id: '',
      name: '',
      phone: '',
      role: 'CLIENT',
      is_active: 'true',
    },
  });

  // 獲取用戶擁有的優惠券
  const { data: userCouponsData, refetch: refetchUserCoupons } = useGetApiUsersIdCouponsOwned(
    editingUser?.id || 0,
    {
      query: {
        enabled: !!editingUser?.id && editingUser.id > 0 && showCouponCodes,
      },
    }
  );

  // TODO: 優惠券功能暫時停用
  // const { data: couponsData } = useCouponsList({...});
  const couponsData = undefined;

  // TODO: 優惠券代碼列表功能暫時停用
  // const { data: selectedCouponCodesData } = useCouponCodesList(...);
  const selectedCouponCodesData = undefined;

  // TODO: 優惠券授權功能暫時停用
  // const createGrantMutation = useCouponsCreateGrant();
  const createGrantMutation = { mutateAsync: async () => { throw new Error('優惠券功能暫時停用'); } };

  // 當編輯用戶時，填充表單數據
  React.useEffect(() => {
    if (editingUser) {
      setValue('line_id', editingUser.line_id || '');
      setValue('name', editingUser.name || '');
      setValue('phone', editingUser.phone || '');
      setValue('role', editingUser.role || 'CLIENT');
      setValue('is_active', editingUser.is_active === 1 ? 'true' : 'false');
    } else {
      reset();
    }
  }, [editingUser, setValue, reset]);

  const handleFormSubmit = async (data: UserFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      // 錯誤處理在父組件中進行
    }
  };

  const handleCancel = () => {
    onClose();
    reset();
    setShowCouponCodes(false);
  };

  // 優惠代碼相關處理函數
  const handleAddCouponCode = async () => {
    if (!couponCodeForm.coupon_code_id || !editingUser?.id) {
      toast.error('請選擇優惠券和代碼');
      return;
    }

    try {
      // TODO: 優惠券功能暫時停用，類型改為 any
      const createData: any = {
        coupon_code_id: couponCodeForm.coupon_code_id,
        user_id: editingUser.id,
        allowed_uses: 1, // 統一一次使用
      };

      await createGrantMutation.mutateAsync({ data: createData });
      toast.success('優惠代碼分配成功');
      setCouponCodeForm({ coupon_id: 0, coupon_code_id: 0 });
      refetchUserCoupons();
    } catch (error: any) {
      console.error('分配優惠代碼失敗:', error);
      // 檢查是否為重複授權錯誤
      const errorMessage = error?.response?.data?.error || error?.message || '分配優惠代碼失敗';
      if (error?.response?.status === 409 || errorMessage.includes('已經有此優惠券代碼的授權')) {
        toast.error('用戶已經有此優惠券代碼的授權');
      } else {
        toast.error(errorMessage);
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingUser ? '編輯用戶' : '新增用戶'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="姓名"
              required
              error={errors.name?.message}
            >
              <Input
                {...register('name', { required: '請輸入姓名' })}
                placeholder="請輸入姓名"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="手機號碼"
              error={errors.phone?.message}
            >
              <Input
                {...register('phone', { 
                  pattern: {
                    value: /^09\d{8}$/,
                    message: '請輸入正確的手機號碼格式'
                  }
                })}
                placeholder="請輸入手機號碼（可選）"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="LINE ID"
              error={errors.line_id?.message}
            >
              <Input
                {...register('line_id', {
                  pattern: {
                    value: /^[a-zA-Z0-9._-]+$/,
                    message: 'LINE ID 只能包含字母、數字、點、底線和連字號'
                  }
                })}
                placeholder="請輸入 LINE ID"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="角色"
              required
              error={errors.role?.message}
            >
              <Select
                {...register('role', { required: '請選擇角色' })}
                options={[
                  { value: 'CLIENT', label: '客戶' },
                  { value: 'ADMIN', label: '管理員' },
                ]}
                disabled={isLoading}
              />
            </FormField>

            <FormField label="狀態">
              <Select
                {...register('is_active')}
                options={[
                  { value: 'true', label: '啟用' },
                  { value: 'false', label: '停用' },
                ]}
                disabled={isLoading}
              />
            </FormField>
          </div>

          {/* 優惠代碼管理區塊 - 只在編輯用戶時顯示 */}
          {editingUser && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">優惠代碼管理 (開發階段)</h3>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowCouponCodes(!showCouponCodes)}
                >
                  {showCouponCodes ? '隱藏' : '顯示'} 優惠代碼
                </Button>
              </div>

              {showCouponCodes && (
                <div className="space-y-4">
                  {/* 添加優惠代碼表單 */}
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="text-md font-medium text-gray-900 mb-3">分配優惠代碼</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField label="優惠券" required>
                        <Select
                          value={couponCodeForm.coupon_id}
                          onChange={(e) => {
                            const couponId = Number(e.target.value);
                            setCouponCodeForm({ 
                              coupon_id: couponId, 
                              coupon_code_id: 0 // 重置代碼選擇
                            });
                          }}
                          options={[
                            { value: 0, label: '請選擇優惠券' },
                            ...(couponsData?.data?.data?.map((coupon: any) => ({
                              value: coupon.id,
                              label: `${coupon.name} (${coupon.discount_type === 'PERCENT' ? `${coupon.percent_off_bps / 100}%` : `NT$ ${coupon.amount_off_twd}`})`
                            })) || [])
                          ]}
                        />
                      </FormField>
                      <FormField label="代碼" required>
                        <Select
                          value={couponCodeForm.coupon_code_id}
                          onChange={(e) => setCouponCodeForm({ ...couponCodeForm, coupon_code_id: Number(e.target.value) })}
                          disabled={!couponCodeForm.coupon_id}
                          options={[
                            { value: 0, label: couponCodeForm.coupon_id ? '請選擇代碼' : '請先選擇優惠券' },
                            // TODO: 暫時無法獲取優惠券代碼列表（API 尚未實現）
                            ...(selectedCouponCodesData?.data?.data?.map((code: any) => ({
                              value: code.id,
                              label: `${code.code} (${code.max_redemptions ? `最多${code.max_redemptions}次` : '無限制'})`
                            })) || [])
                          ]}
                        />
                      </FormField>
                    </div>
                    <div className="mt-3 text-sm text-gray-600">
                      <p>• 統一分配一次使用權限</p>
                      <p>• 用戶將獲得選中代碼的一次使用權限</p>
                    </div>
                    <div className="mt-3">
                      <Button
                        type="button"
                        onClick={handleAddCouponCode}
                        loading={createGrantMutation.isPending}
                        disabled={!couponCodeForm.coupon_code_id}
                      >
                        分配代碼
                      </Button>
                    </div>
                  </div>

                  {/* 用戶優惠代碼授權列表 */}
                  <div className="p-4 bg-white rounded-lg border">
                    <h4 className="text-md font-medium text-gray-900 mb-3">用戶的優惠代碼授權</h4>
                    {userCouponsData?.data?.data?.length ? (
                      <div className="space-y-2">
                        {userCouponsData.data.data.map((coupon: GetApiUsersIdCouponsOwned200DataItem) => (
                          <div key={coupon.grant_id} className="flex items-center justify-between p-3 bg-gray-50 rounded border">
                            <div className="flex-1">
                              <div className="font-mono text-sm font-medium">{coupon.coupon_code}</div>
                              <div className="text-xs text-gray-500">
                                優惠券: {coupon.coupon_name} | 
                                使用次數: {coupon.used_count}/{coupon.allowed_uses} | 
                                剩餘: {coupon.remaining_uses} | 
                                分配時間: {new Date(coupon.granted_at).toLocaleString('zh-TW')}
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              狀態: {coupon.remaining_uses > 0 ? '可用' : '已用完'}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center text-gray-500 py-4">
                        此用戶暫無優惠代碼授權
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCancel}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={isLoading}
            >
              {editingUser ? '更新' : '建立'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
