import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { Card } from '../common/Card';

interface VetPerformance {
  vetId: string;
  vetName: string;
  appointments: number;
  completedRecords: number;
  totalRecords: number;
  completionRate: number;
}

interface VetsChartProps {
  data: VetPerformance[];
  loading?: boolean;
  animationKey?: number;
}

// Color based on completion rate (using brand colors)
const getBarColor = (completionRate: number) => {
  if (completionRate >= 80) return '#5a9f7d'; // Primary green
  if (completionRate >= 50) return '#F5DF59'; // Brand gold
  return '#ef4444'; // Red
};

export const VetsChart = ({ data, loading = false, animationKey = 0 }: VetsChartProps) => {
  const { t } = useTranslation('dashboard');

  // Animation key to force re-render and trigger animation
  const [localAnimationKey, setLocalAnimationKey] = useState(0);

  useEffect(() => {
    // Increment key when data changes to trigger fresh animation
    setLocalAnimationKey(prev => prev + 1);
  }, [data]);

  // Custom tooltip
  const CustomTooltip = ({
    active,
    payload,
  }: {
    active?: boolean;
    payload?: Array<{ payload: VetPerformance }>;
  }) => {
    if (active && payload && payload.length) {
      const vet = payload[0].payload;
      return (
        <div className="bg-brand-white px-4 py-3 rounded-lg shadow-lg border border-primary-200">
          <p className="font-semibold text-brand-dark mb-2">{vet.vetName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-brand-dark/70">
              {t('analytics.appointments')}: <span className="font-medium">{vet.appointments}</span>
            </p>
            <p className="text-brand-dark/70">
              {t('analytics.completedRecords')}: <span className="font-medium">{vet.completedRecords}/{vet.totalRecords}</span>
            </p>
            <p className="text-brand-dark/70">
              {t('analytics.completionRate')}:
              <span className={`font-medium ms-1 ${
                vet.completionRate >= 80 ? 'text-primary-500' :
                vet.completionRate >= 50 ? 'text-secondary-500' : 'text-red-600'
              }`}>
                {vet.completionRate}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-primary-100 rounded w-40 mb-4" />
          <div className="h-64 bg-primary-50 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-brand-dark mb-4 flex items-center gap-2">
        <span className="text-xl">👨‍⚕️</span>
        {t('analytics.vetPerformance')}
      </h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-brand-dark/60">
          <div className="text-center">
            <span className="text-4xl block mb-2">👨‍⚕️</span>
            <p>{t('noData')}</p>
          </div>
        </div>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              key={`bar-${localAnimationKey}-${animationKey}`}
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#CEE8DC" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#211E1F' }}
                tickLine={{ stroke: '#CEE8DC' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="vetName"
                tick={{ fontSize: 11, fill: '#211E1F' }}
                tickLine={{ stroke: '#CEE8DC' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="appointments"
                radius={[0, 4, 4, 0]}
                name={t('analytics.appointments')}
                isAnimationActive={true}
                animationDuration={1000}
                animationEasing="ease-out"
              >
                {data.map((entry: VetPerformance, index: number) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(entry.completionRate)} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Legend */}
      {data.length > 0 && (
        <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-primary-500" />
            <span className="text-brand-dark/70">≥80% {t('analytics.completionRate')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-secondary-300" />
            <span className="text-brand-dark/70">≥50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-brand-dark/70">&lt;50%</span>
          </div>
        </div>
      )}
    </Card>
  );
};
