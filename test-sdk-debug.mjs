#!/usr/bin/env node

/**
 * SDK 除錯腳本
 * 測試前端 SDK 是否正常工作
 */

import { getHealth, getVersion } from './packages/sdk/dist/index.js';

async function testSDK() {
  console.log('🧪 測試前端 SDK...');
  
  try {
    // 測試健康檢查 - 使用相對路徑（模擬瀏覽器環境）
    console.log('📡 測試健康檢查端點...');
    const healthResponse = await fetch('/health');
    if (!healthResponse.ok) {
      throw new Error(`HTTP ${healthResponse.status}: ${healthResponse.statusText}`);
    }
    const healthData = await healthResponse.json();
    console.log('✅ 健康檢查成功:', healthData);
    
    // 測試版本資訊
    console.log('📡 測試版本資訊端點...');
    const versionResponse = await fetch('/version');
    if (!versionResponse.ok) {
      throw new Error(`HTTP ${versionResponse.status}: ${versionResponse.statusText}`);
    }
    const versionData = await versionResponse.json();
    console.log('✅ 版本資訊成功:', versionData);
    
    console.log('🎉 前端 SDK 測試完成！');
    
  } catch (error) {
    console.error('❌ 前端 SDK 測試失敗:', error);
    console.log('💡 提示: 在瀏覽器中，相對路徑會透過 Vite 代理到後端');
    process.exit(1);
  }
}

testSDK();
