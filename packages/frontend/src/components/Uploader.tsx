import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { clsx } from 'clsx';

/**
 * 圖片上傳器屬性
 */
export interface ImageUploaderProps {
  onUpload: (file: File) => Promise<string>;
  onSuccess?: (url: string) => void;
  onError?: (error: Error) => void;
  className?: string;
  accept?: string;
  maxSize?: number;
  disabled?: boolean;
  currentImageUrl?: string; // 當前圖片 URL
}

/**
 * 圖片上傳器元件
 */
export function ImageUploader({
  onUpload,
  onSuccess,
  onError,
  className,
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  currentImageUrl,
}: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  /**
   * 轉換圖片為 WebP 格式
   */
  const convertToWebP = useCallback((file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // 設定畫布尺寸
        const maxWidth = 800;
        const maxHeight = 600;
        let { width, height } = img;

        // 計算縮放比例
        if (width > height) {
          if (width > maxWidth) {
            height = (height * maxWidth) / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width = (width * maxHeight) / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        // 繪製圖片
        ctx?.drawImage(img, 0, 0, width, height);

        // 轉換為 WebP
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const webpFile = new File([blob], file.name.replace(/\.[^/.]+$/, '.webp'), {
                type: 'image/webp',
                lastModified: Date.now(),
              });
              resolve(webpFile);
            } else {
              reject(new Error('無法轉換圖片格式'));
            }
          },
          'image/webp',
          0.8 // 品質設定
        );
      };

      img.onerror = () => reject(new Error('無法載入圖片'));
      img.src = URL.createObjectURL(file);
    });
  }, []);

  /**
   * 處理檔案上傳
   */
  const onDrop = useCallback(
    async (acceptedFiles: File[]) => {
      if (acceptedFiles.length === 0) return;

      const file = acceptedFiles[0];
      setUploading(true);

      try {
        // 建立預覽
        const previewUrl = URL.createObjectURL(file);
        setPreview(previewUrl);

        // 轉換為 WebP
        const webpFile = await convertToWebP(file);

        // 上傳檔案
        const url = await onUpload(webpFile);
        
        onSuccess?.(url);
      } catch (error) {
        console.error('上傳失敗:', error);
        onError?.(error instanceof Error ? error : new Error('上傳失敗'));
        // 上傳失敗時清除預覽
        if (preview) {
          URL.revokeObjectURL(preview);
          setPreview(null);
        }
      } finally {
        setUploading(false);
      }
    },
    [onUpload, onSuccess, onError, convertToWebP, preview]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    maxSize,
    disabled: disabled || uploading,
    multiple: false,
  });

  return (
    <div className={clsx('space-y-4', className)}>
      {/* 上傳區域 */}
      <div
        {...getRootProps()}
        className={clsx(
          'border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors relative',
          isDragActive && 'border-blue-400 bg-blue-50',
          !isDragActive && 'border-gray-300 hover:border-gray-400',
          disabled && 'opacity-50 cursor-not-allowed',
          uploading && 'opacity-50 cursor-not-allowed'
        )}
      >
        <input {...getInputProps()} />
        
        {(preview || currentImageUrl) ? (
          <div className="relative">
            <img
              src={preview || currentImageUrl}
              alt="預覽"
              className="w-full h-48 object-cover rounded-lg"
              onError={(e) => {
                console.error('圖片載入失敗:', preview || currentImageUrl);
                e.currentTarget.style.display = 'none';
              }}
            />
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (preview) {
                  URL.revokeObjectURL(preview);
                }
                setPreview(null);
                onSuccess?.(''); // 清除圖片
              }}
              className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ) : uploading ? (
          <div className="space-y-2">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="text-sm text-gray-600">上傳中...</p>
          </div>
        ) : (
          <div className="space-y-2">
            <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="text-sm text-gray-600">
              {isDragActive ? (
                <p>放開即可上傳</p>
              ) : (
                <div>
                  <p className="text-blue-600 hover:text-blue-500">點擊上傳</p>
                  <p>或拖拽圖片到這裡</p>
                </div>
              )}
            </div>
            <p className="text-xs text-gray-500">
              支援 JPG、PNG、GIF、WebP，最大 {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          </div>
        )}
      </div>
    </div>
  );
}