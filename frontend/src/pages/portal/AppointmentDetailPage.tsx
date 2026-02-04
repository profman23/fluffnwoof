/**
 * Appointment Detail Page
 * Shows appointment details with pet info, vet info, status, and actions
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { customerPortalApi, PortalAppointmentDetail } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { PetAvatar } from '../../components/portal/ui/Avatar';
import { StatusBadge } from '../../components/portal/ui/Badge';
import { PortalLogoLoader } from '../../components/portal/ui/PortalLogoLoader';
import { useToast } from '../../components/portal/ui/Toast';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';
import { format, isToday, isTomorrow, differenceInHours } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ============================================
// ICONS
// ============================================

const ArrowLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);

const ArrowRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
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

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// ============================================
// HELPER FUNCTIONS
// ============================================

const getStatusConfig = (status: string) => {
  const configs: Record<string, { bg: string; icon: string }> = {
    PENDING: { bg: 'from-amber-400 to-amber-500', icon: '⏳' },
    SCHEDULED: { bg: 'from-blue-400 to-blue-500', icon: '📅' },
    CONFIRMED: { bg: 'from-mint-400 to-mint-500', icon: '✅' },
    CHECK_IN: { bg: 'from-teal-400 to-teal-500', icon: '🏥' },
    IN_PROGRESS: { bg: 'from-purple-400 to-purple-500', icon: '⚕️' },
    COMPLETED: { bg: 'from-green-400 to-green-500', icon: '✔️' },
    CANCELLED: { bg: 'from-red-400 to-red-500', icon: '❌' },
    HOSPITALIZED: { bg: 'from-pink-400 to-pink-500', icon: '🏨' },
  };
  return configs[status] || { bg: 'from-gray-400 to-gray-500', icon: '📋' };
};

// ============================================
// MAIN COMPONENT
// ============================================

export const AppointmentDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const toast = useToast();
  const isRtl = i18n.language === 'ar';
  const locale = isRtl ? ar : enUS;

  const [appointment, setAppointment] = useState<PortalAppointmentDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [cancelling, setCancelling] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const BackIcon = isRtl ? ArrowRightIcon : ArrowLeftIcon;

  useEffect(() => {
    const fetchAppointment = async () => {
      if (!id) return;

      try {
        const data = await customerPortalApi.getAppointmentById(id);
        setAppointment(data);
      } catch (err: any) {
        setError(err.response?.data?.message || t('errors.generic'));
      } finally {
        setLoading(false);
      }
    };

    fetchAppointment();
  }, [id, t]);

  const canCancel = () => {
    if (!appointment) return false;
    if (['CANCELLED', 'COMPLETED', 'IN_PROGRESS', 'CHECK_IN'].includes(appointment.status)) {
      return false;
    }

    // Check if appointment is more than 24 hours away
    const appointmentDateTime = new Date(
      `${appointment.appointmentDate}T${appointment.appointmentTime}`
    );
    const hoursUntil = differenceInHours(appointmentDateTime, new Date());
    return hoursUntil >= 24;
  };

  const handleCancel = async () => {
    if (!appointment || !id) return;

    setCancelling(true);
    try {
      await customerPortalApi.cancelAppointment(id);
      toast.success(t('appointments.cancelSuccess'));
      navigate('/portal/appointments', { replace: true });
    } catch (err: any) {
      toast.error(err.response?.data?.message || t('errors.generic'));
    } finally {
      setCancelling(false);
      setShowCancelConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PortalLogoLoader />
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || t('errors.generic')}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(appointment.status);
  const appointmentDate = new Date(appointment.appointmentDate);
  const dateLabel = isToday(appointmentDate)
    ? t('common.today')
    : isTomorrow(appointmentDate)
    ? t('common.tomorrow')
    : format(appointmentDate, 'EEEE, dd MMMM yyyy', { locale });

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="space-y-6 pb-6"
    >
      {/* Header with Back Button */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
        className="flex items-center gap-4"
      >
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
        >
          <BackIcon className="w-5 h-5 text-gray-600 dark:text-gray-400" />
        </button>
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {t('appointmentDetail.title')}
        </h1>
      </motion.div>

      {/* Status Banner */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
      >
        <Card
          variant="glass"
          className={`bg-gradient-to-br ${statusConfig.bg} text-white overflow-hidden relative`}
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -start-10 w-32 h-32 rounded-full bg-white" />
          </div>

          <div className="relative text-center py-4">
            <span className="text-5xl mb-2 block">{statusConfig.icon}</span>
            <StatusBadge status={appointment.status} size="lg" />
            {appointment.cancelledBy && (
              <p className="text-white/80 text-sm mt-2">
                {appointment.cancelledBy === 'CUSTOMER'
                  ? t('appointments.cancelledByCustomer')
                  : t('appointments.cancelledByStaff')}
              </p>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Date & Time Card */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-mint-600" />
          {t('appointmentDetail.dateTime')}
        </h2>

        <Card variant="elevated">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900 dark:text-white">{dateLabel}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 western-numerals">
                {format(appointmentDate, 'dd/MM/yyyy', { locale })}
              </p>
            </div>
            <div className="text-end">
              <div className="flex items-center gap-2 text-gray-900 dark:text-white">
                <ClockIcon className="w-5 h-5 text-mint-600" />
                <span className="font-bold text-lg western-numerals">{appointment.appointmentTime}</span>
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 western-numerals">
                {appointment.duration} {t('booking.minutes')}
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Pet Info Card */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>🐾</span>
          {t('appointmentDetail.petInfo')}
        </h2>

        <Link to={`/portal/pets/${appointment.pet.id}`}>
          <Card variant="elevated" className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <PetAvatar
                  name={appointment.pet.name}
                  species={appointment.pet.species}
                  photoUrl={appointment.pet.photoUrl}
                  size="md"
                />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{appointment.pet.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 font-mono western-numerals">
                    {appointment.pet.petCode}
                  </p>
                </div>
              </div>
              <ChevronRightIcon className={`w-5 h-5 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
            </div>
          </Card>
        </Link>
      </motion.section>

      {/* Vet Info Card */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.25 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <UserIcon className="w-5 h-5 text-mint-600" />
          {t('appointmentDetail.vetInfo')}
        </h2>

        <Card variant="elevated">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-mint-100 dark:bg-mint-900/40 flex items-center justify-center">
              {appointment.vet.avatarUrl ? (
                <img
                  src={appointment.vet.avatarUrl}
                  alt={`${appointment.vet.firstName} ${appointment.vet.lastName}`}
                  className="w-12 h-12 rounded-xl object-cover"
                />
              ) : (
                <span className="text-2xl">👨‍⚕️</span>
              )}
            </div>
            <div>
              <p className="font-medium text-gray-900 dark:text-white">
                {t('common.doctor')} {appointment.vet.firstName} {appointment.vet.lastName}
              </p>
            </div>
          </div>
        </Card>
      </motion.section>

      {/* Visit Reason */}
      {appointment.reason && (
        <motion.section
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📝</span>
            {t('appointmentDetail.visitReason')}
          </h2>

          <Card variant="elevated">
            <p className="text-gray-700 dark:text-gray-300">{appointment.reason}</p>
          </Card>
        </motion.section>
      )}

      {/* Medical Notes (for completed appointments) */}
      {appointment.medicalRecord && (
        <motion.section
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.35 }}
        >
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>🩺</span>
            {t('appointmentDetail.medicalNotes')}
          </h2>

          <Card variant="elevated" className="space-y-3">
            {appointment.medicalRecord.diagnosis && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('appointmentDetail.diagnosis')}
                </p>
                <p className="text-gray-900 dark:text-white">{appointment.medicalRecord.diagnosis}</p>
              </div>
            )}

            {appointment.medicalRecord.treatment && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('appointmentDetail.treatment')}
                </p>
                <p className="text-gray-900 dark:text-white">{appointment.medicalRecord.treatment}</p>
              </div>
            )}

            {appointment.medicalRecord.notes && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                  {t('appointmentDetail.notes')}
                </p>
                <p className="text-gray-700 dark:text-gray-300">{appointment.medicalRecord.notes}</p>
              </div>
            )}
          </Card>
        </motion.section>
      )}

      {/* Cancel Button */}
      {canCancel() && (
        <motion.div
          initial={fadeInUpSimple.initial}
          animate={fadeInUpSimple.animate}
          transition={{ ...fadeInUpSimple.transition, delay: 0.4 }}
        >
          <Button
            variant="secondary"
            size="lg"
            fullWidth
            onClick={() => setShowCancelConfirm(true)}
            className="!text-red-600 !border-red-200 hover:!bg-red-50 dark:!text-red-400 dark:!border-red-800 dark:hover:!bg-red-900/20"
          >
            {t('appointmentDetail.cancelAppointment')}
          </Button>
        </motion.div>
      )}

      {/* Cancel Confirmation Modal */}
      {showCancelConfirm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowCancelConfirm(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-sm w-full shadow-xl"
          >
            <div className="text-center mb-6">
              <span className="text-5xl mb-4 block">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('appointments.cancelConfirmTitle')}
              </h3>
              <p className="text-gray-500 dark:text-gray-400">
                {t('appointments.cancelConfirm')}
              </p>
            </div>

            <div className="flex gap-3">
              <Button
                variant="secondary"
                fullWidth
                onClick={() => setShowCancelConfirm(false)}
                disabled={cancelling}
              >
                {t('common.back')}
              </Button>
              <Button
                variant="primary"
                fullWidth
                onClick={handleCancel}
                loading={cancelling}
                className="!bg-red-500 hover:!bg-red-600"
              >
                {t('appointments.confirmCancel')}
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
};

export default AppointmentDetailPage;
