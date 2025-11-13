import { formatInTimeZone } from 'date-fns-tz';

interface MemberInfoProps {
  name: string;
  phone: string | null;
  lineId: string | null;
  createdAt: string;
}

export function MemberInfo({ name, phone, lineId, createdAt }: MemberInfoProps) {
  // 遮罩 LINE ID（只顯示前 4 位和後 4 位）
  const maskedLineId = lineId 
    ? `${lineId.substring(0, 4)}****${lineId.substring(lineId.length - 4)}`
    : '未設定';

  // 轉換為台北時間
  const createdAtTaipei = formatInTimeZone(
    new Date(createdAt),
    'Asia/Taipei',
    'yyyy/MM/dd HH:mm'
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">基本資料</h2>
      <div className="space-y-3">
        <div className="flex items-center">
          <span className="text-gray-600 w-24 flex-shrink-0">姓名</span>
          <span className="text-gray-900 font-medium">{name}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-600 w-24 flex-shrink-0">手機</span>
          <span className="text-gray-900">{phone || '未設定'}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-600 w-24 flex-shrink-0">LINE ID</span>
          <span className="text-gray-900 font-mono text-sm">{maskedLineId}</span>
        </div>
        <div className="flex items-center">
          <span className="text-gray-600 w-24 flex-shrink-0">註冊時間</span>
          <span className="text-gray-900">{createdAtTaipei}</span>
        </div>
      </div>
    </div>
  );
}

