import { clsx } from 'clsx';

/**
 * 導航項目類型
 */
interface NavItem {
  id: string;
  label: string;
  icon: string;
}

/**
 * 導航項目配置
 */
const navItems: NavItem[] = [
  { id: 'users', label: '用戶管理', icon: '👥' },
  { id: 'products', label: '商品管理', icon: '📦' },
  { id: 'preorders', label: '預購管理', icon: '🛒' },
  // Coupon feature hidden - 優惠券功能已隱藏 (2024-11-11) - May be restored in the future
  // { id: 'coupons', label: '優惠券管理', icon: '🎫' },
  { id: 'orders', label: '訂單管理', icon: '📋' },
];

/**
 * Admin 側邊欄元件屬性
 */
interface AdminSidebarProps {
  currentRoute: string;
  onRouteChange: (route: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

/**
 * Admin 側邊欄元件
 */
export function AdminSidebar({ currentRoute, onRouteChange, isCollapsed, onToggleCollapse }: AdminSidebarProps) {
  return (
    <div className={clsx(
      'fixed left-0 top-16 h-[calc(100vh-4rem)] bg-white shadow-lg border-r border-gray-200 z-40 transition-all duration-300',
      isCollapsed ? 'w-16' : 'w-64'
    )}>
      {/* 標題區域 */}
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h1 className="text-xl font-bold text-gray-900">POS 管理後台</h1>
            <p className="text-sm text-gray-500 mt-1">系統管理面板</p>
          </div>
        )}
        
        {/* 折疊按鈕 */}
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          title={isCollapsed ? '展開側邊欄' : '收起側邊欄'}
        >
          <svg 
            className={clsx(
              'w-5 h-5 text-gray-600 transition-transform duration-300',
              isCollapsed ? 'rotate-180' : ''
            )} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      </div>

      {/* 導航選單 */}
      <nav className="p-4">
        <ul className="space-y-2">
          {navItems.map((item) => (
            <li key={item.id}>
              <button
                onClick={() => onRouteChange(item.id)}
                className={clsx(
                  'w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors group',
                  currentRoute === item.id
                    ? 'bg-blue-50 text-blue-700 border border-blue-200'
                    : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900',
                  isCollapsed ? 'justify-center' : ''
                )}
                title={isCollapsed ? item.label : undefined}
              >
                <span className="text-lg">{item.icon}</span>
                {!isCollapsed && (
                  <span className="font-medium ml-3">{item.label}</span>
                )}
              </button>
            </li>
          ))}
        </ul>
      </nav>

      {/* 底部資訊 */}
      {!isCollapsed && (
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
          <div className="text-xs text-gray-500 text-center">
            <p>POS 系統 v1.0.0</p>
            <p className="mt-1">© 2024</p>
          </div>
        </div>
      )}
    </div>
  );
}
