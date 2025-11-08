/**
 * 金額工具函數
 * 處理 POS 系統中的金額計算和格式化
 */

/**
 * 四捨五入到指定小數位數
 */
export function roundToDecimals(value: number, decimals: number = 2): number {
  return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
}

/**
 * 計算總金額（含四捨五入）
 */
export function calculateTotal(items: Array<{ price: number; quantity: number }>): number {
  const total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  return roundToDecimals(total);
}

/**
 * 計算折扣後金額
 */
export function calculateDiscountedAmount(originalAmount: number, discountAmount: number): number {
  const result = originalAmount - discountAmount;
  return Math.max(0, roundToDecimals(result));
}

/**
 * 計算找零
 */
export function calculateChange(paidAmount: number, totalAmount: number): number {
  const change = paidAmount - totalAmount;
  return Math.max(0, roundToDecimals(change));
}

/**
 * 格式化金額顯示（台灣格式）
 */
export function formatMoney(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * 格式化金額顯示（含小數）
 */
export function formatMoneyWithDecimals(amount: number): string {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
