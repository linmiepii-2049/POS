import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { Data } from './pages/Data';
import { AdminLayout } from './pages/Admin';
import { POSPage } from './pages/POS';

// 建立 QueryClient 實例
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * 路由類型定義
 */
type Route = 'home' | 'data' | 'admin' | 'pos';

/**
 * 簡單路由系統
 */
export function Router() {
  // 從 URL 獲取當前路由
  const getCurrentRouteFromURL = (): Route => {
    const path = window.location.pathname;
    if (path === '/data') return 'data';
    if (path === '/admin') return 'admin';
    if (path === '/pos') return 'pos';
    return 'home';
  };

  const [currentRoute, setCurrentRoute] = useState<Route>(getCurrentRouteFromURL());

  /**
   * 監聽 URL 變化
   */
  useEffect(() => {
    const handlePopState = () => {
      setCurrentRoute(getCurrentRouteFromURL());
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  /**
   * 導航函式
   */
  const navigate = (route: Route) => {
    setCurrentRoute(route);
    // 更新瀏覽器 URL（可選）
    window.history.pushState({}, '', route === 'home' ? '/' : `/${route}`);
  };

  /**
   * 渲染當前路由
   */
  const renderRoute = () => {
    switch (currentRoute) {
      case 'data':
        return <Data />;
      case 'admin':
        return <AdminLayout />;
      case 'pos':
        return <POSPage />;
      case 'home':
      default:
        return <App />;
    }
  };

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen">
        {/* 固定頂部導航列 */}
        <nav className="bg-gray-800 text-white shadow-lg fixed top-0 left-0 right-0 z-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex space-x-8 h-16 items-center">
              <button
                onClick={() => navigate('home')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'home'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                首頁
              </button>
              <button
                onClick={() => navigate('data')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'data'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                資料庫摘要
              </button>
              <button
                onClick={() => navigate('admin')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'admin'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                管理後台
              </button>
              <button
                onClick={() => navigate('pos')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  currentRoute === 'pos'
                    ? 'bg-gray-900 text-white'
                    : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                }`}
              >
                POS 收銀
              </button>
            </div>
          </div>
        </nav>

        {/* 路由內容 - 添加 top padding 避免被固定導航欄遮擋 */}
        <div className="pt-16">
          {renderRoute()}
        </div>
      </div>
    </QueryClientProvider>
  );
}
