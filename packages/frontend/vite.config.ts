import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { copyFileSync, existsSync } from 'fs';
import { join } from 'path';

// PWA Plugin for Vite
function pwaPlugin() {
  return {
    name: 'pwa-plugin',
    generateBundle() {
      // Copy Service Worker to dist
      const swSource = join(__dirname, 'public', 'sw.js');
      const swDest = join(__dirname, 'dist', 'sw.js');
      
      if (existsSync(swSource)) {
        copyFileSync(swSource, swDest);
        console.log('✅ Service Worker copied to dist');
      }
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), pwaPlugin()],
  server: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      // PWA headers
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    },
    // 移除代理配置，改用 CORS 白名單
    // proxy: {
    //   '/api': {
    //     target: 'http://localhost:8787',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/health': {
    //     target: 'http://localhost:8787',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    //   '/version': {
    //     target: 'http://localhost:8787',
    //     changeOrigin: true,
    //     secure: false,
    //   },
    // },
  },
  preview: {
    port: 3000,
    host: true,
    cors: true,
    headers: {
      // PWA headers for preview
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0',
      // Security headers
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block'
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    // PWA optimization
    assetsInlineLimit: 4096,
    rollupOptions: {
      external: (id) => {
        // 排除後端檔案
        if (id.includes('../../../backend/src/client/')) return true;
        return false;
      },
      output: {
        // Optimize chunk splitting for PWA
        manualChunks: {
          vendor: ['react', 'react-dom'],
          router: ['react-router-dom'],
          ui: ['react-hook-form', 'react-hot-toast']
        }
      }
    },
    // PWA build optimization
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
  // PWA specific configuration
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom']
  }
});
