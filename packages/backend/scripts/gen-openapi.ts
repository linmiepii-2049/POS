#!/usr/bin/env tsx

/**
 * OpenAPI 文檔生成腳本
 * 
 * 此腳本會：
 * 1. 啟動本地開發伺服器
 * 2. 抓取 /openapi.json 端點
 * 3. 轉換為 YAML 格式並儲存到 docs/openapi.yaml
 */

import { createApp } from '../src/app.js';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

const PORT = 8787;
const API_URL = `http://localhost:${PORT}`;
const OUTPUT_DIR = join(process.cwd(), 'docs');
const OUTPUT_FILE = join(OUTPUT_DIR, 'openapi.json');

/**
 * 將 JSON 轉換為 YAML 格式
 * @deprecated 目前未使用，保留供未來需求
 */
/*
function jsonToYaml(json: any): string {
  const yamlLines: string[] = [];
  
  function processValue(key: string, value: any, indent: number = 0): void {
    const spaces = '  '.repeat(indent);
    
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      yamlLines.push(`${spaces}${key}:`);
      for (const [k, v] of Object.entries(value)) {
        processValue(k, v, indent + 1);
      }
    } else if (Array.isArray(value)) {
      yamlLines.push(`${spaces}${key}:`);
      for (const item of value) {
        if (typeof item === 'object' && item !== null) {
          yamlLines.push(`${spaces}  -`);
          for (const [k, v] of Object.entries(item)) {
            processValue(k, v, indent + 2);
          }
        } else {
          yamlLines.push(`${spaces}  - ${item}`);
        }
      }
    } else {
      const val = typeof value === 'string' ? `"${value}"` : value;
      yamlLines.push(`${spaces}${key}: ${val}`);
    }
  }
  
  for (const [key, value] of Object.entries(json)) {
    processValue(key, value);
  }
  
  return yamlLines.join('\n');
}
*/

/**
 * 修正 OpenAPI JSON 格式問題
 */
function fixOpenAPIJson(json: any): any {
  // 添加 contact 資訊
  if (!json.info.contact) {
    json.info.contact = {
      name: "POS 系統開發團隊",
      email: "dev@pos-system.com"
    };
  }
  
  // 修正 components 結構
  if (!json.components) {
    json.components = {};
  }
  if (!json.components.schemas) {
    json.components.schemas = {};
  }
  if (!json.components.parameters) {
    json.components.parameters = {};
  }
  
  // 添加 tags 定義
  if (!json.tags) {
    json.tags = [
      {
        name: "System",
        description: "系統相關端點"
      }
    ];
  }
  
  // 為每個操作添加 operationId
  for (const [path, methods] of Object.entries(json.paths)) {
    for (const [method, operation] of Object.entries(methods as any)) {
      if (typeof operation === 'object' && operation !== null) {
        if (!(operation as any).operationId) {
          (operation as any).operationId = `${method}-${path.replace(/[^a-zA-Z0-9]/g, '-')}`;
        }
      }
    }
  }
  
  return json;
}

/**
 * 啟動伺服器並生成 OpenAPI 文檔
 */
async function generateOpenAPI(): Promise<void> {
  console.log('🚀 啟動本地開發伺服器...');
  
  const app = createApp();
  
  // 建立 docs 目錄
  try {
    mkdirSync(OUTPUT_DIR, { recursive: true });
  } catch {
    // 目錄已存在，忽略錯誤
  }
  
  try {
    // 模擬請求到 /openapi.json
    const request = new Request(`${API_URL}/openapi.json`);
    const response = await app.request(request);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const openApiJson = await response.json();
    console.log('✅ 成功取得 OpenAPI JSON');
    
    // 修正 OpenAPI JSON 格式
    const fixedJson = fixOpenAPIJson(openApiJson);
    
    // 寫入 JSON 檔案
    writeFileSync(OUTPUT_FILE, JSON.stringify(fixedJson, null, 2), 'utf8');
    console.log(`✅ OpenAPI 文檔已生成: ${OUTPUT_FILE}`);
    
  } catch (error) {
    console.error('❌ 生成 OpenAPI 文檔時發生錯誤:', error);
    process.exit(1);
  }
}

// 執行腳本
if (import.meta.url === `file://${process.argv[1]}`) {
  generateOpenAPI().catch(error => {
    console.error('❌ 腳本執行失敗:', error);
    process.exit(1);
  });
}
