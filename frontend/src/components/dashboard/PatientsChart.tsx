import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { Card } from '../common/Card';

interface SpeciesData {
  species: string;
  count: number;
}

interface PatientsChartProps {
  data: SpeciesData[];
  loading?: boolean;
  animationKey?: number;
}

// Brand color palette
const COLORS = [
  '#5a9f7d', // Primary green (from brand mint)
  '#F5DF59', // Brand gold
  '#EAB8D5', // Brand pink
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#14B8A6', // Teal
  '#F97316', // Orange
  '#6366F1', // Indigo
];

// Species emoji map
const speciesEmoji: Record<string, string> = {
  DOG: '🐕',
  CAT: '🐈',
  BIRD: '🐦',
  RABBIT: '🐇',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  TURTLE: '🐢',
  FISH: '🐟',
  OTHER: '🐾',
};

export const PatientsChart = ({ data, loading = false, animationKey = 0 }: PatientsChartProps) => {
  const { t } = useTranslation('dashboard');

  // Animation key to force re-render and trigger animation
  const [localAnimationKey, setLocalAnimationKey] = useState(0);

  useEffect(() => {
    // Increment key when data changes to trigger fresh animation
    setLocalAnimationKey(prev => prev + 1);
  }, [data]);

  // Calculate total
  const total = data.reduce((sum, item) => sum + item.count, 0);

  // Custom label for pie chart
  const renderCustomLabel = ({
    cx,
    cy,
    midAngle,
    innerRadius,
    outerRadius,
    percent,
  }: {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    percent: number;
  }) => {
    if (percent < 0.05) return null; // Don't show labels for small slices

    const RADIAN = Math.PI / 180;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text
        x={x}
        y={y}
        fill="white"
        textAnchor="middle"
        dominantBaseline="central"
        className="font-semibold text-sm"
      >
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: SpeciesData }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const emoji = speciesEmoji[item.species] || '🐾';
      const speciesName = t(`species.${item.species}`) || item.species;

      return (
        <div className="bg-brand-white px-4 py-3 rounded-lg shadow-lg border border-primary-200">
          <p className="font-semibold text-brand-dark">
            {emoji} {speciesName}
          </p>
          <p className="text-brand-dark/70">
            {item.count} ({((item.count / total) * 100).toFixed(1)}%)
          </p>
        </div>
      );
    }
    return null;
  };

  // Custom legend
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {payload.map((entry: any, index: number) => {
          const item = entry.payload.payload;
          const emoji = speciesEmoji[item.species] || '🐾';
          const speciesName = t(`species.${item.species}`) || item.species;

          return (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary-50"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-brand-dark">
                {emoji} {speciesName}
              </span>
              <span className="text-sm text-brand-dark/60">({item.count})</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) {
    return (
      <Card>
        <div className="animate-pulse">
          <div className="h-6 bg-primary-100 rounded w-40 mb-4" />
          <div className="h-64 flex items-center justify-center">
            <div className="w-40 h-40 bg-primary-50 rounded-full" />
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <h3 className="text-lg font-semibold text-brand-dark mb-4 flex items-center gap-2">
        <span className="text-xl">🥧</span>
        {t('analytics.patientsBySpecies')}
      </h3>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-brand-dark/60">
          <div className="text-center">
            <span className="text-4xl block mb-2">🐾</span>
            <p>{t('noData')}</p>
          </div>
        </div>
      ) : (
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart key={`pie-${localAnimationKey}-${animationKey}`}>
              <Pie
                data={data}
                dataKey="count"
                nameKey="species"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={90}
                paddingAngle={2}
                labelLine={false}
                label={renderCustomLabel}
                isAnimationActive={true}
                animationDuration={1200}
                animationBegin={300}
                animationEasing="ease-out"
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                    stroke="white"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend content={renderLegend} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Total count */}
      {data.length > 0 && (
        <div className="mt-4 text-center">
          <span className="text-sm text-brand-dark/60">{t('analytics.totalPatients')}: </span>
          <span className="font-bold text-brand-dark">{total}</span>
        </div>
      )}
    </Card>
  );
};
