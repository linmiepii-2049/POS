# 重新部署 Staging 后端

## 问题说明

CORS 配置已更新，但 staging 环境的后端还没有重新部署，所以 CORS 配置还没有生效。

## 部署步骤

### 方法 1：使用 GitHub Actions（推荐）

1. 前往 GitHub 仓库：https://github.com/linmiepii-2049/POS
2. 点击 **Actions** 标签
3. 选择 **"Deploy to Staging"** workflow
4. 点击 **"Run workflow"** 按钮
5. 输入部署原因（例如："Fix CORS for preorder frontend"）
6. 点击 **"Run workflow"** 开始部署
7. 等待部署完成（通常需要 2-3 分钟）

### 方法 2：手动部署

```bash
cd packages/backend
pnpm run deploy:staging
```

## 验证部署

部署完成后，测试 CORS 配置：

```bash
curl -v -H "Origin: https://pos-preorder-frontend.vercel.app" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS \
  "https://pos-backend-staging.survey-api.workers.dev/api/preorders/active"
```

应该看到响应头中包含：
```
< access-control-allow-origin: https://pos-preorder-frontend.vercel.app
```

## 部署后验证

1. 等待 2-3 分钟让部署生效
2. 清除浏览器缓存或使用无痕模式
3. 重新访问 `https://pos-preorder-frontend.vercel.app/`
4. 检查浏览器 Console，应该不再有 CORS 错误

