import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public status: ContentfulStatusCode = 400,
    public details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

