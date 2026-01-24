import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Button } from './Button';
import { LogoLoader } from './LogoLoader';

// Column definition type
export interface Column<T> {
  id: string;
  header: string;
  accessor?: keyof T | ((row: T) => React.ReactNode);
  render?: (row: T, index: number) => React.ReactNode;
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  width?: string;
}

// DataTable props
export interface DataTableProps<T> {
  tableId: string; // Unique ID for localStorage
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyIcon?: string;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
  rowKey: keyof T | ((row: T) => string);
  expandedRowId?: string | null;
  renderExpandedRow?: (row: T) => React.ReactNode;
  onExpandToggle?: (rowId: string | null) => void;
  showExpandColumn?: boolean;
  // Pagination
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  // Styling
  className?: string;
  rowClassName?: string | ((row: T) => string);
  // Actions column
  renderActions?: (row: T) => React.ReactNode;
  actionsHeader?: string;
}

// Sortable header cell component
interface SortableHeaderProps {
  id: string;
  children: React.ReactNode;
  className?: string;
  isDragging?: boolean;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({ id, children, className, isDragging }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    cursor: 'grab',
  };

  return (
    <th
      ref={setNodeRef}
      style={style}
      className={className}
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1">
        <span className="text-gray-400 text-xs">⋮⋮</span>
        {children}
      </div>
    </th>
  );
};

// Dragging header overlay
const DragOverlayHeader: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-primary-100 px-4 py-3 text-xs font-medium text-gray-700 uppercase tracking-wider rounded shadow-lg border border-primary-300">
    {children}
  </div>
);

export function DataTable<T>({
  tableId,
  columns,
  data,
  loading = false,
  emptyIcon = '📋',
  emptyMessage,
  onRowClick,
  rowKey,
  expandedRowId,
  renderExpandedRow,
  onExpandToggle,
  showExpandColumn = false,
  page = 1,
  totalPages = 1,
  onPageChange,
  className = '',
  rowClassName,
  renderActions,
  actionsHeader,
}: DataTableProps<T>) {
  const { t, i18n } = useTranslation('common');
  const isRtl = i18n.language === 'ar';

  // Column order state - load from localStorage
  const [columnOrder, setColumnOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem(`table-columns-${tableId}`);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return columns.map((c) => c.id);
      }
    }
    return columns.map((c) => c.id);
  });

  const [activeId, setActiveId] = useState<string | null>(null);

  // Sync column order when columns change
  useEffect(() => {
    const columnIds = columns.map((c) => c.id);
    const validOrder = columnOrder.filter((id) => columnIds.includes(id));
    const newColumns = columnIds.filter((id) => !columnOrder.includes(id));

    if (validOrder.length !== columnOrder.length || newColumns.length > 0) {
      setColumnOrder([...validOrder, ...newColumns]);
    }
  }, [columns]);

  // Save column order to localStorage
  useEffect(() => {
    localStorage.setItem(`table-columns-${tableId}`, JSON.stringify(columnOrder));
  }, [columnOrder, tableId]);

  // Ordered columns
  const orderedColumns = useMemo(() => {
    return columnOrder
      .map((id) => columns.find((c) => c.id === id))
      .filter(Boolean) as Column<T>[];
  }, [columnOrder, columns]);

  // DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (over && active.id !== over.id) {
      setColumnOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  // Get row key
  const getRowKey = (row: T): string => {
    if (typeof rowKey === 'function') {
      return rowKey(row);
    }
    return String(row[rowKey]);
  };

  // Get cell value
  const getCellValue = (row: T, column: Column<T>, index: number): React.ReactNode => {
    if (column.render) {
      return column.render(row, index);
    }
    if (column.accessor) {
      if (typeof column.accessor === 'function') {
        return column.accessor(row);
      }
      return row[column.accessor] as React.ReactNode;
    }
    return null;
  };

  // Get row class
  const getRowClassName = (row: T): string => {
    if (typeof rowClassName === 'function') {
      return rowClassName(row);
    }
    return rowClassName || '';
  };

  const activeColumn = activeId ? columns.find((c) => c.id === activeId) : null;
  const totalColumns = orderedColumns.length + (showExpandColumn ? 1 : 0) + (renderActions ? 1 : 0);

  if (loading) {
    return <LogoLoader />;
  }

  return (
    <div className={`bg-white rounded-lg shadow overflow-hidden ${className}`}>
      <div className="overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {/* Expand column */}
                {showExpandColumn && (
                  <th className="w-10"></th>
                )}

                {/* Sortable columns */}
                <SortableContext
                  items={columnOrder}
                  strategy={horizontalListSortingStrategy}
                >
                  {orderedColumns.map((column) => (
                    <SortableHeader
                      key={column.id}
                      id={column.id}
                      className={`px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
                      isDragging={activeId === column.id}
                    >
                      {column.header}
                    </SortableHeader>
                  ))}
                </SortableContext>

                {/* Actions column */}
                {renderActions && (
                  <th className="px-4 py-3 text-start text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {actionsHeader || t('actions')}
                  </th>
                )}
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-gray-200">
              {data.length === 0 ? (
                <tr>
                  <td colSpan={totalColumns} className="px-4 py-8 text-center text-gray-500">
                    <div className="flex flex-col items-center">
                      <span className="text-4xl mb-2">{emptyIcon}</span>
                      <p>{emptyMessage || t('noData')}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                data.map((row, index) => {
                  const rowId = getRowKey(row);
                  const isExpanded = expandedRowId === rowId;

                  return (
                    <React.Fragment key={rowId}>
                      <tr
                        className={`hover:bg-gray-50 transition-colors ${
                          onRowClick ? 'cursor-pointer' : ''
                        } ${isExpanded ? 'bg-primary-50' : ''} ${getRowClassName(row)}`}
                        onClick={() => {
                          if (showExpandColumn && onExpandToggle) {
                            onExpandToggle(isExpanded ? null : rowId);
                          } else if (onRowClick) {
                            onRowClick(row);
                          }
                        }}
                      >
                        {/* Expand indicator */}
                        {showExpandColumn && (
                          <td className="px-2 py-3 text-center">
                            <span className="text-gray-400">
                              {isExpanded ? '▼' : '▶'}
                            </span>
                          </td>
                        )}

                        {/* Data cells */}
                        {orderedColumns.map((column) => (
                          <td
                            key={column.id}
                            className={`px-4 py-3 ${column.className || ''}`}
                            style={column.width ? { width: column.width } : undefined}
                          >
                            {getCellValue(row, column, index)}
                          </td>
                        ))}

                        {/* Actions cell */}
                        {renderActions && (
                          <td
                            className="px-4 py-3 whitespace-nowrap text-sm"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {renderActions(row)}
                          </td>
                        )}
                      </tr>

                      {/* Expanded row */}
                      {showExpandColumn && isExpanded && renderExpandedRow && (
                        <tr>
                          <td colSpan={totalColumns} className="px-4 py-4 bg-gray-50">
                            {renderExpandedRow(row)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>

          {/* Drag overlay */}
          <DragOverlay>
            {activeColumn && (
              <DragOverlayHeader>{activeColumn.header}</DragOverlayHeader>
            )}
          </DragOverlay>
        </DndContext>
      </div>

      {/* Pagination */}
      {totalPages > 1 && onPageChange && (
        <div className="px-4 py-3 border-t border-gray-200 flex justify-center gap-2">
          <Button
            variant="secondary"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            {isRtl ? '→' : '←'}
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            {page} / {totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => onPageChange(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            {isRtl ? '←' : '→'}
          </Button>
        </div>
      )}
    </div>
  );
}

export default DataTable;
