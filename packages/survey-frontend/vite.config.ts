import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  
  // GitHub Pages 的 base 路徑（僅在 production 時使用）
  const base = mode === 'production' 
    ? '/POS/'  // GitHub repo 名稱
    : '/';

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
    },
    envPrefix: 'VITE_',
  };
});

