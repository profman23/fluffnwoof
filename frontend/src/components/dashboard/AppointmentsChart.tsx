import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { Card } from '../common/Card';

interface TrendData {
  date: string;
  total: number;
  completed: number;
  cancelled: number;
}

interface AppointmentsChartProps {
  data: TrendData[];
  loading?: boolean;
  animationKey?: number;
}

export const AppointmentsChart = ({ data, loading = false, animationKey = 0 }: AppointmentsChartProps) => {
  const { t, i18n } = useTranslation('dashboard');
  const isRtl = i18n.language === 'ar';

  // Animation key to force re-render and trigger animation
  const [localAnimationKey, setLocalAnimationKey] = useState(0);

  useEffect(() => {
    // Increment key when data changes to trigger fresh animation
    setLocalAnimationKey(prev => prev + 1);
  }, [data]);

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      month: 'short',
      day: 'numeric',
    });
  };

  // Transform data for chart
  const chartData = data.map(item => ({
    ...item,
    formattedDate: formatDate(item.date),
  }));

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
        <span className="text-xl">📈</span>
        {t('analytics.appointmentsTrend')}
      </h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-brand-dark/60">
          <div className="text-center">
            <span className="text-4xl block mb-2">📊</span>
            <p>{t('noData')}</p>
          </div>
        </div>
      ) : (
        <div className="h-64" dir="ltr">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              key={`line-${localAnimationKey}-${animationKey}`}
              data={chartData}
              margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#CEE8DC" />
              <XAxis
                dataKey="formattedDate"
                tick={{ fontSize: 12, fill: '#211E1F' }}
                tickLine={{ stroke: '#CEE8DC' }}
              />
              <YAxis
                tick={{ fontSize: 12, fill: '#211E1F' }}
                tickLine={{ stroke: '#CEE8DC' }}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#FDFEFF',
                  border: '1px solid #CEE8DC',
                  borderRadius: '8px',
                  boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                }}
                labelFormatter={(label) => label}
              />
              <Legend
                wrapperStyle={{ paddingTop: '10px' }}
                formatter={(value) => (
                  <span className="text-sm text-brand-dark">{value}</span>
                )}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#5a9f7d"
                strokeWidth={2}
                dot={{ fill: '#5a9f7d', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#5a9f7d', strokeWidth: 2 }}
                name={t('analytics.totalAppointments')}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
              />
              <Line
                type="monotone"
                dataKey="completed"
                stroke="#22c55e"
                strokeWidth={2}
                dot={{ fill: '#22c55e', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#22c55e', strokeWidth: 2 }}
                name={t('analytics.completedAppointments')}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={200}
              />
              <Line
                type="monotone"
                dataKey="cancelled"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: '#ef4444', strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6, stroke: '#ef4444', strokeWidth: 2 }}
                name={t('analytics.cancelledAppointments')}
                isAnimationActive={true}
                animationDuration={1200}
                animationEasing="ease-out"
                animationBegin={400}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </Card>
  );
};
