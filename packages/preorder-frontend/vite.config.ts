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
    outDir: 'dist',
    commonjsOptions: {
      include: [/@line\/liff/, /node_modules/],
      transformMixedEsModules: true,
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // 将 LIFF SDK 单独打包
          if (id.includes('@line/liff')) {
            return 'line-liff';
          }
          // 将 vendor 库单独打包
          if (id.includes('node_modules')) {
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor';
            }
            return 'vendor-other';
          }
        },
      },
    },
  },
  resolve: {
    dedupe: ['@line/liff'],
  },
  optimizeDeps: {
    include: ['@line/liff'],
  },
});



