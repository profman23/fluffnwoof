import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  reportsApi,
  PaginatedResult,
  GetLostCustomersParams,
  LostCustomer,
} from '../../api/reports';
import { flowBoardApi } from '../../api/flowBoard';
import { User } from '../../types';
import { DataTable, Column } from '../../components/common/DataTable';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { CustomerContactModal } from '../../components/reports/CustomerContactModal';

export const LostCustomersReport = () => {
  const { t } = useTranslation('reports');

  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState<LostCustomer[]>([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [filters, setFilters] = useState<GetLostCustomersParams>({
    startDate: '',
    endDate: '',
    vetId: '',
    page: 1,
    limit: 20,
  });

  const [staff, setStaff] = useState<User[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<LostCustomer | null>(null);

  // Load vets for the filter dropdown
  useEffect(() => {
    const loadStaff = async () => {
      try {
        setStaff(await flowBoardApi.getStaff());
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };
    loadStaff();
  }, []);

  const loadReport = async () => {
    setLoading(true);
    try {
      const result: PaginatedResult<LostCustomer> = await reportsApi.getLostCustomersReport(filters);
      setCustomers(result.data);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) {
      console.error('Failed to load lost customers report:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.page]);

  const handleApplyFilters = () => {
    setFilters((prev) => ({ ...prev, page: 1 }));
    loadReport();
  };

  const handleResetFilters = () => {
    setFilters({ startDate: '', endDate: '', vetId: '', page: 1, limit: 20 });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters((prev) => ({ ...prev, page: newPage }));
    }
  };

  const formatDate = (dateStr: string) => new Date(dateStr).toLocaleDateString();

  const columns: Column<LostCustomer>[] = [
    {
      id: 'customerCode',
      header: t('lostCustomers.table.customerCode'),
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedCustomer(row)}
          className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 hover:underline cursor-pointer"
          dir="ltr"
        >
          {row.customerCode || '-'}
        </button>
      ),
    },
    {
      id: 'owner',
      header: t('lostCustomers.table.owner'),
      render: (row) => (
        <button
          type="button"
          onClick={() => setSelectedCustomer(row)}
          className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap hover:underline cursor-pointer text-left"
        >
          {row.ownerName}
        </button>
      ),
    },
    {
      id: 'pet',
      header: t('lostCustomers.table.pet'),
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
          {row.petName} <span className="text-gray-400" dir="ltr">({row.petCode})</span>
        </span>
      ),
    },
    {
      id: 'lastVisitDate',
      header: t('lostCustomers.table.lastVisit'),
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
          {formatDate(row.lastVisitDate)}
        </span>
      ),
    },
    {
      id: 'vet',
      header: t('lostCustomers.table.vet'),
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
          {row.lastVetName || '-'}
        </span>
      ),
    },
    {
      id: 'totalVisits',
      header: t('lostCustomers.table.totalVisits'),
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)]">
          {row.totalVisits}
        </span>
      ),
    },
  ];

  return (
    <ScreenPermissionGuard screenName="lostCustomersReport">
      <div className="page-container">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-2xl">🔍</span>
          <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
            {t('lostCustomers.title')}
          </h1>
        </div>

        {/* Filters */}
        <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-lg shadow dark:shadow-black/30 p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('lostCustomers.filters.from')}
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('lostCustomers.filters.to')}
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              />
            </div>

            {/* Vet Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-1">
                {t('lostCustomers.filters.vet')}
              </label>
              <select
                value={filters.vetId || ''}
                onChange={(e) => setFilters((prev) => ({ ...prev, vetId: e.target.value }))}
                className="w-full px-3 py-2 border dark:border-[var(--app-border-default)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)]"
              >
                <option value="">{t('lostCustomers.filters.allVets')}</option>
                {staff.map((vet) => (
                  <option key={vet.id} value={vet.id}>
                    {vet.firstName} {vet.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-brand-dark text-white rounded-lg hover:opacity-90"
              >
                {t('lostCustomers.filters.apply')}
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border dark:border-[var(--app-border-default)] rounded-lg text-gray-700 dark:text-[var(--app-text-secondary)] hover:bg-gray-50 dark:hover:bg-[var(--app-bg-elevated)]"
              >
                {t('lostCustomers.filters.reset')}
              </button>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <DataTable<LostCustomer>
          tableId="lost-customers-report"
          columns={columns}
          data={customers}
          loading={loading}
          emptyIcon="🔍"
          emptyMessage={t('lostCustomers.noData')}
          rowKey="petId"
          page={pagination.page}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />

        {/* Total Count */}
        {!loading && customers.length > 0 && (
          <div className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t('lostCustomers.total')}: {pagination.total}
          </div>
        )}

        {/* Customer contact modal */}
        <CustomerContactModal
          isOpen={selectedCustomer !== null}
          onClose={() => setSelectedCustomer(null)}
          customer={selectedCustomer}
        />
      </div>
    </ScreenPermissionGuard>
  );
};
