import { useState } from 'react';
import { useLiff } from './hooks/useLiff';
import { submitSurvey } from './api/surveyClient';
import { SurveyForm } from './components/SurveyForm';
import { Loading } from './components/Loading';

/**
 * App 主元件
 * LIFF 問卷調查應用程式
 */
function App() {
  const { isReady, profile, error: liffError, liff } = useLiff();
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (formData: any) => {
    setSubmitStatus('loading');
    
    try {
      await submitSurvey({
        ...formData,
        lineUserId: profile?.userId,
        displayName: profile?.displayName,
      } as any);
      
      setSubmitStatus('success');
      
      // 提交成功後 2 秒關閉 LIFF 視窗
      setTimeout(() => {
        if (liff.isInClient()) {
          liff.closeWindow();
        }
      }, 2000);
    } catch (error) {
      console.error('提交錯誤:', error);
      setSubmitStatus('error');
      setErrorMessage(error instanceof Error ? error.message : '提交失敗，請稍後再試');
    }
  };

  // LIFF 初始化錯誤
  if (liffError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-6xl text-center mb-4">❌</div>
          <h2 className="text-2xl font-bold text-red-600 mb-4 text-center">初始化失敗</h2>
          <p className="text-gray-700 text-center">{liffError.message}</p>
          <p className="text-sm text-gray-500 mt-4 text-center">請確認您是從 LINE 應用程式開啟此頁面</p>
        </div>
      </div>
    );
  }

  // 載入中
  if (!isReady) {
    return <Loading />;
  }

  // 提交成功
  if (submitStatus === 'success') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-600 mb-2">提交成功！</h2>
          <p className="text-gray-600 mb-4">感謝您填寫問卷</p>
          {profile?.displayName && (
            <p className="text-sm text-gray-500">謝謝 {profile.displayName} 的參與 🙏</p>
          )}
        </div>
      </div>
    );
  }

  // 問卷表單
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
          {/* 標題區塊 */}
          <div className="bg-gradient-to-r from-line-green to-green-600 text-white p-6 text-center">
            <h1 className="text-3xl font-bold mb-2">🍞 麵包問卷調查</h1>
            {profile?.displayName && (
              <p className="text-green-100">歡迎 {profile.displayName}</p>
            )}
            {!profile && (
              <p className="text-green-100">歡迎參與問卷調查</p>
            )}
          </div>

          {/* 表單內容 */}
          <div className="p-6">
            {submitStatus === 'error' && (
              <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
                <p className="text-red-600 font-semibold">❌ {errorMessage}</p>
                <button
                  onClick={() => setSubmitStatus('idle')}
                  className="mt-2 text-sm text-red-700 underline"
                >
                  重新嘗試
                </button>
              </div>
            )}

            <SurveyForm 
              onSubmit={handleSubmit} 
              isSubmitting={submitStatus === 'loading'}
            />
          </div>
        </div>

        {/* 頁尾資訊 */}
        <div className="text-center mt-6 text-white text-sm">
          <p>© 2025 麵包問卷調查系統</p>
          <p className="text-purple-200 mt-1">由 POS 系統提供技術支援</p>
        </div>
      </div>
    </div>
  );
}

export default App;

