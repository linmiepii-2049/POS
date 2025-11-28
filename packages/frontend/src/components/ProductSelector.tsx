/**
 * 商品選擇器組件
 * 以卡片方式顯示商品並支援複選，按分類分組顯示
 */

import { useState, useMemo } from 'react';
import { Button } from './Form';

export interface Product {
  id: number;
  name: string;
  unit_price_twd: number;
  img_url: string | null;
  description?: string | null;
  category?: string | null;
}

export interface SelectedProduct extends Product {
  supplyQuantity: number;
}

interface ProductSelectorProps {
  products: Product[];
  selectedProducts: SelectedProduct[];
  onSelect: (products: SelectedProduct[]) => void;
  onClose: () => void;
}

/**
 * 商品選擇器彈窗
 */
export function ProductSelector({ products, selectedProducts, onSelect, onClose }: ProductSelectorProps) {
  const [selected, setSelected] = useState<Map<number, SelectedProduct>>(() => {
    const map = new Map<number, SelectedProduct>();
    selectedProducts.forEach((p) => {
      map.set(p.id, p);
    });
    return map;
  });

  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set());

  // 按分類分組商品
  const productsByCategory = useMemo(() => {
    if (!products || !Array.isArray(products) || products.length === 0) {
      return new Map<string, Product[]>();
    }

    const grouped = new Map<string, Product[]>();
    const uncategorized: Product[] = [];

    products.forEach((product) => {
      const category = product.category || '未分類';
      if (category === '未分類' || !product.category) {
        uncategorized.push(product);
      } else {
        if (!grouped.has(category)) {
          grouped.set(category, []);
        }
        grouped.get(category)!.push(product);
      }
    });

    if (uncategorized.length > 0) {
      grouped.set('未分類', uncategorized);
    }

    return grouped;
  }, [products]);

  const toggleCategory = (category: string) => {
    const newCollapsed = new Set(collapsedCategories);
    if (newCollapsed.has(category)) {
      newCollapsed.delete(category);
    } else {
      newCollapsed.add(category);
    }
    setCollapsedCategories(newCollapsed);
  };

  const handleToggleProduct = (product: Product) => {
    const newSelected = new Map(selected);
    if (newSelected.has(product.id)) {
      newSelected.delete(product.id);
    } else {
      newSelected.set(product.id, {
        ...product,
        supplyQuantity: 1,
      });
    }
    setSelected(newSelected);
  };

  const handleQuantityChange = (productId: number, value: string) => {
    const newSelected = new Map(selected);
    const product = newSelected.get(productId);
    if (product) {
      // 允許空字串（用戶正在輸入）
      if (value === '') {
        newSelected.set(productId, {
          ...product,
          supplyQuantity: 0, // 暫時設為 0，允許清空
        });
      } else {
        const quantity = Number(value);
        // 如果是有效數字且大於 0，則使用；否則設為 1
        if (!isNaN(quantity) && quantity > 0) {
          newSelected.set(productId, {
            ...product,
            supplyQuantity: quantity,
          });
        } else {
          newSelected.set(productId, {
            ...product,
            supplyQuantity: 1,
          });
        }
      }
      setSelected(newSelected);
    }
  };

  const handleQuantityBlur = (productId: number) => {
    const newSelected = new Map(selected);
    const product = newSelected.get(productId);
    if (product && product.supplyQuantity < 1) {
      // 失去焦點時，如果數量小於 1，則設為 1
      newSelected.set(productId, {
        ...product,
        supplyQuantity: 1,
      });
      setSelected(newSelected);
    }
  };

  const handleConfirm = () => {
    onSelect(Array.from(selected.values()));
    onClose();
  };

  const categories = Array.from(productsByCategory.keys()).sort();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <h2 className="text-xl font-semibold text-gray-900">選擇商品</h2>
          <Button variant="ghost" onClick={onClose}>
            關閉
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {categories.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500">目前沒有可用的商品</p>
              <p className="text-sm text-gray-400 mt-2">請確認資料庫中是否有啟用的商品</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => {
              const categoryProducts = productsByCategory.get(category) || [];
              const isCollapsed = collapsedCategories.has(category);
              const selectedCount = categoryProducts.filter((p) => selected.has(p.id)).length;

              return (
                <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
                  {/* 分類標題 */}
                  <button
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <svg
                        className={`w-5 h-5 text-gray-600 transition-transform ${isCollapsed ? '' : 'rotate-90'}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                      <h3 className="text-lg font-semibold text-gray-900">{category}</h3>
                      <span className="text-sm text-gray-500">
                        ({categoryProducts.length} 項商品
                        {selectedCount > 0 && `，已選 ${selectedCount} 項`})
                      </span>
                    </div>
                  </button>

                  {/* 分類商品列表 */}
                  {!isCollapsed && (
                    <div className="p-4">
                      <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4">
                        {categoryProducts.map((product) => {
                          const isSelected = selected.has(product.id);
                          return (
                            <div
                              key={product.id}
                              onClick={() => handleToggleProduct(product)}
                              className={`
                                bg-white rounded-lg border-2 overflow-hidden cursor-pointer transition-all
                                ${isSelected ? 'border-blue-500 shadow-md' : 'border-gray-200 hover:border-gray-300'}
                              `}
                            >
                              {/* 商品圖片 */}
                              <div className="aspect-square bg-gray-100 flex items-center justify-center relative">
                                {product.img_url ? (
                                  <img src={product.img_url} alt={product.name} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
                                    <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                                {isSelected && (
                                  <div className="absolute top-1 right-1 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center">
                                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                                      <path
                                        fillRule="evenodd"
                                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                  </div>
                                )}
                              </div>

                              {/* 商品資訊 */}
                              <div className="p-2">
                                <h3 className="text-xs font-semibold text-gray-900 mb-1 line-clamp-2">{product.name}</h3>
                                <p className="text-[10px] text-gray-500 mb-2">NT${product.unit_price_twd}</p>
                                {isSelected && (
                                  <div className="mt-1">
                                    <label className="block text-[10px] text-gray-700 mb-1">供應數量</label>
                                    <input
                                      type="number"
                                      min="1"
                                      value={selected.get(product.id)?.supplyQuantity || ''}
                                      onChange={(e) => handleQuantityChange(product.id, e.target.value)}
                                      onBlur={() => handleQuantityBlur(product.id)}
                                      onClick={(e) => e.stopPropagation()}
                                      onFocus={(e) => e.target.select()}
                                      className="w-full px-1 py-0.5 text-xs border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
              })}
            </div>
          )}
        </div>

        <div className="border-t border-gray-200 p-4 flex justify-end gap-3">
          <Button variant="ghost" onClick={onClose}>
            取消
          </Button>
          <Button onClick={handleConfirm} disabled={selected.size === 0}>
            確認 ({selected.size})
          </Button>
        </div>
      </div>
    </div>
  );
}
