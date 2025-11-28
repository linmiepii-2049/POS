import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    port: 3100,
  },
  preview: {
    host: true,
    port: 3100,
  },
  envPrefix: 'VITE_',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'line-liff': ['@line/liff'], // 将 LIFF SDK 单独打包
        },
      },
    },
  },
  optimizeDeps: {
    include: ['@line/liff'],
  },
});



