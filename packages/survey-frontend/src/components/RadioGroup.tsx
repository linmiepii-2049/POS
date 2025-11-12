import { clsx } from 'clsx';

interface RadioOption {
  value: string;
  label: string;
}

interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

/**
 * RadioGroup 元件
 * 單選按鈕群組
 */
export function RadioGroup({ name, options, value, onChange, required }: RadioGroupProps) {
  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={clsx(
            'flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all',
            'hover:border-line-green hover:bg-green-50',
            value === option.value
              ? 'border-line-green bg-green-50 shadow-md'
              : 'border-gray-200 bg-white'
          )}
        >
          <input
            type="radio"
            name={name}
            value={option.value}
            checked={value === option.value}
            onChange={(e) => onChange(e.target.value)}
            required={required}
            className="w-4 h-4 text-line-green focus:ring-line-green"
          />
          <span className="ml-3 text-gray-800 font-medium">{option.label}</span>
        </label>
      ))}
    </div>
  );
}

