import { z } from 'zod';

/**
 * 共用排序方向
 */
export const SortDirectionSchema = z.enum(['asc', 'desc']);

/**
 * 預購檔期排序欄位
 */
export const PreorderSortFieldSchema = z.enum(['starts_at', 'created_at', 'updated_at']);

/**
 * 預購檔期查詢參數
 */
export const PreorderCampaignQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).describe('頁碼'),
  limit: z.coerce.number().int().min(1).max(100).default(20).describe('每頁筆數'),
  sortBy: PreorderSortFieldSchema.default('created_at').describe('排序欄位'),
  sortDir: SortDirectionSchema.default('desc').describe('排序方向'),
  isActive: z
    .union([z.coerce.number().int().min(0).max(1), z.coerce.boolean()])
    .optional()
    .transform((value) => {
      if (value === undefined) {
        return undefined;
      }
      if (typeof value === 'number') {
        return value === 1;
      }
      return value;
    })
    .describe('是否僅顯示啟用檔期'),
});

/**
 * 預購檔期商品資訊
 */
export const PreorderCampaignProductSchema = z.object({
  productId: z.number().int().positive().describe('產品 ID'),
  productName: z.string().describe('產品名稱'),
  productPriceTwd: z.number().int().nonnegative().describe('產品單價 (元)'),
  productImageUrl: z.string().nullable().describe('產品圖片'),
  supplyQuantity: z.number().int().positive().describe('供應數量'),
  reservedQuantity: z.number().int().min(0).describe('已預購數量'),
  remainingQuantity: z.number().int().min(0).describe('剩餘可預購數量'),
});

/**
 * 預購檔期基本資訊
 */
export const PreorderCampaignSchema = z.object({
  id: z.number().int().positive().describe('檔期 ID'),
  campaignName: z.string().describe('預購名稱'),
  campaignCopy: z.string().describe('預購文案'),
  products: z.array(PreorderCampaignProductSchema).describe('預購商品列表'),
  startsAt: z.string().describe('開始時間 (UTC)'),
  endsAt: z.string().describe('結束時間 (UTC)'),
  startsAtTaipei: z.string().describe('開始時間 (台北)'),
  endsAtTaipei: z.string().describe('結束時間 (台北)'),
  isActive: z.boolean().describe('是否啟用'),
  createdAt: z.string().describe('建立時間 (UTC)'),
  updatedAt: z.string().describe('更新時間 (UTC)'),
});

/**
 * 預購檔期商品請求
 */
export const PreorderCampaignProductRequestSchema = z.object({
  productId: z.number().int().positive().describe('產品 ID'),
  supplyQuantity: z.number().int().positive().describe('供應數量'),
});

/**
 * 建立預購檔期請求
 */
export const CreatePreorderCampaignRequestSchema = z.object({
  campaignName: z.string().min(1).max(200).describe('預購名稱'),
  campaignCopy: z.string().min(1).max(300).describe('預購文案'),
  products: z.array(PreorderCampaignProductRequestSchema).min(1).describe('預購商品列表'),
  startsAt: z.string().min(10).describe('檔期開始日期（台北時間，格式：YYYY-MM-DD）'),
  endsAt: z.string().min(10).describe('檔期結束日期（台北時間，格式：YYYY-MM-DD）'),
  isActive: z.boolean().default(false).describe('是否立即啟用'),
});

/**
 * 更新預購檔期請求
 */
export const UpdatePreorderCampaignRequestSchema = z
  .object({
    campaignName: z.string().min(1).max(200).optional().describe('預購名稱'),
    campaignCopy: z.string().min(1).max(300).optional().describe('預購文案'),
    products: z.array(PreorderCampaignProductRequestSchema).min(1).optional().describe('預購商品列表'),
    startsAt: z.string().min(10).optional().describe('檔期開始日期（台北時間，格式：YYYY-MM-DD）'),
    endsAt: z.string().min(10).optional().describe('檔期結束日期（台北時間，格式：YYYY-MM-DD）'),
    isActive: z.boolean().optional().describe('是否啟用'),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: '至少需要一個更新欄位',
  });

/**
 * 預購檔期列表回應
 */
export const PreorderCampaignListResponseSchema = z.object({
  success: z.literal(true).describe('操作是否成功'),
  data: z.array(PreorderCampaignSchema).describe('檔期資料'),
  pagination: z
    .object({
      page: z.number().int().min(1).describe('頁碼'),
      limit: z.number().int().min(1).describe('每頁筆數'),
      total: z.number().int().min(0).describe('總筆數'),
      totalPages: z.number().int().min(0).describe('總頁數'),
    })
    .describe('分頁資訊'),
  timestamp: z.string().describe('時間戳'),
});

/**
 * 預購檔期單筆回應
 */
export const PreorderCampaignDetailResponseSchema = z.object({
  success: z.literal(true).describe('操作是否成功'),
  data: PreorderCampaignSchema.describe('檔期資料'),
  timestamp: z.string().describe('時間戳'),
});

/**
 * 前台預購檔期回應
 */
export const ActivePreorderResponseSchema = z.object({
  success: z.literal(true).describe('操作是否成功'),
  data: PreorderCampaignSchema.describe('可預購檔期'),
  timestamp: z.string().describe('時間戳'),
});

/**
 * 建立預購訂單請求
 */
export const CreatePreorderOrderRequestSchema = z.object({
  campaignId: z.number().int().positive().describe('檔期 ID'),
  productId: z.number().int().positive().describe('商品 ID'),
  quantity: z.number().int().positive().describe('預購數量'),
  customerName: z.string().min(1).max(100).describe('取餐人姓名'),
  customerPhone: z.string().regex(/^09\d{8}$/).describe('取餐人手機'),
  pickupSlot: z.string().optional().describe('取餐時段（已廢棄，保留相容性）'),
  customerNote: z.string().max(500).optional().describe('客製備註'),
  userId: z.number().int().positive().optional().describe('既有會員 ID（可選）'),
});

/**
 * 預購訂單回應
 */
export const PreorderOrderResponseSchema = z.object({
  success: z.literal(true).describe('操作是否成功'),
  data: z.object({
    orderNumber: z.string().describe('訂單編號'),
    campaignId: z.number().int().positive().describe('檔期 ID'),
    quantity: z.number().int().positive().describe('預購數量'),
    remainingQuantity: z.number().int().nonnegative().describe('剩餘量'),
    totalTwd: z.number().int().nonnegative().describe('訂單總金額'),
  }),
  timestamp: z.string().describe('時間戳'),
});

/**
 * 錯誤回應
 */
export const ErrorResponseSchema = z.object({
  code: z.string().describe('錯誤代碼'),
  message: z.string().describe('錯誤訊息'),
  details: z.unknown().optional().describe('錯誤細節'),
});

export type PreorderCampaign = z.infer<typeof PreorderCampaignSchema>;
export type PreorderCampaignProduct = z.infer<typeof PreorderCampaignProductSchema>;
export type PreorderCampaignQuery = z.infer<typeof PreorderCampaignQuerySchema>;
export type PreorderCampaignProductRequest = z.infer<typeof PreorderCampaignProductRequestSchema>;
export type CreatePreorderCampaignRequest = z.infer<typeof CreatePreorderCampaignRequestSchema>;
export type UpdatePreorderCampaignRequest = z.infer<typeof UpdatePreorderCampaignRequestSchema>;
export type CreatePreorderOrderRequest = z.infer<typeof CreatePreorderOrderRequestSchema>;

