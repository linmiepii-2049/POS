import { useEffect, useState } from 'react';
import liff from '@line/liff';

interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
}

interface UseLiffReturn {
  isReady: boolean;
  profile: LiffProfile | null;
  error: Error | null;
  isLoggedIn: boolean;
  liff: typeof liff | null;
  shouldUseLiff: boolean; // 是否应该使用 LIFF
}

/**
 * LIFF SDK Hook
 * 根据环境变量决定是否启用 LIFF
 */
export function useLiff(): UseLiffReturn {
  const [isReady, setIsReady] = useState(false);
  const [profile, setProfile] = useState<LiffProfile | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 检查是否应该启用 LIFF
  const shouldUseLiff = (() => {
    const enableLiff = import.meta.env.VITE_ENABLE_LIFF === 'true';
    const env = import.meta.env.VITE_ENV;
    const liffId = import.meta.env.VITE_LIFF_ID;

    // 如果明确设置了 VITE_ENABLE_LIFF，则使用该值
    if (import.meta.env.VITE_ENABLE_LIFF !== undefined) {
      return enableLiff;
    }

    // 否则根据环境判断：dev 不需要，staging/production 需要
    if (env === 'dev' || env === 'development') {
      return false;
    }

    // staging 或 production 需要 LIFF ID
    return !!liffId;
  })();

  useEffect(() => {
    // 如果不需要 LIFF，直接返回
    if (!shouldUseLiff) {
      setIsReady(true);
      return;
    }

    const liffId = import.meta.env.VITE_LIFF_ID;

    if (!liffId) {
      setError(new Error('LIFF ID 未設定，請檢查環境變數 VITE_LIFF_ID'));
      setIsReady(true); // 即使失败也标记为 ready，让页面可以显示
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
        setIsReady(true); // 即使失败也标记为 ready，让页面可以显示
      });
  }, [shouldUseLiff]);

  return {
    isReady,
    profile,
    error,
    isLoggedIn,
    liff: shouldUseLiff ? liff : null,
    shouldUseLiff,
  };
}

