import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { NotificationService } from '../src/services/notification.js';
import { logger } from '../src/utils/logger.js';

describe('NotificationService', () => {
  const service = new NotificationService();
  let loggerInfoSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    loggerInfoSpy = vi.spyOn(logger, 'info').mockImplementation(() => undefined);
  });

  afterEach(() => {
    loggerInfoSpy.mockRestore();
  });

  it('應建立網站通知並記錄日誌', () => {
    const result = service.notifyPreorderSuccess({
      orderNumber: 'ORD-123',
      campaignId: 9,
      quantity: 2,
      customerName: '小明',
    });

    expect(result.channel).toBe('website');
    expect(result.orderNumber).toBe('ORD-123');
    expect(result.campaignId).toBe(9);
    expect(result.quantity).toBe(2);
    expect(result.timestamp).toMatch(/T/);

    expect(loggerInfoSpy).toHaveBeenCalledWith('預購訂單通知', {
      orderNumber: 'ORD-123',
      campaignId: 9,
      quantity: 2,
      channel: 'website',
    });
  });
});


