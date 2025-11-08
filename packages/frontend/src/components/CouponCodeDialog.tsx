import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import {
  useCouponCodesList,
  useCouponCodesCreate,
  useCouponCodesDelete,
  useCouponsGet,
  type CouponCodesList200DataItem,
  type CouponCodesCreateBody,
} from '../api/posClient';
import { Table, type TableColumn } from './Table';
import { FormField, Input, Button } from './Form';
import { convertToUTCISO, validateDateRange, isDateInRange, formatDateOnly } from '../utils/time';
import { clsx } from 'clsx';

/**
 * 優惠券代碼表單資料類型
 */
interface CouponCodeFormData {
  code: string;
  max_redemptions?: number;
  starts_at?: string;
  ends_at?: string;
  expires_after_days?: number;
}

/**
 * 優惠券代碼管理對話框屬性
 */
interface CouponCodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  couponId: number;
  couponName: string;
}

/**
 * 優惠券代碼管理對話框
 */
export function CouponCodeDialog({ isOpen, onClose, couponId, couponName }: CouponCodeDialogProps) {
  // 表單處理
  const {
    register: registerCode,
    handleSubmit: handleSubmitCode,
    reset: resetCode,
    watch,
    formState: { errors: codeErrors },
  } = useForm<CouponCodeFormData>({
    defaultValues: {
      code: '',
      max_redemptions: undefined,
      starts_at: '',
      ends_at: '',
      expires_after_days: undefined,
    },
  });

  // API 查詢
  const { data: codesData, isLoading: codesLoading, error: codesError, refetch: refetchCodes } = useCouponCodesList({
    page: 1,
    limit: 100,
    coupon_id: couponId,
  });

  // 獲取父優惠券資訊
  const { data: couponData, isLoading: couponLoading } = useCouponsGet(couponId);
  const parentCoupon = couponData?.data?.data;

  // 監聽表單變化，進行即時驗證
  const watchedValues = watch();
  const [validationError, setValidationError] = useState<string | null>(null);

  useEffect(() => {
    if (parentCoupon && (watchedValues.starts_at || watchedValues.ends_at || watchedValues.expires_after_days)) {
      const error = validateCodeTimeBounds(watchedValues);
      setValidationError(error);
    } else {
      setValidationError(null);
    }
  }, [watchedValues, parentCoupon]);



  // API 操作
  const createCodeMutation = useCouponCodesCreate();
  const deleteCodeMutation = useCouponCodesDelete();


  /**
   * 驗證代碼時間是否超出父優惠券範圍
   */
  const validateCodeTimeBounds = (data: CouponCodeFormData): string | null => {
    if (!parentCoupon) return null;

    // 檢查日期範圍是否有效
    const dateValidation = validateDateRange(data.starts_at, data.ends_at);
    if (!dateValidation.isValid) {
      return dateValidation.error || '日期驗證失敗';
    }

    // 檢查是否在父優惠券時間範圍內
    if (data.starts_at && !isDateInRange(data.starts_at, parentCoupon.starts_at, parentCoupon.ends_at)) {
      return `代碼開始時間必須在優惠券有效期間內 (${formatDateOnly(parentCoupon.starts_at)} - ${formatDateOnly(parentCoupon.ends_at)})`;
    }

    if (data.ends_at && !isDateInRange(data.ends_at, parentCoupon.starts_at, parentCoupon.ends_at)) {
      return `代碼結束時間必須在優惠券有效期間內 (${formatDateOnly(parentCoupon.starts_at)} - ${formatDateOnly(parentCoupon.ends_at)})`;
    }

    // 檢查取得後有效天數 - 天數不受父級期效限制，因為每個人拿到代碼的時間不同
    // 所以這裡不需要檢查 expires_after_days 是否超出父優惠券時間

    return null;
  };

  /**
   * 提交優惠券代碼
   */
  const onSubmitCode = async (data: CouponCodeFormData) => {
    try {
      // 驗證時間範圍
      const validationError = validateCodeTimeBounds(data);
      if (validationError) {
        toast.error(validationError);
        return;
      }

      // 驗證數量限制
      if (parentCoupon?.max_uses_total) {
        const existingTotal = codesData?.data?.data?.reduce((sum: number, code: any) => {
          return sum + (code.max_redemptions || 0);
        }, 0) || 0;
        
        if (existingTotal + data.max_redemptions > parentCoupon.max_uses_total) {
          toast.error(`代碼總量不能超過優惠券總量。目前使用：${existingTotal}，優惠券總量：${parentCoupon.max_uses_total}，新增數量：${data.max_redemptions}`);
          return;
        }
      }

      const createData: CouponCodesCreateBody = {
        coupon_id: couponId,
        code: data.code,
        max_redemptions: data.max_redemptions,
        starts_at: data.starts_at ? convertToUTCISO(data.starts_at) : undefined,
        ends_at: data.ends_at ? convertToUTCISO(data.ends_at, true) : undefined,
        expires_after_days: data.expires_after_days || undefined,
        is_active: 1, // 預設啟用
      };

      const result = await createCodeMutation.mutateAsync({ data: createData });
      
      console.log('API 回應結果:', result);
      
      // 只有在真正成功時才顯示 success toast
      if (result && result.status === 201) {
        toast.success('優惠券代碼新增成功');
        resetCode();
        refetchCodes();
      } else {
        console.log('API 回應不是成功狀態:', result);
        
        // 處理 409 衝突錯誤（代碼重複）
        if (result.status === 409) {
          toast.error('優惠券代碼已存在');
        } else {
          toast.error('API 回應異常');
        }
      }
    } catch (error: any) {
      console.error('新增優惠券代碼失敗:', error);
      console.error('錯誤對象結構:', {
        error,
        response: error?.response,
        data: error?.response?.data,
        message: error?.message,
        status: error?.response?.status
      });
      
      // 處理不同類型的錯誤
      let errorMessage = '新增優惠券代碼失敗';
      
      if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      console.log('將要顯示的錯誤訊息:', errorMessage);
      toast.error(errorMessage);
    }
  };

  /**
   * 刪除優惠券代碼
   */
  const handleDeleteCode = async (id: number) => {
    if (!confirm('確定要刪除此優惠券代碼嗎？')) return;

    try {
      const response = await deleteCodeMutation.mutateAsync({ id });
      
      // 檢查響應狀態碼
      if (response.status === 200) {
        toast.success('優惠券代碼刪除成功');
        refetchCodes();
      } else if (response.status === 409) {
        // 處理衝突錯誤
        const errorData = response.data as any;
        const errorMessage = errorData?.error || '無法刪除此優惠券代碼';
        
        if (errorMessage.includes('無法刪除有兌換記錄的優惠券代碼')) {
          toast.error('無法刪除：此優惠券代碼已有兌換記錄，請先處理相關訂單');
        } else if (errorMessage.includes('無法刪除有授權記錄的優惠券代碼')) {
          toast.error('無法刪除：此優惠券代碼已有授權記錄，請先處理相關授權');
        } else {
          toast.error(`無法刪除：${errorMessage}`);
        }
      } else if (response.status === 404) {
        toast.error('優惠券代碼不存在');
      } else {
        toast.error('刪除優惠券代碼失敗');
      }
    } catch (error: any) {
      console.error('刪除優惠券代碼失敗:', error);
      toast.error('刪除優惠券代碼失敗');
    }
  };

  // 優惠券代碼表格欄位定義
  const codeColumns: TableColumn<CouponCodesList200DataItem>[] = [
    {
      key: 'code',
      label: '代碼',
      render: (value) => (
        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
          {value}
        </span>
      ),
    },
    {
      key: 'valid_period',
      label: '有效時間',
      render: (_, record) => {
        // 判斷是否為天數定義的代碼（有 expires_after_days 就優先顯示天數邏輯）
        const isDaysBased = record.expires_after_days;
        
        if (isDaysBased && parentCoupon?.starts_at && parentCoupon?.ends_at) {
          // 天數定義的代碼：計算最晚取得時間
          const parentStart = new Date(parentCoupon.starts_at);
          const parentEnd = new Date(parentCoupon.ends_at);
          const latestAcquisitionDate = new Date(parentEnd);
          latestAcquisitionDate.setDate(parentEnd.getDate() - record.expires_after_days!);
          
          // 確保最晚取得時間不早於父優惠券開始時間
          const actualLatestAcquisition = latestAcquisitionDate < parentStart ? parentStart : latestAcquisitionDate;
          
          return (
            <div className="text-sm">
              <div className="text-gray-600">
                最晚取得: {formatDateOnly(actualLatestAcquisition.toISOString())}
              </div>
              <div className="text-gray-600">
                結束: 依實際取得時間為主
              </div>
            </div>
          );
        }
        
        // 一般代碼：如果代碼沒有設定時間，使用父優惠券的時間
        const startTime = record.starts_at 
          ? formatDateOnly(record.starts_at)
          : (parentCoupon?.starts_at 
              ? formatDateOnly(parentCoupon.starts_at)
              : '無限制');
        const endTime = record.ends_at 
          ? formatDateOnly(record.ends_at)
          : (parentCoupon?.ends_at 
              ? formatDateOnly(parentCoupon.ends_at)
              : '無限制');
        
        return (
          <div className="text-sm">
            <div className="text-gray-600">
              開始: {startTime}
              {!record.starts_at && parentCoupon?.starts_at && (
                <span className="text-blue-600 text-xs ml-1">(父級)</span>
              )}
            </div>
            <div className="text-gray-600">
              結束: {endTime}
              {!record.ends_at && parentCoupon?.ends_at && (
                <span className="text-blue-600 text-xs ml-1">(父級)</span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      key: 'max_redemptions',
      label: '數量限制',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? `${value} 次` : '無限制'}
        </span>
      ),
    },
    {
      key: 'expires_after_days',
      label: '取得後有效天數',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {value ? `${value} 天` : '無限制'}
        </span>
      ),
    },
    {
      key: 'created_at',
      label: '建立時間',
      render: (value) => (
        <span className="text-sm text-gray-600">
          {format(new Date(value), 'yyyy-MM-dd HH:mm', { locale: zhTW })}
        </span>
      ),
    },
    {
      key: 'delete',
      label: '操作',
      render: (_, record) => {
        return (
          <div className="flex space-x-2">
            <button
              onClick={() => handleDeleteCode(record.id)}
              className="text-red-600 hover:text-red-800 text-sm font-medium"
              disabled={deleteCodeMutation.isPending}
            >
              刪除
            </button>
          </div>
        );
      },
    },
  ];

  if (!isOpen) return null;

  // 顯示載入狀態
  if (couponLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">載入優惠券資訊中...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 如果無法載入優惠券資訊，顯示錯誤
  if (!parentCoupon) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
          <div className="p-6 text-center">
            <div className="text-red-500 mb-4">
              <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">無法載入優惠券資訊</h3>
            <p className="text-gray-600 mb-4">請檢查網路連線或稍後再試</p>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              關閉
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden">
        {/* 標題欄 */}
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              管理優惠券代碼 - {couponName}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* 內容區域 */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {/* 優惠券總量資訊 */}
          {parentCoupon?.max_uses_total && (
            <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center justify-between text-sm">
                <span className="text-blue-700">
                  <strong>優惠券總量：</strong>{parentCoupon.max_uses_total.toLocaleString()} 次
                </span>
                <span className="text-blue-600">
                  <strong>已分配：</strong>
                  {codesData?.data?.data?.reduce((sum: number, code: any) => sum + (code.max_redemptions || 0), 0).toLocaleString() || 0} 次
                </span>
                <span className="text-blue-800 font-semibold">
                  <strong>剩餘：</strong>
                  {Math.max(0, parentCoupon.max_uses_total - (codesData?.data?.data?.reduce((sum: number, code: any) => sum + (code.max_redemptions || 0), 0) || 0)).toLocaleString()} 次
                </span>
              </div>
            </div>
          )}

          {/* 新增代碼表單 */}
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">新增優惠券代碼</h3>
            
            <form onSubmit={handleSubmitCode(onSubmitCode)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="代碼"
                  required
                  error={codeErrors.code?.message}
                >
                  <Input
                    {...registerCode('code', { required: '請輸入代碼' })}
                    placeholder="請輸入優惠券代碼"
                  />
                </FormField>

                <FormField
                  label="數量限制"
                  required
                  error={codeErrors.max_redemptions?.message}
                  help="此代碼最多可使用次數"
                >
                  <Input
                    {...registerCode('max_redemptions', { 
                      required: '請輸入數量限制',
                      valueAsNumber: true,
                      min: { value: 1, message: '數量必須大於 0' }
                    })}
                    placeholder="例如：100"
                    type="number"
                    min="1"
                  />
                </FormField>

                <FormField
                  label="取得後有效天數"
                  error={codeErrors.expires_after_days?.message}
                  help="客戶取得後多少天內有效，留空表示無限制"
                >
                  <Input
                    {...registerCode('expires_after_days', { valueAsNumber: true })}
                    placeholder="例如：30"
                    type="number"
                    min="1"
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  label="開始日期"
                  error={codeErrors.starts_at?.message}
                  help={
                    parentCoupon?.starts_at && parentCoupon?.ends_at
                      ? `必須在優惠券有效期間內：${formatDateOnly(parentCoupon.starts_at)} - ${formatDateOnly(parentCoupon.ends_at)}`
                      : parentCoupon?.starts_at
                        ? `最早從：${formatDateOnly(parentCoupon.starts_at)}開始`
                        : "明確的有效開始日期，留空表示立即生效"
                  }
                >
                  <div className="relative">
                    <Input
                      {...registerCode('starts_at')}
                      type="date"
                      min={
                        parentCoupon?.starts_at 
                          ? formatDateOnly(parentCoupon.starts_at)
                          : formatDateOnly(new Date().toISOString())
                      }
                      max={
                        parentCoupon?.ends_at 
                          ? formatDateOnly(parentCoupon.ends_at)
                          : undefined
                      }
                      onFocus={(e) => {
                        if (!e.target.value) {
                          e.target.showPicker?.();
                        }
                      }}
                      className="relative z-10"
                    />
                    {!watch('starts_at') && (
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none text-gray-400">
                        年/月/日
                      </div>
                    )}
                  </div>
                </FormField>

                <FormField
                  label="結束日期"
                  error={codeErrors.ends_at?.message}
                  help={
                    parentCoupon?.starts_at && parentCoupon?.ends_at
                      ? `必須在優惠券有效期間內：${formatDateOnly(parentCoupon.starts_at)} - ${formatDateOnly(parentCoupon.ends_at)}`
                      : parentCoupon?.ends_at
                        ? `最晚到：${formatDateOnly(parentCoupon.ends_at)}結束`
                        : "明確的有效結束日期，留空表示無限制"
                  }
                >
                  <div className="relative">
                    <Input
                      {...registerCode('ends_at')}
                      type="date"
                      min={
                        parentCoupon?.starts_at 
                          ? formatDateOnly(parentCoupon.starts_at)
                          : formatDateOnly(new Date().toISOString())
                      }
                      max={
                        parentCoupon?.ends_at 
                          ? formatDateOnly(parentCoupon.ends_at)
                          : undefined
                      }
                      onFocus={(e) => {
                        if (!e.target.value) {
                          e.target.showPicker?.();
                        }
                      }}
                      className="relative z-10"
                    />
                    {!watch('ends_at') && (
                      <div className="absolute inset-0 flex items-center px-3 pointer-events-none text-gray-400">
                        年/月/日
                      </div>
                    )}
                  </div>
                </FormField>
              </div>

              {/* 驗證錯誤顯示 */}
              {validationError && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-800">{validationError}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex justify-end">
                <Button
                  type="submit"
                  loading={createCodeMutation.isPending}
                  disabled={!!validationError}
                >
                  新增代碼
                </Button>
              </div>
            </form>
          </div>

          {/* 代碼列表 */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">優惠券代碼列表</h3>
            <div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">代碼</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">有效時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">數量限制</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">取得後有效天數</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">建立時間</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {codesData?.data?.data?.map((record) => (
                      <tr key={record.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                            {record.code}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="text-sm">
                            {(() => {
                              // 判斷是否為天數定義的代碼（有 expires_after_days 就優先顯示天數邏輯）
                              const isDaysBased = record.expires_after_days;
                              
                              if (isDaysBased && parentCoupon?.starts_at && parentCoupon?.ends_at) {
                                // 天數定義的代碼：計算最晚取得時間
                                const parentStart = new Date(parentCoupon.starts_at);
                                const parentEnd = new Date(parentCoupon.ends_at);
                                const latestAcquisitionDate = new Date(parentEnd);
                                latestAcquisitionDate.setDate(parentEnd.getDate() - record.expires_after_days!);
                                
                                // 確保最晚取得時間不早於父優惠券開始時間
                                const actualLatestAcquisition = latestAcquisitionDate < parentStart ? parentStart : latestAcquisitionDate;
                                
                                return (
                                  <>
                                    <div className="text-gray-600">
                                      最晚取得: {formatDateOnly(actualLatestAcquisition.toISOString())}
                                    </div>
                                    <div className="text-gray-600">
                                      結束: 依實際取得時間為主
                                    </div>
                                  </>
                                );
                              }
                              
                              // 一般代碼
                              return (
                                <>
                                  <div className="text-gray-600">
                                    開始: {record.starts_at ? formatDateOnly(record.starts_at) : '無限制'}
                                  </div>
                                  <div className="text-gray-600">
                                    結束: {record.ends_at ? formatDateOnly(record.ends_at) : '無限制'}
                                  </div>
                                </>
                              );
                            })()}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-sm text-gray-600">
                            {record.max_redemptions ? `${record.max_redemptions} 次` : '無限制'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-sm text-gray-600">
                            {record.expires_after_days ? `${record.expires_after_days} 天` : '無限制'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="text-sm text-gray-600">
                            {format(new Date(record.created_at), 'yyyy-MM-dd HH:mm', { locale: zhTW })}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleDeleteCode(record.id)}
                              className="text-red-600 hover:text-red-800 text-sm font-medium"
                              disabled={deleteCodeMutation.isPending}
                            >
                              刪除
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) || []}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>

        {/* 底部按鈕 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <div className="flex justify-end">
            <Button
              variant="secondary"
              onClick={onClose}
            >
              關閉
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
