/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string;
  readonly VITE_LIFF_ID?: string; // LIFF ID（可选，仅在需要 LIFF 时设置）
  readonly VITE_ENABLE_LIFF?: string; // 是否启用 LIFF（'true' | 'false'，默认 'false'）
  readonly VITE_ENV?: string; // 环境标识（'dev' | 'staging' | 'production'）
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

