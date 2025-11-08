/**
 * 購物車 Hook
 */

import { useContext } from 'react';
import { CartContext, CartContextType } from '../store/cart.tsx';

/**
 * 使用購物車 Hook
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}