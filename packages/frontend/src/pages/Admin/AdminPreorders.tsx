import { useState } from 'react';
import toast from 'react-hot-toast';
import {
  usePreordersAdminList,
  usePreordersAdminCreate,
  usePreordersAdminUpdate,
  usePreordersAdminDelete,
  useProductsList,
} from '../../api/posClient';
import { Table, type TableColumn } from '../../components/Table';
import { Button, FormField, Input, Textarea } from '../../components/Form';
import { ProductSelector, type SelectedProduct } from '../../components/ProductSelector';

interface PreorderCampaignProduct {
  productId: number;
  productName: string;
  productPriceTwd: number;
  productImageUrl: string | null;
  supplyQuantity: number;
  reservedQuantity: number;
  remainingQuantity: number;
}

interface PreorderCampaign {
  id: number;
  campaignName: string;
  campaignCopy: string;
  products: PreorderCampaignProduct[];
  startsAtTaipei: string;
  endsAtTaipei: string;
  isActive: boolean;
}

interface PreorderFormState {
  campaignName: string;
  campaignCopy: string;
  selectedProducts: SelectedProduct[];
  startsAt: string;
  endsAt: string;
}

const DEFAULT_FORM: PreorderFormState = {
  campaignName: '',
  campaignCopy: '',
  selectedProducts: [],
  startsAt: '',
  endsAt: '',
};

const formatDateInput = (value: string): string => {
  if (!value) {
    return '';
  }
  // 如果是完整的日期時間字串，只取日期部分
  if (value.includes('T')) {
    return value.split('T')[0];
  }
  return value;
};

const displayTaipeiDate = (value: string): string => {
  if (!value) {
    return '';
  }
  // 如果是完整的日期時間字串，只取日期部分
  if (value.includes('T') || value.includes(' ')) {
    return value.split('T')[0].split(' ')[0];
  }
  return value;
};

/**
 * 預購檔期管理頁面
 */
