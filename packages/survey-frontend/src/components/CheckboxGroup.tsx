import { clsx } from 'clsx';

interface CheckboxOption {
  value: string;
  label: string;
}

interface CheckboxGroupProps {
  name: string;
  options: CheckboxOption[];
  values: string[];
  onChange: (values: string[]) => void;
  required?: boolean;
  showOther?: boolean;
  otherValue?: string;
  onOtherChange?: (value: string) => void;
}

/**
 * CheckboxGroup 元件
 * 複選框群組
 */
export function CheckboxGroup({
  name,
  options,
  values,
  onChange,
  required,
  showOther,
  otherValue,
  onOtherChange,
}: CheckboxGroupProps) {
  const handleChange = (optionValue: string, checked: boolean) => {
    if (checked) {
      onChange([...values, optionValue]);
    } else {
      onChange(values.filter((v) => v !== optionValue));
    }
  };

  return (
    <div className="space-y-2">
      {options.map((option) => (
        <label
          key={option.value}
          className={clsx(
            'flex items-center p-3 border-2 rounded-lg cursor-pointer transition-all',
            'hover:border-line-green hover:bg-green-50',
            values.includes(option.value)
              ? 'border-line-green bg-green-50 shadow-md'
              : 'border-gray-200 bg-white'
          )}
        >
          <input
            type="checkbox"
            name={name}
            value={option.value}
            checked={values.includes(option.value)}
            onChange={(e) => handleChange(option.value, e.target.checked)}
            required={required && values.length === 0}
            className="w-4 h-4 text-line-green focus:ring-line-green rounded"
          />
          <span className="ml-3 text-gray-800 font-medium">{option.label}</span>
        </label>
      ))}
      
      {showOther && values.includes('其他') && (
        <input
          type="text"
          placeholder="請說明..."
          value={otherValue || ''}
          onChange={(e) => onOtherChange?.(e.target.value)}
          className="w-full p-3 border-2 border-gray-200 rounded-lg focus:border-line-green focus:outline-none"
        />
      )}
    </div>
  );
}

