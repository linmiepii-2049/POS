/**
 * Cloudflare Workers 入口點
 * 適配 Hono 應用程式到 Workers 環境
 */

import { createApp } from './app.js';

// 建立應用程式實例
const app = createApp();

/**
 * Workers fetch 事件處理器
 */
export default {
  async fetch(
    request: Request,
    env: any,
    ctx: ExecutionContext
  ): Promise<Response> {
    try {
      return await app.fetch(request, env, ctx);
    } catch (error) {
      console.error('Worker fetch error:', error);
      return new Response('Internal Server Error', { status: 500 });
    }
  },
};
