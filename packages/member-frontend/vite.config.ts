import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // 優先從 process.env 讀取（GitHub Actions/Vercel），然後從 .env 檔案讀取（本地）
  const env = { ...loadEnv(mode, process.cwd(), ''), ...process.env };

  return {
    plugins: [react()],
    server: {
      port: 3002,
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

