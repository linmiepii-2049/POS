#!/usr/bin/env node

/**
 * API Health Check Script
 * 檢查 API 連線狀態、CORS 設定和環境變數
 */

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// API Configuration
const API_CONFIG = {
  dev: {
    baseUrl: 'http://localhost:8787',
    endpoints: ['/api/health', '/api/version', '/api/products']
  },
  prod: {
    baseUrl: 'https://api.example.com',
    endpoints: ['/api/health', '/api/version']
  }
};

// CORS allowed origins
const CORS_ALLOWED_ORIGINS = [
  'http://localhost:3000',
  'https://localhost:3000',
  'http://127.0.0.1:3000',
  'https://127.0.0.1:3000'
];

/**
 * Check if fetch is available (Node.js 18+ or polyfill)
 */
async function checkFetch() {
  try {
    // Try native fetch first
    if (typeof fetch !== 'undefined') {
      return fetch;
    }
    
    // Try dynamic import for Node.js
    const { default: nodeFetch } = await import('node-fetch');
    return nodeFetch;
  } catch (error) {
    console.error('❌ Fetch 不可用');
    console.error('');
    console.error('請安裝 node-fetch:');
    console.error('pnpm add -D node-fetch');
    console.error('');
    console.error('或使用 Node.js 18+ 版本');
    process.exit(1);
  }
}

/**
 * Test API endpoint
 */
async function testEndpoint(fetch, baseUrl, endpoint, timeout = 5000) {
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'PWA-API-Checker/1.0.0'
      },
      signal: controller.signal
    });
    
    clearTimeout(timeoutId);
    
    return {
      success: true,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      url: url
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      return {
        success: false,
        error: `請求超時 (${timeout}ms)`,
        url: url
      };
    }
    
    return {
      success: false,
      error: error.message,
      url: url
    };
  }
}

/**
 * Test CORS preflight
 */
async function testCORS(fetch, baseUrl, origin) {
  const url = `${baseUrl}/api/health`;
  
  try {
    const response = await fetch(url, {
      method: 'OPTIONS',
      headers: {
        'Origin': origin,
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'Content-Type'
      }
    });
    
    const corsHeaders = {
      'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin'),
      'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods'),
      'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers'),
      'Access-Control-Allow-Credentials': response.headers.get('Access-Control-Allow-Credentials')
    };
    
    return {
      success: response.status < 400,
      status: response.status,
      corsHeaders: corsHeaders
    };
  } catch (error) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Check environment variables
 */
function checkEnvironmentVariables() {
  console.log('🔍 檢查環境變數...');
  
  const requiredEnvVars = [
    'VITE_API_BASE_URL',
    'VITE_API_TIMEOUT'
  ];
  
  const optionalEnvVars = [
    'VITE_APP_VERSION',
    'VITE_APP_NAME'
  ];
  
  let allValid = true;
  
  console.log('');
  console.log('必需的環境變數:');
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value}`);
    } else {
      console.log(`❌ ${envVar}: 未設定`);
      allValid = false;
    }
  }
  
  console.log('');
  console.log('可選的環境變數:');
  for (const envVar of optionalEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${value}`);
    } else {
      console.log(`⚠️  ${envVar}: 未設定 (可選)`);
    }
  }
  
  return allValid;
}

/**
 * Generate environment file template
 */
function generateEnvTemplate() {
  const envTemplate = `# API Configuration
VITE_API_BASE_URL=http://localhost:8787
VITE_API_TIMEOUT=5000

# App Configuration
VITE_APP_VERSION=1.0.0
VITE_APP_NAME=真真家

# Development
VITE_DEV_MODE=true
VITE_DEBUG=false

# Production (uncomment for production)
# VITE_API_BASE_URL=https://api.example.com
# VITE_DEV_MODE=false
`;

  console.log('');
  console.log('📝 建議的 .env 檔案內容:');
  console.log('─'.repeat(50));
  console.log(envTemplate);
  console.log('─'.repeat(50));
}

/**
 * Check API configuration for specific environment
 */
