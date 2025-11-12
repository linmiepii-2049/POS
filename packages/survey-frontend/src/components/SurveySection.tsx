import { ReactNode } from 'react';

interface SurveySectionProps {
  title: string;
  children: ReactNode;
}

/**
 * SurveySection 元件
 * 問卷區塊容器
 */
export function SurveySection({ title, children }: SurveySectionProps) {
  return (
    <div className="mb-8 p-5 border-2 border-gray-100 rounded-xl bg-gray-50">
      <h2 className="text-xl font-bold text-gray-800 mb-5 pb-3 border-b-2 border-line-green">
        {title}
      </h2>
      {children}
    </div>
  );
}

