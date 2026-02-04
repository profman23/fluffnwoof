import { useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  CalendarIcon,
  ArrowPathIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  UserIcon,
  EyeIcon,
  EyeSlashIcon,
  ViewColumnsIcon,
} from '@heroicons/react/24/outline';
import { LogoLoader } from '../components/common/LogoLoader';
import { FlowBoardColumn } from '../components/flowBoard/FlowBoardColumn';
import { FlowBoardCard } from '../components/flowBoard/FlowBoardCard';
import { AddAppointmentModal } from '../components/flowBoard/AddAppointmentModal';
import { PatientRecordModal } from '../components/flowBoard/PatientRecordModal';
import { RescheduleModal } from '../components/flowBoard/RescheduleModal';
import { flowBoardApi } from '../api/flowBoard';
import { FlowBoardData, FlowBoardAppointment, AppointmentStatus, User } from '../types';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { useThemeStore } from '../store/themeStore';
import { ReadOnlyBadge } from '../components/common/ReadOnlyBadge';

const statusMap: Record<string, AppointmentStatus> = {
  scheduled: AppointmentStatus.SCHEDULED,
  checkIn: AppointmentStatus.CHECK_IN,
  inProgress: AppointmentStatus.IN_PROGRESS,
  hospitalized: AppointmentStatus.HOSPITALIZED,
  completed: AppointmentStatus.COMPLETED,
};