async function checkAPIConfig(fetch, environment) {
  const config = API_CONFIG[environment];
  if (!config) {
    console.error(`❌ 未知的環境: ${environment}`);
    return false;
  }
  
  console.log(`🔍 檢查 ${environment} 環境 API...`);
  console.log(`📍 Base URL: ${config.baseUrl}`);
  console.log('');
  
  let allEndpointsHealthy = true;
  
  // Test each endpoint
  for (const endpoint of config.endpoints) {
    console.log(`🔗 測試 ${endpoint}...`);
    const result = await testEndpoint(fetch, config.baseUrl, endpoint);
    
    if (result.success) {
      console.log(`✅ ${result.status} ${result.statusText}`);
      
      // Check response headers
      const contentType = result.headers['content-type'];
      if (contentType && contentType.includes('application/json')) {
        console.log(`   Content-Type: ${contentType}`);
      }
    } else {
      console.log(`❌ 失敗: ${result.error}`);
      allEndpointsHealthy = false;
    }
  }
  
  console.log('');
  
  // Test CORS
  console.log('🌐 檢查 CORS 設定...');
  let corsWorking = true;
  
  for (const origin of CORS_ALLOWED_ORIGINS) {
    console.log(`🔗 測試 CORS from ${origin}...`);
    const corsResult = await testCORS(fetch, config.baseUrl, origin);
    
    if (corsResult.success) {
      console.log(`✅ CORS 預檢通過`);
      if (corsResult.corsHeaders['Access-Control-Allow-Origin']) {
        console.log(`   Allow-Origin: ${corsResult.corsHeaders['Access-Control-Allow-Origin']}`);
      }
    } else {
      console.log(`❌ CORS 失敗: ${corsResult.error || `Status ${corsResult.status}`}`);
      corsWorking = false;
    }
  }
  
  console.log('');
  
  return allEndpointsHealthy && corsWorking;
}

/**
 * Main API check function
 */
async function checkAPI() {
  console.log('🚀 開始 API 健康檢查...');
  console.log('');
  
  // Check fetch availability
  const fetch = await checkFetch();
  
  // Check environment variables
  const envValid = checkEnvironmentVariables();
  if (!envValid) {
    console.log('');
    console.log('⚠️  環境變數設定不完整');
    generateEnvTemplate();
  }
  
  console.log('');
  
  // Check both dev and prod environments
  let allEnvironmentsHealthy = true;
  
  for (const environment of ['dev', 'prod']) {
    const healthy = await checkAPIConfig(fetch, environment);
    if (!healthy) {
      allEnvironmentsHealthy = false;
    }
    console.log('');
  }
  
  // Summary
  console.log('📊 API 檢查結果:');
  console.log('─'.repeat(50));
  
  if (allEnvironmentsHealthy && envValid) {
    console.log('✅ 所有 API 檢查通過');
    console.log('');
    console.log('🎉 API 配置正確，可以開始使用 PWA！');
    console.log('');
    console.log('下一步:');
    console.log('1. 執行 pnpm run build 建置專案');
    console.log('2. 執行 pnpm run preview 預覽 PWA');
    console.log('3. 使用 Lighthouse 檢查 PWA 分數');
    return true;
  } else {
    console.log('❌ API 檢查發現問題');
    console.log('');
    
    if (!envValid) {
      console.log('🔧 請設定環境變數:');
      console.log('   - 建立 .env 檔案');
      console.log('   - 設定 VITE_API_BASE_URL');
      console.log('   - 設定 VITE_API_TIMEOUT');
    }
    
    if (!allEnvironmentsHealthy) {
      console.log('🔧 請檢查 API 服務:');
      console.log('   - 確保後端服務正在運行');
      console.log('   - 檢查 CORS 設定');
      console.log('   - 驗證 API 端點回應');
    }
    
    console.log('');
    console.log('💡 提示:');
    console.log('   - 開發環境: 執行 pnpm run dev (後端)');
    console.log('   - 檢查 wrangler.toml 中的 CORS 設定');
    console.log('   - 確認 API 路由正確配置');
    
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const success = await checkAPI();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ API 檢查過程中發生錯誤:', error.message);
    console.error('');
    console.error('錯誤詳情:');
    console.error(error.stack);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
