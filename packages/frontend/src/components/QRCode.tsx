import { useState } from 'react';

/**
 * QR Code 組件
 * 顯示店家收款 QR Code（占位圖）
 */

/**
 * QR Code Props
 */
export interface QRCodeProps {
  size?: number;
  className?: string;
  paymentUrl?: string;
  imageUrl?: string; // 自定義 QR Code 圖片 URL
}

/**
 * QR Code 組件
 */
export function QRCode({ size = 200, className = '', paymentUrl, imageUrl }: QRCodeProps) {
  const [imageError, setImageError] = useState(false);

  // 如果有提供自定義圖片 URL 且沒有載入錯誤，使用該圖片
  if (imageUrl && !imageError) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <div 
          className="border-2 border-gray-300 rounded-lg p-4 bg-white"
          style={{ width: size, height: size }}
        >
          <img
            src={imageUrl}
            alt="Payment QR Code"
            className="w-full h-full object-contain"
            onError={() => setImageError(true)}
          />
        </div>
        
        <p className="mt-3 text-sm text-gray-600 text-center">
          請使用手機掃描 QR Code 進行付款
        </p>
        
        {paymentUrl && (
          <p className="mt-1 text-xs text-gray-400 text-center max-w-xs break-all">
            {paymentUrl}
          </p>
        )}
      </div>
    );
  }

  // 預設使用 SVG 占位圖
  const svgContent = `
    <svg width="${size}" height="${size}" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="white"/>
      <g fill="black">
        <!-- 模擬 QR Code 模式 -->
        <rect x="10" y="10" width="20" height="20"/>
        <rect x="40" y="10" width="20" height="20"/>
        <rect x="70" y="10" width="20" height="20"/>
        <rect x="100" y="10" width="20" height="20"/>
        <rect x="130" y="10" width="20" height="20"/>
        <rect x="160" y="10" width="20" height="20"/>
        
        <rect x="10" y="40" width="20" height="20"/>
        <rect x="70" y="40" width="20" height="20"/>
        <rect x="130" y="40" width="20" height="20"/>
        <rect x="160" y="40" width="20" height="20"/>
        
        <rect x="10" y="70" width="20" height="20"/>
        <rect x="40" y="70" width="20" height="20"/>
        <rect x="100" y="70" width="20" height="20"/>
        <rect x="160" y="70" width="20" height="20"/>
        
        <rect x="10" y="100" width="20" height="20"/>
        <rect x="70" y="100" width="20" height="20"/>
        <rect x="130" y="100" width="20" height="20"/>
        
        <rect x="10" y="130" width="20" height="20"/>
        <rect x="40" y="130" width="20" height="20"/>
        <rect x="100" y="130" width="20" height="20"/>
        <rect x="160" y="130" width="20" height="20"/>
        
        <rect x="10" y="160" width="20" height="20"/>
        <rect x="70" y="160" width="20" height="20"/>
        <rect x="130" y="160" width="20" height="20"/>
        <rect x="160" y="160" width="20" height="20"/>
        
        <!-- 三個角落的定位點 -->
        <rect x="20" y="20" width="60" height="60" fill="none" stroke="black" stroke-width="4"/>
        <rect x="30" y="30" width="40" height="40" fill="black"/>
        <rect x="40" y="40" width="20" height="20" fill="white"/>
        
        <rect x="120" y="20" width="60" height="60" fill="none" stroke="black" stroke-width="4"/>
        <rect x="130" y="30" width="40" height="40" fill="black"/>
        <rect x="140" y="40" width="20" height="20" fill="white"/>
        
        <rect x="20" y="120" width="60" height="60" fill="none" stroke="black" stroke-width="4"/>
        <rect x="30" y="130" width="40" height="40" fill="black"/>
        <rect x="40" y="140" width="20" height="20" fill="white"/>
      </g>
    </svg>
  `;
  
  // 使用 encodeURIComponent 來處理 Unicode 字符，然後再進行 base64 編碼
  const qrCodePlaceholder = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div 
        className="border-2 border-gray-300 rounded-lg p-4 bg-white"
        style={{ width: size, height: size }}
      >
        <img
          src={qrCodePlaceholder}
          alt="Payment QR Code"
          className="w-full h-full object-contain"
        />
      </div>
      
      <p className="mt-3 text-sm text-gray-600 text-center">
        請使用手機掃描 QR Code 進行付款
      </p>
      
      {paymentUrl && (
        <p className="mt-1 text-xs text-gray-400 text-center max-w-xs break-all">
          {paymentUrl}
        </p>
      )}
    </div>
  );
}
