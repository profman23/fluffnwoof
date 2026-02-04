/**
 * Pet Detail Page
 * Shows pet information, medical history, and recent appointments
 */

import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { customerPortalApi, PortalPetDetail } from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { PetAvatar } from '../../components/portal/ui/Avatar';
import { StatusBadge } from '../../components/portal/ui/Badge';
import { PortalLogoLoader } from '../../components/portal/ui/PortalLogoLoader';
import { staggerContainer, fadeInUpSimple } from '../../styles/portal/animations';
import { format, differenceInYears, differenceInMonths } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { speciesList, getBreedLabel } from '../../data/petData';

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

const ClipboardIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z" />
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

const calculateAge = (birthDate: string, t: any, isRtl: boolean) => {
  const birth = new Date(birthDate);
  const now = new Date();
  const years = differenceInYears(now, birth);
  const months = differenceInMonths(now, birth) % 12;

  if (years > 0) {
    return `${years} ${t('pets.age.years', { count: years })}`;
  } else if (months > 0) {
    return `${months} ${t('pets.age.months', { count: months })}`;
  }
  return t('pets.age.newborn');
};

const getSpeciesEmoji = (species: string): string => {
  const emojis: Record<string, string> = {
    DOG: '🐕',
    CAT: '🐈',
    BIRD: '🐦',
    RABBIT: '🐰',
    HAMSTER: '🐹',
    TURTLE: '🐢',
    FISH: '🐟',
    HORSE: '🐴',
    OTHER: '🐾',
  };
  return emojis[species] || '🐾';
};

// ============================================
// MAIN COMPONENT
// ============================================

