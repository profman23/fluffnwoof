import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon, CalendarDaysIcon, UserGroupIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { Card } from '../components/common/Card';
import { dashboardApi, DashboardData, AnalyticsData } from '../api/dashboard';
import { StatsCard } from '../components/dashboard/StatsCard';
import { DateRangeFilter, DateRangePreset } from '../components/dashboard/DateRangeFilter';
import { AppointmentsChart } from '../components/dashboard/AppointmentsChart';
import { PatientsChart } from '../components/dashboard/PatientsChart';
import { VetsChart } from '../components/dashboard/VetsChart';

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation('dashboard');
  const isRtl = i18n.language === 'ar';

  // Basic dashboard data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

  // Analytics data with date range
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [dateRange, setDateRange] = useState<{ startDate: Date; endDate: Date }>(() => {
    // Default to this month
    const now = new Date();
    const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return { startDate, endDate };
  });
  const [preset, setPreset] = useState<DateRangePreset>('thisMonth');

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const dashboardData = await dashboardApi.getData();
      setData(dashboardData);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError(t('errors.loadFailed') || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const startStr = dateRange.startDate.toISOString().split('T')[0];
      const endStr = dateRange.endDate.toISOString().split('T')[0];
      const analyticsData = await dashboardApi.getAnalytics(startStr, endStr);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setAnalyticsLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const handleDateRangeChange = (start: Date, end: Date, newPreset: DateRangePreset) => {
    setDateRange({ startDate: start, endDate: end });
    setPreset(newPreset);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateOnly = new Date(date);
    dateOnly.setHours(0, 0, 0, 0);

    if (dateOnly.getTime() === today.getTime()) {
      return t('time.today');
    } else if (dateOnly.getTime() === tomorrow.getTime()) {
      return t('time.tomorrow');
    } else {
      return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      });
    }
  };

  const formatTime = (timeStr: string) => {
    if (!timeStr) return '-';
    const [hours, minutes] = timeStr.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getVisitTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      GENERAL_CHECKUP: t('appointmentTypes.checkup'),
      GROOMING: t('appointmentTypes.grooming'),
      SURGERY: t('appointmentTypes.surgery'),
      VACCINATION: t('appointmentTypes.vaccination'),
      EMERGENCY: t('appointmentTypes.emergency'),
    };
    return typeMap[type] || type;
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="flex items-center justify-center min-h-[60vh]">
          <ArrowPathIcon className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={fetchDashboardData}
            className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
          >
            {t('retry') || 'Retry'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Header with Title and Date Range Filter */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-4 mb-6">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            {t('title')}
          </h1>
          <button
            onClick={() => {
              fetchDashboardData();
              fetchAnalytics();
            }}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title={t('refresh') || 'Refresh'}
          >
            <ArrowPathIcon className="w-5 h-5" />
          </button>
        </div>
        <DateRangeFilter
          startDate={dateRange.startDate}
          endDate={dateRange.endDate}
          preset={preset}
          onDateChange={handleDateRangeChange}
        />
      </div>

      {/* Main Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6">
        <StatsCard
          title={t('analytics.totalAppointments')}
          value={analytics?.appointments.total || 0}
          icon={<CalendarDaysIcon className="w-7 h-7" />}
          change={analytics?.appointments.change}
          changeLabel={t('analytics.changeFromPrevious')}
          color="primary"
          loading={analyticsLoading}
        />
        <StatsCard
          title={t('analytics.newPatients')}
          value={analytics?.patients.newPets || 0}
          icon={<span className="text-2xl">🐾</span>}
          change={analytics?.patients.petsChange}
          changeLabel={t('analytics.changeFromPrevious')}
          color="secondary"
          loading={analyticsLoading}
        />
        <StatsCard
          title={t('analytics.newOwners')}
          value={analytics?.patients.newOwners || 0}
          icon={<UserGroupIcon className="w-7 h-7" />}
          change={analytics?.patients.ownersChange}
          changeLabel={t('analytics.changeFromPrevious')}
          color="accent"
          loading={analyticsLoading}
        />
        <StatsCard
          title={t('stats.pendingInvoices')}
          value={data?.stats.pendingInvoices || 0}
          icon={<ClipboardDocumentListIcon className="w-7 h-7" />}
          color="warning"
          loading={loading}
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6 mb-6">
        {/* Appointments Trend Chart - Takes 2 columns */}
        <div className="lg:col-span-2">
          <AppointmentsChart
            data={analytics?.appointments.trend || []}
            loading={analyticsLoading}
          />
        </div>
        {/* Patients by Species Chart */}
        <div className="lg:col-span-1">
          <PatientsChart
            data={analytics?.patients.bySpecies || []}
            loading={analyticsLoading}
          />
        </div>
      </div>

      {/* Vet Performance and Lists Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Vet Performance Chart */}
        <VetsChart
          data={analytics?.vets.performance || []}
          loading={analyticsLoading}
        />

        {/* Upcoming Appointments Card */}
        <Card title={t('upcomingAppointments')}>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
              data.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg gap-2 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm md:text-base">
                      {getVisitTypeLabel(appointment.type)} - {appointment.petName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {appointment.vetName}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs md:text-sm font-medium">
                      {formatTime(appointment.time)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {formatDate(appointment.date)}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-3xl mb-2 block">📅</span>
                <p>{t('noAppointments') || 'No upcoming appointments'}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Vaccinations Section */}
      <div className="grid grid-cols-1 gap-4 md:gap-6">
        <Card title={t('upcomingVaccinations')}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data?.upcomingVaccinations && data.upcomingVaccinations.length > 0 ? (
              data.upcomingVaccinations.map((vaccination) => (
                <div
                  key={vaccination.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-secondary-50 rounded-lg gap-2 hover:bg-secondary-100 transition-colors"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm md:text-base">
                      {vaccination.petName}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {vaccination.vaccineName}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                        vaccination.daysUntil === 0
                          ? 'bg-red-100 text-red-700'
                          : vaccination.daysUntil <= 3
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-green-100 text-green-700'
                      }`}
                    >
                      {vaccination.daysUntil === 0
                        ? t('time.today')
                        : vaccination.daysUntil === 1
                        ? t('time.tomorrow')
                        : vaccination.daysUntil === 2
                        ? t('time.inTwoDays')
                        : t('time.inDays', { count: vaccination.daysUntil })}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8 text-gray-500">
                <span className="text-3xl mb-2 block">💉</span>
                <p>{t('noVaccinations') || 'No upcoming vaccinations'}</p>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Summary Stats at Bottom */}
      <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-primary-600">{data?.stats.todayAppointments || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{t('stats.todayAppointments')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-secondary-500">{analytics?.patients.totalPets || data?.stats.registeredPets || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{t('stats.registeredPets')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-accent-500">{analytics?.patients.totalOwners || data?.stats.registeredOwners || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{t('stats.registeredOwners')}</p>
        </div>
        <div className="bg-white rounded-xl p-4 border border-gray-100 text-center">
          <p className="text-3xl font-bold text-primary-400">{analytics?.vets.totalVets || 0}</p>
          <p className="text-sm text-gray-500 mt-1">{t('analytics.totalVets')}</p>
        </div>
      </div>
    </div>
  );
};
