import { logger } from '../utils/logger.js';

/**
 * 網站通知頻道
 */
export type WebsiteNotificationChannel = 'website';

/**
 * 建立預購成功通知的輸入資料
 */
export interface PreorderNotificationPayload {
  orderNumber: string;
  campaignId: number;
  quantity: number;
  message?: string;
  customerName?: string;
}

/**
 * 網站通知回傳結構
 */
export interface WebsiteNotificationResult {
  channel: WebsiteNotificationChannel;
  orderNumber: string;
  campaignId: number;
  quantity: number;
  message: string;
  timestamp: string;
  customerName?: string;
}

/**
 * 統一管理網站通知，未來可擴充其他通知方式
 */
export class NotificationService {
  notifyPreorderSuccess(payload: PreorderNotificationPayload): WebsiteNotificationResult {
    const normalizedMessage = payload.message ?? '預購訂單建立成功';
    const result: WebsiteNotificationResult = {
      channel: 'website',
      orderNumber: payload.orderNumber,
      campaignId: payload.campaignId,
      quantity: payload.quantity,
      message: normalizedMessage,
      timestamp: new Date().toISOString(),
      ...(payload.customerName ? { customerName: payload.customerName } : {}),
    };

    logger.info('預購訂單通知', {
      orderNumber: payload.orderNumber,
      campaignId: payload.campaignId,
      quantity: payload.quantity,
      channel: 'website',
    });

    return result;
  }
}



