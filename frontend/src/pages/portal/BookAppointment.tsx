/**
 * Book Appointment Page - Redesigned
 * Mobile-first booking wizard with modern UI
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  customerPortalApi,
  PortalPet,
  PortalVisitType,
  PortalVet,
  AvailabilityResponse
} from '../../api/customerPortal';
import { Card } from '../../components/portal/ui/Card';
import { Button } from '../../components/portal/ui/Button';
import { PetAvatar } from '../../components/portal/ui/Avatar';
import { staggerContainer, fadeInUpSimple, successCheck, successCircle } from '../../styles/portal/animations';
import { PortalLogoLoader } from '../../components/portal/ui/PortalLogoLoader';
import { SlotConflictModal, SlotAlternative } from '../../components/portal/booking/SlotConflictModal';
import { useBookingSocket, SlotStatus } from '../../context/BookingSocketContext';

// ============================================
// ICONS
// ============================================

const CheckIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
  </svg>
);

const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
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

const UserIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
  </svg>
);

// ============================================
// STEP INDICATOR
// ============================================

type Step = 'pet' | 'visitType' | 'vet' | 'date' | 'time' | 'confirm';
const STEPS: Step[] = ['pet', 'visitType', 'vet', 'date', 'time', 'confirm'];

interface StepIndicatorProps {
  currentStep: Step;
  onStepClick: (step: Step) => void;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, onStepClick }) => {
  const { t } = useTranslation('portal');
  const currentIndex = STEPS.indexOf(currentStep);

  const stepIcons = ['🐾', '📋', '👨‍⚕️', '📅', '⏰', '✅'];

  return (
    <div className="flex justify-between mb-6">
      {STEPS.map((step, idx) => {
        const isCompleted = currentIndex > idx;
        const isCurrent = currentIndex === idx;
        const isClickable = currentIndex > idx;

        return (
          <div key={step} className="flex-1 flex flex-col items-center relative">
            {/* Connecting line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`absolute top-4 start-1/2 w-full h-0.5 -z-10 ${
                  isCompleted ? 'bg-mint-500' : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            )}

            {/* Step circle */}
            <button
              onClick={() => isClickable && onStepClick(step)}
              disabled={!isClickable}
              className={`
                w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all
                ${isCompleted
                  ? 'bg-mint-500 text-white cursor-pointer'
                  : isCurrent
                  ? 'bg-mint-500 text-white ring-4 ring-mint-500/20'
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                }
              `}
            >
              {isCompleted ? (
                <CheckIcon className="w-4 h-4" />
              ) : (
                <span className="text-xs">{stepIcons[idx]}</span>
              )}
            </button>

            {/* Step label - only on desktop */}
            <span className={`hidden sm:block text-xs mt-1 ${
              isCurrent ? 'text-mint-600 dark:text-mint-400 font-medium' : 'text-gray-500 dark:text-gray-400'
            }`}>
              {t(`booking.steps.${step}`)}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// ============================================
// SUCCESS SCREEN
// ============================================

const SuccessScreen: React.FC = () => {
  const { t } = useTranslation('portal');

  return (
    <motion.div
      variants={staggerContainer}
      initial="initial"
      animate="animate"
      className="text-center py-8"
    >
      {/* Success animation */}
      <motion.div
        variants={successCircle}
        className="w-24 h-24 rounded-full bg-gradient-to-br from-mint-400 to-mint-600 flex items-center justify-center mx-auto mb-6 shadow-lg shadow-mint-500/30"
      >
        <motion.div variants={successCheck}>
          <CheckIcon className="w-12 h-12 text-white" />
        </motion.div>
      </motion.div>

      <motion.h2
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
        className="text-2xl font-bold text-gray-900 dark:text-white mb-2"
      >
        {t('booking.success')}
      </motion.h2>

      <motion.p
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.3 }}
        className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto"
      >
        {t('booking.successMessage')}
      </motion.p>

      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.4 }}
        className="flex flex-col sm:flex-row gap-3 justify-center"
      >
        <Link to="/portal/appointments">
          <Button variant="primary" fullWidth>
            {t('appointments.title')}
          </Button>
        </Link>
        <Link to="/portal/dashboard">
          <Button variant="secondary" fullWidth>
            {t('nav.dashboard')}
          </Button>
        </Link>
      </motion.div>
    </motion.div>
  );
};

// ============================================
// MAIN COMPONENT
// ============================================

