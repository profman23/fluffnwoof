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
}

// Color based on completion rate
const getBarColor = (completionRate: number) => {
  if (completionRate >= 80) return '#22c55e'; // Green
  if (completionRate >= 50) return '#F4D03F'; // Yellow
  return '#ef4444'; // Red
};

export const VetsChart = ({ data, loading = false }: VetsChartProps) => {
  const { t } = useTranslation('dashboard');

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
        <div className="bg-white px-4 py-3 rounded-lg shadow-lg border border-gray-200">
          <p className="font-semibold text-gray-800 mb-2">{vet.vetName}</p>
          <div className="space-y-1 text-sm">
            <p className="text-gray-600">
              {t('analytics.appointments')}: <span className="font-medium">{vet.appointments}</span>
            </p>
            <p className="text-gray-600">
              {t('analytics.completedRecords')}: <span className="font-medium">{vet.completedRecords}/{vet.totalRecords}</span>
            </p>
            <p className="text-gray-600">
              {t('analytics.completionRate')}:
              <span className={`font-medium ms-1 ${
                vet.completionRate >= 80 ? 'text-green-600' :
                vet.completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'
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
          <div className="h-6 bg-gray-200 rounded w-40 mb-4" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
        <span className="text-xl">👨‍⚕️</span>
        {t('analytics.vetPerformance')}
      </h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <span className="text-4xl block mb-2">👨‍⚕️</span>
            <p>{t('noData')}</p>
          </div>
        </div>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
              <XAxis
                type="number"
                tick={{ fontSize: 12, fill: '#6b7280' }}
                tickLine={{ stroke: '#d1d5db' }}
                allowDecimals={false}
              />
              <YAxis
                type="category"
                dataKey="vetName"
                tick={{ fontSize: 11, fill: '#6b7280' }}
                tickLine={{ stroke: '#d1d5db' }}
                width={100}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="appointments"
                radius={[0, 4, 4, 0]}
                name={t('analytics.appointments')}
              >
                {data.map((entry, index) => (
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
            <div className="w-3 h-3 rounded bg-green-500" />
            <span className="text-gray-600">≥80% {t('analytics.completionRate')}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-yellow-500" />
            <span className="text-gray-600">≥50%</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded bg-red-500" />
            <span className="text-gray-600">&lt;50%</span>
          </div>
        </div>
      )}
    </Card>
  );
};
