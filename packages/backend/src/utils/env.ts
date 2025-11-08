/**
 * 環境變數工具
 * 處理環境變數的解析與驗證
 */

import type { Env } from '../env.d.ts';

/**
 * 解析 CORS_ORIGINS 環境變數
 * @param corsOrigins 逗號分隔的來源清單
 * @returns 來源陣列
 */
export function parseCorsOrigins(corsOrigins: string): string[] {
  return corsOrigins
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);
}

/**
 * 取得環境名稱
 */
export function getEnvName(env: Env): string {
  return env.ENV_NAME || 'development';
}

/**
 * 取得 API Base URL
 */
export function getApiBase(env: Env): string {
  return env.API_BASE || 'http://localhost:8787';
}

/**
 * 取得日誌前綴
 */
export function getLogPrefix(env: Env): string {
  return `[${getEnvName(env)}]`;
}