export const BookAppointment: React.FC = () => {
  const { t, i18n } = useTranslation('portal');
  const isRtl = i18n.language === 'ar';

  const BackIcon = isRtl ? ChevronRightIcon : ChevronLeftIcon;
  const NextIcon = isRtl ? ChevronLeftIcon : ChevronRightIcon;

  // WebSocket for real-time slot updates
  const {
    isConnected,
    slotStatuses,
    subscribe,
    unsubscribe
  } = useBookingSocket();

  // Step state
  const [currentStep, setCurrentStep] = useState<Step>('pet');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Data
  const [pets, setPets] = useState<PortalPet[]>([]);
  const [visitTypes, setVisitTypes] = useState<PortalVisitType[]>([]);
  const [vets, setVets] = useState<PortalVet[]>([]);
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [loadingSlots, setLoadingSlots] = useState(false);

  // Selection state
  const [selectedPet, setSelectedPet] = useState<PortalPet | null>(null);
  const [selectedVisitType, setSelectedVisitType] = useState<PortalVisitType | null>(null);
  const [selectedVet, setSelectedVet] = useState<PortalVet | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [reason, setReason] = useState('');

  // Conflict modal state
  const [showConflictModal, setShowConflictModal] = useState(false);
  const [conflictAlternatives, setConflictAlternatives] = useState<SlotAlternative[]>([]);
  const [conflictError, setConflictError] = useState('');

  // Subscribe to WebSocket room when vet and date are selected
  useEffect(() => {
    if (selectedVet && selectedDate && isConnected) {
      subscribe(selectedVet.id, selectedDate);

      return () => {
        unsubscribe(selectedVet.id, selectedDate);
      };
    }
  }, [selectedVet?.id, selectedDate, isConnected, subscribe, unsubscribe]);

  // Get slot status for display
  const getSlotStatus = useCallback((slot: string): SlotStatus | null => {
    return slotStatuses[slot] || null;
  }, [slotStatuses]);

  // Load initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [petsData, visitTypesData, vetsData] = await Promise.all([
          customerPortalApi.getPets(),
          customerPortalApi.getVisitTypes(),
          customerPortalApi.getVets(),
        ]);
        setPets(petsData);
        setVisitTypes(visitTypesData);
        setVets(vetsData);
      } catch (error) {
        console.error('Error fetching booking data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Fetch availability when vet and date are selected
  useEffect(() => {
    if (selectedVet && selectedDate && selectedVisitType) {
      fetchAvailability();
    }
  }, [selectedVet, selectedDate, selectedVisitType]);

  const fetchAvailability = async () => {
    if (!selectedVet || !selectedDate || !selectedVisitType) return;

    setLoadingSlots(true);
    setSelectedTime('');
    try {
      const data = await customerPortalApi.getAvailability(
        selectedVet.id,
        selectedDate,
        selectedVisitType.duration
      );
      setAvailability(data);
    } catch (error) {
      console.error('Error fetching availability:', error);
      setAvailability(null);
    } finally {
      setLoadingSlots(false);
    }
  };

  const handleNext = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex < STEPS.length - 1) {
      setCurrentStep(STEPS[currentIndex + 1]);
    }
  };

  const handleBack = () => {
    const currentIndex = STEPS.indexOf(currentStep);
    if (currentIndex > 0) {
      setCurrentStep(STEPS[currentIndex - 1]);
    }
  };

  const handleStepClick = (step: Step) => {
    const targetIndex = STEPS.indexOf(step);
    const currentIndex = STEPS.indexOf(currentStep);
    if (targetIndex < currentIndex) {
      setCurrentStep(step);
    }
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'pet':
        return !!selectedPet;
      case 'visitType':
        return !!selectedVisitType;
      case 'vet':
        return !!selectedVet;
      case 'date':
        return !!selectedDate;
      case 'time':
        return !!selectedTime;
      case 'confirm':
        return true;
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    if (!selectedPet || !selectedVisitType || !selectedVet || !selectedDate || !selectedTime) return;

    setSubmitting(true);
    setError('');

    try {
      await customerPortalApi.bookAppointment({
        petId: selectedPet.id,
        vetId: selectedVet.id,
        visitType: selectedVisitType.code,
        appointmentDate: selectedDate,
        appointmentTime: selectedTime,
        reason,
      });
      setSuccess(true);
    } catch (err: any) {
      // Handle slot conflict (409) - another customer just booked this slot
      if (err.response?.status === 409) {
        const errorMsg = isRtl
          ? err.response?.data?.error || t('booking.slotConflict')
          : err.response?.data?.errorEn || t('booking.slotConflict');

        // Get alternatives from response
        const alternatives = err.response?.data?.alternatives || [];

        if (alternatives.length > 0) {
          // Show conflict modal with alternatives
          setConflictAlternatives(alternatives);
          setConflictError(errorMsg);
          setShowConflictModal(true);
        } else {
          // No alternatives - show error and go back to time selection
          setError(errorMsg);
          setSelectedTime('');
          fetchAvailability();
          setCurrentStep('time');
        }
      } else {
        setError(err.response?.data?.message || err.response?.data?.error || t('errors.generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Handle selecting an alternative from conflict modal
  const handleSelectAlternative = (alternative: SlotAlternative) => {
    setShowConflictModal(false);
    setConflictAlternatives([]);

    // Update selections with the alternative
    setSelectedDate(alternative.date);
    setSelectedTime(alternative.time);

    // Refresh availability for the new date and go to confirm step
    if (alternative.date !== selectedDate) {
      setCurrentStep('date');
    } else {
      // Same date, different time - go directly to confirm
      setCurrentStep('confirm');
    }
  };

  // Get minimum date (today - past slots are filtered by backend)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Get max date (3 months from now)
  const getMaxDate = () => {
    const maxDate = new Date();
    maxDate.setMonth(maxDate.getMonth() + 3);
    return maxDate.toISOString().split('T')[0];
  };

  // Format date for display
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Success screen
  if (success) {
    return (
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={fadeInUpSimple.transition}
      >
        <Card variant="elevated" padding="lg">
          <SuccessScreen />
        </Card>
      </motion.div>
    );
  }

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
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('booking.title')}
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {t('booking.subtitle')}
        </p>
      </motion.div>

      {/* Step Indicator */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.1 }}
      >
        <StepIndicator currentStep={currentStep} onStepClick={handleStepClick} />
      </motion.div>

      {/* Main Content */}
      <motion.div
        initial={fadeInUpSimple.initial}
        animate={fadeInUpSimple.animate}
        transition={{ ...fadeInUpSimple.transition, delay: 0.2 }}
      >
        <Card variant="elevated" padding="md">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800"
            >
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            {/* Step 1: Select Pet */}
            {currentStep === 'pet' && (
              <motion.div
                key="pet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>🐾</span>
                  {t('booking.selectPet')}
                </h2>

                {pets.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="text-5xl mb-4">🐾</div>
                    <p className="text-gray-500 dark:text-gray-400 mb-4">{t('pets.noPets')}</p>
                    <Link to="/portal/pets">
                      <Button variant="primary" leftIcon={<PlusIcon className="w-4 h-4" />}>
                        {t('booking.addNewPet')}
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 gap-3">
                    {pets.map((pet) => (
                      <motion.button
                        key={pet.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedPet(pet)}
                        className={`
                          p-4 rounded-2xl border-2 text-start transition-all
                          ${selectedPet?.id === pet.id
                            ? 'border-mint-500 bg-mint-50 dark:bg-mint-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-center gap-3">
                          <PetAvatar
                            src={pet.photo}
                            name={pet.name}
                            species={pet.species}
                            size="lg"
                          />
                          <div>
                            <p className="font-semibold text-gray-900 dark:text-white">{pet.name}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                              {t(`pets.speciesOptions.${pet.species}`, pet.species)}
                            </p>
                          </div>
                        </div>
                      </motion.button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 2: Select Visit Type */}
            {currentStep === 'visitType' && (
              <motion.div
                key="visitType"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📋</span>
                  {t('booking.selectVisitType')}
                </h2>

                <div className="grid sm:grid-cols-2 gap-3">
                  {visitTypes.map((type) => (
                    <motion.button
                      key={type.code}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedVisitType(type)}
                      className={`
                        p-4 rounded-2xl border-2 text-start transition-all
                        ${selectedVisitType?.code === type.code
                          ? 'border-mint-500 bg-mint-50 dark:bg-mint-900/20'
                          : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                        }
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center"
                          style={{ backgroundColor: `${type.color}20` }}
                        >
                          <div
                            className="w-4 h-4 rounded-full"
                            style={{ backgroundColor: type.color }}
                          />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900 dark:text-white">
                            {isRtl ? type.nameAr : type.nameEn}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1">
                            <ClockIcon className="w-4 h-4" />
                            {type.duration} {t('booking.minutes')}
                          </p>
                        </div>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Step 3: Select Vet */}
            {currentStep === 'vet' && (
              <motion.div
                key="vet"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>👨‍⚕️</span>
                  {t('booking.selectVet')}
                </h2>

                <div className="space-y-3">
                  {vets.map((vet) => {
                    const workingDays = vet.schedule.filter((s) => s.isWorkingDay);
                    return (
                      <motion.button
                        key={vet.id}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setSelectedVet(vet)}
                        className={`
                          w-full p-4 rounded-2xl border-2 text-start transition-all
                          ${selectedVet?.id === vet.id
                            ? 'border-mint-500 bg-mint-50 dark:bg-mint-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                          }
                        `}
                      >
                        <div className="flex items-start gap-4">
                          <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-2xl flex items-center justify-center overflow-hidden">
                            {vet.avatar ? (
                              <img src={vet.avatar} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon className="w-6 h-6 text-gray-400 dark:text-gray-500" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {t('common.doctor')} {vet.firstName} {vet.lastName}
                            </p>
                            <div className="mt-2">
                              <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">
                                {t('booking.workingDays')}:
                              </p>
                              <div className="flex flex-wrap gap-1">
                                {workingDays.map((day) => (
                                  <span
                                    key={day.dayOfWeek}
                                    className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400"
                                  >
                                    {t(`days.${day.dayOfWeek}`)}
                                  </span>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </motion.div>
            )}

            {/* Step 4: Select Date */}
            {currentStep === 'date' && (
              <motion.div
                key="date"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>📅</span>
                  {t('booking.selectDate')}
                </h2>

                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  min={getMinDate()}
                  max={getMaxDate()}
                  className="w-full px-4 py-4 border-2 border-gray-200 dark:border-gray-700 rounded-2xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-mint-500 focus:outline-none focus:ring-4 focus:ring-mint-500/20 transition-all text-lg"
                />

                {selectedDate && (
                  <div className="p-4 bg-mint-50 dark:bg-mint-900/20 rounded-2xl">
                    <div className="flex items-center gap-3">
                      <CalendarIcon className="w-5 h-5 text-mint-600 dark:text-mint-400" />
                      <span className="font-medium text-mint-700 dark:text-mint-300">
                        {formatDate(selectedDate)}
                      </span>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Step 5: Select Time */}
            {currentStep === 'time' && (
              <motion.div
                key="time"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>⏰</span>
                  {t('booking.selectTime')}
                </h2>

                {loadingSlots ? (
                  <div className="flex items-center justify-center py-12">
                    <div className="w-10 h-10 rounded-full border-2 border-mint-500 border-t-transparent animate-spin" />
                  </div>
                ) : availability?.unavailableReason ? (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <div className="text-5xl mb-4">😔</div>
                    <p className="text-gray-600 dark:text-gray-400">
                      {availability.unavailableReason === 'dayOff' && t('booking.vetOnLeave')}
                      {availability.unavailableReason === 'noSchedule' && t('booking.noSchedule')}
                      {availability.unavailableReason === 'fullyBooked' && t('booking.fullyBooked')}
                    </p>
                  </div>
                ) : availability?.slots && availability.slots.length > 0 ? (
                  <div>
                    {/* WebSocket connection indicator */}
                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('booking.availableSlots')}
                      </p>
                      <div className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                        isConnected
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                        {isConnected ? t('booking.liveUpdates') : t('booking.connecting')}
                      </div>
                    </div>

                    {/* Slot legend */}
                    <div className="flex flex-wrap gap-3 mb-3 text-xs">
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-white border-2 border-gray-200 dark:bg-gray-800 dark:border-gray-700" />
                        <span className="text-gray-500">{t('booking.slotAvailable')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-amber-100 border-2 border-amber-300" />
                        <span className="text-gray-500">{t('booking.slotReserving')}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded bg-red-100 border-2 border-red-300" />
                        <span className="text-gray-500">{t('booking.slotBooked')}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
                      {availability.slots.map((slot) => {
                        const status = getSlotStatus(slot);
                        const isBooked = status?.status === 'booked';
                        const isReservedByOther = status?.status === 'reserved' && !status.isOwn;
                        const isUnavailable = isBooked || isReservedByOther;

                        return (
                          <motion.button
                            key={slot}
                            whileTap={isUnavailable ? {} : { scale: 0.95 }}
                            onClick={() => !isUnavailable && setSelectedTime(slot)}
                            disabled={isUnavailable}
                            className={`
                              relative px-3 py-3 rounded-xl border-2 text-sm font-medium transition-all
                              ${isBooked
                                ? 'border-red-300 bg-red-50 text-red-400 cursor-not-allowed dark:border-red-800 dark:bg-red-900/20 dark:text-red-500 line-through'
                                : isReservedByOther
                                ? 'border-amber-300 bg-amber-50 text-amber-600 cursor-not-allowed dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-400'
                                : selectedTime === slot
                                ? 'border-mint-500 bg-mint-500 text-white'
                                : 'border-gray-200 dark:border-gray-700 hover:border-mint-300 dark:hover:border-mint-600 text-gray-700 dark:text-gray-300'
                              }
                            `}
                          >
                            <span>{slot}</span>
                            {isBooked && (
                              <span className="absolute -top-1 -end-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                                <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </span>
                            )}
                            {isReservedByOther && (
                              <span className="absolute -top-1 -end-1 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center animate-pulse">
                                <ClockIcon className="w-2.5 h-2.5 text-white" />
                              </span>
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 bg-gray-50 dark:bg-gray-800/50 rounded-2xl">
                    <p className="text-gray-600 dark:text-gray-400">{t('booking.noSlots')}</p>
                  </div>
                )}

                {/* Optional reason field */}
                <div className="pt-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {t('booking.reason')}
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={2}
                    placeholder={t('booking.reasonPlaceholder')}
                    className="w-full px-4 py-3 border-2 border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-mint-500 focus:outline-none focus:ring-4 focus:ring-mint-500/20 transition-all"
                  />
                </div>
              </motion.div>
            )}

            {/* Step 6: Confirm */}
            {currentStep === 'confirm' && (
              <motion.div
                key="confirm"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-4"
              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <span>✅</span>
                  {t('booking.summary')}
                </h2>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4">
                  {/* Pet */}
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <PetAvatar
                      src={selectedPet?.photo}
                      name={selectedPet?.name || ''}
                      species={selectedPet?.species || 'OTHER'}
                      size="md"
                    />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('booking.steps.pet')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">{selectedPet?.name}</p>
                    </div>
                  </div>

                  {/* Visit Type */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('booking.steps.visitType')}</span>
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: selectedVisitType?.color }}
                      />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {isRtl ? selectedVisitType?.nameAr : selectedVisitType?.nameEn}
                      </span>
                    </div>
                  </div>

                  {/* Vet */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('booking.steps.vet')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {t('common.doctor')} {selectedVet?.firstName} {selectedVet?.lastName}
                    </span>
                  </div>

                  {/* Date & Time */}
                  <div className="flex justify-between items-center pb-3 border-b border-gray-200 dark:border-gray-700">
                    <span className="text-gray-500 dark:text-gray-400">{t('booking.steps.date')}</span>
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatDate(selectedDate)}
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400">{t('booking.steps.time')}</span>
                    <span className="font-bold text-lg text-mint-600 dark:text-mint-400">
                      {selectedTime}
                    </span>
                  </div>

                  {/* Reason */}
                  {reason && (
                    <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{t('booking.reason')}</p>
                      <p className="text-gray-900 dark:text-white">{reason}</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation buttons */}
          <div className="flex gap-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <Button
              variant="secondary"
              onClick={handleBack}
              disabled={currentStep === 'pet' || submitting}
              leftIcon={<BackIcon className="w-4 h-4" />}
              fullWidth
            >
              {t('booking.back')}
            </Button>

            {currentStep === 'confirm' ? (
              <Button
                variant="primary"
                onClick={handleSubmit}
                loading={submitting}
                fullWidth
              >
                {t('booking.confirm')}
              </Button>
            ) : (
              <Button
                variant="primary"
                onClick={handleNext}
                disabled={!canProceed()}
                rightIcon={<NextIcon className="w-4 h-4" />}
                fullWidth
              >
                {t('booking.next')}
              </Button>
            )}
          </div>
        </Card>
      </motion.div>

      {/* Slot Conflict Modal */}
      <SlotConflictModal
        isOpen={showConflictModal}
        onClose={() => {
          setShowConflictModal(false);
          setSelectedTime('');
          fetchAvailability();
          setCurrentStep('time');
        }}
        onSelectAlternative={handleSelectAlternative}
        alternatives={conflictAlternatives}
        errorMessage={conflictError}
      />
    </motion.div>
  );
};

export default BookAppointment;
