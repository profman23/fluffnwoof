import { ArrowTrendingUpIcon, ArrowTrendingDownIcon, MinusIcon } from '@heroicons/react/24/solid';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  change?: number;
  changeLabel?: string;
  color?: 'primary' | 'secondary' | 'accent' | 'success' | 'warning' | 'danger';
  loading?: boolean;
}

const colorClasses = {
  primary: 'bg-gradient-to-br from-primary-500 to-primary-600',
  secondary: 'bg-gradient-to-br from-secondary-400 to-secondary-500',
  accent: 'bg-gradient-to-br from-accent-400 to-accent-500',
  success: 'bg-gradient-to-br from-green-500 to-green-600',
  warning: 'bg-gradient-to-br from-yellow-500 to-yellow-600',
  danger: 'bg-gradient-to-br from-red-500 to-red-600',
};

export const StatsCard = ({
  title,
  value,
  icon,
  change,
  changeLabel,
  color = 'primary',
  loading = false,
}: StatsCardProps) => {
  const renderChange = () => {
    if (change === undefined) return null;

    let changeIcon;
    let changeColor;
    let changeText;

    if (change > 0) {
      changeIcon = <ArrowTrendingUpIcon className="w-3 h-3" />;
      changeColor = 'text-green-600 bg-green-50';
      changeText = `+${change}%`;
    } else if (change < 0) {
      changeIcon = <ArrowTrendingDownIcon className="w-3 h-3" />;
      changeColor = 'text-red-600 bg-red-50';
      changeText = `${change}%`;
    } else {
      changeIcon = <MinusIcon className="w-3 h-3" />;
      changeColor = 'text-gray-600 bg-gray-50';
      changeText = '0%';
    }

    return (
      <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${changeColor}`}>
        {changeIcon}
        <span>{changeText}</span>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 animate-pulse">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
            <div className="h-8 bg-gray-200 rounded w-16 mb-2" />
            <div className="h-4 bg-gray-200 rounded w-20" />
          </div>
          <div className="w-14 h-14 bg-gray-200 rounded-xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all duration-300 p-5 border border-gray-100">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-gray-500 text-sm font-medium mb-1">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mb-2">
            {typeof value === 'number' ? value.toLocaleString() : value}
          </p>
          <div className="flex items-center gap-2">
            {renderChange()}
            {changeLabel && (
              <span className="text-xs text-gray-500">{changeLabel}</span>
            )}
          </div>
        </div>
        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${colorClasses[color]} shadow-lg`}>
          <div className="text-white text-2xl">{icon}</div>
        </div>
      </div>
    </div>
  );
};
