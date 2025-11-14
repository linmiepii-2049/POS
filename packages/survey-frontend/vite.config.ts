import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 優先從 process.env 讀取（Vercel/GitHub Actions），然後從 .env 檔案讀取（本地）
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };
  
  // Vercel 部署時 base 為 '/'（不需要子路徑）
  // 如果需要在 GitHub Pages 部署，可以透過環境變數控制
  const base = process.env.VITE_BASE_PATH || '/';

  return {
    plugins: [react()],
    base,
    server: {
      port: 3001,
      host: true,
      cors: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            liff: ['@line/liff'],
          },
        },
      },
      minify: 'terser',
      terserOptions: {
        compress: {
          drop_console: true,
          drop_debugger: true
        }
      }
    },
    define: {
      'process.env': {},
      'import.meta.env.VITE_API_BASE': JSON.stringify(env.VITE_API_BASE),
      'import.meta.env.VITE_LIFF_ID': JSON.stringify(env.VITE_LIFF_ID),
    },
    envPrefix: 'VITE_',
  };
});

