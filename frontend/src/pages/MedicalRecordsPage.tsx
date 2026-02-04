import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, ArrowPathIcon, ClipboardDocumentListIcon, PlusCircleIcon } from '@heroicons/react/24/outline';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { useAuthStore } from '../store/authStore';
import { medicalRecordsApi } from '../api/medicalRecords';
import { MedicalRecord, Species } from '../types';
import { PatientRecordModal } from '../components/flowBoard/PatientRecordModal';
import { Input } from '../components/common/Input';
import { DataTable, Column } from '../components/common/DataTable';
import { ReadOnlyBadge } from '../components/common/ReadOnlyBadge';

const speciesIcons: Record<Species, string> = {
  DOG: '🐕',
  CAT: '🐈',
  BIRD: '🦜',
  RABBIT: '🐇',
  HAMSTER: '🐹',
  GUINEA_PIG: '🐹',
  TURTLE: '🐢',
  FISH: '🐟',
  OTHER: '🐾',
};

export const MedicalRecordsPage = () => {
  const { t, i18n } = useTranslation('medicalRecords');
  const isRtl = i18n.language === 'ar';
  const { isReadOnly } = useScreenPermission('medical');
  const user = useAuthStore((state) => state.user);

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);
  const [creatingRecord, setCreatingRecord] = useState(false);
  const [isNewStandaloneRecord, setIsNewStandaloneRecord] = useState(false);

  // Fetch records
  const fetchRecords = useCallback(async () => {
    setLoading(true);
    try {
      const result = await medicalRecordsApi.getAll(page, 20, search || undefined);
      setRecords(result.data || []);
      setTotalPages(result.pagination?.totalPages || 1);
    } catch (error) {
      console.error('Error fetching medical records:', error);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    fetchRecords();
  }, [fetchRecords]);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleRowClick = (record: MedicalRecord) => {
    setIsNewStandaloneRecord(false); // Existing record, not standalone
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRecord(null);
    setIsNewStandaloneRecord(false);
    // Refresh records to show any updates
    fetchRecords();
  };

  // Create new record for a pet (for hospitalized/daily monitoring)
  const handleAddRecord = async (record: MedicalRecord, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent row click

    if (!record.pet?.id || !user?.id || creatingRecord) return;

    setCreatingRecord(true);
    try {
      // Create a new record for the same pet
      const newRecord = await medicalRecordsApi.create({
        petId: record.pet.id,
        vetId: record.vetId || user.id, // Use same vet or current user
      });

      // Open the modal with the new record (standalone mode)
      setIsNewStandaloneRecord(true);
      setSelectedRecord(newRecord);
      setShowModal(true);
    } catch (error) {
      console.error('Error creating new record:', error);
    } finally {
      setCreatingRecord(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateStr: string) => {
    return new Date(dateStr).toLocaleString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Define columns for DataTable
  const columns: Column<MedicalRecord>[] = [
    {
      id: 'visitDate',
      header: t('table.visitDate'),
      render: (record) => (
        <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
          {formatDate(record.visitDate)}
        </span>
      ),
    },
    {
      id: 'petName',
      header: t('table.petName'),
      render: (record) => (
        <div className="flex items-center gap-2">
          <span>{speciesIcons[record.pet?.species || 'OTHER']}</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-[var(--app-text-primary)]">
              {record.pet?.name || '-'}
            </span>
            {record.pet?.petCode && (
              <span className="text-xs text-gray-400">{record.pet.petCode}</span>
            )}
          </div>
        </div>
      ),
    },
    {
      id: 'species',
      header: t('table.species'),
      render: (record) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {record.pet?.species || '-'}
        </span>
      ),
    },
    {
      id: 'owner',
      header: t('table.owner'),
      render: (record) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-900 dark:text-[var(--app-text-primary)] whitespace-nowrap">
            {record.pet?.owner
              ? `${record.pet.owner.firstName} ${record.pet.owner.lastName}`
              : '-'}
          </span>
          {record.pet?.owner?.customerCode && (
            <span className="text-xs text-gray-400">{record.pet.owner.customerCode}</span>
          )}
        </div>
      ),
    },
    {
      id: 'chiefComplaint',
      header: t('table.chiefComplaint'),
      render: (record) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate block">
          {record.chiefComplaint || '-'}
        </span>
      ),
    },
    {
      id: 'diagnosis',
      header: t('table.diagnosis'),
      render: (record) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate block">
          {record.diagnosis || '-'}
        </span>
      ),
    },
    {
      id: 'vet',
      header: t('table.vet'),
      render: (record) => (
        <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
          {record.vet
            ? `${record.vet.firstName} ${record.vet.lastName}`
            : '-'}
        </span>
      ),
    },
    {
      id: 'lastUpdated',
      header: t('table.lastUpdated'),
      render: (record) => (
        <div className="flex flex-col">
          <span className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
            {formatDateTime(record.updatedAt)}
          </span>
          {record.updatedBy && (
            <span className="text-xs text-gray-400">
              {record.updatedBy.firstName} {record.updatedBy.lastName}
            </span>
          )}
        </div>
      ),
    },
    // Actions column - only show if not read-only
    ...(!isReadOnly ? [{
      id: 'actions',
      header: t('table.actions'),
      render: (record: MedicalRecord) => (
        <button
          onClick={(e) => handleAddRecord(record, e)}
          disabled={creatingRecord}
          title={t('addRecordTooltip')}
          className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-brand-dark dark:text-[var(--app-text-primary)] bg-secondary-200 dark:bg-secondary-600 hover:bg-secondary-300 dark:hover:bg-secondary-500 rounded-md transition-colors disabled:opacity-50"
        >
          <PlusCircleIcon className="w-4 h-4" />
          {t('addRecord')}
        </button>
      ),
    }] : []),
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <span className="text-2xl">📋</span>
            <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">{t('title')}</h1>
          </div>
          {isReadOnly && (
            <div className="mt-1">
              <ReadOnlyBadge namespace="medicalRecords" />
            </div>
          )}
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-[var(--app-bg-elevated)] rounded-lg transition-colors"
        >
          <ArrowPathIcon className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative max-w-md">
          <MagnifyingGlassIcon className="absolute start-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <Input
            type="text"
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="ps-10"
          />
        </div>
      </div>

      {/* DataTable */}
      <DataTable<MedicalRecord>
        tableId="medical-records"
        columns={columns}
        data={records}
        loading={loading}
        emptyIcon="📋"
        emptyMessage={t('noRecords')}
        rowKey="id"
        onRowClick={handleRowClick}
        page={page}
        totalPages={totalPages}
        onPageChange={setPage}
      />

      {/* Patient Record Modal */}
      {showModal && selectedRecord && (
        <PatientRecordModal
          isOpen={showModal}
          onClose={handleModalClose}
          appointment={null}
          existingRecordId={selectedRecord.id}
          isStandaloneRecord={isNewStandaloneRecord}
        />
      )}
    </div>
  );
};

export default MedicalRecordsPage;
