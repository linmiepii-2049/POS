#!/usr/bin/env node

/**
 * SDK 生成後處理腳本
 * 自動修正 Orval 生成的代碼中的已知問題
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sdkIndexPath = path.join(__dirname, '../../sdk/src/index.ts');

console.log('🔧 執行 SDK 後處理...');

// 讀取 SDK 檔案
let content = fs.readFileSync(sdkIndexPath, 'utf8');

// 1. 添加 config.ts 的 import（如果尚未存在）
if (!content.includes('import { createFullURL } from')) {
  // 在文件開頭添加 import
  const importStatement = `import { createFullURL } from './config.js';\n\n`;
  content = importStatement + content;
}

// 2. 修正所有 URL 函數使用 createFullURL
// 處理簡單的 return 語句
content = content.replace(/return `(\/[^`]+)`$/gm, (match, path) => {
  return `return createFullURL(\`${path}\`)`;
});

// 處理條件運算符
content = content.replace(
  /return stringifiedParams\.length > 0 \? `(\/[^`]+)` : `(\/[^`]+)`$/gm,
  (match, path1, path2) => {
    return `return stringifiedParams.length > 0 ? createFullURL(\`${path1}\`) : createFullURL(\`${path2}\`)`;
  }
);

// 3. 修正 FormData.append 的 Blob 類型檢查
content = content.replace(
  /if\(uploadsProductImageLocalBody\.file !== undefined && uploadsProductImageLocalBody\.file !== null\) \{[\s\n]+formData\.append\(`file`, uploadsProductImageLocalBody\.file\)/g,
  `if(uploadsProductImageLocalBody.file !== undefined && uploadsProductImageLocalBody.file !== null && typeof uploadsProductImageLocalBody.file === 'object' && uploadsProductImageLocalBody.file instanceof Blob) {
 formData.append(\`file\`, uploadsProductImageLocalBody.file)`
);

// 寫回檔案
fs.writeFileSync(sdkIndexPath, content, 'utf8');

// 統計修正結果
const lines = content.split('\n');
const urlFunctions = lines.filter(line => line.includes('createFullURL'));
console.log(`✅ SDK 後處理完成！修正了 ${urlFunctions.length} 個 URL 函數`);
