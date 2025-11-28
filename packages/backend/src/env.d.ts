import type { D1Database, R2Bucket } from '@cloudflare/workers-types';

/**
 * Cloudflare Workers 環境變數與綁定定義
 */
export interface Env {
  // D1 資料庫綁定
  DB: D1Database;
  
  // R2 儲存桶綁定
  ASSETS: R2Bucket;
  
  // 環境變數
  ENV_NAME: 'development' | 'staging' | 'production';
  API_BASE: string;
  CORS_ORIGINS: string; // 逗號分隔的來源清單
  GIT_SHA?: string; // 可選：Git commit SHA（CI/CD 注入）
  
  // LINE Pay 配置
  LINE_PAY_CHANNEL_ID: string;
  LINE_PAY_CHANNEL_SECRET: string;
  LINE_PAY_API_BASE: string; // Sandbox: 'https://sandbox-api-pay.line.me'
  LINE_PAY_RETURN_URL: string;
  LINE_PAY_CANCEL_URL: string;
}

/**
 * 全域環境變數（用於型別推導）
 */
declare global {
  const DB: D1Database;
  const ASSETS: R2Bucket;
}
