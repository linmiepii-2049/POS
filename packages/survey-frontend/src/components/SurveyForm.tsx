import { useState } from 'react';
import { SurveySection } from './SurveySection';
import { RadioGroup } from './RadioGroup';
import { CheckboxGroup } from './CheckboxGroup';

interface SurveyFormProps {
  onSubmit: (data: any) => Promise<void>;
  isSubmitting: boolean;
}

/**
 * SurveyForm 元件
 * 完整的問卷表單（來自 LIFF 專案）
 */
export function SurveyForm({ onSubmit, isSubmitting }: SurveyFormProps) {
  const [formData, setFormData] = useState({
    phone: '',
    age: '',
    gender: '',
    location: '',
    purchaseFrequency: '',
    purchaseLocation: [] as string[],
    purchaseTime: '',
    mealType: '',
    purchaseFactors: [] as string[],
    healthPrice: '',
    naturalPreference: '',
    tastePreference: [] as string[],
    breadTypes: [] as string[],
    breadTypesOther: '',
    favoriteBread: '',
    desiredBread: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // 驗證必填欄位
    if (!formData.phone || !formData.age || !formData.gender) {
      alert('請填寫所有必填欄位（標記 * 者）');
      return;
    }

    // 手機號碼格式驗證
    if (!/^09\d{8}$/.test(formData.phone)) {
      alert('請輸入有效的台灣手機號碼（10位數字，以09開頭）');
      return;
    }

    await onSubmit({
      ...formData,
      memberId: formData.phone, // 使用手機號碼作為會員ID
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* 基本資料 */}
      <SurveySection title="📋 基本資料">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              手機號碼 <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              placeholder="請輸入手機號碼（例如：0912345678）"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              maxLength={10}
              pattern="09\d{8}"
              required
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-line-green focus:outline-none"
            />
            <p className="text-sm text-gray-500 mt-1">10位數字，以09開頭</p>
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              年齡 <span className="text-red-500">*</span>
            </label>
            <RadioGroup
              name="age"
              options={[
                { value: '25歲以下', label: '25歲以下' },
                { value: '26-45歲', label: '26-45歲' },
                { value: '46歲以上', label: '46歲以上' },
              ]}
              value={formData.age}
              onChange={(value) => setFormData({ ...formData, age: value })}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              性別 <span className="text-red-500">*</span>
            </label>
            <RadioGroup
              name="gender"
              options={[
                { value: '男', label: '男' },
                { value: '女', label: '女' },
              ]}
              value={formData.gender}
              onChange={(value) => setFormData({ ...formData, gender: value })}
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">居住地</label>
            <RadioGroup
              name="location"
              options={[
                { value: '附近', label: '附近' },
                { value: '外地', label: '外地' },
              ]}
              value={formData.location}
              onChange={(value) => setFormData({ ...formData, location: value })}
            />
          </div>
        </div>
      </SurveySection>

      {/* 購買習慣 */}
      <SurveySection title="🛒 購買習慣">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">購買頻率</label>
            <RadioGroup
              name="purchaseFrequency"
              options={[
                { value: '每週3次以上', label: '每週3次以上' },
                { value: '每週1~3次', label: '每週1~3次' },
                { value: '偶爾', label: '偶爾' },
              ]}
              value={formData.purchaseFrequency}
              onChange={(value) => setFormData({ ...formData, purchaseFrequency: value })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              購買地點（可複選）
            </label>
            <CheckboxGroup
              name="purchaseLocation"
              options={[
                { value: '麵包店', label: '麵包店' },
                { value: '便利商店', label: '便利商店' },
                { value: '量販超市', label: '量販超市' },
                { value: '網購', label: '網購' },
              ]}
              values={formData.purchaseLocation}
              onChange={(values) => setFormData({ ...formData, purchaseLocation: values })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">購買時間</label>
            <RadioGroup
              name="purchaseTime"
              options={[
                { value: '早上(6:00~12:00)', label: '早上 (6:00~12:00)' },
                { value: '下午(12:00~17:00)', label: '下午 (12:00~17:00)' },
                { value: '晚上(17:00後)', label: '晚上 (17:00後)' },
              ]}
              value={formData.purchaseTime}
              onChange={(value) => setFormData({ ...formData, purchaseTime: value })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">用餐時機</label>
            <RadioGroup
              name="mealType"
              options={[
                { value: '早餐', label: '早餐' },
                { value: '點心', label: '點心' },
                { value: '其他', label: '其他' },
              ]}
              value={formData.mealType}
              onChange={(value) => setFormData({ ...formData, mealType: value })}
            />
          </div>
        </div>
      </SurveySection>

      {/* 選購考量 */}
      <SurveySection title="💭 選購考量">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              選購考量因素（可複選）
            </label>
            <CheckboxGroup
              name="purchaseFactors"
              options={[
                { value: '價格', label: '價格' },
                { value: '健康', label: '健康' },
                { value: '好吃', label: '好吃' },
                { value: '口味嚐鮮', label: '口味嚐鮮' },
                { value: '美觀', label: '美觀' },
                { value: '衛生', label: '衛生' },
              ]}
              values={formData.purchaseFactors}
              onChange={(values) => setFormData({ ...formData, purchaseFactors: values })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              會因健康考量而選擇較貴的麵包嗎？
            </label>
            <RadioGroup
              name="healthPrice"
              options={[
                { value: '會', label: '會' },
                { value: '不會', label: '不會' },
              ]}
              value={formData.healthPrice}
              onChange={(value) => setFormData({ ...formData, healthPrice: value })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              在意天然食材嗎？
            </label>
            <RadioGroup
              name="naturalPreference"
              options={[
                { value: '在意', label: '在意' },
                { value: '不在意', label: '不在意' },
              ]}
              value={formData.naturalPreference}
              onChange={(value) => setFormData({ ...formData, naturalPreference: value })}
            />
          </div>
        </div>
      </SurveySection>

      {/* 口味偏好 */}
      <SurveySection title="😋 口味偏好">
        <div className="space-y-4">
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              口味偏好（可複選）
            </label>
            <CheckboxGroup
              name="tastePreference"
              options={[
                { value: '原味', label: '原味' },
                { value: '鹹', label: '鹹' },
                { value: '甜', label: '甜' },
              ]}
              values={formData.tastePreference}
              onChange={(values) => setFormData({ ...formData, tastePreference: values })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              喜歡的麵包種類（可複選）
            </label>
            <CheckboxGroup
              name="breadTypes"
              options={[
                { value: '吐司', label: '吐司' },
                { value: '台式、日式麵包', label: '台式、日式麵包' },
                { value: '歐式麵包', label: '歐式麵包' },
                { value: '法國麵包', label: '法國麵包' },
                { value: '丹麥可頌', label: '丹麥可頌' },
                { value: '貝果系列', label: '貝果系列' },
                { value: '無麩質麵包', label: '無麩質麵包' },
                { value: '其他', label: '其他' },
              ]}
              values={formData.breadTypes}
              onChange={(values) => setFormData({ ...formData, breadTypes: values })}
              showOther
              otherValue={formData.breadTypesOther}
              onOtherChange={(value) => setFormData({ ...formData, breadTypesOther: value })}
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              最喜歡的麵包（選填）
            </label>
            <textarea
              placeholder="請分享您最喜歡的麵包..."
              value={formData.favoriteBread}
              onChange={(e) => setFormData({ ...formData, favoriteBread: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-line-green focus:outline-none resize-none"
            />
          </div>

          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              想吃的麵包（選填）
            </label>
            <textarea
              placeholder="請分享您想吃的麵包..."
              value={formData.desiredBread}
              onChange={(e) => setFormData({ ...formData, desiredBread: e.target.value })}
              rows={3}
              maxLength={500}
              className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-line-green focus:outline-none resize-none"
            />
          </div>
        </div>
      </SurveySection>

      {/* 提交按鈕 */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gradient-to-r from-line-green to-green-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
        >
          {isSubmitting ? '提交中...' : '✨ 提交問卷'}
        </button>
        <p className="text-center text-sm text-gray-500 mt-3">
          <span className="text-red-500">*</span> 為必填欄位
        </p>
      </div>
    </form>
  );
}

