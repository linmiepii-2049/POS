/**
 * Survey API Client
 * 與 POS 後端的 Survey API 進行通訊
 */

interface SurveyData {
  memberId: string;
  phone: string;
  age: string;
  gender: string;
  location?: string;
  purchaseFrequency?: string;
  purchaseLocation?: string[];
  purchaseTime?: string;
  mealType?: string;
  purchaseFactors?: string[];
  healthPrice?: string;
  naturalPreference?: string;
  tastePreference?: string[];
  breadTypes?: string[];
  breadTypesOther?: string;
  favoriteBread?: string;
  desiredBread?: string;
  lineUserId?: string;
  displayName?: string;
}

/**
 * 提交問卷資料
 */
export async function submitSurvey(data: SurveyData): Promise<unknown> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定，請檢查環境變數 VITE_API_BASE');
  }

  console.log('📤 提交問卷:', { apiBase, data });

  const response = await fetch(`${apiBase}/api/surveys`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: '提交失敗' }));
    console.error('❌ 提交失敗:', error);
    throw new Error(error.message || '提交失敗，請稍後再試');
  }

  const result = await response.json();
  console.log('✅ 提交成功:', result);
  return result;
}

/**
 * 查詢問卷資料（根據手機號碼）
 */
export async function getSurvey(memberId: string): Promise<unknown> {
  const apiBase = import.meta.env.VITE_API_BASE;
  
  if (!apiBase) {
    throw new Error('API 位址未設定');
  }

  const response = await fetch(`${apiBase}/api/surveys/${memberId}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error('查詢失敗');
  }

  return response.json();
}

