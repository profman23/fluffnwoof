import { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import {
  BanknotesIcon,
  CreditCardIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
} from '@heroicons/react/24/outline';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import {
  reportsApi,
  GetSalesReportParams,
  SalesReportResponse,
  SalesReportInvoice,
} from '../../api/reports';
import { InvoiceStatus } from '../../types';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { useDarkMode } from '../../context/DarkModeContext';
import { DataTable, Column } from '../../components/common/DataTable';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { StatsCard } from '../../components/dashboard/StatsCard';
import { SarSymbol } from '../../components/common/SarSymbol';

// Payment method colors for pie chart
const PAYMENT_COLORS: Record<string, string> = {
  CASH: '#22c55e',       // Green
  CARD: '#3B82F6',       // Blue
  MADA: '#8B5CF6',       // Purple
  TABBY: '#14B8A6',      // Teal
  TAMARA: '#EC4899',     // Pink
  BANK_TRANSFER: '#F97316', // Orange
  OTHER: '#6B7280',      // Gray
};

const PAYMENT_EMOJIS: Record<string, string> = {
  CASH: '💵',
  CARD: '💳',
  MADA: '💜',
  TABBY: '🟢',
  TAMARA: '🩷',
  BANK_TRANSFER: '🏦',
  OTHER: '💱',
};

export const SalesReport = () => {
  const { t, i18n } = useTranslation('reports');
  const isRTL = i18n.language === 'ar';
  const { canViewPhone } = usePhonePermission();
  const { isDark } = useDarkMode();

  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<SalesReportResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(true);

  const [filters, setFilters] = useState<GetSalesReportParams & { startDate: string; startTime: string; endDate: string; endTime: string }>({
    startDate: '',
    startTime: '00:00',
    endDate: '',
    endTime: '23:59',
    status: '',
    page: 1,
    limit: 20,
  });

  // Use ref to access latest filters in loadReport without stale closures
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  // Build ISO datetime from date+time fields
  const buildDateTime = (date: string, time: string) => {
    if (!date) return undefined;
    return new Date(`${date}T${time || '00:00'}:00`).toISOString();
  };

  // Load report data — reads from filtersRef (always fresh) or optional override
  const loadReport = async (overrideFilters?: typeof filters) => {
    setLoading(true);
    setError(null);
    try {
      const f = overrideFilters || filtersRef.current;
      // Build clean params — only include non-empty values to avoid sending empty strings
      const params: GetSalesReportParams = {
        page: f.page,
        limit: f.limit,
      };
      const startDT = buildDateTime(f.startDate, f.startTime);
      const endDT = buildDateTime(f.endDate, f.endTime);
      if (startDT) params.startDateTime = startDT;
      if (endDT) params.endDateTime = endDT;
      if (f.status) params.status = f.status as InvoiceStatus;

      console.log('[SalesReport] API params:', params);
      const result = await reportsApi.getSalesReport(params);
      console.log('[SalesReport] API result:', result);
      setReportData(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load sales report';
      console.error('[SalesReport] API error:', err);
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  // Load on mount and on page change only
  useEffect(() => {
    loadReport();
  }, [filters.page]);

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadReport();
  };

  const handleResetFilters = () => {
    const resetFilters = {
      startDate: '',
      startTime: '00:00',
      endDate: '',
      endTime: '23:59',
      status: '' as const,
      page: 1,
      limit: 20,
    };
    setFilters(resetFilters);
    loadReport(resetFilters);
  };

  const handlePageChange = (newPage: number) => {
    const totalPages = reportData?.invoices.totalPages || 1;
    if (newPage >= 1 && newPage <= totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(isRTL ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return amount.toFixed(2);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'PARTIALLY_PAID':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PENDING':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OVERDUE':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-[var(--app-bg-elevated)] dark:text-gray-400';
    }
  };

  const stats = reportData?.stats;
  const invoices = reportData?.invoices;

  // Pie chart data
  const pieData = (stats?.paymentMethodBreakdown || []).map((pm) => ({
    name: pm.method,
    value: pm.amount,
    count: pm.count,
  }));
  const totalPaymentsForChart = pieData.reduce((sum, item) => sum + item.value, 0);

  // Custom tooltip for pie chart
  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: { name: string; value: number; count: number } }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const emoji = PAYMENT_EMOJIS[item.name] || '💱';

      return (
        <div className="bg-brand-white dark:bg-[var(--app-bg-card)] px-4 py-3 rounded-lg shadow-lg border border-primary-200 dark:border-[var(--app-border-default)]">
          <p className="font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">
            {emoji} {t(`salesReport.paymentMethods.${item.name}`, item.name)}
          </p>
          <p className="text-brand-dark/70 dark:text-gray-400 inline-flex items-center gap-1" dir="ltr">
            {formatCurrency(item.value)} <SarSymbol className="w-3.5 h-3.5" />
            <span className="text-xs ms-1">({item.count} {item.count === 1 ? 'payment' : 'payments'})</span>
          </p>
          {totalPaymentsForChart > 0 && (
            <p className="text-xs text-brand-dark/50 dark:text-gray-500">
              {((item.value / totalPaymentsForChart) * 100).toFixed(1)}%
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  // Custom legend for pie chart
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const renderLegend = (props: any) => {
    const { payload } = props;
    if (!payload) return null;

    return (
      <div className="flex flex-wrap justify-center gap-3 mt-4">
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {payload.map((entry: any, index: number) => {
          const item = entry.payload.payload;
          const emoji = PAYMENT_EMOJIS[item.name] || '💱';

          return (
            <div
              key={`legend-${index}`}
              className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-primary-50 dark:bg-[var(--app-bg-elevated)]"
            >
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-sm text-brand-dark dark:text-[var(--app-text-primary)]">
                {emoji} {String(t(`salesReport.paymentMethods.${item.name}`))}
              </span>
              <span className="text-sm font-medium text-brand-dark/60 dark:text-gray-400 inline-flex items-center gap-0.5" dir="ltr">
                {formatCurrency(item.value)} <SarSymbol className="w-3 h-3" />
              </span>
            </div>
          );
        })}
      </div>
    );
  };

  // Percent label inside pie slices
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
    if (percent < 0.05) return null;

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

  // DataTable columns
  const columns: Column<SalesReportInvoice>[] = [
    {
      id: 'invoiceNumber',
      header: t('salesReport.table.invoiceNumber'),
      render: (inv) => (
        <span className="text-sm font-medium text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap" dir="ltr">
          {inv.invoiceNumber}
        </span>
      ),
    },
    {
      id: 'date',
      header: t('salesReport.table.date'),
      render: (inv) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
          {formatDate(inv.issueDate)}
        </span>
      ),
    },
    {
      id: 'customer',
      header: t('salesReport.table.customer'),
      render: (inv) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
          {inv.owner?.firstName} {inv.owner?.lastName}
        </span>
      ),
    },
    {
      id: 'phone',
      header: t('salesReport.table.phone'),
      render: (inv) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap" dir="ltr">
          {canViewPhone
            ? inv.owner?.phone
            : maskPhoneNumber(inv.owner?.phone || '')}
        </span>
      ),
    },
    {
      id: 'items',
      header: t('salesReport.table.items'),
      render: (inv) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)]">
          {inv.items.length}
        </span>
      ),
    },
    {
      id: 'total',
      header: t('salesReport.table.total'),
      render: (inv) => (
        <span className="text-sm font-medium text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap inline-flex items-center gap-1" dir="ltr">
          {formatCurrency(inv.totalAmount)} <SarSymbol className="w-3.5 h-3.5" />
        </span>
      ),
    },
    {
      id: 'paid',
      header: t('salesReport.table.paid'),
      render: (inv) => (
        <span className="text-sm text-green-600 dark:text-green-400 whitespace-nowrap inline-flex items-center gap-1" dir="ltr">
          {formatCurrency(inv.paidAmount)} <SarSymbol className="w-3.5 h-3.5" />
        </span>
      ),
    },
    {
      id: 'balance',
      header: t('salesReport.table.balance'),
      render: (inv) => {
        const balance = inv.totalAmount - inv.paidAmount;
        return (
          <span className={`text-sm whitespace-nowrap inline-flex items-center gap-1 ${balance > 0 ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'}`} dir="ltr">
            {formatCurrency(balance)} <SarSymbol className="w-3.5 h-3.5" />
          </span>
        );
      },
    },
    {
      id: 'status',
      header: t('salesReport.table.status'),
      render: (inv) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(inv.status)}`}>
          {t(`salesReport.status.${inv.status}`)}
        </span>
      ),
    },
  ];

  // Expanded row: item details
  const renderExpandedRow = (inv: SalesReportInvoice) => (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-gray-700 dark:text-[var(--app-text-secondary)]">
        {t('salesReport.table.items')}
      </h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-gray-500 dark:text-gray-400 border-b dark:border-[var(--app-border-default)]">
              <th className="text-start py-2 px-3 font-medium">{t('salesReport.itemDetails.description')}</th>
              <th className="text-center py-2 px-3 font-medium">{t('salesReport.itemDetails.qty')}</th>
              <th className="text-center py-2 px-3 font-medium">{t('salesReport.itemDetails.price')}</th>
              <th className="text-center py-2 px-3 font-medium">{t('salesReport.itemDetails.tax')}</th>
              <th className="text-center py-2 px-3 font-medium">{t('salesReport.itemDetails.discount')}</th>
              <th className="text-end py-2 px-3 font-medium">{t('salesReport.itemDetails.total')}</th>
            </tr>
          </thead>
          <tbody>
            {inv.items.map((item) => (
              <tr key={item.id} className="border-b dark:border-[var(--app-border-default)] last:border-0">
                <td className="py-2 px-3 text-gray-900 dark:text-[var(--app-text-primary)]">{item.description}</td>
                <td className="py-2 px-3 text-center text-gray-700 dark:text-[var(--app-text-secondary)]">{item.quantity}</td>
                <td className="py-2 px-3 text-center text-gray-700 dark:text-[var(--app-text-secondary)]" dir="ltr">
                  <span className="inline-flex items-center gap-1">
                    {formatCurrency(item.unitPrice)} <SarSymbol className="w-3 h-3" />
                  </span>
                </td>
                <td className="py-2 px-3 text-center text-gray-700 dark:text-[var(--app-text-secondary)]">{item.taxRate}%</td>
                <td className="py-2 px-3 text-center text-gray-700 dark:text-[var(--app-text-secondary)]">{item.discount}%</td>
                <td className="py-2 px-3 text-end text-gray-900 dark:text-[var(--app-text-primary)] font-medium" dir="ltr">
                  <span className="inline-flex items-center gap-1">
                    {formatCurrency(item.totalPrice)} <SarSymbol className="w-3 h-3" />
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl">💰</span>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
            {t('salesReport.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border dark:border-[var(--app-border-default)] rounded-lg hover:bg-gray-50 dark:hover:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-secondary)]"
        >
          <FunnelIcon className="w-5 h-5" />
          {t('salesReport.filters.title')}
          {showFilters ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-lg shadow dark:shadow-black/30 p-4 mb-6 border border-gray-200 dark:border-[var(--app-border-default)]">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('salesReport.filters.startDate')}
              </label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* Start Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('salesReport.filters.startTime')}
              </label>
              <input
                type="time"
                value={filters.startTime}
                onChange={(e) => setFilters(prev => ({ ...prev, startTime: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('salesReport.filters.endDate')}
              </label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* End Time */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('salesReport.filters.endTime')}
              </label>
              <input
                type="time"
                value={filters.endTime}
                onChange={(e) => setFilters(prev => ({ ...prev, endTime: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('salesReport.filters.status')}
              </label>
              <select
                value={filters.status || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as InvoiceStatus | '' }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              >
                <option value="">{t('salesReport.filters.allStatuses')}</option>
                {Object.values(InvoiceStatus).map((status) => (
                  <option key={status} value={status}>
                    {t(`salesReport.status.${status}`)}
                  </option>
                ))}
              </select>
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <Button variant="primary" onClick={handleApplyFilters}>
                {t('salesReport.filters.apply')}
              </Button>
              <Button variant="secondary" onClick={handleResetFilters}>
                {t('salesReport.filters.reset')}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center gap-3">
          <span className="text-red-600 dark:text-red-400 text-lg">⚠️</span>
          <div>
            <p className="text-sm font-medium text-red-800 dark:text-red-300">{error}</p>
          </div>
          <button onClick={() => loadReport()} className="ms-auto text-sm text-red-600 dark:text-red-400 hover:underline">
            {t('salesReport.filters.apply')}
          </button>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 animate-fade-in-up">
        <StatsCard
          title={t('salesReport.stats.totalSales')}
          value={stats?.totalSales || 0}
          icon={<BanknotesIcon className="w-7 h-7" />}
          color="primary"
          loading={loading}
          animationDelay={0}
        />
        <StatsCard
          title={t('salesReport.stats.totalPayments')}
          value={stats?.totalPayments || 0}
          icon={<CreditCardIcon className="w-7 h-7" />}
          color="success"
          loading={loading}
          animationDelay={100}
        />
        <StatsCard
          title={t('salesReport.stats.outstanding')}
          value={stats?.outstandingBalance || 0}
          icon={<ExclamationTriangleIcon className="w-7 h-7" />}
          color="warning"
          loading={loading}
          animationDelay={200}
        />
        <StatsCard
          title={t('salesReport.stats.invoiceCount')}
          value={stats?.invoiceCount || 0}
          icon={<DocumentTextIcon className="w-7 h-7" />}
          color="accent"
          loading={loading}
          animationDelay={300}
        />
      </div>

      {/* Payment Method Breakdown — Donut Chart */}
      {pieData.length > 0 && (
        <div className="mb-6 animate-fade-in-up" style={{ animationDelay: '200ms' }}>
          <Card>
            <h3 className="text-lg font-semibold text-brand-dark dark:text-[var(--app-text-primary)] mb-4 flex items-center gap-2">
              <span className="text-xl">💳</span>
              {t('salesReport.stats.paymentBreakdown')}
            </h3>

            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    dataKey="value"
                    nameKey="name"
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
                    {pieData.map((entry) => (
                      <Cell
                        key={`cell-${entry.name}`}
                        fill={PAYMENT_COLORS[entry.name] || '#6B7280'}
                        stroke={isDark ? '#1f1f23' : 'white'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend content={renderLegend} />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Total in center info */}
            <div className="mt-2 text-center">
              <span className="text-sm text-brand-dark/60 dark:text-gray-400">{t('salesReport.stats.totalPayments')}: </span>
              <span className="font-bold text-brand-dark dark:text-[var(--app-text-primary)] inline-flex items-center gap-1" dir="ltr">
                {formatCurrency(totalPaymentsForChart)} <SarSymbol className="w-4 h-4" />
              </span>
            </div>
          </Card>
        </div>
      )}

      {/* Invoice DataTable */}
      <DataTable<SalesReportInvoice>
        tableId="sales-report"
        columns={columns}
        data={invoices?.data || []}
        loading={loading}
        emptyIcon="💰"
        emptyMessage={t('salesReport.noData')}
        rowKey="id"
        page={invoices?.page || 1}
        totalPages={invoices?.totalPages || 1}
        onPageChange={handlePageChange}
        expandedRowId={expandedRowId}
        renderExpandedRow={renderExpandedRow}
        onExpandToggle={setExpandedRowId}
        showExpandColumn={true}
      />

      {/* Total Count */}
      {!loading && invoices && invoices.data.length > 0 && (
        <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          {t('salesReport.total')}: {invoices.total}
        </div>
      )}
    </div>
  );
};
