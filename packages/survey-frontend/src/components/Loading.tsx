/**
 * Loading 元件
 * 顯示載入動畫
 */
export function Loading() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 to-indigo-700 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-white mb-4"></div>
        <p className="text-white text-lg font-semibold">載入中...</p>
      </div>
    </div>
  );
}

