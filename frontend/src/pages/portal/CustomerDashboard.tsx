/**
 * Customer Dashboard Page - Redesigned
 * Mobile-first dashboard with modern UI
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useCustomerAuthStore } from '../../store/customerAuthStore';
import { customerPortalApi, PortalPet, PortalAppointment } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { PetAvatar } from '../../components/portal/ui/Avatar';
import { StatusBadge } from '../../components/portal/ui/Badge';
import {
  NoPetsEmptyState,
  NoAppointmentsEmptyState,
} from '../../components/portal/ui/EmptyState';
import { PortalLogoLoader } from '../../components/portal/ui/PortalLogoLoader';
import { usePortalTheme } from '../../context/PortalThemeContext';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';
import { format, isToday, isTomorrow } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// ============================================
// LORD ICON DECLARATION (for TypeScript)
// ============================================

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'lord-icon': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src: string;
          trigger?: string;
          delay?: string;
          colors?: string;
        },
        HTMLElement
      >;
    }
  }
}

// ============================================
// ICONS
// ============================================

const CalendarIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5" />
  </svg>
);

const PlusIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

// ============================================
// QUICK ACTION CARD
// ============================================

interface QuickActionProps {
  emoji: string;
  title: string;
  to: string;
  color: 'mint' | 'pink' | 'gold';
}

const QuickAction: React.FC<QuickActionProps> = ({ emoji, title, to, color }) => {
  const colorStyles = {
    mint: 'bg-mint-400 text-gray-800',
    pink: 'bg-pink-400 text-gray-800',
    gold: 'bg-gold-300 text-gray-800',
  };

  return (
    <Link to={to} className="flex-1">
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={`
          p-5 rounded-2xl
          ${colorStyles[color]}
          shadow-lg
          hover:shadow-xl
          transition-shadow
          flex items-center justify-center gap-3
          h-full
        `}
      >
        <span className="text-2xl">{emoji}</span>
        <span className="font-semibold text-base">{title}</span>
      </motion.div>
    </Link>
  );
};

// ============================================
// SECTION HEADER
// ============================================

interface SectionHeaderProps {
  title: string;
  icon?: React.ReactNode;
  actionLabel?: string;
  actionTo?: string;
}

const SectionHeader: React.FC<SectionHeaderProps> = ({ title, icon, actionLabel, actionTo }) => {
  const { i18n } = useTranslation();
  const isRtl = i18n.language === 'ar';

  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
        {icon}
        {title}
      </h2>
      {actionLabel && actionTo && (
        <Link
          to={actionTo}
          className="text-sm text-mint-600 dark:text-mint-400 hover:underline flex items-center gap-1"
        >
          {actionLabel}
          <ChevronRightIcon className={`w-4 h-4 ${isRtl ? 'rotate-180' : ''}`} />
        </Link>
      )}
    </div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const CustomerDashboard: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const { customer } = useCustomerAuthStore();
  const { isDark } = usePortalTheme();
  const isRtl = i18n.language === 'ar';
  const locale = isRtl ? ar : enUS;

  // Lord Icon colors based on theme
  // In dark mode: brackets (primary) = yellow, hand outline (secondary) = black
  const iconColors = isDark
    ? 'primary:#f5df59,secondary:#242424'
    : 'primary:#242424,secondary:#f5df59';

  const [pets, setPets] = useState<PortalPet[]>([]);
  const [appointments, setAppointments] = useState<PortalAppointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [petsData, appointmentsData] = await Promise.all([
          customerPortalApi.getPets(),
          customerPortalApi.getAppointments('upcoming'),
        ]);
        setPets(petsData);
        setAppointments(appointmentsData.slice(0, 3));
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return t('dashboard.goodMorning', 'صباح الخير');
    if (hour < 18) return t('dashboard.goodAfternoon', 'مساء الخير');
    return t('dashboard.goodEvening', 'مساء الخير');
  };

  const getRelativeDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    if (isToday(date)) return t('common.today');
    if (isTomorrow(date)) return t('common.tomorrow');
    return format(date, 'EEEE, d MMM', { locale });
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
      className="space-y-6 pb-4"
    >
      {/* Welcome Section */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
      >
        <Card
          variant="glass"
          className="bg-gradient-to-br from-mint-300 to-mint-400 dark:from-mint-400 dark:to-mint-500 text-gray-800 dark:text-gray-900 overflow-hidden relative"
        >
          {/* Decorative Background (no pattern) */}
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -start-10 w-32 h-32 rounded-full bg-white" />
          </div>

          <div className="relative">
            <p className="text-mint-700 dark:text-mint-800 text-sm mb-1">{getGreeting()}</p>
            <h1 className="text-2xl font-bold mb-1 flex items-center gap-2">
              {customer?.firstName}
              <lord-icon
                src="https://cdn.lordicon.com/zoxiseye.json"
                trigger="loop"
                delay="1000"
                colors={iconColors}
                style={{ width: '32px', height: '32px' }}
              />
            </h1>
            <p className="text-mint-700 dark:text-mint-800 text-sm">
              {t('welcome', 'مرحباً بك في فلف آند ووف')}
            </p>

            {/* Stats */}
            <div className="flex gap-6 mt-4 pt-4 border-t border-gray-800/20">
              <div>
                <p className="text-2xl font-bold">{pets.length}</p>
                <p className="text-xs text-mint-700 dark:text-mint-800">{t('dashboard.myPets', 'حيواناتي')}</p>
              </div>
              <div>
                <p className="text-2xl font-bold">{appointments.length}</p>
                <p className="text-xs text-mint-700 dark:text-mint-800">{t('dashboard.upcomingAppointments', 'مواعيد قادمة')}</p>
              </div>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
        className="flex gap-3"
      >
        <QuickAction
          emoji="🐾"
          title={t('pets.addPet')}
          to="/portal/pets?add=true"
          color="pink"
        />
        <QuickAction
          emoji="📅"
          title={t('dashboard.bookNow')}
          to="/portal/book"
          color="gold"
        />
      </motion.div>

      {/* My Pets Section */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
      >
        <SectionHeader
          title={t('dashboard.myPets', 'حيواناتي الأليفة')}
          icon={<span className="text-lg">🐾</span>}
          actionLabel={t('dashboard.viewAll', 'عرض الكل')}
          actionTo="/portal/pets"
        />

        {pets.length === 0 ? (
          <NoPetsEmptyState onAdd={() => navigate('/portal/pets?add=true')} />
        ) : (
          <div className="space-y-3">
            {pets.slice(0, 3).map((pet) => (
              <Link key={pet.id} to={`/portal/pets/${pet.id}`}>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Card variant="interactive" padding="sm">
                    <div className="flex items-center gap-3">
                      <PetAvatar
                        src={pet.photo}
                        name={pet.name}
                        species={pet.species}
                        size="lg"
                      />
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                          {pet.name}
                        </h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {t(`pets.speciesOptions.${pet.species}`, pet.species)}
                          {pet.breed && ` • ${pet.breed}`}
                        </p>
                      </div>
                      <ChevronRightIcon className={`w-5 h-5 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
                    </div>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.section>

      {/* Upcoming Appointments Section */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
      >
        <SectionHeader
          title={t('dashboard.upcomingAppointments', 'المواعيد القادمة')}
          icon={<CalendarIcon className="w-5 h-5 text-mint-500" />}
          actionLabel={t('dashboard.viewAll', 'عرض الكل')}
          actionTo="/portal/appointments"
        />

        {appointments.length === 0 ? (
          <NoAppointmentsEmptyState onBook={() => navigate('/portal/book')} />
        ) : (
          <div className="space-y-3">
            {appointments.map((apt) => (
              <Link key={apt.id} to={`/portal/appointments/${apt.id}`}>
                <motion.div whileTap={{ scale: 0.98 }}>
                  <Card
                    variant="interactive"
                    padding="sm"
                    className="overflow-hidden"
                  >
                    {/* Color indicator */}
                    <div
                      className="absolute top-0 start-0 w-1 h-full rounded-s-2xl bg-gold-400"
                    />

                    <div className="flex items-start gap-3">
                      <PetAvatar
                        src={apt.pet.photo}
                        name={apt.pet.name}
                        species={apt.pet.species}
                        size="md"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {apt.pet.name}
                          </h3>
                          <StatusBadge status={apt.status} size="sm" />
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                          {t('common.doctor')} {apt.vet.firstName} {apt.vet.lastName}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                          <span className="flex items-center gap-1">
                            <CalendarIcon className="w-3.5 h-3.5" />
                            {getRelativeDate(apt.appointmentDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <ClockIcon className="w-3.5 h-3.5" />
                            {apt.appointmentTime}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              </Link>
            ))}
          </div>
        )}
      </motion.section>

    </motion.div>
  );
};

export default CustomerDashboard;
