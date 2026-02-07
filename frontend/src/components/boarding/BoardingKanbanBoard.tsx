/**
 * Boarding Kanban Board Component
 * Displays three columns: Green (5+ days), Yellow (3 days), Red (1 day)
 */

import { BoardingSessionWithDetails, KanbanData } from '../../api/boarding';
import { BoardingKanbanColumn } from './BoardingKanbanColumn';

interface BoardingKanbanBoardProps {
  data: KanbanData;
  isLoading?: boolean;
  onCardClick?: (session: BoardingSessionWithDetails) => void;
  onCheckout?: (session: BoardingSessionWithDetails) => void;
  hasFullAccess?: boolean;
}

export const BoardingKanbanBoard = ({
  data,
  isLoading = false,
  onCardClick,
  onCheckout,
  hasFullAccess = false,
}: BoardingKanbanBoardProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-xl border-2 border-primary-200 dark:border-gray-700 bg-primary-50 dark:bg-gray-800/50 min-h-[400px] animate-pulse"
          >
            <div className="h-12 bg-primary-100 dark:bg-gray-700 rounded-t-xl" />
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="h-24 bg-primary-100 dark:bg-gray-700 rounded-lg" />
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <BoardingKanbanColumn
        type="green"
        sessions={data.green}
        onCardClick={onCardClick}
        onCheckout={onCheckout}
        hasFullAccess={hasFullAccess}
      />
      <BoardingKanbanColumn
        type="yellow"
        sessions={data.yellow}
        onCardClick={onCardClick}
        onCheckout={onCheckout}
        hasFullAccess={hasFullAccess}
      />
      <BoardingKanbanColumn
        type="red"
        sessions={data.red}
        onCardClick={onCardClick}
        onCheckout={onCheckout}
        hasFullAccess={hasFullAccess}
      />
    </div>
  );
};

export default BoardingKanbanBoard;
