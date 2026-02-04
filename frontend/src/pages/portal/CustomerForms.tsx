/**
 * Customer Forms Page
 * Shows all forms requiring customer signature
 */

import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { customerPortalApi, PortalForm } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { PortalLogoLoader } from '../../components/portal/ui/PortalLogoLoader';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';
import { format, Locale } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';

// Icons
const DocumentIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
  </svg>
);

const PenIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
  </svg>
);

const CheckCircleIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ClockIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
);

// Category colors
const CATEGORY_COLORS: Record<string, string> = {
  BOARDING: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  SURGERY: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  VACCINATION: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  GROOMING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  CONSENT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
  DISCHARGE: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
  OTHER: 'bg-gray-100 text-gray-700 dark:bg-gray-900/30 dark:text-gray-400',
};

const CATEGORY_ICONS: Record<string, string> = {
  BOARDING: '🏠',
  SURGERY: '🏥',
  VACCINATION: '💉',
  GROOMING: '✂️',
  CONSENT: '✅',
  DISCHARGE: '📋',
  OTHER: '📄',
};

// Tab component
interface TabButtonProps {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  count?: number;
}

const TabButton: React.FC<TabButtonProps> = ({ active, onClick, icon, label, count }) => (
  <button
    onClick={onClick}
    className={`
      flex-1 flex items-center justify-center gap-2 py-3 px-4
      text-sm font-medium rounded-xl transition-all
      ${active
        ? 'bg-mint-500 text-white shadow-lg'
        : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
      }
    `}
  >
    {icon}
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`
        px-2 py-0.5 rounded-full text-xs font-bold
        ${active ? 'bg-white/20 text-white' : 'bg-mint-100 text-mint-700 dark:bg-mint-900/30 dark:text-mint-400'}
      `}>
        {count}
      </span>
    )}
  </button>
);

// Empty state
const EmptyState: React.FC<{ isPending: boolean }> = ({ isPending }) => {
  const { t } = useTranslation('portal');

  return (
    <div className="text-center py-12">
      <div className="w-20 h-20 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
        <DocumentIcon className="w-10 h-10 text-gray-400" />
      </div>
      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
        {isPending ? t('forms.noPending', 'No pending forms') : t('forms.noSigned', 'No signed forms')}
      </h3>
      <p className="text-gray-500 dark:text-gray-400">
        {isPending
          ? t('forms.noPendingDesc', 'You have no forms waiting for your signature')
          : t('forms.noSignedDesc', 'You have not signed any forms yet')}
      </p>
    </div>
  );
};

// Form card component
interface FormCardProps {
  form: PortalForm;
  isRtl: boolean;
  locale: Locale;
}

const FormCard: React.FC<FormCardProps> = ({ form, isRtl, locale }) => {
  const { t } = useTranslation('portal');

  const getStatusInfo = () => {
    switch (form.status) {
      case 'PENDING':
        return {
          label: t('forms.status.pending', 'Pending Signature'),
          color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
          icon: <PenIcon className="w-4 h-4" />,
        };
      case 'AWAITING_VET':
        return {
          label: t('forms.status.awaitingVet', 'Awaiting Vet'),
          color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
          icon: <ClockIcon className="w-4 h-4" />,
        };
      case 'COMPLETED':
        return {
          label: t('forms.status.completed', 'Completed'),
          color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
          icon: <CheckCircleIcon className="w-4 h-4" />,
        };
      default:
        return {
          label: form.status,
          color: 'bg-gray-100 text-gray-700',
          icon: <DocumentIcon className="w-4 h-4" />,
        };
    }
  };

  const statusInfo = getStatusInfo();

  return (
    <Link to={`/portal/forms/${form.id}`}>
      <motion.div whileTap={{ scale: 0.98 }}>
        <Card variant="interactive" padding="sm" className="overflow-hidden">
          {/* Category indicator */}
          <div
            className={`absolute top-0 ${isRtl ? 'right-0' : 'left-0'} w-1 h-full rounded-${isRtl ? 'r' : 'l'}-2xl ${CATEGORY_COLORS[form.template.category] || CATEGORY_COLORS.OTHER}`}
          />

          <div className="flex items-start gap-4">
            {/* Icon */}
            <div className={`
              w-12 h-12 rounded-xl flex items-center justify-center text-2xl
              ${CATEGORY_COLORS[form.template.category] || CATEGORY_COLORS.OTHER}
            `}>
              {CATEGORY_ICONS[form.template.category] || '📄'}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 mb-1">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {isRtl ? form.template.nameAr : form.template.nameEn}
                </h3>
              </div>

              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                🐾 {form.pet.name}
              </p>

              <div className="flex items-center justify-between">
                <span className={`
                  inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium
                  ${statusInfo.color}
                `}>
                  {statusInfo.icon}
                  {statusInfo.label}
                </span>

                <span className="text-xs text-gray-400">
                  {format(new Date(form.createdAt), 'd MMM', { locale })}
                </span>
              </div>
            </div>

            {/* Arrow */}
            <ChevronRightIcon className={`w-5 h-5 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
          </div>
        </Card>
      </motion.div>
    </Link>
  );
};

// Main component
export const CustomerForms: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const isRtl = i18n.language === 'ar';
  const locale = isRtl ? ar : enUS;

  const [activeTab, setActiveTab] = useState<'pending' | 'signed'>('pending');
  const [forms, setForms] = useState<PortalForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchForms = async () => {
      setLoading(true);
      try {
        const data = await customerPortalApi.getForms(activeTab);
        setForms(data);
      } catch (error) {
        console.error('Error fetching forms:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchForms();
  }, [activeTab]);

  const pendingCount = forms.filter(f => f.status === 'PENDING').length;

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
      {/* Header */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
      >
        <Card variant="glass" className="bg-gradient-to-br from-gold-300 to-gold-400 dark:from-gold-400 dark:to-gold-500 text-gray-800">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/30 rounded-2xl flex items-center justify-center">
              <DocumentIcon className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-bold">{t('forms.title', 'My Forms')}</h1>
              <p className="text-gold-700 dark:text-gold-800 text-sm">
                {t('forms.subtitle', 'Sign and manage your documents')}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Tabs */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
        className="flex gap-2"
      >
        <TabButton
          active={activeTab === 'pending'}
          onClick={() => setActiveTab('pending')}
          icon={<PenIcon className="w-4 h-4" />}
          label={t('forms.tabs.pending', 'Pending')}
          count={pendingCount}
        />
        <TabButton
          active={activeTab === 'signed'}
          onClick={() => setActiveTab('signed')}
          icon={<CheckCircleIcon className="w-4 h-4" />}
          label={t('forms.tabs.signed', 'Signed')}
        />
      </motion.div>

      {/* Forms List */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
      >
        {forms.length === 0 ? (
          <EmptyState isPending={activeTab === 'pending'} />
        ) : (
          <div className="space-y-3">
            {forms.map((form) => (
              <FormCard key={form.id} form={form} isRtl={isRtl} locale={locale} />
            ))}
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};

export default CustomerForms;
