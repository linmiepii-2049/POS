import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Button, FormField, Input, Textarea } from './Form';
import { ImageUploader } from './Uploader';
import { useForm } from 'react-hook-form';
import { toast } from 'react-hot-toast';

interface ProductFormData {
  sku: string;
  name: string;
  list_price: number;
  unit_price: number;
  category: string;
  is_active: string;
  description: string;
  image_url: string;
}

interface ProductDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  onImageUpload: (file: File) => Promise<string>;
  editingProduct?: any;
  categories: string[];
  isLoading?: boolean;
}

export const ProductDialog: React.FC<ProductDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  onImageUpload,
  editingProduct,
  categories,
  isLoading = false,
}) => {
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<ProductFormData>({
    defaultValues: {
      sku: '',
      name: '',
      list_price: 0,
      unit_price: 0,
      category: '',
      is_active: 'true',
      description: '',
      image_url: '',
    },
  });

  // 當編輯商品時，填充表單數據
  React.useEffect(() => {
    if (editingProduct) {
      setValue('sku', editingProduct.sku || '');
      setValue('name', editingProduct.name || '');
      setValue('list_price', editingProduct.list_price_twd || 0);
      setValue('unit_price', editingProduct.unit_price_twd || 0);
      setValue('category', editingProduct.category || '');
      setValue('is_active', editingProduct.is_active === 1 ? 'true' : 'false');
      setValue('description', editingProduct.description || '');
      setValue('image_url', editingProduct.img_url || '');
    } else {
      reset();
    }
  }, [editingProduct, setValue, reset]);

  const handleFormSubmit = async (data: ProductFormData) => {
    try {
      await onSubmit(data);
      onClose();
      reset();
    } catch (error) {
      console.error('表單提交錯誤:', error);
    }
  };

  const handleImageUpload = async (file: File) => {
    try {
      const imageUrl = await onImageUpload(file);
      setValue('image_url', imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('圖片上傳錯誤:', error);
      throw error;
    }
  };

  const handleClose = () => {
    onClose();
    reset();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {editingProduct ? '編輯商品' : '新增商品'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              label="SKU *"
              error={errors.sku?.message}
            >
              <Input
                {...register('sku', { required: '請輸入商品 SKU' })}
                placeholder="請輸入商品 SKU"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="商品名稱 *"
              error={errors.name?.message}
            >
              <Input
                {...register('name', { required: '請輸入商品名稱' })}
                placeholder="請輸入商品名稱"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="原價 (元) *"
              error={errors.list_price?.message}
            >
              <Input
                type="number"
                {...register('list_price', { 
                  required: '請輸入原價',
                  min: { value: 0, message: '原價不能小於 0' }
                })}
                placeholder="請輸入原價"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="售價 (元) *"
              error={errors.unit_price?.message}
            >
              <Input
                type="number"
                {...register('unit_price', { 
                  required: '請輸入售價',
                  min: { value: 0, message: '售價不能小於 0' }
                })}
                placeholder="請輸入售價"
                disabled={isLoading}
              />
            </FormField>

            <FormField
              label="分類 *"
              error={errors.category?.message}
            >
              <div className="relative">
                <input
                  {...register('category', { required: '請輸入分類' })}
                  placeholder="請輸入或選擇分類"
                  className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={isLoading}
                  autoComplete="off"
                  onFocus={() => setShowCategoryDropdown(true)}
                  onBlur={() => setTimeout(() => setShowCategoryDropdown(false), 200)}
                />
                <div 
                  className="absolute inset-y-0 right-0 flex items-center pr-3 cursor-pointer"
                  onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}
                >
                  <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
                {/* 建議選項 */}
                {showCategoryDropdown && (
                  <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-40 overflow-auto">
                    {categories.map((category) => (
                      <div
                        key={category}
                        className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                        onClick={() => {
                          setValue('category', category);
                          setShowCategoryDropdown(false);
                        }}
                      >
                        {category}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </FormField>

            <FormField
              label="狀態"
              error={errors.is_active?.message}
            >
              <select
                {...register('is_active')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                disabled={isLoading}
              >
                <option value="true">啟用</option>
                <option value="false">停用</option>
              </select>
            </FormField>
          </div>

          <FormField
            label="商品描述"
            error={errors.description?.message}
          >
            <Textarea
              {...register('description')}
              placeholder="請輸入商品描述"
              rows={3}
              disabled={isLoading}
            />
          </FormField>

          <FormField
            label="商品圖片"
            error={errors.image_url?.message}
          >
            <ImageUploader
              onUpload={handleImageUpload}
              onSuccess={(url) => setValue('image_url', url)}
              onError={(error) => toast.error(error.message)}
              disabled={isLoading}
              currentImageUrl={watch('image_url')}
            />
          </FormField>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? '處理中...' : (editingProduct ? '更新' : '新增')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
