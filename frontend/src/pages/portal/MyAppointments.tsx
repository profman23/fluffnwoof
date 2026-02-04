/**
 * My Appointments Page - Redesigned
 * Mobile-first appointments list with modern UI
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { customerPortalApi, PortalAppointment } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { PetAvatar } from '../../components/portal/ui/Avatar';
import { StatusBadge } from '../../components/portal/ui/Badge';
import { BottomSheet } from '../../components/portal/ui/Modal';
import { NoAppointmentsEmptyState, PortalLogoLoader } from '../../components/portal/ui';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ============================================
// ICONS
// ============================================

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ExclamationIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
  </svg>
);

// ============================================
// FILTER TABS
// ============================================

interface FilterTabsProps {
  filter: 'upcoming' | 'past';
  onChange: (filter: 'upcoming' | 'past') => void;
  upcomingCount: number;
}

const FilterTabs: React.FC<FilterTabsProps> = ({ filter, onChange, upcomingCount }) => {
  const { t } = useTranslation('portal');

  return (
    <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
      <button
        onClick={() => onChange('upcoming')}
        className={`
          flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
          ${filter === 'upcoming'
            ? 'bg-white dark:bg-gray-700 text-mint-600 dark:text-mint-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }
        `}
      >
        {t('appointments.upcoming')}
        {upcomingCount > 0 && (
          <span className={`ms-2 px-2 py-0.5 text-xs rounded-full ${
            filter === 'upcoming' ? 'bg-mint-100 dark:bg-mint-900/30 text-mint-700 dark:text-mint-300' : 'bg-gray-200 dark:bg-gray-700'
          }`}>
            {upcomingCount}
          </span>
        )}
      </button>
      <button
        onClick={() => onChange('past')}
        className={`
          flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
          ${filter === 'past'
            ? 'bg-white dark:bg-gray-700 text-mint-600 dark:text-mint-400 shadow-sm'
            : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
          }
        `}
      >
        {t('appointments.past')}
      </button>
    </div>
  );
};

// ============================================
// APPOINTMENT CARD
// ============================================

interface AppointmentCardProps {
  appointment: PortalAppointment;
  onCancel: () => void;
  canCancel: boolean;
  isRtl: boolean;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment: apt,
  onCancel,
  canCancel,
  isRtl,
}) => {
  const { t } = useTranslation('portal');
  const locale = isRtl ? ar : enUS;

  const getRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return t('common.today');
    if (isTomorrow(date)) return t('common.tomorrow');
    return format(date, 'EEEE, d MMM', { locale });
  };

  const getStatusColor = (status: string): string => {
    const colors: Record<string, string> = {
      SCHEDULED: 'from-amber-400 to-amber-500',
      CONFIRMED: 'from-green-400 to-green-500',
      CHECK_IN: 'from-blue-400 to-blue-500',
      IN_PROGRESS: 'from-purple-400 to-purple-500',
      HOSPITALIZED: 'from-orange-400 to-orange-500',
      COMPLETED: 'from-gray-400 to-gray-500',
      CANCELLED: 'from-red-400 to-red-500',
    };
    return colors[status] || 'from-gray-400 to-gray-500';
  };

  const isCancelled = apt.status === 'CANCELLED';

  return (
    <motion.div whileTap={{ scale: 0.98 }}>
      <Card
        variant="interactive"
        padding="none"
        className={`overflow-hidden ${isCancelled ? 'opacity-60' : ''}`}
      >
        {/* Status indicator bar */}
        <div className={`h-1 bg-gradient-to-r ${getStatusColor(apt.status)}`} />

        <div className="p-4">
          <div className="flex items-start gap-4">
            <PetAvatar
              src={apt.pet.photo}
              name={apt.pet.name}
              species={apt.pet.species}
              size="lg"
            />

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {apt.pet.name}
                </h3>
                <StatusBadge status={apt.status} size="sm" />
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">
                {t('common.doctor')} {apt.vet.firstName} {apt.vet.lastName}
              </p>

              {/* Date and Time */}
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <CalendarIcon className="w-4 h-4 text-mint-500" />
                  {getRelativeDate(apt.appointmentDate)}
                </span>
                <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <ClockIcon className="w-4 h-4 text-mint-500" />
                  {apt.appointmentTime}
                </span>
              </div>

              {/* Cancelled info */}
              {apt.cancelledBy && (
                <p className="mt-2 text-sm text-red-500 dark:text-red-400">
                  {apt.cancelledBy === 'CUSTOMER'
                    ? t('appointments.cancelledByCustomer')
                    : t('appointments.cancelledByStaff')}
                </p>
              )}

              {/* Cancel button */}
              {canCancel && !isCancelled && (
                <button
                  onClick={onCancel}
                  className="mt-3 text-sm text-red-500 dark:text-red-400 hover:text-red-600 dark:hover:text-red-300 font-medium"
                >
                  {t('appointments.cancel')}
                </button>
              )}
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const MyAppointments: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const isRtl = i18n.language === 'ar';

  const [filter, setFilter] = useState<'upcoming' | 'past'>('upcoming');
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<PortalAppointment | null>(null);
  const [error, setError] = useState('');
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    fetchAppointments();
  }, [filter]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const data = await customerPortalApi.getAppointments(filter);
      setAppointments(data);

      // Also get upcoming count for badge
      if (filter === 'past') {
        const upcoming = await customerPortalApi.getAppointments('upcoming');
        setUpcomingCount(upcoming.length);
      } else {
        setUpcomingCount(data.length);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const canCancel = (apt: PortalAppointment): boolean => {
    if (apt.status === 'CANCELLED' || apt.status === 'COMPLETED') return false;
    if (apt.status === 'SCHEDULED') return true;

    const aptDateTime = new Date(`${apt.appointmentDate}T${apt.appointmentTime}`);
    const hoursUntil = (aptDateTime.getTime() - Date.now()) / (1000 * 60 * 60);
    return hoursUntil >= 24;
  };

  const openCancelModal = (apt: PortalAppointment) => {
    setSelectedAppointment(apt);
    setError('');
    setShowCancelModal(true);
  };

  const handleCancel = async () => {
    if (!selectedAppointment) return;

    setCancellingId(selectedAppointment.id);
    setError('');

    try {
      await customerPortalApi.cancelAppointment(selectedAppointment.id);
      setShowCancelModal(false);
      fetchAppointments();
    } catch (err: any) {
      setError(err.response?.data?.message || t('errors.generic'));
    } finally {
      setCancellingId(null);
    }
  };

  // Show centered logo loader while loading
  if (loading) {
    return <PortalLogoLoader fullScreen={false} size="lg" />;
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
            <span>📅</span> {t('appointments.title')}
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t('appointments.subtitle')}
          </p>
        </div>
        <Link to="/portal/book">
          <Button variant="primary" leftIcon={<PlusIcon className="w-5 h-5" />}>
            {t('dashboard.bookAppointment')}
          </Button>
        </Link>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
      >
        <FilterTabs
          filter={filter}
          onChange={setFilter}
          upcomingCount={upcomingCount}
        />
      </motion.div>

      {/* Appointments List */}
      <AnimatePresence mode="wait">
        {appointments.length === 0 ? (
          <motion.div
            key="empty"
            initial={fadeInUpSimple.initial}
            animate={fadeInUpSimple.animate}
            transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
          >
            <NoAppointmentsEmptyState onBook={() => {}} />
          </motion.div>
        ) : (
          <motion.div
            key="list"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-4"
          >
            {appointments.map((apt, index) => (
              <motion.div
                key={apt.id}
                initial={fadeInUpSimple.initial}
                animate={fadeInUpSimple.animate}
                transition={{ ...fadeInUpSimple.transition, delay: 0.1 + index * 0.05 }}
              >
                <AppointmentCard
                  appointment={apt}
                  onCancel={() => openCancelModal(apt)}
                  canCancel={filter === 'upcoming' && canCancel(apt)}
                  isRtl={isRtl}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cancel Confirmation Modal */}
      <BottomSheet
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title={t('appointments.cancel')}
      >
        <div className="text-center py-4">
          {/* Warning Icon */}
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <ExclamationIcon className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>

          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            {t('appointments.cancelConfirmTitle')}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6">
            {t('appointments.cancelConfirm')}
          </p>

          {selectedAppointment && (
            <div className="bg-gray-50 dark:bg-gray-800/50 rounded-xl p-4 mb-6 text-start">
              <div className="flex items-center gap-3">
                <PetAvatar
                  src={selectedAppointment.pet.photo}
                  name={selectedAppointment.pet.name}
                  species={selectedAppointment.pet.species}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {selectedAppointment.pet.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {format(new Date(selectedAppointment.appointmentDate), 'EEEE, d MMM', { locale: isRtl ? ar : enUS })} • {selectedAppointment.appointmentTime}
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-4 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          <div className="flex gap-3">
            <Button
              variant="secondary"
              fullWidth
              onClick={() => setShowCancelModal(false)}
              disabled={!!cancellingId}
            >
              {t('common.back')}
            </Button>
            <Button
              variant="danger"
              fullWidth
              onClick={handleCancel}
              loading={!!cancellingId}
            >
              {t('appointments.confirmCancel')}
            </Button>
          </div>
        </div>
      </BottomSheet>
    </motion.div>
  );
};

export default MyAppointments;
