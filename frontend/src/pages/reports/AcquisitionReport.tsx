import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { ArrowPathIcon, InformationCircleIcon } from '@heroicons/react/24/outline';
import { reportsApi, AcquisitionReportResponse } from '../../api/reports';
import { LogoLoader } from '../../components/common/LogoLoader';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { ReadOnlyBadge } from '../../components/common/ReadOnlyBadge';
import { AnimatedNumber } from '../../components/common/AnimatedNumber';

const SOURCE_COLORS: Record<string, string> = {
  GOOGLE_SEARCH: '#4285F4',
  GOOGLE_MAPS: '#34A853',
  INSTAGRAM: '#E4405F',
  FACEBOOK: '#1877F2',
  FRIEND_REFERRAL: '#F5DF59',
  CLINIC_REFERRAL: '#5a9f7d',
  TIKTOK: '#000000',
  SNAPCHAT: '#FFFC00',
  WALK_IN: '#9333EA',
  DR_MANDOUR_ADV: '#0EA5E9',
  DR_MAHMOUD_ADV: '#14B8A6',
};

const SOURCE_ICONS: Record<string, string> = {
  GOOGLE_SEARCH: '🔍',
  GOOGLE_MAPS: '📍',
  INSTAGRAM: '📸',
  FACEBOOK: '📘',
  FRIEND_REFERRAL: '👥',
  CLINIC_REFERRAL: '🏥',
  TIKTOK: '🎵',
  SNAPCHAT: '👻',
  WALK_IN: '🚶',
  DR_MANDOUR_ADV: '👨‍⚕️',
  DR_MAHMOUD_ADV: '👨‍⚕️',
};

