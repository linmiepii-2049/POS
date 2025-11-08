import React, { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { Input, FormField, Textarea, Select, Button } from './Form';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import type { CouponsList200DataItem } from '../api/posClient';
import { useCouponCodesList } from '../api/posClient';
import { convertToUTCISO, validateDateRange, formatDateOnly } from '../utils/time';

interface CouponFormData {
  name: string;
  description?: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_spend: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  is_active: string;
}

interface CouponDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CouponFormData) => Promise<void>;
  editingCoupon: CouponsList200DataItem | null;
  isLoading: boolean;
}

export function CouponDialog({
  isOpen,
  onClose,
  onSubmit,
  editingCoupon,
  isLoading,
}: CouponDialogProps) {
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<CouponFormData>({
    defaultValues: {
      name: '',
      description: '',
      discount_type: 'PERCENT',
      discount_value: 0,
      min_spend: 0,
      valid_from: '',
      valid_to: '',
      usage_limit: undefined,
      is_active: 'true',
    },
  });

  const discountType = watch('discount_type');

  // 檢查優惠券是否有代碼
  const shouldCheckCodes = editingCoupon?.id && editingCoupon.id > 0;
  const { data: codesData } = useCouponCodesList(
    shouldCheckCodes ? {
      page: 1,
      limit: 1, // 只需要檢查是否有代碼，不需要獲取全部
      coupon_id: editingCoupon.id,
    } : undefined,
    {
      enabled: shouldCheckCodes, // 只有編輯時且 ID 有效時才查詢
    }
  );

  // 只有在編輯模式且確實有代碼時才鎖定日期欄位
  const hasCodes = shouldCheckCodes && codesData?.data?.data && codesData.data.data.length > 0;

  useEffect(() => {
    if (editingCoupon) {
      setValue('name', editingCoupon.name || '');
      setValue('description', editingCoupon.description || '');
      setValue('discount_type', editingCoupon.discount_type || 'PERCENT');
      setValue('discount_value', editingCoupon.percent_off_bps ? editingCoupon.percent_off_bps / 100 : editingCoupon.amount_off_twd || 0);
      setValue('min_spend', editingCoupon.min_order_twd || 0);
      setValue('valid_from', editingCoupon.starts_at ? formatDateOnly(editingCoupon.starts_at) : '');
      setValue('valid_to', editingCoupon.ends_at ? formatDateOnly(editingCoupon.ends_at) : '');
      setValue('usage_limit', editingCoupon.max_uses_total || undefined);
      setValue('is_active', editingCoupon.is_active === 1 ? 'true' : 'false');
    } else {
      reset();
    }
  }, [editingCoupon, setValue, reset]);

  const handleLocalSubmit = async (data: CouponFormData) => {
    // 前端驗證：結束日期不得早於開始日期
    const dateValidation = validateDateRange(data.valid_from, data.valid_to);
    if (!dateValidation.isValid) {
      toast.error(dateValidation.error || '日期驗證失敗');
      return;
    }

    // 前端驗證：百分比折扣不得超過100%
    if (data.discount_type === 'PERCENT' && data.discount_value > 100) {
      toast.error('折扣百分比不得超過100%');
      return;
    }

    // 將日期轉換為 UTC 格式
    const processedData = {
      ...data,
      valid_from: data.valid_from ? convertToUTCISO(data.valid_from) : undefined,
      valid_to: data.valid_to ? convertToUTCISO(data.valid_to, true) : undefined,
    };
    
    await onSubmit(processedData);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) {
        onClose();
        reset();
      }
    }}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editingCoupon ? '編輯優惠券' : '新增優惠券'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleLocalSubmit)} className="space-y-4 py-4">
          {/* 基本資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="優惠券名稱"
              required
              error={errors.name?.message}
            >
              <Input
                {...register('name', { required: '請輸入優惠券名稱' })}
                placeholder="請輸入優惠券名稱"
              />
            </FormField>

            <FormField
              label="折扣類型"
              required
              error={errors.discount_type?.message}
            >
              <Select
                {...register('discount_type', { required: '請選擇折扣類型' })}
                options={[
                  { value: 'PERCENT', label: '百分比折扣' },
                  { value: 'FIXED', label: '固定金額折扣' },
                ]}
              />
            </FormField>

            <FormField
              label={discountType === 'PERCENT' ? '折扣百分比 (%)' : '折扣金額 (元)'}
              required
              error={errors.discount_value?.message}
            >
              <Input
                {...register('discount_value', { 
                  required: '請輸入折扣值',
                  valueAsNumber: true,
                  min: { value: 0, message: '折扣值不能小於 0' },
                  max: discountType === 'PERCENT' 
                    ? { value: 100, message: '折扣百分比不能大於 100%' }
                    : undefined
                })}
                placeholder={discountType === 'PERCENT' ? '請輸入折扣百分比' : '請輸入折扣金額'}
                type="number"
                max={discountType === 'PERCENT' ? 100 : undefined}
              />
            </FormField>

            <FormField
              label="最低消費金額 (元)"
              required
              error={errors.min_spend?.message}
            >
              <Input
                {...register('min_spend', { 
                  required: '請輸入最低消費金額',
                  valueAsNumber: true,
                  min: { value: 0, message: '最低消費金額不能小於 0' }
                })}
                placeholder="請輸入最低消費金額"
                type="number"
              />
            </FormField>
          </div>

          {/* 時間設定 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="開始日期"
              required={!hasCodes}
              error={errors.valid_from?.message}
              help={hasCodes ? "優惠券已有代碼，日期無法修改" : undefined}
            >
              <Input
                {...register('valid_from', { 
                  required: hasCodes ? false : '請選擇開始日期' 
                })}
                type="date"
                min={formatDateOnly(new Date().toISOString())}
                disabled={hasCodes}
                className={hasCodes ? 'bg-gray-100 cursor-not-allowed' : ''}
                onFocus={(e) => {
                  if (!e.target.value && !hasCodes) {
                    e.target.showPicker?.();
                  }
                }}
              />
            </FormField>

            <FormField
              label="結束日期"
              required={!hasCodes}
              error={errors.valid_to?.message}
              help={hasCodes ? "優惠券已有代碼，日期無法修改" : undefined}
            >
              <Input
                {...register('valid_to', { 
                  required: hasCodes ? false : '請選擇結束日期' 
                })}
                type="date"
                min={formatDateOnly(new Date().toISOString())}
                disabled={hasCodes}
                className={hasCodes ? 'bg-gray-100 cursor-not-allowed' : ''}
                onFocus={(e) => {
                  if (!e.target.value && !hasCodes) {
                    e.target.showPicker?.();
                  }
                }}
              />
            </FormField>
          </div>

          {/* 限制設定 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="使用次數限制"
              error={errors.usage_limit?.message}
            >
              <Input
                {...register('usage_limit', { 
                  valueAsNumber: true,
                  min: { value: 1, message: '使用次數限制不能小於 1' }
                })}
                placeholder="請輸入使用次數限制"
                type="number"
              />
            </FormField>

            <FormField label="狀態">
              <Select
                {...register('is_active', { valueAsNumber: false })}
                options={[
                  { value: 'true', label: '啟用' },
                  { value: 'false', label: '停用' },
                ]}
              />
            </FormField>
          </div>

          <FormField label="優惠券描述" error={errors.description?.message}>
            <Textarea
              {...register('description')}
              placeholder="請輸入優惠券描述"
              rows={3}
            />
          </FormField>

          <div className="flex justify-end space-x-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                onClose();
                reset();
              }}
            >
              取消
            </Button>
            <Button
              type="submit"
              loading={isLoading}
            >
              {editingCoupon ? '更新' : '建立'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
