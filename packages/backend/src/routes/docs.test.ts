import { describe, it, expect } from 'vitest';
import { docsRouter } from './docs.js';

describe('docs router', () => {
  it('should serve Swagger UI HTML', async () => {
    const res = await docsRouter.request(new Request('http://localhost:8787/'));
    
    expect(res.status).toBe(200);
    expect(res.headers.get('content-type')).toContain('text/html');
    
    const html = await res.text();
    expect(html).toContain('swagger-ui');
    expect(html).toContain('/openapi.json');
  });

  it('should redirect OpenAPI YAML to JSON', async () => {
    const res = await docsRouter.request(new Request('http://localhost:8787/openapi.yaml'));
    
    expect(res.status).toBe(302);
    expect(res.headers.get('location')).toBe('/openapi.json');
  });

  it('should have proper security headers', async () => {
    const res = await docsRouter.request(new Request('http://localhost:8787/'));
    
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('X-Frame-Options')).toBe('DENY');
    expect(res.headers.get('X-XSS-Protection')).toBe('1; mode=block');
    expect(res.headers.get('Content-Security-Policy')).toContain("default-src 'self'");
  });
});
