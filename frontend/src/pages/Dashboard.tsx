import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { Card } from '../components/common/Card';
import { dashboardApi, DashboardData } from '../api/dashboard';

export const Dashboard: React.FC = () => {
  const { t, i18n } = useTranslation('dashboard');
  const isRtl = i18n.language === 'ar';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<DashboardData | null>(null);

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

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const stats = data
    ? [
        {
          key: 'todayAppointments',
          value: data.stats.todayAppointments,
          icon: '📅',
          color: 'bg-primary-500',
        },
        {
          key: 'registeredPets',
          value: data.stats.registeredPets,
          icon: '🐾',
          color: 'bg-secondary-400',
        },
        {
          key: 'registeredOwners',
          value: data.stats.registeredOwners,
          icon: '👥',
          color: 'bg-accent-400',
        },
        {
          key: 'pendingInvoices',
          value: data.stats.pendingInvoices,
          icon: '💰',
          color: 'bg-primary-400',
        },
      ]
    : [];

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
    // Convert 24h to 12h format
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
      {/* Title - responsive font size */}
      <div className="flex justify-between items-center mb-4 md:mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
          {t('title')}
        </h1>
        <button
          onClick={fetchDashboardData}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          title={t('refresh') || 'Refresh'}
        >
          <ArrowPathIcon className="w-5 h-5" />
        </button>
      </div>

      {/* Stats Grid - responsive columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-6 md:mb-8">
        {stats.map((stat) => (
          <Card key={stat.key}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-xs sm:text-sm mb-1">
                  {t(`stats.${stat.key}`)}
                </p>
                <p className="text-2xl md:text-3xl font-bold text-gray-800">
                  {stat.value}
                </p>
              </div>
              <div
                className={`${stat.color} w-12 h-12 md:w-16 md:h-16 rounded-full flex items-center justify-center text-2xl md:text-3xl`}
              >
                {stat.icon}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Cards Grid - responsive layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
        {/* Upcoming Appointments Card */}
        <Card title={t('upcomingAppointments')}>
          <div className="space-y-3">
            {data?.upcomingAppointments && data.upcomingAppointments.length > 0 ? (
              data.upcomingAppointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-gray-50 rounded-lg gap-2"
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

        {/* Upcoming Vaccinations Card */}
        <Card title={t('upcomingVaccinations')}>
          <div className="space-y-3">
            {data?.upcomingVaccinations && data.upcomingVaccinations.length > 0 ? (
              data.upcomingVaccinations.map((vaccination) => (
                <div
                  key={vaccination.id}
                  className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 bg-secondary-50 rounded-lg gap-2"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm md:text-base">
                      {vaccination.petName} - {vaccination.petSpecies}
                    </p>
                    <p className="text-xs md:text-sm text-gray-500">
                      {vaccination.vaccineName}
                    </p>
                  </div>
                  <div className="text-left sm:text-right">
                    <p className="text-xs md:text-sm font-medium text-secondary-600">
                      {vaccination.daysUntil === 0
                        ? t('time.today')
                        : vaccination.daysUntil === 1
                        ? t('time.tomorrow')
                        : vaccination.daysUntil === 2
                        ? t('time.inTwoDays')
                        : t('time.inDays', { count: vaccination.daysUntil })}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-gray-500">
                <span className="text-3xl mb-2 block">💉</span>
                <p>{t('noVaccinations') || 'No upcoming vaccinations'}</p>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};
