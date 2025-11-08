#!/usr/bin/env node

/**
 * PWA Icons Generator Script
 * 使用 sharp 生成各種尺寸的 PWA icons
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Icon sizes for PWA
const ICON_SIZES = [
  { size: 72, name: 'icon-72x72.png' },
  { size: 96, name: 'icon-96x96.png' },
  { size: 128, name: 'icon-128x128.png' },
  { size: 144, name: 'icon-144x144.png' },
  { size: 152, name: 'icon-152x152.png' },
  { size: 192, name: 'icon-192x192.png' },
  { size: 384, name: 'icon-384x384.png' },
  { size: 512, name: 'icon-512x512.png' },
  { size: 512, name: 'icon-maskable-512x512.png', maskable: true }
];

const LOGO_SVG_PATH = join(projectRoot, 'logo.svg');
const ICONS_DIR = join(projectRoot, 'public', 'icons');

// Colors for maskable icon background
const MASKABLE_BACKGROUND = '#0f172a';
const MASKABLE_PADDING = 0.1; // 10% padding for maskable icons

/**
 * Check if sharp is available, if not provide installation instructions
 */
async function checkSharp() {
  try {
    const sharp = await import('sharp');
    return sharp.default;
  } catch (error) {
    console.error('❌ Sharp 未安裝或版本不兼容');
    console.error('');
    console.error('請執行以下指令安裝 sharp：');
    console.error('pnpm add -D sharp');
    console.error('');
    console.error('如果安裝失敗，請嘗試：');
    console.error('pnpm add -D sharp --platform=linux --arch=x64');
    console.error('');
    process.exit(1);
  }
}

/**
 * Generate a single icon from SVG
 */
async function generateIcon(sharp, svgBuffer, size, filename, maskable = false) {
  try {
    let pipeline = sharp(svgBuffer)
      .resize(size, size, {
        fit: 'contain',
        background: { r: 255, g: 255, b: 255, alpha: 0 }
      });

    // For maskable icons, add padding and background
    if (maskable) {
      const paddedSize = Math.round(size * (1 - MASKABLE_PADDING * 2));
      const padding = Math.round((size - paddedSize) / 2);
      
      pipeline = pipeline
        .resize(paddedSize, paddedSize, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 0 }
        })
        .extend({
          top: padding,
          bottom: padding,
          left: padding,
          right: padding,
          background: MASKABLE_BACKGROUND
        });
    }

    const outputPath = join(ICONS_DIR, filename);
    await pipeline.png().toFile(outputPath);
    
    console.log(`✅ 生成 ${filename} (${size}x${size})`);
    return true;
  } catch (error) {
    console.error(`❌ 生成 ${filename} 失敗:`, error.message);
    return false;
  }
}

/**
 * Generate all icons
 */
async function generateAllIcons() {
  console.log('🚀 開始生成 PWA Icons...');
  console.log('');

  // Check if sharp is available
  const sharp = await checkSharp();

  // Check if source SVG exists
  if (!existsSync(LOGO_SVG_PATH)) {
    console.error(`❌ 找不到源 SVG 檔案: ${LOGO_SVG_PATH}`);
    console.error('');
    console.error('請確保 logo.svg 存在於專案根目錄');
    process.exit(1);
  }

  // Create icons directory
  if (!existsSync(ICONS_DIR)) {
    mkdirSync(ICONS_DIR, { recursive: true });
    console.log(`📁 建立目錄: ${ICONS_DIR}`);
  }

  // Read SVG source
  const svgBuffer = readFileSync(LOGO_SVG_PATH);
  console.log(`📖 讀取 SVG 源檔: ${LOGO_SVG_PATH}`);
  console.log('');

  // Generate all icons
  let successCount = 0;
  let totalCount = ICON_SIZES.length;

  for (const icon of ICON_SIZES) {
    const success = await generateIcon(
      sharp,
      svgBuffer,
      icon.size,
      icon.name,
      icon.maskable
    );
    if (success) successCount++;
  }

  console.log('');
  console.log('📊 生成結果:');
  console.log(`✅ 成功: ${successCount}/${totalCount}`);
  console.log(`❌ 失敗: ${totalCount - successCount}/${totalCount}`);

  if (successCount === totalCount) {
    console.log('');
    console.log('🎉 所有 icons 生成完成！');
    console.log('');
    console.log('生成的檔案:');
    ICON_SIZES.forEach(icon => {
      console.log(`  - ${icon.name}`);
    });
  } else {
    console.log('');
    console.error('⚠️  部分 icons 生成失敗，請檢查錯誤訊息');
    process.exit(1);
  }
}

/**
 * Generate additional icons for different platforms
 */
async function generateAdditionalIcons(sharp, svgBuffer) {
  console.log('');
  console.log('🔧 生成額外的平台 icons...');

  const additionalIcons = [
    { size: 180, name: 'apple-touch-icon.png' }, // iOS
    { size: 32, name: 'favicon-32x32.png' },     // Favicon
    { size: 16, name: 'favicon-16x16.png' }      // Favicon
  ];

  for (const icon of additionalIcons) {
    await generateIcon(sharp, svgBuffer, icon.size, icon.name);
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    await generateAllIcons();
    
    // Generate additional icons
    const sharp = await checkSharp();
    const svgBuffer = readFileSync(LOGO_SVG_PATH);
    await generateAdditionalIcons(sharp, svgBuffer);
    
    console.log('');
    console.log('✨ 所有 icons 生成完成！');
    console.log('');
    console.log('下一步:');
    console.log('1. 執行 pnpm run pwa:icons:verify 驗證 icons');
    console.log('2. 執行 pnpm run build 建置專案');
    console.log('3. 執行 pnpm run preview 預覽 PWA');
    
  } catch (error) {
    console.error('❌ 生成 icons 時發生錯誤:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
