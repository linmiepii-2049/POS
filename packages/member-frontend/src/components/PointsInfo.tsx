interface PointsInfoProps {
  points: number;
  pointsYuanEquivalent: number;
}

export function PointsInfo({ points, pointsYuanEquivalent }: PointsInfoProps) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-4">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">點數資訊</h2>
      <div className="space-y-4">
        <div>
          <div className="text-sm text-gray-600 mb-1">當前點數</div>
          <div className="text-4xl font-bold text-blue-600">{points.toLocaleString()}</div>
        </div>
        <div className="pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600 mb-1">點數等值金額</div>
          <div className="text-2xl font-semibold text-gray-900">
            NT$ {pointsYuanEquivalent.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500 mt-1">（20 點 = 1 元）</div>
        </div>
      </div>
    </div>
  );
}

