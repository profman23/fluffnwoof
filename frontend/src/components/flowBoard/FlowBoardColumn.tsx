import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { PlusIcon, ArrowUpIcon, ArrowDownIcon } from '@heroicons/react/24/outline';
import { FlowBoardAppointment } from '../../types';
import { FlowBoardCard } from './FlowBoardCard';

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
}: FlowBoardColumnProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });

  return (
    <div
      className={`flex flex-col bg-gray-50 rounded-lg h-full w-56 flex-shrink-0 border-2 border-gray-200
        ${isOver ? 'ring-2 ring-blue-400 ring-opacity-50' : ''}`}
    >
      {/* Column Header */}
      <div
        className="px-2 py-2 rounded-t-lg flex items-center justify-between h-10"
        style={{ backgroundColor: color }}
      >
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <h3 className="font-semibold text-white text-sm truncate">{title}</h3>
          <span className="bg-white bg-opacity-30 text-white px-1.5 py-0.5 rounded-full text-xs flex-shrink-0">
            {appointments.length}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Sort Button */}
          {onSortChange && (
            <button
              onClick={onSortChange}
              className="p-1 bg-white bg-opacity-20 hover:bg-opacity-40 rounded transition-colors"
              title={sortOrder === 'asc' ? 'Sort descending' : 'Sort ascending'}
            >
              {sortOrder === 'asc' ? (
                <ArrowUpIcon className="w-4 h-4 text-white" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 text-white" />
              )}
            </button>
          )}
          {showAddButton && onAddClick && (
            <button
              onClick={onAddClick}
              className="p-1 bg-white bg-opacity-20 hover:bg-opacity-40 rounded-lg transition-colors"
            >
              <PlusIcon className="w-5 h-5 text-white" />
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
          <div className="text-center text-gray-400 py-8 text-sm">
            {/* Empty state */}
          </div>
        )}
      </div>
    </div>
  );
};
