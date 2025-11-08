/**
 * SDK 配置
 * 提供不同環境的 baseURL 配置
 * 
 * 環境變數優先級：
 * 1. VITE_API_BASE_URL (Vite 前端專案)
 * 2. 預設值：http://localhost:8787 (本地開發)
 */

// 聲明 Vite 環境變數類型
declare const import_meta_env_VITE_API_BASE_URL: string | undefined;

export const getBaseURL = (): string => {
  // 瀏覽器環境：使用 Vite 環境變數
  // Vite 會在編譯時替換 import.meta.env.VITE_API_BASE_URL
  if (typeof window !== 'undefined') {
    try {
      // @ts-ignore - Vite 在編譯時會注入環境變數
      const viteEnv = import.meta.env?.VITE_API_BASE_URL;
      if (viteEnv) {
        return viteEnv;
      }
    } catch (e) {
      // import.meta 可能不存在（例如在測試環境）
    }
  }
  
  // 預設值：本地開發
  return 'http://localhost:8787';
};

export const createFullURL = (path: string): string => {
  const baseURL = getBaseURL();
  return `${baseURL}${path}`;
};