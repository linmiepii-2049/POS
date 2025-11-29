import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PreorderLandingPage } from '../pages/PreorderLandingPage';

const mockUsePreordersGetActive = vi.fn();
const mockUsePreordersCreateOrder = vi.fn();

vi.mock('../api/posClient', () => ({
  usePreordersGetActive: (...args: unknown[]) => mockUsePreordersGetActive(...args),
  usePreordersCreateOrder: (...args: unknown[]) => mockUsePreordersCreateOrder(...args),
}));

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
  Toaster: () => null,
}));

describe('PreorderLandingPage', () => {
  const campaign = {
    id: 1,
    productName: '限定禮盒',
    campaignCopy: '新年預購',
    note: '取貨請攜帶保冷袋',
    pickupTimeSlots: ['10:00-11:00', '11:00-12:00'],
    remainingQuantity: 5,
    productPriceTwd: 520,
    startsAtTaipei: '2025-01-10 10:00:00',
    endsAtTaipei: '2025-01-15 18:00:00',
  };

  beforeEach(() => {
    mockUsePreordersGetActive.mockReturnValue({
      data: { data: campaign },
      isLoading: false,
      isError: false,
      refetch: vi.fn(),
    });
    mockUsePreordersCreateOrder.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('應該顯示預購檔期資訊', () => {
    render(<PreorderLandingPage />);

    expect(screen.getByText('限定禮盒')).toBeInTheDocument();
    expect(screen.getByText('新年預購')).toBeInTheDocument();
    expect(screen.getByText('送出預購')).toBeInTheDocument();
  });

  it('提交表單應呼叫建立訂單 API', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({
      data: {
        data: {
          orderNumber: 'ORD-123',
          totalTwd: 520,
          quantity: 1,
        },
      },
    });
    mockUsePreordersCreateOrder.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<PreorderLandingPage />);

    fireEvent.change(screen.getByPlaceholderText('請輸入姓名'), { target: { value: '小明' } });
    fireEvent.change(screen.getByPlaceholderText('09xxxxxxxx'), { target: { value: '0911222333' } });
    fireEvent.change(screen.getByDisplayValue('10:00-11:00'), { target: { value: '11:00-12:00' } });
    fireEvent.change(screen.getByDisplayValue('1'), { target: { value: '2' } });

    fireEvent.click(screen.getByText('送出預購'));

    expect(mutateAsync).toHaveBeenCalledWith({
      data: {
        campaignId: 1,
        customerName: '小明',
        customerPhone: '0911222333',
        pickupSlot: '11:00-12:00',
        quantity: 2,
        customerNote: undefined,
      },
    });
  });
});



