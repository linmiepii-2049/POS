import { useState } from 'react';
import { createUser } from '../api/memberClient';

interface RegisterFormProps {
  displayName: string;
  lineId: string;
  onSuccess: () => void;
}

export function RegisterForm({ displayName, lineId, onSuccess }: RegisterFormProps) {
  const [name, setName] = useState(displayName || '');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const validatePhone = (phoneValue: string): boolean => {
    return /^09\d{8}$/.test(phoneValue);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // 驗證姓名
    if (!name.trim()) {
      setError('請輸入姓名');
      return;
    }

    if (name.trim().length > 100) {
      setError('姓名長度不能超過 100 字元');
      return;
    }

    // 驗證電話
    if (!phone.trim()) {
      setError('請輸入手機號碼');
      return;
    }

    if (!validatePhone(phone.trim())) {
      setError('請輸入有效的手機號碼（格式：09xxxxxxxx）');
      return;
    }

    setLoading(true);

    try {
      await createUser({
        name: name.trim(),
        phone: phone.trim(),
        line_id: lineId,
        role: 'CLIENT',
        is_active: 1,
      });

      // 註冊成功，重新載入會員資料
      onSuccess();
    } catch (err) {
      console.error('註冊失敗:', err);
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('註冊失敗，請稍後再試');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full">
        <div className="mb-6 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">加入會員</h2>
          <p className="text-sm text-gray-600">請填寫以下資料完成註冊</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              姓名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="請輸入姓名"
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              手機號碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                if (value.length <= 10) {
                  setPhone(value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="0912345678"
              disabled={loading}
              maxLength={10}
            />
            <p className="mt-1 text-xs text-gray-500">格式：09xxxxxxxx</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 px-4 bg-blue-600 text-white font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '註冊中...' : '完成註冊'}
          </button>
        </form>
      </div>
    </div>
  );
}

