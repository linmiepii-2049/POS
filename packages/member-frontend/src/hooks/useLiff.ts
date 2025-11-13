import { useEffect, useState } from 'react';
import liff from '@line/liff';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

/**
 * LIFF SDK Hook
 * 處理 LIFF 初始化與使用者登入狀態
 */
export function useLiff() {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const liffId = import.meta.env.VITE_LIFF_ID;
    
    if (!liffId) {
      setError(new Error('LIFF ID 未設定，請檢查環境變數 VITE_LIFF_ID'));
      return;
    }

    console.log('🔄 初始化 LIFF...', { liffId });

    liff
      .init({ liffId })
      .then(() => {
        console.log('✅ LIFF 初始化成功');
        setIsReady(true);
        
        const loggedIn = liff.isLoggedIn();
        setIsLoggedIn(loggedIn);
        
        if (loggedIn) {
          console.log('✅ 使用者已登入，取得個人資料...');
          return liff.getProfile();
        }
        console.log('⚠️ 使用者未登入');
        return null;
      })
      .then((userProfile) => {
        if (userProfile) {
          console.log('✅ 取得使用者資料:', userProfile);
          setProfile({
            userId: userProfile.userId,
            displayName: userProfile.displayName,
            pictureUrl: userProfile.pictureUrl,
          });
        }
      })
      .catch((err) => {
        console.error('❌ LIFF 初始化失敗:', err);
        setError(err);
      });
  }, []);

  return {
    isReady,
    profile,
    error,
    isLoggedIn,
    liff,
  };
}