export const PetDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { t, i18n } = useTranslation('portal');
  const navigate = useNavigate();
  const isRtl = i18n.language === 'ar';
  const locale = isRtl ? ar : enUS;

  const [pet, setPet] = useState<PortalPetDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const BackIcon = isRtl ? ArrowRightIcon : ArrowLeftIcon;

  useEffect(() => {
    const fetchPet = async () => {
      if (!id) return;

      try {
        const data = await customerPortalApi.getPetById(id);
        setPet(data);
      } catch (err: any) {
        setError(err.response?.data?.message || t('errors.generic'));
      } finally {
        setLoading(false);
      }
    };

    fetchPet();
  }, [id, t]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <PortalLogoLoader />
      </div>
    );
  }

  if (error || !pet) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error || t('errors.generic')}</p>
        <Button variant="secondary" onClick={() => navigate(-1)}>
          {t('common.back')}
        </Button>
      </div>
    );
  }

  const speciesLabel = isRtl
    ? speciesList.find((s) => s.value === pet.species)?.labelAr
    : speciesList.find((s) => s.value === pet.species)?.labelEn;

  const breedLabel = pet.breed ? getBreedLabel(pet.species, pet.breed, i18n.language) : null;

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
          {t('petDetail.title')}
        </h1>
      </motion.div>

      {/* Pet Header Card */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
      >
        <Card
          variant="glass"
          className="bg-gradient-to-br from-mint-300 to-mint-400 dark:from-mint-400 dark:to-mint-500 text-gray-800 dark:text-gray-900 overflow-hidden relative"
        >
          <div className="absolute inset-0 opacity-20">
            <div className="absolute -top-10 -end-10 w-40 h-40 rounded-full bg-white" />
            <div className="absolute -bottom-10 -start-10 w-32 h-32 rounded-full bg-white" />
          </div>

          <div className="relative flex items-center gap-4">
            <PetAvatar
              name={pet.name}
              species={pet.species}
              photoUrl={pet.photoUrl}
              size="xl"
            />
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{pet.name}</h2>
              <p className="text-mint-700 dark:text-mint-800 text-sm mt-1">
                {getSpeciesEmoji(pet.species)} {speciesLabel}
                {breedLabel && ` • ${breedLabel}`}
              </p>
              <p className="text-mint-700 dark:text-mint-800 text-xs font-mono mt-1 western-numerals">
                {pet.petCode}
              </p>
            </div>
          </div>
        </Card>
      </motion.div>

      {/* Pet Info Card */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.15 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>📋</span>
          {t('petDetail.info')}
        </h2>

        <Card variant="elevated">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t('pets.gender')}</p>
              <p className="font-medium text-gray-900 dark:text-white">
                {pet.gender === 'MALE' ? '♂️' : '♀️'} {t(`pets.genderOptions.${pet.gender}`)}
              </p>
            </div>

            {pet.birthDate && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('petDetail.age')}</p>
                <p className="font-medium text-gray-900 dark:text-white">
                  {calculateAge(pet.birthDate, t, isRtl)}
                </p>
              </div>
            )}

            {pet.color && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('pets.color')}</p>
                <p className="font-medium text-gray-900 dark:text-white">{pet.color}</p>
              </div>
            )}

            {pet.weight && (
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('petDetail.weight')}</p>
                <p className="font-medium text-gray-900 dark:text-white western-numerals">
                  {pet.weight} kg
                </p>
              </div>
            )}
          </div>
        </Card>
      </motion.section>

      {/* Medical Records Section */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <ClipboardIcon className="w-5 h-5 text-mint-600" />
          {t('petDetail.medicalHistory')}
        </h2>

        {pet.medicalRecords.length === 0 ? (
          <Card variant="elevated" className="text-center py-8">
            <span className="text-4xl mb-3 block">📋</span>
            <p className="text-gray-500 dark:text-gray-400">{t('petDetail.noMedicalRecords')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pet.medicalRecords.map((record) => (
              <Card key={record.id} variant="elevated" padding="sm">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-xs text-gray-500 dark:text-gray-400 western-numerals">
                      {format(new Date(record.visitDate), 'dd MMM yyyy', { locale })}
                    </p>
                    {record.diagnosis && (
                      <p className="font-medium text-gray-900 dark:text-white mt-1">
                        {record.diagnosis}
                      </p>
                    )}
                    {record.treatment && (
                      <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                        {record.treatment}
                      </p>
                    )}
                    <p className="text-xs text-mint-600 dark:text-mint-400 mt-2">
                      {t('common.doctor')} {record.vet.firstName} {record.vet.lastName}
                    </p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </motion.section>

      {/* Recent Appointments Section */}
      <motion.section
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.25 }}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <CalendarIcon className="w-5 h-5 text-mint-600" />
          {t('petDetail.recentAppointments')}
        </h2>

        {pet.appointments.length === 0 ? (
          <Card variant="elevated" className="text-center py-8">
            <span className="text-4xl mb-3 block">📅</span>
            <p className="text-gray-500 dark:text-gray-400">{t('petDetail.noAppointments')}</p>
          </Card>
        ) : (
          <div className="space-y-3">
            {pet.appointments.map((apt) => (
              <Link key={apt.id} to={`/portal/appointments/${apt.id}`}>
                <Card variant="elevated" padding="sm" className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <StatusBadge status={apt.status} size="sm" />
                        <span className="text-xs text-gray-500 dark:text-gray-400 western-numerals">
                          {format(new Date(apt.appointmentDate), 'dd MMM yyyy', { locale })}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400 western-numerals">
                          {apt.appointmentTime}
                        </span>
                      </div>
                      <p className="text-xs text-mint-600 dark:text-mint-400 mt-1">
                        {t('common.doctor')} {apt.vet.firstName} {apt.vet.lastName}
                      </p>
                    </div>
                    <ChevronRightIcon className={`w-5 h-5 text-gray-400 ${isRtl ? 'rotate-180' : ''}`} />
                  </div>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </motion.section>

      {/* Book Appointment Button */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
      >
        <Button
          variant="primary"
          size="lg"
          fullWidth
          onClick={() => navigate('/portal/book')}
        >
          📅 {t('petDetail.bookAppointment')}
        </Button>
      </motion.div>
    </motion.div>
  );
};

export default PetDetailPage;
