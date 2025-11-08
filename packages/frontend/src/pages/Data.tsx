import { useGetApiData } from '../api/posClient';

/**
 * 資料摘要介面
 */
interface DataSummary {
  table_name: string;
  total_count: number;
  sample_data: Record<string, unknown>[];
  error?: string;
}

/**
 * 資料頁面元件
 */
export function Data() {
  const { data: dataResponse, isLoading: loading, error, refetch: loadData } = useGetApiData();

  // 從響應中提取實際資料
  const data = dataResponse?.data;

  /**
   * 格式化樣本資料為表格顯示
   */
  const renderSampleData = (sampleData: Record<string, unknown>[]) => {
    if (sampleData.length === 0) {
      return <span className="text-gray-500 text-sm">無資料</span>;
    }

    // 取得所有欄位名稱
    const columns = Object.keys(sampleData[0] || {});
    
    return (
      <div className="overflow-x-auto">
        <table className="min-w-full text-xs">
          <thead>
            <tr className="bg-gray-50">
              {columns.map((col) => (
                <th key={col} className="px-2 py-1 text-left font-medium text-gray-600 border-b">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sampleData.map((row, idx) => (
              <tr key={idx} className="border-b">
                {columns.map((col) => (
                  <td key={col} className="px-2 py-1 text-gray-900">
                    {String(row[col] || '-')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  /**
   * 取得表格狀態顏色
   */
  const getTableStatusColor = (summary: DataSummary) => {
    if (summary.error) return 'text-red-600';
    if (summary.total_count === 0) return 'text-yellow-600';
    return 'text-green-600';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 標題列 */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-2xl font-bold text-gray-900">
              資料庫摘要
            </h1>
            <button
              onClick={() => loadData()}
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
        {error && (
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

        {loading ? (
            <div className="space-y-6">
            {[...Array(5)].map((_, idx) => (
              <div key={idx} className="bg-white rounded-lg shadow p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-32 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : data ? (
          <div className="space-y-6">
            {/* 查詢資訊 */}
            <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
              <div className="flex items-center">
                <svg className="h-5 w-5 text-blue-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-blue-800">
                    查詢成功
                  </h3>
                  <p className="text-sm text-blue-700 mt-1">
                    查詢時間: {data?.timestamp}
                  </p>
                </div>
              </div>
            </div>

            {/* 資料表摘要 */}
            {data?.data?.map((summary: any) => (
              <div key={summary.table_name} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 capitalize">
                    {summary.table_name.replace(/_/g, ' ')}
                  </h2>
                  <div className="flex items-center space-x-2">
                    <span className={`text-sm font-medium ${getTableStatusColor(summary)}`}>
                      {summary.error ? '錯誤' : `${summary.total_count} 筆記錄`}
                    </span>
                    <div className={`w-3 h-3 rounded-full ${
                      summary.error ? 'bg-red-500' : 
                      summary.total_count === 0 ? 'bg-yellow-500' : 'bg-green-500'
                    }`} />
                  </div>
                </div>

                {summary.error ? (
                  <div className="bg-red-50 border border-red-200 rounded-md p-3">
                    <p className="text-sm text-red-700">
                      查詢錯誤: {summary.error}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* 樣本資料表格 */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-2">
                        樣本資料 (最多顯示 5 筆)
                      </h3>
                      {renderSampleData(summary.sample_data)}
                    </div>
                  </div>
                )}
              </div>
            ))}

            {/* 原始 JSON 資料 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                原始 JSON 資料
              </h3>
              <pre className="bg-gray-100 p-4 rounded-md text-sm overflow-x-auto">
                {JSON.stringify(dataResponse || {}, null, 2)}
              </pre>
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-500">無法載入資料</p>
          </div>
        )}
      </main>
    </div>
  );
}
