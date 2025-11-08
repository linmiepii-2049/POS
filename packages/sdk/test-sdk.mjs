#!/usr/bin/env node

/**
 * SDK 測試腳本
 * 驗證共用 SDK 是否正常工作
 */

async function testSDK() {
  console.log('🧪 測試共用 SDK...');
  
  try {
    // 測試健康檢查
    console.log('📡 測試健康檢查端點...');
    const healthResponse = await fetch('http://localhost:8787/health');
    const healthData = await healthResponse.json();
    console.log('✅ 健康檢查成功:', healthData);
    
    // 測試版本資訊
    console.log('📡 測試版本資訊端點...');
    const versionResponse = await fetch('http://localhost:8787/version');
    const versionData = await versionResponse.json();
    console.log('✅ 版本資訊成功:', versionData);
    
    console.log('🎉 SDK 測試完成！共用 SDK 運作正常。');
    
  } catch (error) {
    console.error('❌ SDK 測試失敗:', error);
    process.exit(1);
  }
}

testSDK();
