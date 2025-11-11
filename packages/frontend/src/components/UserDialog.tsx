import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button, FormField, Input, Select } from './Form';
import { useForm } from 'react-hook-form';

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

export const UserDialog: React.FC<UserDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingUser,
  isLoading = false,
}) => {

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
