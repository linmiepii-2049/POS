import { useEffect, useState } from 'react';
import { useLiff } from './hooks/useLiff';
import { getUserByLineId, getUserDetail } from './api/memberClient';
import { MemberInfo } from './components/MemberInfo';
import { PointsInfo } from './components/PointsInfo';
import { PointsHistory } from './components/PointsHistory';
import { OrderHistory } from './components/OrderHistory';
import { Loading } from './components/Loading';

interface UserData {
  id: number;
  name: string;
  phone: string | null;
  lineId: string | null;
  points: number;
  pointsYuanEquivalent: number;
  createdAt: string;
}

export function App() {
  const { isReady, profile, error: liffError, isLoggedIn } = useLiff();
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isReady) return;
    
    if (liffError) {
      setError(`LIFF 初始化失敗: ${liffError.message}`);
      setLoading(false);
      return;
    }

    if (!isLoggedIn || !profile) {
      setError('請先登入 LINE');
      setLoading(false);
      return;
    }

    const fetchUserData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // 先透過 LINE ID 取得基本資訊
        const lineIdResponse = await getUserByLineId(profile.userId);
        
        if (!lineIdResponse.success || !lineIdResponse.data) {
          setError('找不到此 LINE ID 對應的使用者');
          setLoading(false);
          return;
        }

        // 再取得完整的使用者詳細資訊
        const detailResponse = await getUserDetail(lineIdResponse.data.id);
        
        if (!detailResponse.success || !detailResponse.data) {
          setError('取得使用者詳細資訊失敗');
          setLoading(false);
          return;
        }

        const user = detailResponse.data;
        setUserData({
          id: user.id,
          name: user.name,
          phone: user.phone,
          lineId: user.line_id,
          points: user.points,
          pointsYuanEquivalent: user.points_yuan_equivalent,
          createdAt: user.created_at,
        });
      } catch (err) {
        console.error('取得使用者資料失敗:', err);
        if (err instanceof Error) {
          if (err.message.includes('找不到此 LINE ID')) {
            setError('尚未註冊為會員，請先註冊');
          } else {
            setError(err.message);
          }
        } else {
          setError('取得使用者資料時發生錯誤');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isReady, isLoggedIn, profile, liffError]);

  if (!isReady || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full text-center">
          <div className="text-red-600 mb-4">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">發生錯誤</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            重新載入
          </button>
        </div>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">尚未註冊為會員</h2>
          <p className="text-gray-600">此 LINE ID 尚未註冊為會員，請先註冊</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">會員資訊</h1>
          <p className="text-sm text-gray-600">歡迎，{userData.name}</p>
        </div>

        <MemberInfo
          name={userData.name}
          phone={userData.phone}
          lineId={userData.lineId}
          createdAt={userData.createdAt}
        />

        <PointsInfo
          points={userData.points}
          pointsYuanEquivalent={userData.pointsYuanEquivalent}
        />

        <PointsHistory userId={userData.id} />

        <OrderHistory userId={userData.id} />
      </div>
    </div>
  );
}