export function AdminPreorders() {
  const [formState, setFormState] = useState<PreorderFormState>(DEFAULT_FORM);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isProductSelectorOpen, setIsProductSelectorOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  const { data: campaignResponse, isLoading, refetch } = usePreordersAdminList({
    page: 1,
    limit: 100,
    sortBy: 'starts_at',
    sortDir: 'desc',
    isActive: filterStatus === 'all' ? undefined : filterStatus === 'active' ? 1 : 0,
  });

  // 從響應中提取實際資料（參考 AdminProducts 頁面的方式）
  const campaignsData = campaignResponse?.data;
  const campaigns = (campaignsData && 'data' in campaignsData && Array.isArray(campaignsData.data))
    ? campaignsData.data
    : [];

  const { data: productResponse } = useProductsList({
    page: 1,
    limit: 100, // 後端限制最大值為 100
    is_active: 1,
    sortBy: 'name',
    sortDir: 'asc',
  });

  // 從響應中提取實際資料（參考 AdminProducts 和 POS 頁面的方式）
  const productsData = productResponse?.data;
  
  // 提取商品列表（與 AdminProducts 頁面一致）
  const products = (productsData && 'data' in productsData && Array.isArray(productsData.data))
    ? productsData.data
    : [];

  const createMutation = usePreordersAdminCreate({
    mutation: {
      onSuccess: () => {
        toast.success('預購檔期建立成功');
        refetch();
        closeForm();
      },
    },
  });

  const updateMutation = usePreordersAdminUpdate({
    mutation: {
      onSuccess: () => {
        toast.success('預購檔期更新成功');
        refetch();
        closeForm();
      },
    },
  });

  const deleteMutation = usePreordersAdminDelete({
    mutation: {
      onSuccess: () => {
        toast.success('預購檔期已刪除');
        refetch();
      },
    },
  });

  const openCreateForm = () => {
    setEditingId(null);
    setFormState(DEFAULT_FORM);
    setIsFormOpen(true);
  };

  const openEditForm = (campaign: PreorderCampaign) => {
    setEditingId(campaign.id);
    setFormState({
      campaignName: campaign.campaignName,
      campaignCopy: campaign.campaignCopy,
      selectedProducts: campaign.products.map((p) => ({
        id: p.productId,
        name: p.productName,
        unit_price_twd: p.productPriceTwd,
        img_url: p.productImageUrl,
        supplyQuantity: p.supplyQuantity,
      })),
      startsAt: formatDateInput(campaign.startsAtTaipei),
      endsAt: formatDateInput(campaign.endsAtTaipei),
    });
    setIsFormOpen(true);
  };

  const closeForm = () => {
    setIsFormOpen(false);
    setFormState(DEFAULT_FORM);
    setEditingId(null);
  };

  const handleFormChange = (field: keyof PreorderFormState, value: string | SelectedProduct[]) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleProductQuantityChange = (productId: number, quantity: number) => {
    setFormState((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.map((p) =>
        p.id === productId ? { ...p, supplyQuantity: Math.max(1, quantity) } : p,
      ),
    }));
  };

  const handleRemoveProduct = (productId: number) => {
    setFormState((prev) => ({
      ...prev,
      selectedProducts: prev.selectedProducts.filter((p) => p.id !== productId),
    }));
  };

  const extractErrorMessage = (error: unknown, fallback: string): string => {
    if (typeof error === 'object' && error !== null && 'response' in error) {
      const response = (error as { response?: { data?: { message?: string; code?: string } } }).response;
      return response?.data?.message ?? response?.data?.code ?? fallback;
    }
    if (error instanceof Error) {
      return error.message || fallback;
    }
    return fallback;
  };

  const handleSubmit = async () => {
    if (!formState.campaignName || !formState.campaignCopy || formState.selectedProducts.length === 0 || !formState.startsAt || !formState.endsAt) {
      toast.error('請填寫必要欄位');
      return;
    }

    const payload = {
      campaignName: formState.campaignName.trim(),
      campaignCopy: formState.campaignCopy.trim(),
      products: formState.selectedProducts.map((p) => ({
        productId: p.id,
        supplyQuantity: p.supplyQuantity,
      })),
      startsAt: formState.startsAt,
      endsAt: formState.endsAt,
      isActive: false,
    };

    try {
      if (editingId) {
        await updateMutation.mutateAsync({
          id: editingId,
          data: payload,
        });
      } else {
        await createMutation.mutateAsync({
          data: payload,
        });
      }
    } catch (error) {
      toast.error(extractErrorMessage(error, '操作失敗'));
    }
  };

  const handleDelete = async (campaign: PreorderCampaign) => {
    if (!window.confirm(`確定要刪除檔期「${campaign.campaignName}」嗎？`)) {
      return;
    }

    try {
      await deleteMutation.mutateAsync({ id: campaign.id });
    } catch (error) {
      toast.error(extractErrorMessage(error, '刪除失敗'));
    }
  };

  const handleSetActive = async (campaign: PreorderCampaign) => {
    try {
      await updateMutation.mutateAsync({
        id: campaign.id,
        data: { isActive: true },
      });
    } catch (error) {
      toast.error(extractErrorMessage(error, '切換失敗'));
    }
  };

  const columns: TableColumn<PreorderCampaign>[] = [
    {
      key: 'campaignName',
      label: '預購名稱',
      render: (value) => <p className="font-semibold text-gray-900">{value}</p>,
    },
    {
      key: 'products',
      label: '商品',
      render: (value: PreorderCampaignProduct[]) => {
        const totalLength = value.reduce((sum, p) => sum + p.productName.length, 0);
        const shouldWrap = totalLength > 12;
        
        return (
          <div className={`flex flex-wrap gap-1 text-sm text-gray-700 ${shouldWrap ? '' : 'whitespace-nowrap'}`}>
            {value.map((p, index) => (
              <span key={p.productId} className="font-medium">
                {p.productName}
                {index < value.length - 1 && <span className="text-gray-400 mx-1">、</span>}
              </span>
            ))}
          </div>
        );
      },
    },
      {
        key: 'startsAtTaipei',
        label: '檔期日期',
        render: (_, record) => (
          <div className="text-sm text-gray-700">
            <p>{displayTaipeiDate(record.startsAtTaipei)}</p>
            <p className="text-gray-500">至 {displayTaipeiDate(record.endsAtTaipei)}</p>
          </div>
        ),
      },
    {
      key: 'isActive',
      label: '狀態',
      render: (value) => (
        <span
          className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${
            value
              ? 'bg-green-50 text-green-700 border border-green-200'
              : 'bg-gray-100 text-gray-600 border border-gray-200'
          }`}
        >
          {value ? '啟用中' : '未啟用'}
        </span>
      ),
    },
    {
      key: 'actions',
      label: '操作',
      render: (_, record) => (
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => openEditForm(record)}>
            編輯
          </Button>
          {!record.isActive && (
            <Button variant="success" size="sm" onClick={() => handleSetActive(record)}>
              設為啟用
            </Button>
          )}
          <Button variant="danger" size="sm" onClick={() => handleDelete(record)}>
            刪除
          </Button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">預購管理</h1>
          <p className="text-gray-500 mt-1">設定商品預購檔期</p>
        </div>
        <Button onClick={openCreateForm}>新增預購檔期</Button>
      </div>

      <div className="bg-white rounded-lg shadow p-4 flex flex-wrap gap-4">
        <FormField label="檔期狀態">
          <select
            value={filterStatus}
            onChange={(event) => setFilterStatus(event.target.value as 'all' | 'active' | 'inactive')}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">全部檔期</option>
            <option value="active">啟用中</option>
            <option value="inactive">未啟用</option>
          </select>
        </FormField>
      </div>

      <Table<PreorderCampaign> columns={columns} data={campaigns} loading={isLoading} emptyText="尚未建立預購檔期" />

      {isFormOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-xl font-semibold text-gray-900">{editingId ? '編輯預購檔期' : '新增預購檔期'}</h2>
              <Button variant="ghost" onClick={closeForm}>
                關閉
              </Button>
            </div>

            <div className="p-6 space-y-4">
              <FormField label="預購名稱" required>
                <Input
                  value={formState.campaignName}
                  onChange={(event) => handleFormChange('campaignName', event.target.value)}
                  placeholder="輸入預購名稱"
                />
              </FormField>

              <FormField label="預購文案" required>
                <Textarea
                  value={formState.campaignCopy}
                  rows={8}
                  maxLength={300}
                  onChange={(event) => handleFormChange('campaignCopy', event.target.value)}
                  placeholder="輸入預購文案（最多300字）"
                  className="resize-none"
                />
                <p className="text-xs text-gray-500 mt-1">{formState.campaignCopy.length}/300</p>
              </FormField>

              <FormField label="預購商品" required>
                <div className="space-y-3">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setIsProductSelectorOpen(true)}
                    className="w-full"
                  >
                    {formState.selectedProducts.length === 0 ? '選擇商品' : '修改商品選擇'}
                  </Button>

                  {formState.selectedProducts.length > 0 && (
                    <div className="border border-gray-200 rounded-lg p-4 space-y-3">
                      {formState.selectedProducts.map((product) => (
                        <div key={product.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 flex-1">
                            {product.img_url && (
                              <img src={product.img_url} alt={product.name} className="w-12 h-12 object-cover rounded" />
                            )}
                            <div className="flex-1">
                              <p className="font-medium text-gray-900">{product.name}</p>
                              <p className="text-sm text-gray-500">NT${product.unit_price_twd}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                              <label className="text-sm text-gray-700">供應數量:</label>
                              <input
                                type="number"
                                min="1"
                                value={product.supplyQuantity}
                                onChange={(e) => handleProductQuantityChange(product.id, Number(e.target.value))}
                                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                              />
                            </div>
                            <Button variant="danger" size="sm" onClick={() => handleRemoveProduct(product.id)}>
                              移除
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="開始日期" required>
                  <Input
                    type="date"
                    value={formState.startsAt}
                    onChange={(event) => handleFormChange('startsAt', event.target.value)}
                  />
                </FormField>
                <FormField label="結束日期" required>
                  <Input
                    type="date"
                    value={formState.endsAt}
                    onChange={(event) => handleFormChange('endsAt', event.target.value)}
                  />
                </FormField>
              </div>
            </div>

            <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
              <Button variant="ghost" onClick={closeForm}>
                取消
              </Button>
              <Button onClick={handleSubmit} loading={createMutation.isPending || updateMutation.isPending}>
                {editingId ? '更新' : '建立'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {isProductSelectorOpen && (
        <ProductSelector
          products={
            Array.isArray(products) && products.length > 0
              ? products.map((p: Record<string, unknown>) => ({
                  id: typeof p.id === 'number' ? p.id : 0,
                  name: typeof p.name === 'string' ? p.name : '',
                  unit_price_twd: typeof p.unit_price_twd === 'number' ? p.unit_price_twd : 0,
                  img_url: typeof p.img_url === 'string' ? p.img_url : null,
                  description: typeof p.description === 'string' ? p.description : null,
                  category: typeof p.category === 'string' ? p.category : null,
                }))
              : []
          }
          selectedProducts={formState.selectedProducts}
          onSelect={(products) => handleFormChange('selectedProducts', products)}
          onClose={() => setIsProductSelectorOpen(false)}
        />
      )}
    </div>
  );
}
