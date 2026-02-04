import { useState, useRef, useEffect, useMemo } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { UserIcon, ArrowRightOnRectangleIcon, EllipsisVerticalIcon, CheckCircleIcon, XCircleIcon, CalendarIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment, AppointmentStatus, Species } from '../../types';
import { flowBoardApi } from '../../api/flowBoard';
import { visitTypesApi } from '../../api/visitTypes';

interface FlowBoardCardProps {
  appointment: FlowBoardAppointment;
  isDragging?: boolean;
  onCardClick?: (appointment: FlowBoardAppointment) => void;
  columnId?: string;
  onStatusChange?: () => void;
  onReschedule?: (appointment: FlowBoardAppointment) => void;
  hasFullAccess?: boolean;
}

const speciesIcons: Record<Species, string> = {
  DOG: '🐕',
  CAT: '🐈',
  BIRD: '🦜',
  RABBIT: '🐇',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  TURTLE: '🐢',
  FISH: '🐟',
  HORSE: '🐴',
  GOAT: '🐐',
  SHEEP: '🐑',
  COW: '🐄',
  CAMEL: '🐪',
  DONKEY: '🫏',
  MONKEY: '🐒',
  FERRET: '🦨',
  HEDGEHOG: '🦔',
  SNAKE: '🐍',
  LIZARD: '🦎',
  FROG: '🐸',
  CHICKEN: '🐔',
  DUCK: '🦆',
  PIG: '🐷',
  ALPACA: '🦙',
  OTHER: '🐾',
};

