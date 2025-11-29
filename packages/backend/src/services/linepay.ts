import type { Env } from '../env.d.ts';
import { logger } from '../utils/logger.js';
import { ApiError } from '../utils/api-error.js';

/**
 * LINE Pay 請求支付請求
 */
interface LinePayRequestPaymentRequest {
  amount: number;
  currency: 'TWD';
  orderId: string;
  packages: Array<{
    id: string;
    amount: number;
    name: string;
    products: Array<{
      name: string;
      quantity: number;
      price: number;
    }>;
  }>;
  redirectUrls: {
    confirmUrl: string;
    cancelUrl: string;
  };
}

/**
 * LINE Pay 請求支付回應
 */
interface LinePayRequestPaymentResponse {
  returnCode: string;
  returnMessage: string;
  info?: {
    paymentUrl: {
      web: string;
      app: string;
    };
    transactionId: number | string; // 可能是 number 或 string（避免精度丢失）
    paymentAccessToken: string;
  };
}

/**
 * LINE Pay 確認支付請求
 */
interface LinePayConfirmPaymentRequest {
  amount: number;
  currency: 'TWD';
}

/**
 * LINE Pay 確認支付回應
 */
interface LinePayConfirmPaymentResponse {
  returnCode: string;
  returnMessage: string;
  info?: {
    transactionId: number | string; // 可能是 number 或 string（避免精度丢失）
    orderId: string;
    payInfo: Array<{
      method: string;
      amount: number;
      creditCardNickname?: string;
      creditCardBrand?: string;
    }>;
  };
}

/**
 * LINE Pay 服務類別
 */
export class LinePayService {
  constructor(private env: Env) {
    // 檢查必要的環境變數
    if (!env.LINE_PAY_CHANNEL_ID || env.LINE_PAY_CHANNEL_ID === 'YOUR_SANDBOX_CHANNEL_ID') {
      logger.error('LINE Pay Channel ID 未配置', {
        channelId: env.LINE_PAY_CHANNEL_ID,
      });
      throw new ApiError('LINE_PAY_CONFIG_ERROR', 'LINE Pay Channel ID 未配置，請檢查 wrangler.toml', 500);
    }

    if (!env.LINE_PAY_CHANNEL_SECRET || env.LINE_PAY_CHANNEL_SECRET === 'YOUR_SANDBOX_CHANNEL_SECRET') {
      logger.error('LINE Pay Channel Secret 未配置', {
        hasSecret: !!env.LINE_PAY_CHANNEL_SECRET,
      });
      throw new ApiError('LINE_PAY_CONFIG_ERROR', 'LINE Pay Channel Secret 未配置，請檢查 wrangler.toml', 500);
    }

    if (!env.LINE_PAY_API_BASE) {
      logger.error('LINE Pay API Base 未配置');
      throw new ApiError('LINE_PAY_CONFIG_ERROR', 'LINE Pay API Base 未配置', 500);
    }

    logger.info('LINE Pay Service 初始化', {
      apiBase: env.LINE_PAY_API_BASE,
      isSandbox: env.LINE_PAY_API_BASE.includes('sandbox'),
      hasChannelId: !!env.LINE_PAY_CHANNEL_ID,
      hasChannelSecret: !!env.LINE_PAY_CHANNEL_SECRET,
    });
  }

  /**
   * 生成 LINE Pay API 簽名
   * 使用 Web Crypto API（Workers 環境）
   * 簽名算法：HMAC-SHA256(channelSecret + uri + requestBody + nonce)
   */
  private async generateSignature(
    channelSecret: string,
    uri: string,
    requestBody: string,
    nonce: string,
  ): Promise<string> {
    const message = channelSecret + uri + requestBody + nonce;

    // 將字符串轉換為 ArrayBuffer
    const encoder = new TextEncoder();
    const keyData = encoder.encode(channelSecret);
    const messageData = encoder.encode(message);

    // 導入密鑰
    const key = await crypto.subtle.importKey(
      'raw',
      keyData,
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );

    // 生成簽名
    const signature = await crypto.subtle.sign('HMAC', key, messageData);

    // 轉換為 Base64
    const signatureArray = new Uint8Array(signature);
    const base64String = btoa(String.fromCharCode(...signatureArray));

    return base64String;
  }

