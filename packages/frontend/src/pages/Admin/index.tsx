import { useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { clsx } from 'clsx';
import { AdminSidebar } from './AdminSidebar';
import { AdminUsers } from './AdminUsers';
import { AdminProducts } from './AdminProducts';
// Coupon feature hidden - 優惠券功能已隱藏 (2024-11-11) - May be restored in the future
// import { AdminCoupons } from './AdminCoupons';
import { AdminOrders } from './AdminOrders';

/**
 * Admin 子路由類型
 * Note: 'coupons' route removed - may be restored in the future
 */
type AdminRoute = 'users' | 'products' | 'orders';

/**
 * Admin 主要布局元件
 */
export function AdminLayout() {
  // 從 URL 參數獲取當前路由，如果沒有則預設為 'users'
  const getCurrentRouteFromURL = (): AdminRoute => {
    const urlParams = new URLSearchParams(window.location.search);
    const route = urlParams.get('tab') as AdminRoute;
    // Coupon route removed - 優惠券路由已移除
    return route && ['users', 'products', 'orders'].includes(route) ? route : 'users';
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
      // Coupon route hidden - 優惠券路由已隱藏 (2024-11-11)
      // case 'coupons':
      //   return <AdminCoupons />;
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
