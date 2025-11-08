/**
 * Mock API Client for Testing
 * 提供測試用的 mock hooks 和類型
 */
import { vi } from 'vitest';

// Mock hooks
export const useGetHealth = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useHealthGet = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useGetVersion = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useVersionGet = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useGetApiData = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useProductsList = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useProductsCreate = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useProductsUpdate = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useProductsDelete = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useProductsGetCategories = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
}));

export const useUploadsProductImageLocal = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useOrdersList = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useOrdersCreate = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useOrdersUpdateStatus = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useOrdersCancel = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useGetApiUsers = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const usePostApiUsers = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const usePutApiUsersId = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useDeleteApiUsersId = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useCouponsList = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useCouponsCreate = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useCouponsUpdate = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useCouponsDelete = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useCouponCodesList = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useCouponCodesCreate = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useCouponCodesDelete = vi.fn(() => ({
  mutateAsync: vi.fn(),
  isPending: false,
}));

export const useUsersGetByPhone = vi.fn(() => ({
  data: null,
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

export const useUsersGetAvailableCoupons = vi.fn(() => ({
  data: { data: [], timestamp: '' },
  isLoading: false,
  error: null,
  refetch: vi.fn(),
}));

// Mock types
export type GetHealth200 = {
  ok: boolean;
  timestamp: string;
  timezone: string;
  localTime: string;
};

export type GetVersion200 = {
  version: string;
  name: string;
};

export type GetApiData200 = {
  success: boolean;
  data: Array<{
    table_name: string;
    total_count: number;
    sample_data: Record<string, unknown>[];
    error?: string;
  }>;
  timestamp: string;
};

export type ProductsList200DataItem = {
  id: number;
  sku: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_active: boolean;
  image_url?: string;
  created_at: string;
};

export type ProductsCreateBody = {
  sku: string;
  name: string;
  description?: string;
  price: number;
  category: string;
  is_active: number;
  image_url?: string;
};

export type ProductsUpdateBody = ProductsCreateBody;

export type OrdersList200DataItem = {
  id: number;
  order_number: string;
  user_id: number;
  subtotal: number;
  status: string;
  created_at: string;
};

export type GetApiUsers200DataItem = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  role: 'CLIENT' | 'ADMIN';
  is_active: boolean;
  created_at: string;
};

export type PostApiUsersBody = {
  name: string;
  phone: string;
  email?: string;
  role: 'CLIENT' | 'ADMIN';
  is_active: number;
};

export type PutApiUsersIdBody = PostApiUsersBody;

export type CouponsList200DataItem = {
  id: number;
  name?: string;
  discount_type: string;
  discount_value: number;
  min_spend: number;
  is_active: boolean;
  created_at: string;
};

export type CouponsCreateBody = {
  name?: string;
  description?: string;
  discount_type: 'PERCENT' | 'FIXED';
  discount_value: number;
  min_spend: number;
  max_discount?: number;
  valid_from: string;
  valid_to: string;
  usage_limit?: number;
  is_active: number;
};

export type CouponsUpdateBody = CouponsCreateBody;

export type CouponCodesList200DataItem = {
  id: number;
  code: string;
  user_id?: number;
  is_used: boolean;
  created_at: string;
};

export type CouponCodesCreateBody = {
  coupon_id: number;
  code: string;
  max_redemptions?: number;
  starts_at?: string;
  ends_at?: string;
  expires_after_days?: number;
  is_active?: number;
};
