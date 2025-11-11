import { describe, it, expect, beforeEach, vi } from 'vitest';
import { PointsService } from '../src/services/points.js';

describe('PointsService', () => {
  let pointsService: PointsService;
  let mockDB: any;

  beforeEach(() => {
    mockDB = {
      prepare: vi.fn().mockReturnValue({
        bind: vi.fn().mockReturnValue({
          first: vi.fn().mockResolvedValue(null),
          all: vi.fn().mockResolvedValue({ results: [] }),
          run: vi.fn().mockResolvedValue({ success: true }),
        }),
      }),
    };

    pointsService = new PointsService(mockDB);
  });

  describe('calculatePointsEarned', () => {
    it('應該正確計算獲得的點數（1元 = 1點）', () => {
      expect(pointsService.calculatePointsEarned(100)).toBe(100);
      expect(pointsService.calculatePointsEarned(500)).toBe(500);
      expect(pointsService.calculatePointsEarned(1000)).toBe(1000);
    });

    it('應該對小數點取整（向下）', () => {
      expect(pointsService.calculatePointsEarned(99.9)).toBe(99);
      expect(pointsService.calculatePointsEarned(100.5)).toBe(100);
      expect(pointsService.calculatePointsEarned(999.99)).toBe(999);
    });

    it('應該處理 0 元', () => {
      expect(pointsService.calculatePointsEarned(0)).toBe(0);
    });
  });

  describe('calculatePointsDiscount', () => {
    it('應該正確計算點數折扣金額（20點 = 1元）', () => {
      expect(pointsService.calculatePointsDiscount(20)).toBe(1);
      expect(pointsService.calculatePointsDiscount(40)).toBe(2);
      expect(pointsService.calculatePointsDiscount(100)).toBe(5);
      expect(pointsService.calculatePointsDiscount(200)).toBe(10);
      expect(pointsService.calculatePointsDiscount(1000)).toBe(50);
    });

    it('應該對不足 20 點的部分向下取整', () => {
      expect(pointsService.calculatePointsDiscount(19)).toBe(0);
      expect(pointsService.calculatePointsDiscount(39)).toBe(1);
      expect(pointsService.calculatePointsDiscount(59)).toBe(2);
    });

    it('應該處理 0 點', () => {
      expect(pointsService.calculatePointsDiscount(0)).toBe(0);
    });
  });

  describe('validatePointsRedemption', () => {
    it('應該拒絕負數點數', async () => {
      const result = await pointsService.validatePointsRedemption(1, -10);
      expect(result.valid).toBe(false);
      expect(result.error).toBe('點數不可為負數');
    });

    it('應該接受 0 點', async () => {
      const result = await pointsService.validatePointsRedemption(1, 0);
      expect(result.valid).toBe(true);
    });

    it('應該拒絕非 20 的倍數', async () => {
      // Mock 使用者有足夠點數
      const mockPrepare = mockDB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ points: 100 }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const result1 = await pointsService.validatePointsRedemption(1, 19);
      expect(result1.valid).toBe(false);
      expect(result1.error).toBe('點數必須是 20 的倍數');

      const result2 = await pointsService.validatePointsRedemption(1, 21);
      expect(result2.valid).toBe(false);
      expect(result2.error).toBe('點數必須是 20 的倍數');

      const result3 = await pointsService.validatePointsRedemption(1, 50);
      expect(result3.valid).toBe(false);
      expect(result3.error).toBe('點數必須是 20 的倍數');
    });

    it('應該接受 20 的倍數且使用者有足夠點數', async () => {
      const mockPrepare = mockDB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ points: 100 }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const result = await pointsService.validatePointsRedemption(1, 60);
      expect(result.valid).toBe(true);
      expect(result.currentPoints).toBe(100);
    });

    it('應該拒絕點數不足', async () => {
      const mockPrepare = mockDB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ points: 50 }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const result = await pointsService.validatePointsRedemption(1, 60);
      expect(result.valid).toBe(false);
      expect(result.error).toContain('點數不足');
      expect(result.currentPoints).toBe(50);
    });
  });

  describe('getUserPoints', () => {
    it('應該回傳使用者目前點數', async () => {
      const mockPrepare = mockDB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue({ points: 150 }),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const points = await pointsService.getUserPoints(1);
      expect(points).toBe(150);
    });

    it('應該在使用者不存在時回傳 0', async () => {
      const mockPrepare = mockDB.prepare as any;
      const mockBind = vi.fn().mockReturnValue({
        first: vi.fn().mockResolvedValue(null),
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      const points = await pointsService.getUserPoints(999);
      expect(points).toBe(0);
    });
  });

  describe('addPoints', () => {
    it('應該新增點數並記錄交易', async () => {
      const mockPrepare = mockDB.prepare as any;
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockFirst = vi.fn().mockResolvedValue({ points: 120 });
      const mockBind = vi.fn().mockReturnValue({
        run: mockRun,
        first: mockFirst,
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      await pointsService.addPoints(1, 20, 100, 'EARN');

      // 應該呼叫兩次 prepare（一次更新點數，一次記錄交易）
      expect(mockPrepare).toHaveBeenCalledTimes(3); // 包括 getUserPoints
    });
  });

  describe('deductPoints', () => {
    it('應該扣除點數並記錄交易', async () => {
      const mockPrepare = mockDB.prepare as any;
      const mockRun = vi.fn().mockResolvedValue({ success: true });
      const mockFirst = vi.fn().mockResolvedValue({ points: 80 });
      const mockBind = vi.fn().mockReturnValue({
        run: mockRun,
        first: mockFirst,
      });
      mockPrepare.mockReturnValue({ bind: mockBind });

      await pointsService.deductPoints(1, 20, 100);

      // 應該呼叫兩次 prepare（一次更新點數，一次記錄交易）
      expect(mockPrepare).toHaveBeenCalledTimes(3); // 包括 getUserPoints
    });
  });
});

