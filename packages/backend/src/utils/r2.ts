import type { R2Bucket } from '@cloudflare/workers-types';

/**
 * R2 工具類別
 */
export class R2Service {
  constructor(
    private bucket: R2Bucket,
    private envName: string = 'development',
    private apiBase: string = 'http://localhost:8787'
  ) {}

  /**
   * 產生唯一的檔案 key
   */
  private generateKey(prefix: string, originalName: string): string {
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split('.').pop() || 'webp';
    return `${prefix}/${timestamp}-${random}.${extension}`;
  }

  /**
   * 上傳檔案到 R2
   */
  async uploadFile(file: File, prefix: string = 'products'): Promise<{ key: string; publicUrl: string }> {
    // 驗證檔案類型
    if (!file.type.startsWith('image/')) {
      throw new Error('只允許上傳圖片檔案');
    }

    // 驗證檔案大小 (最大 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new Error('檔案大小不能超過 10MB');
    }

    // 產生檔案 key
    const key = this.generateKey(prefix, file.name);

    try {
      // 上傳檔案
      await this.bucket.put(key, file as any, {
        httpMetadata: {
          contentType: file.type,
          cacheControl: 'public, max-age=31536000', // 1 年快取
        },
        customMetadata: {
          originalName: file.name,
          uploadedAt: new Date().toISOString(),
        },
      });

      // 根據環境返回正確的圖片 URL
      // 使用後端 API 的代理路由 /assets/:key
      const publicUrl = `${this.apiBase}/assets/${key}`;

      return {
        key,
        publicUrl,
      };
    } catch (error) {
      console.error('上傳檔案到 R2 失敗:', error);
      throw new Error('上傳檔案失敗');
    }
  }

  /**
   * 取得檔案的公開 URL
   */
  async getPublicUrl(key: string): Promise<string> {
    try {
      const object = await this.bucket.get(key);
      if (!object) {
        throw new Error('檔案不存在');
      }

      // 嘗試透過 R2 的公開 URL 存取
      // 注意：這需要 bucket 設定為公開存取
      const bucketName = (this.bucket as any).name || 'pos-assets';
      const publicUrl = `https://pub-${bucketName}.r2.dev/${key}`;
      
      // 驗證 URL 是否可存取
      const response = await fetch(publicUrl, { method: 'HEAD' });
      if (response.ok) {
        return publicUrl;
      }

      throw new Error('無法取得公開 URL');
    } catch {
      throw new Error('檔案不存在或無法存取');
    }
  }

  /**
   * 透過代理取得檔案內容
   */
  async getFile(key: string): Promise<{ body: ReadableStream; contentType: string } | null> {
    try {
      const object = await this.bucket.get(key);
      if (!object) {
        return null;
      }

      return {
        body: object.body as any,
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
      };
    } catch (error) {
      console.error('取得檔案失敗:', error);
      return null;
    }
  }

  /**
   * 刪除檔案
   */
  async deleteFile(key: string): Promise<boolean> {
    try {
      await this.bucket.delete(key);
      return true;
    } catch (error) {
      console.error('刪除檔案失敗:', error);
      return false;
    }
  }

  /**
   * 檢查檔案是否存在
   */
  async fileExists(key: string): Promise<boolean> {
    try {
      const object = await this.bucket.head(key);
      return object !== null;
    } catch {
      return false;
    }
  }

  /**
   * 取得檔案資訊
   */
  async getFileInfo(key: string): Promise<{
    size: number;
    contentType: string;
    lastModified: Date;
    etag: string;
  } | null> {
    try {
      const object = await this.bucket.head(key);
      if (!object) {
        return null;
      }

      return {
        size: object.size,
        contentType: object.httpMetadata?.contentType || 'application/octet-stream',
        lastModified: object.uploaded,
        etag: object.etag,
      };
    } catch (error) {
      console.error('取得檔案資訊失敗:', error);
      return null;
    }
  }
}