export const FlowBoardCard = ({
  appointment,
  isDragging,
  onCardClick,
  columnId,
  onStatusChange,
  onReschedule,
  hasFullAccess = false,
}: FlowBoardCardProps) => {
  const { t, i18n } = useTranslation('flowBoard');
  const isRTL = i18n.language === 'ar';
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fetch visit types to get the actual name
  const { data: visitTypes = [] } = useQuery({
    queryKey: ['visit-types-all'],
    queryFn: () => visitTypesApi.getAll(true), // Include inactive to show all
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Get the visit type name from the code
  const visitTypeName = useMemo(() => {
    if (!appointment.visitType) return null;
    const visitType = visitTypes.find(vt => vt.code === appointment.visitType);
    if (visitType) {
      return isRTL ? visitType.nameAr : visitType.nameEn;
    }
    // Fallback to translation for old enum values
    return t(`visitTypes.${appointment.visitType}`);
  }, [appointment.visitType, visitTypes, isRTL, t]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: appointment.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const isConfirmed = appointment.isConfirmed;
  const isCancelled = appointment.status === AppointmentStatus.CANCELLED;
  const isScheduledColumn = columnId === 'scheduled';

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showMenu]);

  const handleClick = (e: React.MouseEvent) => {
    // Only trigger click if not dragging
    if (onCardClick && !isDragging) {
      e.stopPropagation();
      onCardClick(appointment);
    }
  };

  // Toggle menu
  const handleMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(!showMenu);
  };

  // Toggle confirmation status
  const handleConfirmationToggle = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasFullAccess) return;
    setShowMenu(false);

    try {
      await flowBoardApi.updateConfirmation(appointment.id, !isConfirmed);
      onStatusChange?.();
    } catch (err) {
      console.error('Failed to toggle confirmation:', err);
    }
  };

  // Reschedule handler
  const handleReschedule = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowMenu(false);
    onReschedule?.(appointment);
  };

  // Cancel appointment handler
  const handleCancel = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasFullAccess) return;
    setShowMenu(false);

    try {
      await flowBoardApi.updateStatus(appointment.id, AppointmentStatus.CANCELLED);
      onStatusChange?.();
    } catch (err) {
      console.error('Failed to cancel appointment:', err);
    }
  };

  // Check-in handler
  const handleCheckIn = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!hasFullAccess) return;

    try {
      await flowBoardApi.updateStatus(appointment.id, AppointmentStatus.CHECK_IN);
      onStatusChange?.();
    } catch (err) {
      console.error('Failed to check in:', err);
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={handleClick}
      className={`rounded-md shadow-sm dark:shadow-black/30 border p-2 cursor-grab active:cursor-grabbing
        ${isCancelled ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 opacity-75' : 'bg-brand-white dark:bg-[var(--app-bg-card)]'}
        ${isDragging ? 'opacity-50 shadow-lg' : ''}
        hover:shadow-md transition-shadow ${onCardClick ? 'hover:ring-2 hover:ring-secondary-300' : ''}`}
    >
      {/* Header with time, status and menu */}
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs font-medium text-brand-dark/70 dark:text-[var(--app-text-secondary)]">
          {appointment.appointmentTime}
        </span>
        <div className="flex items-center gap-1">
          <span
            className={`px-1.5 py-0.5 text-xs rounded-full ${
              isCancelled
                ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : isConfirmed
                ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
            }`}
          >
            {isCancelled ? t('cancelled') : isConfirmed ? t('confirmed') : t('unconfirmed')}
          </span>

          {/* Three dots menu - only in scheduled column and not cancelled */}
          {isScheduledColumn && hasFullAccess && !isCancelled && (
            <div className="relative" ref={menuRef}>
              <button
                onClick={handleMenuToggle}
                className="p-0.5 hover:bg-primary-100 rounded transition-colors"
              >
                <EllipsisVerticalIcon className="w-4 h-4 text-brand-dark/60" />
              </button>

              {/* Dropdown Menu */}
              {showMenu && (
                <div className="absolute right-0 top-full mt-1 bg-brand-white dark:bg-[var(--app-bg-card)] border border-primary-200 dark:border-[var(--app-border-default)] rounded-lg shadow-lg dark:shadow-black/50 z-50 min-w-[140px] py-1">
                  {/* Confirm/Unconfirm */}
                  <button
                    onClick={handleConfirmationToggle}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-primary-50 dark:hover:bg-[var(--app-bg-elevated)] text-left dark:text-[var(--app-text-primary)]"
                  >
                    <CheckCircleIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                    <span>{isConfirmed ? t('menu.unconfirm') : t('menu.confirm')}</span>
                  </button>

                  {/* Reschedule */}
                  <button
                    onClick={handleReschedule}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-primary-50 dark:hover:bg-[var(--app-bg-elevated)] text-left dark:text-[var(--app-text-primary)]"
                  >
                    <CalendarIcon className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span>{t('menu.reschedule')}</span>
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={handleCancel}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-red-50 dark:hover:bg-red-900/20 text-left text-red-600 dark:text-red-400"
                  >
                    <XCircleIcon className="w-4 h-4" />
                    <span>{t('menu.cancel')}</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Owner name */}
      <div className="font-medium text-brand-dark dark:text-[var(--app-text-primary)] text-sm mb-0.5 truncate">
        {appointment.pet.owner
          ? `${appointment.pet.owner.firstName} ${appointment.pet.owner.lastName}`
          : '-'}
      </div>

      {/* Pet info */}
      <div className="flex items-center gap-1 text-xs text-brand-dark/70 dark:text-[var(--app-text-secondary)] mb-0.5">
        <span>{speciesIcons[appointment.pet.species] || '🐾'}</span>
        <span className="truncate font-medium">{appointment.pet.name}</span>
        <span className="text-brand-dark/40 dark:text-gray-600">•</span>
        <span className="text-brand-dark/60 dark:text-[var(--app-text-tertiary)]">{t(`species.${appointment.pet.species}`)}</span>
      </div>

      {/* Vet Name */}
      {appointment.vet && (
        <div className="flex items-center gap-1 text-xs text-brand-dark/60 dark:text-[var(--app-text-tertiary)] mb-1">
          <UserIcon className="w-3 h-3" />
          <span className="truncate">
            {appointment.vet.firstName} {appointment.vet.lastName}
          </span>
        </div>
      )}

      {/* Visit type and Check-In button */}
      <div className="flex items-center justify-between mt-1">
        {visitTypeName && (
          <div className="text-xs text-brand-dark/60 dark:text-[var(--app-text-tertiary)] bg-primary-100 dark:bg-primary-900/30 px-1.5 py-0.5 rounded inline-block">
            {visitTypeName}
          </div>
        )}

        {/* Check-In button - only show in scheduled column and not cancelled */}
        {isScheduledColumn && hasFullAccess && !isCancelled && (
          <button
            onClick={handleCheckIn}
            className="flex items-center gap-1 px-2 py-0.5 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          >
            <ArrowRightOnRectangleIcon className="w-3 h-3" />
            {t('checkIn')}
          </button>
        )}
      </div>

      {/* Medical Record Code - show when record is closed */}
      {appointment.medicalRecord?.recordCode && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
          <DocumentTextIcon className="w-3 h-3" />
          <span className="font-medium">{appointment.medicalRecord.recordCode}</span>
        </div>
      )}

      {/* Invoice Number - show when invoice is finalized */}
      {appointment.invoice?.isFinalized && (
        <div className="flex items-center gap-1 mt-1.5 text-xs text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded">
          <DocumentTextIcon className="w-3 h-3" />
          <span className="font-medium">{appointment.invoice.invoiceNumber}</span>
        </div>
      )}
    </div>
  );
};
