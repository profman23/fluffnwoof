import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon, FunnelIcon, CheckIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment } from '../../types';
import { FlowBoardCard } from './FlowBoardCard';

export type ScheduledStatusFilter = 'all' | 'confirmed' | 'unconfirmed' | 'cancelled';

interface FlowBoardColumnProps {
  id: string;
  title: string;
  appointments: FlowBoardAppointment[];
  color: string;
  showAddButton?: boolean;
  onAddClick?: () => void;
  onCardClick?: (appointment: FlowBoardAppointment) => void;
  onStatusChange?: () => void;
  onReschedule?: (appointment: FlowBoardAppointment) => void;
  hasFullAccess?: boolean;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: () => void;
  statusFilter?: ScheduledStatusFilter;
  onStatusFilterChange?: (value: ScheduledStatusFilter) => void;
}

export const FlowBoardColumn = ({
  id,
  title,
  appointments,
  color,
  showAddButton,
  onAddClick,
  onCardClick,
  onStatusChange,
  onReschedule,
  hasFullAccess = false,
  sortOrder = 'asc',
  onSortChange,
  statusFilter = 'all',
  onStatusFilterChange,
}: FlowBoardColumnProps) => {
  const { t } = useTranslation('flowBoard');
  const { setNodeRef, isOver } = useDroppable({ id });
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const statusMenuRef = useRef<HTMLDivElement>(null);

  // Close status filter menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target as Node)) {
        setShowStatusMenu(false);
      }
    };
    if (showStatusMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showStatusMenu]);

  const statusOptions: { value: ScheduledStatusFilter; label: string }[] = [
    { value: 'all', label: t('statusFilter.all') },
    { value: 'confirmed', label: t('confirmed') },
    { value: 'unconfirmed', label: t('unconfirmed') },
    { value: 'cancelled', label: t('cancelled') },
  ];

  return (
    <div
      className={`flex flex-col bg-primary-50 dark:bg-[var(--app-bg-secondary)] rounded-lg h-full flex-1 min-w-[200px] border-2 border-primary-200 dark:border-[var(--app-border-default)]
        ${isOver ? 'ring-2 ring-secondary-300 ring-opacity-50' : ''}`}
    >
      {/* Column Header */}
      <div
        className="px-2 py-2 rounded-t-lg flex items-center justify-between h-10"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h3 className="font-medium text-gray-900 text-sm truncate">{title}</h3>
          <span className="bg-black bg-opacity-20 text-gray-900 px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
            {appointments.length}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Status Filter (scheduled column only) */}
          {onStatusFilterChange && (
            <div className="relative" ref={statusMenuRef}>
              <button
                onClick={() => setShowStatusMenu((v) => !v)}
                className="relative p-1 bg-black bg-opacity-10 hover:bg-opacity-20 rounded transition-colors"
                title={t('statusFilter.title')}
              >
                <FunnelIcon className="w-4 h-4 text-gray-900" />
                {statusFilter !== 'all' && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full ring-1 ring-white" />
                )}
              </button>

              {showStatusMenu && (
                <div className="absolute right-0 top-full mt-1 bg-brand-white dark:bg-[var(--app-bg-card)] border border-primary-200 dark:border-[var(--app-border-default)] rounded-lg shadow-lg dark:shadow-black/50 z-50 min-w-[130px] py-1">
                  {statusOptions.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => {
                        onStatusFilterChange(opt.value);
                        setShowStatusMenu(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-1.5 text-xs text-left hover:bg-primary-50 dark:hover:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] ${
                        statusFilter === opt.value ? 'font-semibold' : ''
                      }`}
                    >
                      <span>{opt.label}</span>
                      {statusFilter === opt.value && (
                        <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400 flex-shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Sort Button */}
          {onSortChange && (
            <button
              onClick={onSortChange}
              className="p-1 bg-black bg-opacity-10 hover:bg-opacity-20 rounded transition-colors"
              title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortOrder === 'asc' ? (
                <ArrowUpIcon className="w-4 h-4 text-gray-900" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-gray-900" />
              )}
            </button>
          )}
          {showAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="p-1 bg-black bg-opacity-10 hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 text-gray-900" />
            </button>
          )}
        </div>
      </div>

      {/* Cards Container */}
      <div
        ref={setNodeRef}
        className="flex-1 p-1.5 space-y-1.5 overflow-y-auto"
      >
        <SortableContext
          items={appointments.map((a) => a.id)}
          strategy={verticalListSortingStrategy}
        >
          {appointments.map((appointment) => (
            <FlowBoardCard
              key={appointment.id}
              appointment={appointment}
              onCardClick={onCardClick}
              columnId={id}
              onStatusChange={onStatusChange}
              onReschedule={onReschedule}
              hasFullAccess={hasFullAccess}
            />
          ))}
        </SortableContext>

        {appointments.length === 0 && (
          <div className="text-center text-gray-400 dark:text-gray-500 py-8 text-sm">
            {/* Empty state */}
          </div>
        )}
      </div>
    </div>
  );
};
