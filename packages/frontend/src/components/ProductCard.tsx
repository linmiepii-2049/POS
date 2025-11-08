/**
 * 商品卡片組件
 * 顯示商品資訊並提供加入購物車功能
 */

import { useCart } from '../hooks/useCart';
import { formatMoney } from '../utils/money';

/**
 * 商品資料介面
 */
export interface Product {
  id: number;
  name: string;
  price: number;
  thumbnail?: string;
  description?: string;
  category?: string;
}

/**
 * 商品卡片 Props
 */
export interface ProductCardProps {
  product: Product;
  onAddToCart?: (product: Product) => void;
}

/**
 * 商品卡片組件
 */
export function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const { addItem } = useCart();

  /**
   * 處理加入購物車
   */
  const handleAddToCart = () => {
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      thumbnail: product.thumbnail,
    });
    
    onAddToCart?.(product);
  };

  return (
    <div 
      onClick={handleAddToCart}
      className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer hover:scale-105 active:scale-95"
    >
      {/* 商品圖片 */}
      <div className="aspect-square bg-gray-100 flex items-center justify-center">
        {product.thumbnail ? (
          <img
            src={product.thumbnail}
            alt={product.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
            <svg className="w-16 h-16 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* 商品資訊 */}
      <div className="p-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
          {product.name}
        </h3>
        
        {product.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.description}
          </p>
        )}

        {/* 價格和類別 */}
        <div className="flex items-center justify-between">
          <span className="text-xl font-bold text-green-600">
            {formatMoney(product.price)}
          </span>
          {product.category && (
            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
              {product.category}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
