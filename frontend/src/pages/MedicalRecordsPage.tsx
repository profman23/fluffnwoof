import { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MagnifyingGlassIcon, ArrowPathIcon, ClipboardDocumentListIcon } from '@heroicons/react/24/outline';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { medicalRecordsApi } from '../api/medicalRecords';
import { MedicalRecord, Species } from '../types';
import { PatientRecordModal } from '../components/flowBoard/PatientRecordModal';
import { Input } from '../components/common/Input';
import { DataTable, Column } from '../components/common/DataTable';

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

  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<MedicalRecord | null>(null);

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
    setSelectedRecord(record);
    setShowModal(true);
  };

  const handleModalClose = () => {
    setShowModal(false);
    setSelectedRecord(null);
    // Refresh records to show any updates
    fetchRecords();
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
        <span className="text-sm text-gray-900 whitespace-nowrap">
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
          <span className="text-sm font-medium text-gray-900">
            {record.pet?.name || '-'}
          </span>
        </div>
      ),
    },
    {
      id: 'species',
      header: t('table.species'),
      render: (record) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
          {record.pet?.species || '-'}
        </span>
      ),
    },
    {
      id: 'owner',
      header: t('table.owner'),
      render: (record) => (
        <span className="text-sm text-gray-900 whitespace-nowrap">
          {record.pet?.owner
            ? `${record.pet.owner.firstName} ${record.pet.owner.lastName}`
            : '-'}
        </span>
      ),
    },
    {
      id: 'chiefComplaint',
      header: t('table.chiefComplaint'),
      render: (record) => (
        <span className="text-sm text-gray-500 max-w-[200px] truncate block">
          {record.chiefComplaint || '-'}
        </span>
      ),
    },
    {
      id: 'diagnosis',
      header: t('table.diagnosis'),
      render: (record) => (
        <span className="text-sm text-gray-500 max-w-[200px] truncate block">
          {record.diagnosis || '-'}
        </span>
      ),
    },
    {
      id: 'vet',
      header: t('table.vet'),
      render: (record) => (
        <span className="text-sm text-gray-500 whitespace-nowrap">
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
          <span className="text-sm text-gray-500 whitespace-nowrap">
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
  ];

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
        <div>
          <div className="flex items-center gap-3">
            <ClipboardDocumentListIcon className="w-7 h-7 text-brand-dark" />
            <h1 className="text-2xl font-bold text-brand-dark">{t('title')}</h1>
          </div>
          {isReadOnly && (
            <span className="text-sm text-amber-600 bg-amber-50 px-2 py-1 rounded mt-1 inline-block">
              {t('readOnly')}
            </span>
          )}
        </div>
        <button
          onClick={fetchRecords}
          disabled={loading}
          className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
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
        />
      )}
    </div>
  );
};

export default MedicalRecordsPage;
