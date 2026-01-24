import { useTranslation } from 'react-i18next';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export type DateRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface DateRangeFilterProps {
  startDate: Date;
  endDate: Date;
  preset: DateRangePreset;
  onDateChange: (startDate: Date, endDate: Date, preset: DateRangePreset) => void;
}

export const DateRangeFilter = ({
  startDate,
  endDate,
  preset,
  onDateChange,
}: DateRangeFilterProps) => {
  const { t } = useTranslation('dashboard');

  const presets: { key: DateRangePreset; label: string }[] = [
    { key: 'today', label: t('dateRange.today') },
    { key: 'thisWeek', label: t('dateRange.thisWeek') },
    { key: 'thisMonth', label: t('dateRange.thisMonth') },
    { key: 'thisYear', label: t('dateRange.thisYear') },
  ];

  // Convert Date to string for input value
  const formatDateForInput = (date: Date): string => {
    return date.toISOString().split('T')[0];
  };

  const handlePresetClick = (presetKey: DateRangePreset) => {
    const today = new Date();
    let start: Date;
    let end: Date = today;

    switch (presetKey) {
      case 'today':
        start = today;
        break;
      case 'thisWeek':
        start = new Date(today);
        start.setDate(today.getDate() - today.getDay());
        break;
      case 'thisMonth':
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        break;
      case 'thisYear':
        start = new Date(today.getFullYear(), 0, 1);
        break;
      default:
        return;
    }

    onDateChange(start, end, presetKey);
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    const newDate = new Date(value);
    if (type === 'start') {
      onDateChange(newDate, endDate, 'custom');
    } else {
      onDateChange(startDate, newDate, 'custom');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset Buttons */}
      <div className="flex flex-wrap gap-1">
        {presets.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => handlePresetClick(key)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-all duration-200 ${
              preset === key
                ? 'bg-secondary-300 text-brand-dark shadow-md'
                : 'bg-primary-50 text-brand-dark hover:bg-primary-100'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-6 w-px bg-primary-200" />

      {/* Custom Date Inputs */}
      <div className="flex items-center gap-2">
        <CalendarDaysIcon className="w-4 h-4 text-brand-dark/60" />
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={formatDateForInput(startDate)}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className={`px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 ${
              preset === 'custom' ? 'border-secondary-300' : 'border-primary-200'
            }`}
          />
          <span className="text-brand-dark/60 text-sm">-</span>
          <input
            type="date"
            value={formatDateForInput(endDate)}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className={`px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 ${
              preset === 'custom' ? 'border-secondary-300' : 'border-primary-200'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
