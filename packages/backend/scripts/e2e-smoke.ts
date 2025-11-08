#!/usr/bin/env tsx

/**
 * E2E Smoke 測試腳本
 * 測試本機開發伺服器的基本端點
 */

const BASE_URL = 'http://localhost:8787';

/**
 * 執行 HTTP 請求
 */
async function fetchJson(url: string): Promise<any> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error(`❌ 請求失敗 ${url}:`, error);
    throw error;
  }
}

/**
 * 測試健康檢查端點
 */
async function testHealthEndpoint(): Promise<void> {
  console.log('🔍 測試 /health 端點...');

  const data = await fetchJson(`${BASE_URL}/health`);

  // 驗證回應結構
  if (!data.ok || data.ok !== true) {
    throw new Error('健康檢查狀態不正確');
  }

  if (data.tz !== 'Asia/Taipei') {
    throw new Error('時區設定不正確');
  }

  if (!data.now_utc || !data.now_local) {
    throw new Error('時間資訊缺失');
  }

  // 驗證時間格式
  const utcRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
  if (!utcRegex.test(data.now_utc) || !utcRegex.test(data.now_local)) {
    throw new Error('時間格式不正確');
  }

  console.log('✅ /health 端點測試通過');
  console.log(`   時區: ${data.tz}`);
  console.log(`   UTC 時間: ${data.now_utc}`);
  console.log(`   本地時間: ${data.now_local}`);
}

/**
 * 測試版本端點
 */
async function testVersionEndpoint(): Promise<void> {
  console.log('🔍 測試 /version 端點...');

  const data = await fetchJson(`${BASE_URL}/version`);

  // 驗證回應結構
  if (!data.version || !data.name) {
    throw new Error('版本資訊不完整');
  }

  if (data.name !== '@pos/backend') {
    throw new Error('應用程式名稱不正確');
  }

  console.log('✅ /version 端點測試通過');
  console.log(`   名稱: ${data.name}`);
  console.log(`   版本: ${data.version}`);
}

/**
 * 主測試函數
 */
async function runSmokeTests(): Promise<void> {
  console.log('🚀 開始 E2E Smoke 測試...');
  console.log(`   目標伺服器: ${BASE_URL}`);
  console.log('');

  try {
    await testHealthEndpoint();
    console.log('');
    await testVersionEndpoint();
    console.log('');
    console.log('🎉 所有 E2E Smoke 測試通過！');
    process.exit(0);
  } catch (error) {
    console.error('');
    console.error('❌ E2E Smoke 測試失敗:', error);
    process.exit(1);
  }
}

// 執行測試
runSmokeTests();
