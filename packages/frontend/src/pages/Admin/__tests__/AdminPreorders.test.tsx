import { describe, expect, it, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen } from '@testing-library/react';
import { AdminPreorders } from '../AdminPreorders';

const mockUsePreordersAdminList = vi.fn();
const mockUsePreordersAdminCreate = vi.fn();
const mockUsePreordersAdminUpdate = vi.fn();
const mockUsePreordersAdminDelete = vi.fn();
const mockUseProductsList = vi.fn();

vi.mock('../../../api/posClient', () => ({
  usePreordersAdminList: (...args: unknown[]) => mockUsePreordersAdminList(...args),
  usePreordersAdminCreate: (...args: unknown[]) => mockUsePreordersAdminCreate(...args),
  usePreordersAdminUpdate: (...args: unknown[]) => mockUsePreordersAdminUpdate(...args),
  usePreordersAdminDelete: (...args: unknown[]) => mockUsePreordersAdminDelete(...args),
  useProductsList: (...args: unknown[]) => mockUseProductsList(...args),
}));

vi.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('AdminPreorders', () => {
  const defaultCampaign = {
    id: 1,
    productId: 10,
    productName: '節慶禮盒',
    productPriceTwd: 520,
    productImageUrl: null,
    campaignCopy: '新春預購',
    note: '取餐請提前 10 分鐘',
    pickupTimeSlots: ['10:00-11:00', '11:00-12:00'],
    maxQuantity: 100,
    reservedQuantity: 40,
    remainingQuantity: 60,
    startsAtTaipei: '2025-02-01T10:00:00',
    endsAtTaipei: '2025-02-05T18:00:00',
    isActive: true,
  };

  beforeEach(() => {
    const refetch = vi.fn();
    mockUsePreordersAdminList.mockReturnValue({
      data: {
        data: [defaultCampaign],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      },
      isLoading: false,
      refetch,
    });
    mockUseProductsList.mockReturnValue({
      data: {
        data: [
          { id: 10, name: '節慶禮盒', unit_price_twd: 520, img_url: null, is_active: 1 },
        ],
      },
    });
    mockUsePreordersAdminCreate.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsePreordersAdminUpdate.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
    mockUsePreordersAdminDelete.mockReturnValue({
      mutateAsync: vi.fn(),
      isPending: false,
    });
  });

  it('應顯示預購列表資訊', () => {
    render(<AdminPreorders />);

    expect(screen.getByText('預購管理')).toBeInTheDocument();
    expect(screen.getByText('新春預購')).toBeInTheDocument();
    expect(screen.getByText('節慶禮盒')).toBeInTheDocument();
  });

  it('編輯檔期後點擊更新應觸發 API', async () => {
    const mutateAsync = vi.fn().mockResolvedValue({});
    mockUsePreordersAdminUpdate.mockReturnValue({
      mutateAsync,
      isPending: false,
    });

    render(<AdminPreorders />);

    fireEvent.click(screen.getByText('編輯'));
    fireEvent.click(screen.getByText('更新'));

    expect(mutateAsync).toHaveBeenCalledWith({
      id: 1,
      data: {
        productId: 10,
        campaignCopy: '新春預購',
        note: '取餐請提前 10 分鐘',
        pickupTimeSlots: ['10:00-11:00', '11:00-12:00'],
        maxQuantity: 100,
        startsAt: '2025-02-01T10:00',
        endsAt: '2025-02-05T18:00',
        isActive: true,
      },
    });
  });
});



