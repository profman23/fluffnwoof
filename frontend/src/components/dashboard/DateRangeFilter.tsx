import { useTranslation } from 'react-i18next';
import { CalendarDaysIcon } from '@heroicons/react/24/outline';

export type DateRangePreset = 'today' | 'thisWeek' | 'thisMonth' | 'thisYear' | 'custom';

interface DateRangeFilterProps {
  startDate: string;
  endDate: string;
  preset: DateRangePreset;
  onPresetChange: (preset: DateRangePreset) => void;
  onDateChange: (startDate: string, endDate: string) => void;
}

export const DateRangeFilter = ({
  startDate,
  endDate,
  preset,
  onPresetChange,
  onDateChange,
}: DateRangeFilterProps) => {
  const { t } = useTranslation('dashboard');

  const presets: { key: DateRangePreset; label: string }[] = [
    { key: 'today', label: t('dateRange.today') },
    { key: 'thisWeek', label: t('dateRange.thisWeek') },
    { key: 'thisMonth', label: t('dateRange.thisMonth') },
    { key: 'thisYear', label: t('dateRange.thisYear') },
  ];

  const handlePresetClick = (presetKey: DateRangePreset) => {
    onPresetChange(presetKey);

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

    onDateChange(
      start.toISOString().split('T')[0],
      end.toISOString().split('T')[0]
    );
  };

  const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
    onPresetChange('custom');
    if (type === 'start') {
      onDateChange(value, endDate);
    } else {
      onDateChange(startDate, value);
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
                ? 'bg-primary-600 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Separator */}
      <div className="hidden sm:block h-6 w-px bg-gray-300" />

      {/* Custom Date Inputs */}
      <div className="flex items-center gap-2">
        <CalendarDaysIcon className="w-4 h-4 text-gray-500" />
        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={startDate}
            onChange={(e) => handleCustomDateChange('start', e.target.value)}
            className={`px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              preset === 'custom' ? 'border-primary-400' : 'border-gray-300'
            }`}
          />
          <span className="text-gray-500 text-sm">-</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => handleCustomDateChange('end', e.target.value)}
            className={`px-2 py-1.5 text-sm border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 ${
              preset === 'custom' ? 'border-primary-400' : 'border-gray-300'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
