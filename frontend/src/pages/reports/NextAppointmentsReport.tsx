import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CalendarDaysIcon, FunnelIcon } from '@heroicons/react/24/outline';
import { reportsApi, PaginatedResult, GetNextAppointmentsParams } from '../../api/reports';
import { flowBoardApi } from '../../api/flowBoard';
import { visitTypesApi } from '../../api/visitTypes';
import { FlowBoardAppointment, User } from '../../types';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { getTodayDate } from '../../utils/appointmentUtils';
import { DataTable, Column } from '../../components/common/DataTable';

export const NextAppointmentsReport = () => {
  const { t, i18n } = useTranslation('reports');
  const { t: tFlow } = useTranslation('flowBoard');
  const isRTL = i18n.language === 'ar';
  const { canViewPhone } = usePhonePermission();

  // Fetch visit types to get the actual name
  const { data: visitTypes = [] } = useQuery({
    queryKey: ['visit-types-all'],
    queryFn: () => visitTypesApi.getAll(true),
    staleTime: 1000 * 60 * 5,
  });

  // Helper to get visit type name from code
  const getVisitTypeName = useCallback((code: string | undefined) => {
    if (!code) return '-';
    const visitType = visitTypes.find(vt => vt.code === code);
    if (visitType) {
      return isRTL ? visitType.nameAr : visitType.nameEn;
    }
    return tFlow(`visitTypes.${code}`);
  }, [visitTypes, isRTL, tFlow]);

  const [loading, setLoading] = useState(true);
  const [appointments, setAppointments] = useState<FlowBoardAppointment[]>([]);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
  });

  const [filters, setFilters] = useState<GetNextAppointmentsParams>({
    startDate: getTodayDate(),
    endDate: '',
    vetId: '',
    customerCode: '',
    phone: '',
    page: 1,
    limit: 20,
  });

  const [staff, setStaff] = useState<User[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  // Load staff for filter dropdown
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const data = await flowBoardApi.getStaff();
        setStaff(data);
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };
    loadStaff();
  }, []);

  // Load appointments
  const loadAppointments = async () => {
    setLoading(true);
    try {
      const result: PaginatedResult<FlowBoardAppointment> = await reportsApi.getNextAppointments(filters);
      setAppointments(result.data);
      setPagination({
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      });
    } catch (err) {
      console.error('Failed to load appointments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppointments();
  }, [filters.page]);

  const handleApplyFilters = () => {
    setFilters(prev => ({ ...prev, page: 1 }));
    loadAppointments();
  };

  const handleResetFilters = () => {
    setFilters({
      startDate: getTodayDate(),
      endDate: '',
      vetId: '',
      customerCode: '',
      phone: '',
      page: 1,
      limit: 20,
    });
  };

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      setFilters(prev => ({ ...prev, page: newPage }));
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'SCHEDULED':
        return 'bg-blue-100 text-blue-800';
      case 'CONFIRMED':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Define columns for DataTable
  const columns: Column<FlowBoardAppointment>[] = [
    {
      id: 'date',
      header: t('nextAppointments.table.date'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {formatDate(apt.appointmentDate)}
        </span>
      ),
    },
    {
      id: 'time',
      header: t('nextAppointments.table.time'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {apt.appointmentTime}
        </span>
      ),
    },
    {
      id: 'pet',
      header: t('nextAppointments.table.pet'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {apt.pet?.name} ({apt.pet?.species})
        </span>
      ),
    },
    {
      id: 'owner',
      header: t('nextAppointments.table.owner'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {apt.pet?.owner?.firstName} {apt.pet?.owner?.lastName}
        </span>
      ),
    },
    {
      id: 'phone',
      header: t('nextAppointments.table.phone'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap" dir="ltr">
          {canViewPhone
            ? apt.pet?.owner?.phone
            : maskPhoneNumber(apt.pet?.owner?.phone || '')}
        </span>
      ),
    },
    {
      id: 'vet',
      header: t('nextAppointments.table.vet'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {apt.vet?.firstName} {apt.vet?.lastName}
        </span>
      ),
    },
    {
      id: 'visitType',
      header: t('nextAppointments.table.visitType'),
      render: (apt) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {getVisitTypeName(apt.visitType)}
        </span>
      ),
    },
    {
      id: 'status',
      header: t('nextAppointments.table.status'),
      render: (apt) => (
        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>
          {tFlow(`statuses.${apt.status}`)}
        </span>
      ),
    },
  ];

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-7 h-7 text-brand-dark" />
          <h1 className="text-2xl font-bold text-brand-dark">
            {t('nextAppointments.title')}
          </h1>
        </div>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50"
        >
          <FunnelIcon className="w-5 h-5" />
          {t('nextAppointments.filters.title', 'Filters')}
        </button>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {/* Start Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nextAppointments.filters.from')}
              </label>
              <input
                type="date"
                value={filters.startDate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* End Date */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nextAppointments.filters.to')}
              </label>
              <input
                type="date"
                value={filters.endDate || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Vet Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nextAppointments.filters.vet')}
              </label>
              <select
                value={filters.vetId || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, vetId: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">{t('nextAppointments.filters.allVets')}</option>
                {staff.map(vet => (
                  <option key={vet.id} value={vet.id}>
                    {vet.firstName} {vet.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Customer Code Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nextAppointments.filters.customerCode')}
              </label>
              <input
                type="text"
                value={filters.customerCode || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, customerCode: e.target.value }))}
                placeholder="C00000001"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Phone Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t('nextAppointments.filters.phone')}
              </label>
              <input
                type="text"
                value={filters.phone || ''}
                onChange={(e) => setFilters(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="05xxxxxxxx"
                dir="ltr"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            {/* Filter Actions */}
            <div className="flex items-end gap-2">
              <button
                onClick={handleApplyFilters}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                {t('nextAppointments.filters.apply')}
              </button>
              <button
                onClick={handleResetFilters}
                className="px-4 py-2 border rounded-lg text-gray-700 hover:bg-gray-50"
              >
                {t('nextAppointments.filters.reset')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DataTable */}
      <DataTable<FlowBoardAppointment>
        tableId="next-appointments"
        columns={columns}
        data={appointments}
        loading={loading}
        emptyIcon="📅"
        emptyMessage={t('nextAppointments.noData')}
        rowKey="id"
        page={pagination.page}
        totalPages={pagination.totalPages}
        onPageChange={handlePageChange}
      />

      {/* Total Count */}
      {!loading && appointments.length > 0 && (
        <div className="mt-2 text-sm text-gray-500">
          {t('nextAppointments.total')}: {pagination.total}
        </div>
      )}
    </div>
  );
};
