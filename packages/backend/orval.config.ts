import { defineConfig } from 'orval';

export default defineConfig({
  'pos-backend-api': {
    input: './docs/openapi.json',
    output: {
      target: '../sdk/src/index.ts',
      client: 'react-query',
      httpClient: 'fetch',
      baseURL: 'http://localhost:8787',
      override: {
        query: {
          useQuery: true,
        },
        operations: {
          // 健康檢查端點
          'get-health': {
            query: {
              staleTime: 30000, // 30 秒
              refetchOnWindowFocus: false,
            },
          },
          // 版本資訊端點
          'get-version': {
            query: {
              staleTime: 300000, // 5 分鐘
              refetchOnWindowFocus: false,
            },
          },
        },
      },
    },
  },
});
