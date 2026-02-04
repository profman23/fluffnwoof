import React from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND_COLOR_OPTIONS } from '../../store/themeStore';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  className?: string;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label,
  className = '',
}) => {
  const { i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-brand-dark dark:text-[var(--app-text-primary)] mb-2">
          {label}
        </label>
      )}
      <div className="flex gap-2 flex-wrap">
        {BRAND_COLOR_OPTIONS.map((color) => (
          <button
            key={color.name}
            type="button"
            onClick={() => onChange(color.hex)}
            className={`relative w-10 h-10 rounded-lg border-2 transition-all duration-200 hover:scale-110 ${
              value === color.hex
                ? 'border-brand-dark dark:border-primary-400 ring-2 ring-brand-dark dark:ring-primary-400 ring-offset-2 dark:ring-offset-[var(--app-bg-card)]'
                : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'
            }`}
            style={{ backgroundColor: color.hex }}
            title={isArabic ? color.labelAr : color.labelEn}
          >
            {value === color.hex && (
              <span className="absolute inset-0 flex items-center justify-center">
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke={color.hex === '#FDFEFF' || color.hex === '#F5DF59' ? '#211E1F' : '#FDFEFF'}
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