export const FlowBoardPage = () => {
  const { t } = useTranslation('flowBoard');
  const { isFullControl: hasFullAccess, isReadOnly } = useScreenPermission('flowBoard');
  const flowBoardColors = useThemeStore((state) => state.flowBoardColors);

  // Column config using theme colors - memoized to prevent infinite re-renders
  const columnConfig = useMemo(() => [
    { id: 'scheduled', color: flowBoardColors?.scheduled || '#CEE8DC' },
    { id: 'checkIn', color: flowBoardColors?.checkIn || '#F5DF59' },
    { id: 'inProgress', color: flowBoardColors?.inProgress || '#EAB8D5' },
    { id: 'hospitalized', color: flowBoardColors?.hospitalized || '#EAB8D5' },
    { id: 'completed', color: flowBoardColors?.completed || '#CEE8DC' },
  ], [flowBoardColors]);

  const [data, setData] = useState<FlowBoardData>({
    scheduled: [],
    checkIn: [],
    inProgress: [],
    hospitalized: [],
    completed: [],
  });
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeCard, setActiveCard] = useState<FlowBoardAppointment | null>(null);
  const [showPatientRecord, setShowPatientRecord] = useState(false);
  const [selectedAppointment, setSelectedAppointment] = useState<FlowBoardAppointment | null>(null);
  const [staffList, setStaffList] = useState<User[]>([]);
  const [selectedStaff, setSelectedStaff] = useState<string>('all');
  const [showCancelled, setShowCancelled] = useState(true);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<FlowBoardAppointment | null>(null);
  const [columnSortOrder, setColumnSortOrder] = useState<Record<string, 'asc' | 'desc'>>({
    scheduled: 'asc',
    checkIn: 'asc',
    inProgress: 'asc',
    hospitalized: 'asc',
    completed: 'asc',
  }); // Default: closest time at top for all columns

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const loadData = async () => {
    console.log('>>> loadData CALLED at', new Date().toISOString());
    setLoading(true);
    try {
      const result = await flowBoardApi.getData(selectedDate);
      // Debug: Check if recordCode is returned
      console.log('=== FlowBoard Data Debug ===');
      const allAppts = [...(result.scheduled || []), ...(result.checkIn || []), ...(result.inProgress || []), ...(result.completed || [])];
      allAppts.forEach((appt, i) => {
        if (appt.medicalRecord) {
          console.log(`[${appt.status}] ${appt.pet?.name}: recordCode=${appt.medicalRecord?.recordCode}, isClosed=${appt.medicalRecord?.isClosed}`);
        }
      });
      setData(result);
    } catch (err) {
      console.error('Failed to load flow board data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [selectedDate]);

  // Load staff list
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const staff = await flowBoardApi.getStaff();
        setStaffList(staff);
      } catch (err) {
        console.error('Failed to load staff:', err);
      }
    };
    loadStaff();
  }, []);

  // Sort appointments by time for a specific column
  const sortAppointments = (appointments: FlowBoardAppointment[], columnId: string) => {
    const sortOrder = columnSortOrder[columnId] || 'asc';
    return [...appointments].sort((a, b) => {
      const comparison = a.appointmentTime.localeCompare(b.appointmentTime);
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  };

  // Handler for column sort change
  const handleColumnSortChange = (columnId: string) => {
    setColumnSortOrder(prev => ({
      ...prev,
      [columnId]: prev[columnId] === 'asc' ? 'desc' : 'asc',
    }));
  };

  // Filter data by selected staff, cancelled visibility, and sort
  const filteredData = useMemo(() => {
    let result = data;

    // Filter by staff
    if (selectedStaff !== 'all') {
      result = {
        scheduled: result.scheduled.filter((a) => a.vet?.id === selectedStaff),
        checkIn: result.checkIn.filter((a) => a.vet?.id === selectedStaff),
        inProgress: result.inProgress.filter((a) => a.vet?.id === selectedStaff),
        hospitalized: result.hospitalized.filter((a) => a.vet?.id === selectedStaff),
        completed: result.completed.filter((a) => a.vet?.id === selectedStaff),
      };
    }

    // Filter out cancelled if not showing them
    if (!showCancelled) {
      result = {
        ...result,
        scheduled: result.scheduled.filter((a) => a.status !== AppointmentStatus.CANCELLED),
      };
    }

    // Sort all columns by appointment time (each column has its own sort order)
    result = {
      scheduled: sortAppointments(result.scheduled, 'scheduled'),
      checkIn: sortAppointments(result.checkIn, 'checkIn'),
      inProgress: sortAppointments(result.inProgress, 'inProgress'),
      hospitalized: sortAppointments(result.hospitalized, 'hospitalized'),
      completed: sortAppointments(result.completed, 'completed'),
    };

    return result;
  }, [data, selectedStaff, showCancelled, columnSortOrder]);

  const handleDateChange = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const findAppointmentColumn = (id: string): string | null => {
    for (const [columnId, appointments] of Object.entries(data)) {
      if (appointments.some((a: FlowBoardAppointment) => a.id === id)) {
        return columnId;
      }
    }
    return null;
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const columnId = findAppointmentColumn(active.id as string);
    if (columnId) {
      const appointment = data[columnId as keyof FlowBoardData].find(
        (a) => a.id === active.id
      );
      setActiveCard(appointment || null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over || !hasFullAccess) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find source column
    const sourceColumn = findAppointmentColumn(activeId);
    if (!sourceColumn) return;

    // Determine target column
    let targetColumn = overId;
    if (!columnConfig.some((c) => c.id === overId)) {
      targetColumn = findAppointmentColumn(overId) || sourceColumn;
    }

    if (sourceColumn === targetColumn) return;

    // Get the appointment
    const appointment = data[sourceColumn as keyof FlowBoardData].find(
      (a) => a.id === activeId
    );
    if (!appointment) return;

    // Optimistic update
    setData((prev) => {
      const newData = { ...prev };
      newData[sourceColumn as keyof FlowBoardData] = prev[
        sourceColumn as keyof FlowBoardData
      ].filter((a) => a.id !== activeId);
      newData[targetColumn as keyof FlowBoardData] = [
        ...prev[targetColumn as keyof FlowBoardData],
        { ...appointment, status: statusMap[targetColumn] },
      ];
      return newData;
    });

    // API call
    try {
      await flowBoardApi.updateStatus(activeId, statusMap[targetColumn]);
    } catch (err) {
      console.error('Failed to update status:', err);
      // Revert on error
      loadData();
    }
  };

  const formatDisplayDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString(undefined, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleCardClick = (appointment: FlowBoardAppointment) => {
    setSelectedAppointment(appointment);
    setShowPatientRecord(true);
  };

  return (
    <div className="page-container pt-1 h-screen flex flex-col">
      {/* Header - Compact */}
      <div className="bg-white dark:bg-[var(--app-bg-card)] rounded-lg shadow-sm dark:shadow-black/30 px-3 py-1.5 mb-1">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xl">📋</span>
            <h1 className="text-xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">{t('title')}</h1>
            <span className="text-xs text-gray-500 dark:text-gray-400">{formatDisplayDate(selectedDate)}</span>
            {isReadOnly && <ReadOnlyBadge compact namespace="flowBoard" />}
          </div>

          <div className="flex items-center gap-2">
            {/* Date Navigation */}
            <div className="flex items-center bg-gray-100 dark:bg-[var(--app-bg-elevated)] rounded-md">
              <button
                onClick={() => handleDateChange(-1)}
                className="p-1 hover:bg-white dark:hover:bg-[var(--app-bg-tertiary)] rounded-md transition-colors dark:text-gray-400"
              >
                <ChevronLeftIcon className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-1 px-1">
                <CalendarIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent border-none focus:ring-0 text-xs font-medium w-28 py-0.5 dark:text-[var(--app-text-primary)]"
                />
              </div>
              <button
                onClick={() => handleDateChange(1)}
                className="p-1 hover:bg-white dark:hover:bg-[var(--app-bg-tertiary)] rounded-md transition-colors dark:text-gray-400"
              >
                <ChevronRightIcon className="w-4 h-4" />
              </button>
            </div>

            {/* Staff Filter */}
            <div className="flex items-center bg-gray-100 dark:bg-[var(--app-bg-elevated)] rounded-md px-1.5">
              <UserIcon className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
              <select
                value={selectedStaff}
                onChange={(e) => setSelectedStaff(e.target.value)}
                className="bg-transparent border-none focus:ring-0 text-xs font-medium py-1 pr-5 dark:text-[var(--app-text-primary)]"
              >
                <option value="all">{t('allStaff')}</option>
                {staffList.map((staff) => (
                  <option key={staff.id} value={staff.id}>
                    {staff.firstName} {staff.lastName}
                  </option>
                ))}
              </select>
            </div>

            {/* Show Cancelled Filter */}
            <label className="flex items-center gap-1.5 bg-gray-100 dark:bg-[var(--app-bg-elevated)] rounded-md px-2 py-1 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-red-500 focus:ring-red-500"
              />
              <span className="flex items-center gap-1 text-xs font-medium text-gray-600 dark:text-gray-400">
                {showCancelled ? <EyeIcon className="w-3.5 h-3.5" /> : <EyeSlashIcon className="w-3.5 h-3.5" />}
                {t('showCancelled')}
              </span>
            </label>

            {/* Refresh Button */}
            <button
              onClick={loadData}
              disabled={loading}
              className="p-1.5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-md transition-colors"
            >
              <ArrowPathIcon className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Board with Brand Pattern Background */}
      <div className="overflow-x-auto pb-2 flex-1 min-h-0">
        {loading ? (
          <LogoLoader />
        ) : (
          <DndContext
            sensors={isReadOnly ? [] : sensors}
            collisionDetection={closestCorners}
            onDragStart={isReadOnly ? undefined : handleDragStart}
            onDragEnd={isReadOnly ? undefined : handleDragEnd}
          >
            <div className="flex gap-3 h-full w-full">
              {columnConfig.map((column) => (
                <FlowBoardColumn
                  key={column.id}
                  id={column.id}
                  title={t(`columns.${column.id}`)}
                  appointments={filteredData[column.id as keyof FlowBoardData] || []}
                  color={column.color}
                  showAddButton={column.id === 'scheduled' && hasFullAccess}
                  onAddClick={() => setShowAddModal(true)}
                  onCardClick={handleCardClick}
                  onStatusChange={loadData}
                  onReschedule={setRescheduleAppointment}
                  hasFullAccess={hasFullAccess}
                  sortOrder={columnSortOrder[column.id] || 'asc'}
                  onSortChange={() => handleColumnSortChange(column.id)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCard && <FlowBoardCard appointment={activeCard} isDragging />}
            </DragOverlay>
          </DndContext>
        )}
      </div>

      {/* Add Appointment Modal - rendered conditionally to avoid unnecessary mounting */}
      {showAddModal && (
        <AddAppointmentModal
          isOpen={showAddModal}
          onClose={() => setShowAddModal(false)}
          onSuccess={loadData}
          selectedDate={selectedDate}
        />
      )}

      {/* Patient Record Modal */}
      {showPatientRecord && (
        <PatientRecordModal
          isOpen={showPatientRecord}
          onClose={() => {
            setShowPatientRecord(false);
            setSelectedAppointment(null);
          }}
          onSuccess={loadData}
          appointment={selectedAppointment}
        />
      )}

      {/* Reschedule Modal */}
      {rescheduleAppointment && (
        <RescheduleModal
          isOpen={!!rescheduleAppointment}
          onClose={() => setRescheduleAppointment(null)}
          appointment={rescheduleAppointment}
          onSuccess={loadData}
        />
      )}
    </div>
  );
};

export default FlowBoardPage;
