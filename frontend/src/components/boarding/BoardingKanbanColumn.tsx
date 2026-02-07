/**
 * Boarding Kanban Column Component
 * A single column in the Kanban board (Green, Yellow, or Red)
 */

import { useTranslation } from 'react-i18next';
import { BoardingSessionWithDetails } from '../../api/boarding';
import { BoardingCard } from './BoardingCard';

export type ColumnType = 'green' | 'yellow' | 'red';

interface BoardingKanbanColumnProps {
  type: ColumnType;
  sessions: BoardingSessionWithDetails[];
  onCardClick?: (session: BoardingSessionWithDetails) => void;
  onCheckout?: (session: BoardingSessionWithDetails) => void;
  hasFullAccess?: boolean;
}

const columnConfig: Record<ColumnType, {
  bgColor: string;
  borderColor: string;
  headerBg: string;
  badgeBg: string;
  titleKey: string;
}> = {
  green: {
    bgColor: 'bg-[#CEE8DC]/30 dark:bg-green-900/10',
    borderColor: 'border-[#86C5A5] dark:border-green-800',
    headerBg: 'bg-[#CEE8DC] dark:bg-green-900/30',
    badgeBg: 'bg-green-500',
    titleKey: 'columns.green',
  },
  yellow: {
    bgColor: 'bg-[#F5DF59]/20 dark:bg-yellow-900/10',
    borderColor: 'border-[#E5C739] dark:border-yellow-800',
    headerBg: 'bg-[#F5DF59]/50 dark:bg-yellow-900/30',
    badgeBg: 'bg-yellow-500',
    titleKey: 'columns.yellow',
  },
  red: {
    bgColor: 'bg-[#FFCDD2]/30 dark:bg-red-900/10',
    borderColor: 'border-[#EF5350] dark:border-red-800',
    headerBg: 'bg-[#FFCDD2] dark:bg-red-900/30',
    badgeBg: 'bg-red-500',
    titleKey: 'columns.red',
  },
};

export const BoardingKanbanColumn = ({
  type,
  sessions,
  onCardClick,
  onCheckout,
  hasFullAccess = false,
}: BoardingKanbanColumnProps) => {
  const { t } = useTranslation('boardingManagement');
  const config = columnConfig[type];

  return (
    <div
      className={`flex flex-col rounded-xl border-2 ${config.borderColor} ${config.bgColor} min-h-[400px] overflow-hidden`}
    >
      {/* Column Header */}
      <div className={`${config.headerBg} px-4 py-3 border-b ${config.borderColor}`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-brand-dark dark:text-[var(--app-text-primary)]">
            {t(config.titleKey)}
          </h3>
          <span
            className={`${config.badgeBg} text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[24px] text-center`}
          >
            {sessions.length}
          </span>
        </div>
      </div>

      {/* Cards Container - Grid layout */}
      <div className="flex-1 p-2 overflow-y-auto">
        {sessions.length === 0 ? (
          <div className="text-center py-8 text-brand-dark/40 dark:text-gray-500 text-sm">
            {t('columns.empty', 'No pets')}
          </div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
            {sessions.map((session) => (
              <BoardingCard
                key={session.id}
                session={session}
                columnType={type}
                onCardClick={onCardClick}
                onCheckout={onCheckout}
                hasFullAccess={hasFullAccess}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BoardingKanbanColumn;
