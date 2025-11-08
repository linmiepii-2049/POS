import { describe, it, expect } from 'vitest';
import { createApp } from './app.js';

describe('App Routes', () => {
  const app = createApp();

  it('GET /health should return health status with time info', async () => {
    const res = await app.request('/health');

    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      ok: boolean;
      tz: string;
      now_utc: string;
      now_local: string;
    };
    expect(data).toHaveProperty('ok', true);
    expect(data).toHaveProperty('tz', 'Asia/Taipei');
    expect(data).toHaveProperty('now_utc');
    expect(data).toHaveProperty('now_local');

    // 驗證時間格式
    expect(data.now_utc).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
    expect(data.now_local).toMatch(
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/
    );
  });

  it('GET /version should return version info', async () => {
    const res = await app.request('/version');

    expect(res.status).toBe(200);

    const data = (await res.json()) as {
      version: string;
      name: string;
    };
    expect(data).toHaveProperty('version');
    expect(data).toHaveProperty('name', '@pos/backend');
    expect(typeof data.version).toBe('string');
  });

  it('should handle CORS preflight request', async () => {
    const res = await app.request('/', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    // CORS preflight 通常回傳 204 No Content
    expect([200, 204]).toContain(res.status);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'http://localhost:3000'
    );
  });
});