  /**
   * 請求支付
   */
  async requestPayment(
    orderId: string,
    amount: number,
    packageName: string,
    items: Array<{ product: { productName: string; productPriceTwd: number }; quantity: number }>,
    pointsDiscount?: number, // 點數折抵金額（可選）
  ): Promise<LinePayRequestPaymentResponse> {
    const nonce = crypto.randomUUID();
    // 構建商品列表
    const products = items.map((item) => ({
      name: item.product.productName,
      quantity: item.quantity,
      price: item.product.productPriceTwd,
    }));

    // 如果有點數折抵，將折抵金額作為負數商品項添加
    // 這樣可以確保 packages[].amount == sum(products[].quantity * products[].price)
    if (pointsDiscount && pointsDiscount > 0) {
      products.push({
        name: '點數折抵',
        quantity: 1,
        price: -pointsDiscount, // 負數表示折扣
      });
    }

    // 計算商品總和以驗證金額一致性
    const productsSum = products.reduce((sum, p) => sum + p.price * p.quantity, 0);
    
    // 驗證：amount 必須等於 products 的總和
    if (Math.abs(amount - productsSum) > 0.01) {
      logger.error('LINE Pay 金額驗證失敗', {
        amount,
        productsSum,
        difference: Math.abs(amount - productsSum),
        products,
      });
      throw new ApiError('LINE_PAY_AMOUNT_MISMATCH', `金額不一致：amount (${amount}) != sum(products) (${productsSum})`, 400);
    }

    const requestBody: LinePayRequestPaymentRequest = {
      amount,
      currency: 'TWD',
      orderId,
      packages: [
        {
          id: `package-${orderId}`,
          amount,
          name: packageName,
          products,
        },
      ],
      redirectUrls: {
        confirmUrl: this.env.LINE_PAY_RETURN_URL,
        cancelUrl: this.env.LINE_PAY_CANCEL_URL,
      },
    };

    const uri = '/v3/payments/request';
    const bodyString = JSON.stringify(requestBody);
    const signature = await this.generateSignature(
      this.env.LINE_PAY_CHANNEL_SECRET,
      uri,
      bodyString,
      nonce,
    );

    logger.info('LINE Pay 請求支付', {
      orderId,
      amount,
      packageName,
      itemCount: items.length,
      uri,
      nonce,
    });

    const response = await fetch(`${this.env.LINE_PAY_API_BASE}${uri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': this.env.LINE_PAY_CHANNEL_ID,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    logger.info('LINE Pay 請求支付回應', {
      status: response.status,
      statusText: response.statusText,
      responseText,
    });

    if (!response.ok) {
      logger.error('LINE Pay 請求支付失敗', {
        status: response.status,
        statusText: response.statusText,
        responseText,
      });
      throw new ApiError('LINE_PAY_REQUEST_FAILED', 'LINE Pay 支付請求失敗', 500);
    }

    let data: LinePayRequestPaymentResponse;
    try {
      // 先解析为普通对象，然后手动处理 transactionId（避免精度丢失）
      const rawData = JSON.parse(responseText);
      
      // 将 transactionId 转换为字符串（避免 JavaScript Number 精度问题）
      // LINE Pay 的 transactionId 是 19 位数字，超过 Number.MAX_SAFE_INTEGER
      if (rawData.info && rawData.info.transactionId !== undefined) {
        // 使用原始 JSON 字符串提取，避免精度丢失
        const transactionIdMatch = responseText.match(/"transactionId"\s*:\s*(\d+)/);
        if (transactionIdMatch && transactionIdMatch[1]) {
          rawData.info.transactionId = transactionIdMatch[1]; // 直接使用字符串
        } else {
          // 如果正则匹配失败，使用 String() 转换（可能仍有精度问题，但比直接解析好）
          rawData.info.transactionId = String(rawData.info.transactionId);
        }
      }
      
      data = rawData as LinePayRequestPaymentResponse;
    } catch (error) {
      logger.error('LINE Pay 回應解析失敗', { responseText, error });
      throw new ApiError('LINE_PAY_PARSE_ERROR', 'LINE Pay 回應解析失敗', 500);
    }

    if (data.returnCode !== '0000') {
      logger.error('LINE Pay 返回錯誤', {
        returnCode: data.returnCode,
        returnMessage: data.returnMessage,
      });
      throw new ApiError('LINE_PAY_ERROR', data.returnMessage || 'LINE Pay 支付請求失敗', 400);
    }

    if (!data.info) {
      logger.error('LINE Pay 回應缺少 info', { data });
      throw new ApiError('LINE_PAY_INVALID_RESPONSE', 'LINE Pay 回應格式錯誤', 500);
    }

    // 确保 transactionId 是字符串
    if (typeof data.info.transactionId === 'number') {
      logger.warn('transactionId 仍然是 number 类型，转换为字符串', {
        transactionId: data.info.transactionId,
      });
      data.info.transactionId = String(data.info.transactionId);
    }

    logger.info('LINE Pay 請求支付回應處理完成', {
      transactionId: data.info.transactionId,
      transactionIdType: typeof data.info.transactionId,
    });

    return data;
  }

  /**
   * 確認支付
   */
  async confirmPayment(
    transactionId: number | string, // 接受 number 或 string（避免精度丢失）
    amount: number,
    currency: 'TWD' = 'TWD',
  ): Promise<LinePayConfirmPaymentResponse> {
    const nonce = crypto.randomUUID();
    const requestBody: LinePayConfirmPaymentRequest = {
      amount,
      currency,
    };

    // URL 路径中的参数可以是字符串，直接使用（避免精度丢失）
    const transactionIdStr = String(transactionId);
    const uri = `/v3/payments/${transactionIdStr}/confirm`;
    
    logger.info('LINE Pay 確認支付（使用字符串 transactionId）', {
      transactionId: transactionIdStr,
      transactionIdType: typeof transactionId,
      uri,
    });
    const bodyString = JSON.stringify(requestBody);
    const signature = await this.generateSignature(
      this.env.LINE_PAY_CHANNEL_SECRET,
      uri,
      bodyString,
      nonce,
    );

    logger.info('LINE Pay 確認支付', {
      transactionId,
      amount,
      currency,
      uri,
      nonce,
    });

    const response = await fetch(`${this.env.LINE_PAY_API_BASE}${uri}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-LINE-ChannelId': this.env.LINE_PAY_CHANNEL_ID,
        'X-LINE-Authorization-Nonce': nonce,
        'X-LINE-Authorization': signature,
      },
      body: bodyString,
    });

    const responseText = await response.text();
    logger.info('LINE Pay 確認支付回應', {
      status: response.status,
      statusText: response.statusText,
      responseText,
    });

    if (!response.ok) {
      logger.error('LINE Pay 確認支付失敗', {
        status: response.status,
        statusText: response.statusText,
        responseText,
      });
      throw new ApiError('LINE_PAY_CONFIRM_FAILED', 'LINE Pay 支付確認失敗', 500);
    }

    let data: LinePayConfirmPaymentResponse;
    try {
      // 先解析为普通对象，然后手动处理 transactionId（避免精度丢失）
      const rawData = JSON.parse(responseText);
      
      // 将 transactionId 转换为字符串（避免 JavaScript Number 精度问题）
      if (rawData.info && rawData.info.transactionId !== undefined) {
        // 使用原始 JSON 字符串提取，避免精度丢失
        const transactionIdMatch = responseText.match(/"transactionId"\s*:\s*(\d+)/);
        if (transactionIdMatch && transactionIdMatch[1]) {
          rawData.info.transactionId = transactionIdMatch[1]; // 直接使用字符串
        } else {
          // 如果正则匹配失败，使用 String() 转换
          rawData.info.transactionId = String(rawData.info.transactionId);
        }
      }
      
      data = rawData as LinePayConfirmPaymentResponse;
    } catch (error) {
      logger.error('LINE Pay 確認回應解析失敗', { responseText, error });
      throw new ApiError('LINE_PAY_PARSE_ERROR', 'LINE Pay 回應解析失敗', 500);
    }

    if (data.returnCode !== '0000') {
      logger.error('LINE Pay 確認返回錯誤', {
        returnCode: data.returnCode,
        returnMessage: data.returnMessage,
      });
      throw new ApiError('LINE_PAY_ERROR', data.returnMessage || 'LINE Pay 支付確認失敗', 400);
    }

    if (!data.info) {
      logger.error('LINE Pay 確認回應缺少 info', { data });
      throw new ApiError('LINE_PAY_INVALID_RESPONSE', 'LINE Pay 回應格式錯誤', 500);
    }

    // 确保 transactionId 是字符串
    if (typeof data.info.transactionId === 'number') {
      logger.warn('transactionId 仍然是 number 类型，转换为字符串', {
        transactionId: data.info.transactionId,
      });
      data.info.transactionId = String(data.info.transactionId);
    }

    logger.info('LINE Pay 確認支付回應處理完成', {
      transactionId: data.info.transactionId,
      transactionIdType: typeof data.info.transactionId,
    });

    return data;
  }
}

