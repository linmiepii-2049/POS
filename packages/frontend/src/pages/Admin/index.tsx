import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';
import { AdminSidebar } from './AdminSidebar';
import { AdminUsers } from './AdminUsers';
import { AdminProducts } from './AdminProducts';
import { AdminCoupons } from './AdminCoupons';
import { AdminOrders } from './AdminOrders';

/**
 * Admin 子路由類型
 */
type AdminRoute = 'users' | 'products' | 'coupons' | 'orders';

/**
 * Admin 主要布局元件
 */
export function AdminLayout() {
  // 從 URL 參數獲取當前路由，如果沒有則預設為 'users'
  const getCurrentRouteFromURL = (): AdminRoute => {
    const urlParams = new URLSearchParams(window.location.search);
    const route = urlParams.get('tab') as AdminRoute;
    return route && ['users', 'products', 'coupons', 'orders'].includes(route) ? route : 'users';
  };

  const [currentRoute, setCurrentRoute] = useState<AdminRoute>(getCurrentRouteFromURL());
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  /**
   * 更新當前路由並同步到 URL
   */
  const updateCurrentRoute = (route: AdminRoute) => {
    setCurrentRoute(route);
    // 更新 URL 參數
    const url = new URL(window.location.href);
    url.searchParams.set('tab', route);
    window.history.replaceState({}, '', url.toString());
  };

  /**
   * 渲染當前子路由
   */
  const renderAdminRoute = () => {
    switch (currentRoute) {
      case 'users':
        return <AdminUsers />;
      case 'products':
        return <AdminProducts />;
      case 'coupons':
        return <AdminCoupons />;
      case 'orders':
        return <AdminOrders />;
      default:
        return <AdminUsers />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        {/* 左側導航 */}
        <AdminSidebar 
          currentRoute={currentRoute} 
          onRouteChange={(route: string) => updateCurrentRoute(route as AdminRoute)}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
        
        {/* 右側主內容區 */}
        <div className={clsx(
          'flex-1 transition-all duration-300',
          isSidebarCollapsed ? 'ml-16' : 'ml-64'
        )}>
          <div className="p-6">
            {renderAdminRoute()}
          </div>
        </div>
      </div>
      
      {/* Toast 通知 */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 5000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  );
}
