#!/usr/bin/env node

/**
 * PWA Icons Verification Script
 * 檢查 icons 是否正確生成並修復問題
 */

import { readFileSync, existsSync, statSync, mkdirSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = join(__dirname, '..');

// Required icons for PWA
const REQUIRED_ICONS = [
  'icon-72x72.png',
  'icon-96x96.png',
  'icon-128x128.png',
  'icon-144x144.png',
  'icon-152x152.png',
  'icon-192x192.png',
  'icon-384x384.png',
  'icon-512x512.png',
  'icon-maskable-512x512.png'
];

const ICONS_DIR = join(projectRoot, 'public', 'icons');
const MANIFEST_PATH = join(projectRoot, 'public', 'manifest.webmanifest');
const LOGO_SVG_PATH = join(projectRoot, 'logo.svg');

// Expected icon sizes
const ICON_SIZE_MAP = {
  'icon-72x72.png': { width: 72, height: 72 },
  'icon-96x96.png': { width: 96, height: 96 },
  'icon-128x128.png': { width: 128, height: 128 },
  'icon-144x144.png': { width: 144, height: 144 },
  'icon-152x152.png': { width: 152, height: 152 },
  'icon-192x192.png': { width: 192, height: 192 },
  'icon-384x384.png': { width: 384, height: 384 },
  'icon-512x512.png': { width: 512, height: 512 },
  'icon-maskable-512x512.png': { width: 512, height: 512 }
};

/**
 * Check if sharp is available for image processing
 */
async function checkSharp() {
  try {
    const sharp = await import('sharp');
    return sharp.default;
  } catch (error) {
    return null;
  }
}

/**
 * Validate PNG file and get dimensions
 */
async function validateIcon(iconPath, expectedSize) {
  const sharp = await checkSharp();
  if (!sharp) {
    // Fallback validation without sharp
    try {
      const stats = statSync(iconPath);
      if (stats.size === 0) {
        return { valid: false, error: '檔案為空' };
      }
      return { valid: true, width: expectedSize.width, height: expectedSize.height };
    } catch (error) {
      return { valid: false, error: error.message };
    }
  }

  try {
    const metadata = await sharp(iconPath).metadata();
    
    if (metadata.width !== expectedSize.width || metadata.height !== expectedSize.height) {
      return {
        valid: false,
        error: `尺寸不符: 期望 ${expectedSize.width}x${expectedSize.height}, 實際 ${metadata.width}x${metadata.height}`
      };
    }

    if (metadata.format !== 'png') {
      return { valid: false, error: `格式錯誤: 期望 PNG, 實際 ${metadata.format}` };
    }

    if (metadata.size === 0) {
      return { valid: false, error: '檔案為空' };
    }

    return { valid: true, width: metadata.width, height: metadata.height };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

/**
 * Check if manifest references all icons correctly
 */
function validateManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    return { valid: false, error: 'manifest.webmanifest 不存在' };
  }

  try {
    const manifestContent = readFileSync(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(manifestContent);

    if (!manifest.icons || !Array.isArray(manifest.icons)) {
      return { valid: false, error: 'manifest 中缺少 icons 陣列' };
    }

    const manifestIconPaths = manifest.icons.map(icon => icon.src);
    const missingIcons = REQUIRED_ICONS.filter(iconName => {
      const iconPath = `/icons/${iconName}`;
      return !manifestIconPaths.includes(iconPath);
    });

    if (missingIcons.length > 0) {
      return {
        valid: false,
        error: `manifest 中缺少 icons: ${missingIcons.join(', ')}`
      };
    }

    return { valid: true, icons: manifest.icons };
  } catch (error) {
    return { valid: false, error: `manifest 解析錯誤: ${error.message}` };
  }
}

/**
 * Auto-fix manifest if needed
 */
async function fixManifest() {
  console.log('🔧 修復 manifest.webmanifest...');

  if (!existsSync(MANIFEST_PATH)) {
    console.error('❌ manifest.webmanifest 不存在，無法自動修復');
    return false;
  }

  try {
    const manifestContent = readFileSync(MANIFEST_PATH, 'utf8');
    const manifest = JSON.parse(manifestContent);

    // Ensure icons array exists
    if (!manifest.icons) {
      manifest.icons = [];
    }

    // Add missing icons
    const existingIconPaths = manifest.icons.map(icon => icon.src);
    let addedCount = 0;

    for (const iconName of REQUIRED_ICONS) {
      const iconPath = `/icons/${iconName}`;
      if (!existingIconPaths.includes(iconPath)) {
        const size = iconName.match(/(\d+)x\d+/)?.[1];
        const purpose = iconName.includes('maskable') ? 'maskable' : 'any';
        
        manifest.icons.push({
          src: iconPath,
          sizes: `${size}x${size}`,
          type: 'image/png',
          purpose: purpose
        });
        addedCount++;
      }
    }

    if (addedCount > 0) {
      // Write updated manifest
      writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
      console.log(`✅ 已新增 ${addedCount} 個 icons 到 manifest`);
      return true;
    } else {
      console.log('✅ manifest 已包含所有必要的 icons');
      return true;
    }
  } catch (error) {
    console.error('❌ 修復 manifest 失敗:', error.message);
    return false;
  }
}

/**
 * Auto-regenerate missing icons
 */
async function regenerateMissingIcons(missingIcons) {
  console.log('🔧 重新生成缺失的 icons...');

  if (!existsSync(LOGO_SVG_PATH)) {
    console.error('❌ logo.svg 不存在，無法重新生成 icons');
    return false;
  }

  try {
    // Import build script
    const buildScript = join(__dirname, 'build-icons.mjs');
    if (!existsSync(buildScript)) {
      console.error('❌ build-icons.mjs 不存在');
      return false;
    }

    console.log('🔄 執行 build-icons.mjs...');
    
    // Use dynamic import to run the build script
    const { spawn } = await import('child_process');
    
    return new Promise((resolve) => {
      const child = spawn('node', [buildScript], {
        stdio: 'inherit',
        cwd: projectRoot
      });

      child.on('close', (code) => {
        if (code === 0) {
          console.log('✅ Icons 重新生成完成');
          resolve(true);
        } else {
          console.error('❌ Icons 重新生成失敗');
          resolve(false);
        }
      });
    });
  } catch (error) {
    console.error('❌ 重新生成 icons 失敗:', error.message);
    return false;
  }
}

/**
 * Main verification function
 */
async function verifyIcons() {
  console.log('🔍 驗證 PWA Icons...');
  console.log('');

  let allValid = true;
  const issues = [];

  // Check icons directory
  if (!existsSync(ICONS_DIR)) {
    console.error('❌ Icons 目錄不存在:', ICONS_DIR);
    issues.push('Icons 目錄不存在');
    allValid = false;
  }

  // Validate each required icon
  const missingIcons = [];
  const invalidIcons = [];

  for (const iconName of REQUIRED_ICONS) {
    const iconPath = join(ICONS_DIR, iconName);
    const expectedSize = ICON_SIZE_MAP[iconName];

    if (!existsSync(iconPath)) {
      console.error(`❌ 缺失: ${iconName}`);
      missingIcons.push(iconName);
      allValid = false;
      continue;
    }

    const validation = await validateIcon(iconPath, expectedSize);
    if (!validation.valid) {
      console.error(`❌ 無效: ${iconName} - ${validation.error}`);
      invalidIcons.push({ name: iconName, error: validation.error });
      allValid = false;
    } else {
      console.log(`✅ 有效: ${iconName} (${validation.width}x${validation.height})`);
    }
  }

  console.log('');

  // Validate manifest
  console.log('🔍 驗證 manifest.webmanifest...');
  const manifestValidation = validateManifest();
  if (!manifestValidation.valid) {
    console.error(`❌ Manifest 問題: ${manifestValidation.error}`);
    issues.push(`Manifest: ${manifestValidation.error}`);
    allValid = false;
  } else {
    console.log('✅ Manifest 有效');
  }

  console.log('');

  // Summary
  if (allValid) {
    console.log('🎉 所有 icons 驗證通過！');
    console.log('');
    console.log('驗證結果:');
    console.log(`✅ Icons: ${REQUIRED_ICONS.length}/${REQUIRED_ICONS.length} 有效`);
    console.log('✅ Manifest: 有效');
    console.log('');
    console.log('PWA Icons 已準備就緒！');
    return true;
  } else {
    console.log('⚠️  Icons 驗證發現問題:');
    console.log('');
    
    if (missingIcons.length > 0) {
      console.log(`❌ 缺失的 icons (${missingIcons.length}):`);
      missingIcons.forEach(icon => console.log(`  - ${icon}`));
    }
    
    if (invalidIcons.length > 0) {
      console.log(`❌ 無效的 icons (${invalidIcons.length}):`);
      invalidIcons.forEach(icon => console.log(`  - ${icon.name}: ${icon.error}`));
    }
    
    if (issues.length > 0) {
      console.log(`❌ 其他問題:`);
      issues.forEach(issue => console.log(`  - ${issue}`));
    }

    console.log('');
    console.log('🔧 嘗試自動修復...');

    // Auto-fix missing icons
    if (missingIcons.length > 0) {
      const regenerated = await regenerateMissingIcons(missingIcons);
      if (regenerated) {
        console.log('✅ 已重新生成缺失的 icons');
        // Re-verify
        return await verifyIcons();
      }
    }

    // Auto-fix manifest
    const manifestFixed = await fixManifest();
    if (manifestFixed) {
      console.log('✅ 已修復 manifest');
    }

    console.log('');
    console.log('❌ 自動修復完成，但仍有問題需要手動處理');
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  try {
    const success = await verifyIcons();
    process.exit(success ? 0 : 1);
  } catch (error) {
    console.error('❌ 驗證過程中發生錯誤:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
