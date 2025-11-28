import { useEffect, useMemo, useState, type FormEvent } from 'react';
import toast from 'react-hot-toast';
import { Button, FormField, Input, Textarea } from '../components/Form';
import {
  usePreordersGetActive,
  usePreordersCreateOrder,
  type PreordersGetActive200Data,
  type PreordersGetActive200,
  type PreordersGetActive404,
  type PreordersCreateOrder201,
  type PreordersCreateOrder409,
} from '../api/posClient';

type PreorderCampaign = PreordersGetActive200Data;

interface PreorderFormState {
  customerName: string;
  customerPhone: string;
  selectedProductId: number | null;
  quantity: string;
  customerNote: string;
}

const INITIAL_FORM: PreorderFormState = {
  customerName: '',
  customerPhone: '',
  selectedProductId: null,
  quantity: '1',
  customerNote: '',
};

/**
 * 前台預購頁面
 */
export function PreorderLandingPage() {
  const [formState, setFormState] = useState<PreorderFormState>(INITIAL_FORM);
  const [orderSummary, setOrderSummary] = useState<PreordersCreateOrder201['data'] | null>(null);

  const { data: campaignResponse, isLoading, isError, refetch } = usePreordersGetActive();
  const campaignPayload = campaignResponse?.data as PreordersGetActive200 | PreordersGetActive404 | undefined;
  const isActiveResponse = (
    response: PreordersGetActive200 | PreordersGetActive404 | undefined,
  ): response is PreordersGetActive200 => Boolean(response && 'data' in response);

  const isCreateOrderSuccess = (
    response: PreordersCreateOrder201 | PreordersCreateOrder409 | undefined,
  ): response is PreordersCreateOrder201 => Boolean(response && 'data' in response);

  const campaign = useMemo<PreorderCampaign | null>(() => {
    if (isActiveResponse(campaignPayload)) {
      return campaignPayload.data;
    }
    return null;
  }, [campaignPayload]);

  useEffect(() => {
    if (campaign && campaign.products && campaign.products.length > 0) {
      const firstAvailableProduct = campaign.products.find((p) => p.remainingQuantity > 0);
      if (firstAvailableProduct) {
        setFormState((prev) => ({
          ...prev,
          selectedProductId: firstAvailableProduct.productId,
        }));
      }
    }
  }, [campaign]);

  const orderMutation = usePreordersCreateOrder({
    mutation: {
      onSuccess: (response) => {
        const payload = response?.data as PreordersCreateOrder201 | PreordersCreateOrder409 | undefined;
        if (isCreateOrderSuccess(payload)) {
          setOrderSummary(payload.data);
          toast.success('預購成功，請截圖保留訂單編號');
          refetch();
        }
      },
    },
  });

  const handleFormChange = (field: keyof PreorderFormState, value: string | number | null) => {
    setFormState((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!campaign) {
      toast.error('目前無可預購檔期');
      return;
    }
    if (!formState.customerName || !formState.customerPhone || !formState.selectedProductId) {
      toast.error('請完整填寫表單');
      return;
    }

    const selectedProduct = campaign.products?.find((p) => p.productId === formState.selectedProductId);
    if (!selectedProduct) {
      toast.error('請選擇商品');
      return;
    }

    const quantity = Number(formState.quantity);
    if (quantity > selectedProduct.remainingQuantity) {
      toast.error(`該商品剩餘數量不足，最多可預購 ${selectedProduct.remainingQuantity} 件`);
      return;
    }

    try {
      await orderMutation.mutateAsync({
        data: {
          campaignId: campaign.id,
          productId: formState.selectedProductId,
          customerName: formState.customerName.trim(),
          customerPhone: formState.customerPhone.trim(),
          quantity,
          customerNote: formState.customerNote.trim() || undefined,
        },
      });
    } catch (error) {
      let message = '預購失敗';
      if (error instanceof Error) {
        message = error.message;
      } else if (typeof error === 'object' && error !== null && 'response' in error) {
        const errorResponse = error as { response?: { data?: { message?: string; code?: string } } };
        message = errorResponse.response?.data?.message ?? errorResponse.response?.data?.code ?? '預購失敗';
      }
      toast.error(message);
    }
  };

  const resetForm = () => {
    setOrderSummary(null);
    const firstAvailableProduct = campaign?.products?.find((p) => p.remainingQuantity > 0);
    setFormState({
      ...INITIAL_FORM,
      selectedProductId: firstAvailableProduct?.productId ?? null,
    });
  };

  const selectedProduct = campaign?.products?.find((p) => p.productId === formState.selectedProductId);
  const remaining = selectedProduct?.remainingQuantity ?? 0;
  const totalPrice = selectedProduct ? Number(formState.quantity || '1') * selectedProduct.productPriceTwd : 0;

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-48 bg-gray-100 rounded"></div>
        </div>
      </div>
    );
  }

  if (isError || !campaign) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold text-gray-900">目前沒有預購活動</h1>
        <p className="text-gray-500 mt-4">請稍後再回來看看，或聯絡客服取得最新資訊。</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <p className="text-sm text-blue-600 font-semibold">官方預購活動</p>
              <h1 className="text-3xl font-bold text-gray-900 mt-2">{campaign.campaignName}</h1>
              <p className="text-lg text-gray-700 mt-4 whitespace-pre-wrap">{campaign.campaignCopy}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 mt-6 pt-6 text-sm text-gray-500">
            <p>檔期時間：{campaign.startsAtTaipei} 至 {campaign.endsAtTaipei}</p>
          </div>
        </div>

        {orderSummary ? (
          <div className="bg-white rounded-2xl shadow-lg p-8 text-center space-y-6">
            <div className="text-green-600 text-5xl">✓</div>
            <h2 className="text-2xl font-bold text-gray-900">預購成功！</h2>
            <p className="text-gray-600">請截圖或記下以下資訊，取貨時提供訂單編號即可。</p>
            <div className="bg-gray-50 rounded-xl p-6 space-y-3">
              <p className="text-lg">
                訂單編號：<span className="font-semibold">{orderSummary.orderNumber}</span>
              </p>
              <p>預購數量：{orderSummary.quantity}</p>
              <p>應付金額：NT${orderSummary.totalTwd}</p>
            </div>
            <Button onClick={resetForm}>再預購一筆</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-lg p-8 space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">立即預購</h2>

            {campaign.products && campaign.products.length > 0 && (
              <FormField label="選擇商品" required>
                <div className="space-y-3">
                  {campaign.products.map((product) => {
                    const isSelected = product.productId === formState.selectedProductId;
                    const isAvailable = product.remainingQuantity > 0;
                    return (
                      <div
                        key={product.productId}
                        onClick={() => isAvailable && handleFormChange('selectedProductId', product.productId)}
                        className={`
                          border-2 rounded-lg p-4 cursor-pointer transition-all
                          ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'}
                          ${!isAvailable ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                      >
                        <div className="flex items-center gap-4">
                          {product.productImageUrl && (
                            <img
                              src={product.productImageUrl}
                              alt={product.productName}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900">{product.productName}</p>
                            <p className="text-sm text-gray-500">NT${product.productPriceTwd}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              剩餘數量：{product.remainingQuantity} / 供應數量：{product.supplyQuantity}
                            </p>
                          </div>
                          {isSelected && (
                            <div className="text-blue-500">
                              <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                          {!isAvailable && (
                            <span className="text-xs text-red-500 font-semibold">已售罄</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </FormField>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField label="取貨人姓名" required>
                <Input
                  value={formState.customerName}
                  onChange={(event) => handleFormChange('customerName', event.target.value)}
                  placeholder="請輸入姓名"
                />
              </FormField>
              <FormField label="聯絡手機" required>
                <Input
                  type="tel"
                  pattern="09[0-9]{8}"
                  value={formState.customerPhone}
                  onChange={(event) => handleFormChange('customerPhone', event.target.value)}
                  placeholder="09xxxxxxxx"
                />
              </FormField>
            </div>

            {selectedProduct && (
              <FormField label="預購數量" required help={`最多 ${remaining} 件`}>
                <Input
                  type="number"
                  min="1"
                  max={remaining}
                  value={formState.quantity}
                  onChange={(event) => handleFormChange('quantity', event.target.value)}
                />
              </FormField>
            )}

            <FormField label="備註需求">
              <Textarea
                rows={3}
                value={formState.customerNote}
                onChange={(event) => handleFormChange('customerNote', event.target.value)}
                placeholder="例如：需要生日插牌、寫上祝福等"
              />
            </FormField>

            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <p className="text-gray-600">
                實付金額：<span className="text-2xl font-bold text-blue-600">NT${totalPrice}</span>
              </p>
              <Button
                type="submit"
                size="lg"
                loading={orderMutation.isPending}
                disabled={remaining === 0 || !selectedProduct}
              >
                {remaining === 0 ? '已售罄' : '送出預購'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
