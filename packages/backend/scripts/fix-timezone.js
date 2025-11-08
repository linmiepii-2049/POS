#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const servicesDir = path.join(__dirname, '../src/services');
const files = ['products.ts', 'coupons.ts', 'orders.ts'];

files.forEach(file => {
  const filePath = path.join(servicesDir, file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  
  // 添加時間工具導入
  if (!content.includes('getCurrentTaipeiSQLite')) {
    content = content.replace(
      /import.*from.*zod.*users\.js.*;/,
      `import { getCurrentTaipeiSQLite } from '../utils/time.js';\n$&`
    );
  }
  
  // 替換 datetime('now') 為 getCurrentTaipeiSQLite()
  content = content.replace(/datetime\('now'\)/g, 'getCurrentTaipeiSQLite()');
  
  // 修復 INSERT 語句
  content = content.replace(
    /VALUES \(([^)]+), datetime\('now'\), datetime\('now'\)\)/g,
    'VALUES ($1, ?, ?)'
  );
  
  // 修復 UPDATE 語句
  content = content.replace(
    /SET ([^,]+), updated_at = datetime\('now'\)/g,
    'SET $1, updated_at = ?'
  );
  
  fs.writeFileSync(filePath, content);
  console.log(`Fixed ${file}`);
});

console.log('Timezone fix completed!');
