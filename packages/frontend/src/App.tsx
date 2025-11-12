import { useGetHealth, useGetVersion } from './api/posClient';

/**
 * 主要應用程式元件
 */
function App() {
  // 使用 orval hooks
  const { data: healthResponse, isLoading: healthLoading, error: healthError, refetch: refetchHealth } = useGetHealth();
  const { data: versionResponse, isLoading: versionLoading, error: versionError, refetch: refetchVersion } = useGetVersion();

  // 從響應中提取實際資料
  const healthData = healthResponse?.data;
  const versionData = versionResponse?.data;
  
  // 除錯資訊
  console.log('Health Response:', healthResponse);
  console.log('Version Response:', versionResponse);
  console.log('Health Data:', healthData);
  console.log('Version Data:', versionData);
  console.log('Health Error:', healthError);
  console.log('Version Error:', versionError);
  console.log('Health Loading:', healthLoading);
  console.log('Version Loading:', versionLoading);

  const loading = healthLoading || versionLoading;
  const error = healthError || versionError;

  /**
   * 重新載入資料
   */
  const loadData = async () => {
    await Promise.all([refetchHealth(), refetchVersion()]);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題列 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              POS 系統前端
            </h1>
            <button
              onClick={loadData}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '載入中...' : '重新載入'}
            </button>
          </div>
        </div>
      </header>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!!error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  載入錯誤
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  {error instanceof Error ? error.message : '載入失敗'}
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* 健康檢查卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                健康檢查
              </h2>
              <div className={`w-3 h-3 rounded-full ${healthData?.ok ? 'bg-green-500' : 'bg-red-500'}`} />
            </div>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ) : healthData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">狀態:</span>
                  <span className={`text-sm font-medium ${healthData.ok ? 'text-green-600' : 'text-red-600'}`}>
                    {healthData.ok ? '正常' : '異常'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">環境:</span>
                  <span className="text-sm text-gray-900">{healthData.env}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">UTC 時間:</span>
                  <span className="text-sm text-gray-900">{healthData.now_utc}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">本地時間:</span>
                  <span className="text-sm text-gray-900">{healthData.now_local}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">無法載入健康檢查資料</p>
            )}
          </div>

          {/* 版本資訊卡片 */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">
                版本資訊
              </h2>
              <div className="w-3 h-3 bg-blue-500 rounded-full" />
            </div>
            
            {loading ? (
              <div className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded"></div>
              </div>
            ) : versionData ? (
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">版本號:</span>
                  <span className="text-sm text-gray-900 font-mono bg-gray-100 px-2 py-1 rounded">
                    {versionData.version}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">環境:</span>
                  <span className="text-sm text-gray-900">{versionData.env}</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-500 text-sm">無法載入版本資訊</p>
            )}
          </div>
        </div>

        {/* JSON 資料顯示區域 */}
        {(healthResponse || versionResponse) && (
          <div className="mt-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              原始 JSON 資料
            </h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {healthResponse && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    /health 回應
                  </h4>
                  <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(healthResponse, null, 2)}
                  </pre>
                </div>
              )}
              {versionResponse && (
                <div className="bg-white rounded-lg shadow p-6">
                  <h4 className="text-md font-medium text-gray-900 mb-3">
                    /version 回應
                  </h4>
                  <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                    {JSON.stringify(versionResponse, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