export const AcquisitionReport = () => {
  const { t } = useTranslation('reports');
  const { isReadOnly } = useScreenPermission('acquisitionReport');

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AcquisitionReportResponse | null>(null);
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [firstInvoiceOnly, setFirstInvoiceOnly] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result = await reportsApi.getAcquisitionReport({
        startDate,
        endDate,
        firstInvoiceOnly,
      });
      setData(result);
    } catch (err) {
      console.error('Failed to fetch acquisition report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [startDate, endDate, firstInvoiceOnly]);

  const pieData = useMemo(() => {
    if (!data) return [];
    return data.bySource.map(s => ({
      name: t(`acquisition.sources.${s.source}`, s.source),
      value: s.customerCount,
      source: s.source,
    }));
  }, [data, t]);

  const barData = useMemo(() => {
    if (!data) return [];
    return data.bySource.map(s => ({
      name: t(`acquisition.sources.${s.source}`, s.source),
      source: s.source,
      withTax: Math.round(s.totalWithTax * 100) / 100,
      beforeTax: Math.round(s.totalBeforeTax * 100) / 100,
    }));
  }, [data, t]);

  return (
    <ScreenPermissionGuard screenName="acquisitionReport">
      <div className="page-container">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
              📊 {t('acquisition.title')}
            </h1>
            {isReadOnly && <ReadOnlyBadge namespace="reports" />}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Date Range */}
            <div className="flex items-center gap-2 bg-white dark:bg-[var(--app-bg-card)] px-3 py-2 rounded-lg border border-gray-200 dark:border-[var(--app-border-default)]">
              <label className="text-sm text-gray-600 dark:text-gray-400">{t('acquisition.from')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 dark:text-[var(--app-text-primary)]"
              />
              <label className="text-sm text-gray-600 dark:text-gray-400">{t('acquisition.to')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="text-sm border-none bg-transparent focus:ring-0 dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* First Invoice Toggle */}
            <div className="flex items-center gap-2 bg-white dark:bg-[var(--app-bg-card)] px-3 py-2 rounded-lg border border-gray-200 dark:border-[var(--app-border-default)]">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={firstInvoiceOnly}
                  onChange={(e) => setFirstInvoiceOnly(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {t('acquisition.firstInvoiceOnly')}
                </span>
              </label>
              <div className="relative group">
                <InformationCircleIcon className="w-4 h-4 text-gray-400 cursor-help" />
                <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-gray-800 text-white text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                  {t('acquisition.firstInvoiceTooltip')}
                </div>
              </div>
            </div>

            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
            >
              <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {loading ? (
          <LogoLoader />
        ) : !data || data.bySource.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-5xl block mb-4">📊</span>
            <p className="text-gray-500 dark:text-gray-400 text-lg">{t('acquisition.noData')}</p>
          </div>
        ) : (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--app-border-default)]">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">👥 {t('acquisition.totalCustomers')}</p>
                <p className="text-3xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
                  <AnimatedNumber value={data.summary.totalCustomers} />
                </p>
              </div>
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--app-border-default)]">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💰 {t('acquisition.totalSalesWithTax')}</p>
                <p className="text-3xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
                  {data.summary.totalSalesWithTax.toFixed(2)} <span className="text-sm">{t('acquisition.sar')}</span>
                </p>
              </div>
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--app-border-default)]">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">💵 {t('acquisition.totalSalesBeforeTax')}</p>
                <p className="text-3xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
                  {data.summary.totalSalesBeforeTax.toFixed(2)} <span className="text-sm">{t('acquisition.sar')}</span>
                </p>
              </div>
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl p-5 shadow-sm border border-gray-100 dark:border-[var(--app-border-default)]">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">📈 {t('acquisition.avgPerCustomer')}</p>
                <p className="text-3xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
                  {data.summary.averagePerCustomer.toFixed(2)} <span className="text-sm">{t('acquisition.sar')}</span>
                </p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Pie Chart */}
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-[var(--app-border-default)]">
                <h3 className="text-lg font-semibold mb-4 dark:text-[var(--app-text-primary)]">
                  🎯 {t('acquisition.customersBySource')}
                </h3>
                <div className="h-72" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        outerRadius={100}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={SOURCE_COLORS[entry.source] || '#8884d8'} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bar Chart */}
              <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl p-6 shadow-sm border border-gray-100 dark:border-[var(--app-border-default)]">
                <h3 className="text-lg font-semibold mb-4 dark:text-[var(--app-text-primary)]">
                  💰 {t('acquisition.salesBySource')}
                </h3>
                <div className="h-72" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barData} layout="vertical" margin={{ left: 10, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="withTax" name={t('acquisition.withTax')} fill="#5a9f7d" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="beforeTax" name={t('acquisition.beforeTax')} fill="#F5DF59" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            {/* Detail Table */}
            <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-sm border border-gray-100 dark:border-[var(--app-border-default)] overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-[var(--app-border-default)]">
                <h3 className="text-lg font-semibold dark:text-[var(--app-text-primary)]">
                  📋 {t('acquisition.detailTable')}
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-[var(--app-bg-tertiary)]">
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('acquisition.source')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('acquisition.customers')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('acquisition.salesWithTax')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('acquisition.salesBeforeTax')}</th>
                      <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">{t('acquisition.avgPerCustomer')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-[var(--app-border-default)]">
                    {data.bySource.map((source) => (
                      <tr key={source.source} className="hover:bg-gray-50 dark:hover:bg-[var(--app-bg-elevated)]">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{SOURCE_ICONS[source.source] || '📢'}</span>
                            <span className="font-medium dark:text-[var(--app-text-primary)]">
                              {t(`acquisition.sources.${source.source}`, source.source)}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap font-medium dark:text-[var(--app-text-primary)]">
                          {source.customerCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-[var(--app-text-primary)]">
                          {source.totalWithTax.toFixed(2)} {t('acquisition.sar')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-[var(--app-text-primary)]">
                          {source.totalBeforeTax.toFixed(2)} {t('acquisition.sar')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap dark:text-[var(--app-text-primary)]">
                          {source.customerCount > 0
                            ? (source.totalWithTax / source.customerCount).toFixed(2)
                            : '0.00'} {t('acquisition.sar')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </ScreenPermissionGuard>
  );
};

export default AcquisitionReport;
