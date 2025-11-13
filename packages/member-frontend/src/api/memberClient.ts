/**
 * Member API Client
 * 與 POS 後端的 Member API 進行通訊
 */

interface UserByLineIdResponse {
  success: boolean;
  data: {
    id: number;
    name: string;
    points: number;
    points_yuan_equivalent: number;
  };
  requestId?: string;
  timestamp: string;
}

interface UserDetailResponse {
  success: boolean;
  data: {
    id: number;
    line_id: string | null;
    name: string;
    phone: string | null;
    role: 'CLIENT' | 'ADMIN';
    is_active: number;
    points: number;
    points_yuan_equivalent: number;
    created_at: string;
    updated_at: string;
    last_purchase_at: string | null;
    current_month_spending: number;
    last_month_spending: number;
    stats: {
      total_spent: number;
      last_purchase_at: string | null;
      total_orders: number;
    };
  };
  timestamp: string;
}

interface PointsTransaction {
  id: number;
  user_id: number;
  order_id: number | null;
  points_change: number;
  transaction_type: 'EARNED' | 'REDEEMED';
  balance_after: number;
  created_at: string;
}

interface PointsHistoryResponse {
  success: boolean;
  data: PointsTransaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  timestamp: string;
}

interface Order {
  id: number;
  order_number: string;
  user_id: number;
  subtotal_twd: number;
  discount_twd: number;
  points_discount_twd: number;
  total_twd: number;
  status: 'created' | 'confirmed' | 'paid' | 'cancelled';
  created_at: string;
  updated_at: string;
  created_at_taipei: string;
  updated_at_taipei: string;
}

interface OrderListResponse {
  success: boolean;
  data: Order[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
  timestamp: string;
}

/**
 * 根據 LINE ID 取得使用者基本資訊
 */
export async function getUserByLineId(lineId: string): Promise<UserByLineIdResponse> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定，請檢查環境變數 VITE_API_BASE');
  }

  console.log('📤 查詢使用者 (LINE ID):', { apiBase, lineId: lineId.substring(0, 10) + '...' });

  const response = await fetch(`${apiBase}/api/users/by-line-id/${encodeURIComponent(lineId)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      const error = await response.json();
      const errorMessage = error.error || '找不到此 LINE ID 對應的使用者';
      // 建立一個特殊的錯誤，讓 App.tsx 可以識別這是 404 錯誤
      const notFoundError = new Error(errorMessage);
      (notFoundError as any).status = 404;
      throw notFoundError;
    }
    let errorMessage = '查詢失敗，請稍後再試';
    try {
      const error = await response.json();
      console.error('❌ 查詢失敗:', error);
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      console.error('❌ 查詢失敗（無法解析錯誤）:', response.status, response.statusText);
      errorMessage = `查詢失敗 (${response.status}): ${response.statusText || '請稍後再試'}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json() as UserByLineIdResponse;
  console.log('✅ 查詢成功:', result);
  return result;
}

/**
 * 取得使用者詳細資訊（包含完整資料）
 */
export async function getUserDetail(userId: number): Promise<UserDetailResponse> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定，請檢查環境變數 VITE_API_BASE');
  }

  console.log('📤 查詢使用者詳細資訊:', { apiBase, userId });

  const response = await fetch(`${apiBase}/api/users/${userId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = '查詢失敗，請稍後再試';
    try {
      const error = await response.json();
      console.error('❌ 查詢失敗:', error);
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      console.error('❌ 查詢失敗（無法解析錯誤）:', response.status, response.statusText);
      errorMessage = `查詢失敗 (${response.status}): ${response.statusText || '請稍後再試'}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json() as UserDetailResponse;
  console.log('✅ 查詢成功:', result);
  return result;
}

/**
 * 取得點數交易歷史
 */
export async function getPointsHistory(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<PointsHistoryResponse> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定，請檢查環境變數 VITE_API_BASE');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortDir: 'desc',
  });

  console.log('📤 查詢點數交易歷史:', { apiBase, userId, page, limit });

  const response = await fetch(`${apiBase}/api/users/${userId}/points-history?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = '查詢失敗，請稍後再試';
    try {
      const error = await response.json();
      console.error('❌ 查詢失敗:', error);
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      console.error('❌ 查詢失敗（無法解析錯誤）:', response.status, response.statusText);
      errorMessage = `查詢失敗 (${response.status}): ${response.statusText || '請稍後再試'}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json() as PointsHistoryResponse;
  console.log('✅ 查詢成功:', result);
  return result;
}

/**
 * 取得使用者訂單列表
 */
export async function getUserOrders(
  userId: number,
  page: number = 1,
  limit: number = 10
): Promise<OrderListResponse> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定，請檢查環境變數 VITE_API_BASE');
  }

  const params = new URLSearchParams({
    page: page.toString(),
    limit: limit.toString(),
    sortBy: 'id',
    sortDir: 'desc',
  });

  console.log('📤 查詢訂單列表:', { apiBase, userId, page, limit });

  const response = await fetch(`${apiBase}/api/users/${userId}/orders?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    let errorMessage = '查詢失敗，請稍後再試';
    try {
      const error = await response.json();
      console.error('❌ 查詢失敗:', error);
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      console.error('❌ 查詢失敗（無法解析錯誤）:', response.status, response.statusText);
      errorMessage = `查詢失敗 (${response.status}): ${response.statusText || '請稍後再試'}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json() as OrderListResponse;
  console.log('✅ 查詢成功:', result);
  return result;
}

interface CreateUserRequest {
  name: string;
  phone: string;
  line_id: string;
  role?: 'CLIENT' | 'ADMIN';
  is_active?: number;
}

interface CreateUserResponse {
  success: boolean;
  data: {
    id: number;
    line_id: string | null;
    name: string;
    phone: string | null;
    role: 'CLIENT' | 'ADMIN';
    is_active: number;
    points: number;
    points_yuan_equivalent: number;
    created_at: string;
    updated_at: string;
    last_purchase_at: string | null;
    current_month_spending: number;
    last_month_spending: number;
  };
  timestamp: string;
}

/**
 * 建立新使用者
 */
export async function createUser(data: CreateUserRequest): Promise<CreateUserResponse> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定，請檢查環境變數 VITE_API_BASE');
  }

  const requestData = {
    name: data.name,
    phone: data.phone,
    line_id: data.line_id,
    role: data.role || 'CLIENT',
    is_active: data.is_active !== undefined ? data.is_active : 1,
  };

  console.log('📤 建立使用者:', { apiBase, requestData: { ...requestData, line_id: requestData.line_id.substring(0, 10) + '...' } });

  const response = await fetch(`${apiBase}/api/users`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestData),
  });

  if (!response.ok) {
    let errorMessage = '註冊失敗，請稍後再試';
    try {
      const error = await response.json();
      console.error('❌ 註冊失敗:', error);
      errorMessage = error.error || error.message || errorMessage;
    } catch {
      console.error('❌ 註冊失敗（無法解析錯誤）:', response.status, response.statusText);
      errorMessage = `註冊失敗 (${response.status}): ${response.statusText || '請稍後再試'}`;
    }
    throw new Error(errorMessage);
  }

  const result = await response.json() as CreateUserResponse;
  console.log('✅ 註冊成功:', result);
  return result;
}

export type {
  UserByLineIdResponse,
  UserDetailResponse,
  PointsTransaction,
  PointsHistoryResponse,
  Order,
  OrderListResponse,
  CreateUserRequest,
  CreateUserResponse,
};

