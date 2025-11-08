import { Hono } from 'hono';

/**
 * Swagger UI 文檔路由
 * 提供 /docs 端點顯示 API 文檔
 */
export const docsRouter = new Hono();

/**
 * 生成 Swagger UI HTML
 */
function generateSwaggerUIHtml(openApiUrl: string): string {
  return `<!DOCTYPE html>
<html lang="zh-TW">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>POS 系統後端 API 文檔</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.29.0/swagger-ui.css" />
  <style>
    .swagger-ui .topbar { display: none; }
    .swagger-ui .info .title { color: #3b82f6; }
    .swagger-ui .scheme-container { background: #f8fafc; padding: 10px; border-radius: 4px; }
    .swagger-ui .info { margin: 20px 0; }
    .swagger-ui .info .title { font-size: 2.5rem; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.29.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.29.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = function() {
      const ui = SwaggerUIBundle({
        url: '${openApiUrl}',
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        plugins: [
          SwaggerUIBundle.plugins.DownloadUrl
        ],
        layout: "StandaloneLayout",
        validatorUrl: null,
        tryItOutEnabled: true,
        requestInterceptor: function(request) {
          console.log('Request:', request);
          return request;
        },
        responseInterceptor: function(response) {
          console.log('Response:', response);
          return response;
        }
      });
    };
  </script>
</body>
</html>`;
}

/**
 * GET /docs - Swagger UI 文檔頁面
 */
docsRouter.get('/', c => {
  const openApiUrl = '/openapi.json';
  const html = generateSwaggerUIHtml(openApiUrl);
  
  return c.html(html, 200, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, max-age=3600',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Content-Security-Policy': [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://unpkg.com",
      "style-src 'self' 'unsafe-inline' https://unpkg.com",
      "img-src 'self' data: https:",
      "font-src 'self' data: https://unpkg.com",
      "connect-src 'self' https://unpkg.com",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'"
    ].join('; '),
  });
});

/**
 * GET /docs/openapi.yaml - 提供 YAML 格式的 OpenAPI 文檔
 * 用於開發時本地供應
 */
docsRouter.get('/openapi.yaml', c => {
  // 簡化版本，直接重定向到 JSON 端點
  return c.redirect('/openapi.json', 302);
});
