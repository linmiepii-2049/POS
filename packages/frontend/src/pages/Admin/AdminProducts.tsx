import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  useProductsList,
  useProductsCreate,
  useProductsUpdate,
  useProductsDelete,
  useProductsGetCategories,
  useUploadsProductImageLocal,
  type ProductsList200DataItem,
  type ProductsCreateBody,
  type ProductsUpdateBody,
} from '../../api/posClient';
import { Table, type TableColumn } from '../../components/Table';
import { FormField, Input, Select, Button } from '../../components/Form';
import { ProductDialog } from '../../components/ProductDialog';
import { clsx } from 'clsx';

/**
 * 產品表單資料類型
 */
interface ProductFormData {
  sku: string;
  name: string;
  description?: string;
  list_price: number;  // 原價
  unit_price: number;  // 售價
  category: string;
  is_active: string;
  image_url?: string;
}

/**
 * 產品列表篩選條件
 */
interface ProductFilters {
  search: string;
  category: string;
  is_active: string;
}

/**
 * Admin Products 頁面元件
 */
export function AdminProducts() {
  const [showDialog, setShowDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<ProductsList200DataItem | null>(null);
  const [filters, setFilters] = useState<ProductFilters>({
    search: '',
    category: '',
    is_active: '',
  });
  const [sortBy, setSortBy] = useState<string>('id');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  /**
   * 處理排序
   */
  const handleSort = (key: string, direction: 'asc' | 'desc') => {
    setSortBy(key);
    setSortDir(direction);
  };

  // API hooks
  const { data: productsResponse, isLoading, refetch } = useProductsList({
    page: 1,
    limit: 100,
    search: filters.search || undefined,
    category: filters.category || undefined,
    is_active: filters.is_active ? (filters.is_active === '1' ? 1 : 0) : undefined,
    sortBy: sortBy as any,
    sortDir: sortDir,
  });

  // 從響應中提取實際資料
  const productsData = productsResponse?.data;

  const { data: categoriesResponse } = useProductsGetCategories();

  // 從響應中提取實際資料
  // React Query 會將 API 回應包裝在 data 屬性中
  // API 回應結構: { success: true, data: [...], timestamp: ... }
  // React Query 包裝後: { data: { success: true, data: [...], timestamp: ... } }
  const categoriesData = (categoriesResponse && 'data' in categoriesResponse && categoriesResponse.data && 'data' in categoriesResponse.data) ? categoriesResponse.data.data : undefined;
  const createProductMutation = useProductsCreate({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const updateProductMutation = useProductsUpdate({
    mutation: {
      onSuccess: () => {
        refetch();
      },
    },
  });
  const deleteProductMutation = useProductsDelete();
  const uploadImageMutation = useUploadsProductImageLocal();

  /**
   * 處理圖片上傳
   */
  const handleImageUpload = async (file: File): Promise<string> => {
    try {
      console.log('=== 圖片上傳開始 ===');
      console.log('檔案資訊:', {
        name: file.name,
        size: file.size,
        type: file.type,
      });

      // 使用 SDK 的 mutation 上傳圖片
      const response = await uploadImageMutation.mutateAsync({
        data: { file }
      });

      console.log('上傳成功，回應資料:', response);
      
      // SDK 返回的結構是 { data: { success, data, timestamp }, status, headers }
      const result = (response as any).data;
      
      if (!result?.success) {
        throw new Error(result?.error || '上傳失敗');
      }
      
      const imageUrl = result.data?.public_url || `http://localhost:3000/assets/${result.data?.key}`;
      console.log('圖片 URL:', imageUrl);
      
      return imageUrl;
    } catch (error: any) {
      console.error('=== 圖片上傳錯誤 ===');
      console.error('錯誤物件:', error);
      console.error('錯誤訊息:', error?.message);
      console.error('錯誤堆疊:', error?.stack);
      
      // 確保錯誤訊息是字串
      const errorMessage = typeof error === 'string' 
        ? error 
        : error?.message || error?.toString() || '圖片上傳失敗';
      
      throw new Error(errorMessage);
    }
  };

  /**
   * 處理表單提交
   */
  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('=== 產品表單提交開始 ===');
      console.log('原始表單資料:', data);
      
      const productData: ProductsCreateBody | ProductsUpdateBody = {
        sku: data.sku,
        name: data.name,
        description: data.description || '', // 確保傳送空字串而不是 undefined
        list_price_twd: Number(data.list_price), // 統一使用元，轉換為數字
        unit_price_twd: Number(data.unit_price), // 統一使用元，轉換為數字
        category: data.category && data.category.trim() !== '' ? data.category : undefined,
        is_active: data.is_active === 'true' ? 1 : 0,
        img_url: data.image_url && data.image_url.trim() !== '' && data.image_url.startsWith('http') ? data.image_url : undefined,
      };

      console.log('準備發送的產品資料:', productData);

      if (editingProduct) {
        console.log('=== 更新產品 ===');
        console.log('產品 ID:', editingProduct.id);
        
        await updateProductMutation.mutateAsync({
          id: editingProduct.id,
          data: productData,
        });
        
        console.log('產品更新成功');
        toast.success('產品更新成功');
      } else {
        console.log('=== 創建產品 ===');
        
        await createProductMutation.mutateAsync({
          data: productData as ProductsCreateBody,
        });
        
        console.log('產品創建成功');
        toast.success('產品建立成功');
      }
    } catch (error: any) {
      console.error('=== 產品操作錯誤 ===');
      console.error('錯誤物件:', error);
      console.error('錯誤訊息:', error?.message);
      console.error('錯誤響應:', error?.response);
      console.error('錯誤狀態碼:', error?.response?.status);
      console.error('錯誤資料:', error?.response?.data);
      console.error('錯誤堆疊:', error?.stack);
      
      // 改善錯誤訊息解析邏輯
      let errorMessage = '操作失敗';
      
      // 檢查 React Query 錯誤結構
      if (error?.response?.data) {
        const errorData = error.response.data;
        console.error('錯誤資料詳情:', errorData);
        
        if (errorData.error) {
          // 處理 Zod 錯誤
          if (errorData.error.name === 'ZodError') {
            try {
              const zodErrors = JSON.parse(errorData.error.message);
              const errorMessages = zodErrors.map((err: any) => `${err.path.join('.')}: ${err.message}`).join(', ');
              errorMessage = `驗證錯誤: ${errorMessages}`;
            } catch {
              errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
            }
          } else {
            errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
          }
        } else if (errorData.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error?.message) {
        // React Query 錯誤通常會有 message 屬性
        errorMessage = error.message;
      } else if (error?.data) {
        // 檢查是否有 data 屬性
        const errorData = error.data;
        console.error('錯誤 data 詳情:', errorData);
        
        if (typeof errorData === 'string') {
          errorMessage = errorData;
        } else if (errorData?.error) {
          errorMessage = typeof errorData.error === 'string' ? errorData.error : JSON.stringify(errorData.error);
        } else if (errorData?.message) {
          errorMessage = typeof errorData.message === 'string' ? errorData.message : JSON.stringify(errorData.message);
        } else {
          errorMessage = JSON.stringify(errorData);
        }
      } else if (error?.toString) {
        errorMessage = error.toString();
      } else {
        // 最後的備用方案
        errorMessage = `未知錯誤: ${JSON.stringify(error)}`;
      }
      
      console.error('顯示錯誤訊息:', errorMessage);
      toast.error(errorMessage);
    }
  };

  /**
   * 編輯產品
   */
  const handleEdit = (product: ProductsList200DataItem) => {
    setEditingProduct(product);
    setShowDialog(true);
  };

  /**
   * 刪除產品
   */
  const handleDelete = async (product: ProductsList200DataItem) => {
    // 檢查產品 ID 是否存在
    if (!product.id) {
      toast.error('產品 ID 不存在，無法刪除');
      return;
    }

    if (!confirm(`確定要刪除產品「${product.name}」嗎？`)) return;

    try {
      await deleteProductMutation.mutateAsync({
        id: product.id,
      });
      toast.success('產品刪除成功');
      refetch();
    } catch (error: any) {
      console.error('刪除產品錯誤:', error);
      
      // 改善錯誤訊息處理
      let errorMessage = '刪除失敗';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      // 特別處理 409 Conflict 錯誤
      if (error?.response?.status === 409) {
        errorMessage = '無法刪除此產品，因為它有關聯的訂單記錄';
      }
      
      toast.error(errorMessage);
    }
  };

  /**
   * 切換產品狀態
   */
  const handleToggleStatus = async (product: ProductsList200DataItem) => {
    // 檢查產品 ID 是否存在
    if (!product.id) {
      toast.error('產品 ID 不存在，無法切換狀態');
      return;
    }

    try {
      const newStatus = product.is_active ? 0 : 1;
      
      await updateProductMutation.mutateAsync({
        id: product.id,
        data: {
          is_active: newStatus,
        },
      });
      
      toast.success(`產品已${newStatus ? '啟用' : '停用'}`);
      refetch();
    } catch (error: any) {
      console.error('切換產品狀態錯誤:', error);
      
      // 改善錯誤訊息處理
      let errorMessage = '狀態切換失敗';
      
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.error) {
          errorMessage = errorData.error;
        } else if (errorData.message) {
          errorMessage = errorData.message;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }
      
      toast.error(errorMessage);
    }
  };

  /**
   * 格式化價格顯示 (統一使用元)
   */
  const formatPrice = (price: number) => {
    return `NT$ ${price.toLocaleString()}`;
  };


  /**
   * 表格欄位定義
   */
  const columns: TableColumn<ProductsList200DataItem>[] = [
    {
      key: 'img_url',
      label: '圖片',
      width: '100px',
      render: (value, record) => {
        // 修正圖片 URL 格式，將 /api/assets/ 改為 /assets/
        const correctedUrl = value ? value.replace('/api/assets/', '/assets/') : null;
        
        return (
          <div className="w-16 h-16">
            {correctedUrl ? (
              <img
                src={correctedUrl}
                alt={record.name}
                className="w-full h-full object-cover rounded-lg border border-gray-200"
                onError={(e) => {
                  console.error('圖片載入失敗:', correctedUrl);
                  e.currentTarget.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-full h-full bg-gray-100 rounded-lg flex items-center justify-center">
                <span className="text-gray-400 text-xs">無圖片</span>
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: 'sku',
      label: 'SKU',
      render: (value, record) => (
        <div>
          <div className="font-medium text-gray-900">{value}</div>
          <div className="text-sm text-gray-500">{record.name}</div>
        </div>
      ),
    },
    {
      key: 'category',
      label: '分類',
      render: (value) => (
        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
          {value}
        </span>
      ),
    },
    {
      key: 'list_price_twd',
      label: '原價',
      render: (value) => (
        <span className="text-gray-500 line-through">
          {formatPrice(value)}
        </span>
      ),
    },
    {
      key: 'unit_price_twd',
      label: '售價',
      render: (value) => (
        <span className="font-medium text-green-600">
          {formatPrice(value)}
        </span>
      ),
    },
    {
      key: 'is_active',
      label: '狀態',
      render: (value, record) => (
        <button
          onClick={() => handleToggleStatus(record)}
          className={clsx(
            'px-2 py-1 text-xs font-medium rounded-full cursor-pointer transition-colors hover:opacity-80',
            value ? 'bg-green-100 text-green-800 hover:bg-green-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
          )}
          disabled={updateProductMutation.isPending}
        >
          {value ? '啟用' : '停用'}
        </button>
      ),
    },
    {
      key: 'current_month_sales',
      label: '本月賣出數量',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-blue-600">
          {value || 0}
        </span>
      ),
    },
    {
      key: 'last_month_sales',
      label: '上月賣出數量',
      sortable: true,
      render: (value) => (
        <span className="font-medium text-gray-600">
          {value || 0}
        </span>
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
          <h2 className="text-2xl font-bold text-gray-900">商品管理</h2>
          <p className="text-gray-600">管理系統商品資料</p>
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
              setEditingProduct(null);
              setShowDialog(true);
            }}
          >
            新增商品
          </Button>
        </div>
      </div>

      {/* 篩選條件 */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <FormField label="搜尋">
            <Input
              placeholder="搜尋 SKU 或商品名稱"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            />
          </FormField>
          <FormField label="分類">
            <Select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value })}
              options={[
                { value: '', label: '全部分類' },
                ...(Array.isArray(categoriesData) ? categoriesData.map((cat: string) => ({ value: cat, label: cat })) : []),
              ]}
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

      {/* 商品對話框 */}
      <ProductDialog
        isOpen={showDialog}
        onClose={() => {
          setShowDialog(false);
          setEditingProduct(null);
        }}
        onSubmit={onSubmit}
        onImageUpload={handleImageUpload}
        editingProduct={editingProduct}
        categories={Array.isArray(categoriesData) ? categoriesData : []}
        isLoading={createProductMutation.isPending || updateProductMutation.isPending}
      />

      {/* 商品列表 */}
      <Table
        columns={columns}
        data={(productsData && 'data' in productsData) ? (productsData.data || []) : []}
        loading={isLoading}
        emptyText="暫無商品資料"
        sortBy={sortBy}
        sortDir={sortDir}
        onSort={handleSort}
      />
    </div>
  );
}