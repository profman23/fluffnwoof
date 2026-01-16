import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CalendarDaysIcon, FunnelIcon, ArrowPathIcon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { reportsApi, PaginatedResult, GetNextAppointmentsParams } from '../../api/reports';
import { flowBoardApi } from '../../api/flowBoard';
import { FlowBoardAppointment, User } from '../../types';
import { usePhonePermission, maskPhoneNumber } from '../../hooks/useScreenPermission';
import { getTodayDate } from '../../utils/appointmentUtils';

export const NextAppointmentsReport = () => {
  const { t } = useTranslation('reports');
  const { t: tFlow } = useTranslation('flowBoard');
  const { canViewPhone } = usePhonePermission();

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

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <CalendarDaysIcon className="w-8 h-8 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">
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
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <ArrowPathIcon className="w-8 h-8 animate-spin text-blue-600" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            {t('nextAppointments.noData')}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.date')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.time')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.pet')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.owner')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.phone')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.vet')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.visitType')}
                    </th>
                    <th className="px-6 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {t('nextAppointments.table.status')}
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {appointments.map((apt) => (
                    <tr key={apt.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(apt.appointmentDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {apt.appointmentTime}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {apt.pet?.name} ({apt.pet?.species})
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {apt.pet?.owner?.firstName} {apt.pet?.owner?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900" dir="ltr">
                        {canViewPhone
                          ? apt.pet?.owner?.phone
                          : maskPhoneNumber(apt.pet?.owner?.phone || '')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {apt.vet?.firstName} {apt.vet?.lastName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {tFlow(`visitTypes.${apt.visitType}`)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(apt.status)}`}>
                          {tFlow(`statuses.${apt.status}`)}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="px-6 py-4 border-t flex items-center justify-between">
              <div className="text-sm text-gray-500">
                {t('nextAppointments.total')}: {pagination.total}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeftIcon className="w-5 h-5" />
                </button>
                <span className="text-sm text-gray-700">
                  {pagination.page} / {pagination.totalPages || 1}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRightIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
