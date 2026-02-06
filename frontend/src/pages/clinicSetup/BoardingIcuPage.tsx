/**
 * Boarding & ICU Settings Page
 * Manage boarding and ICU slot configurations
 *
 * Design unified with FormsPage - uses:
 * - CSS variables for dark mode
 * - Light variant buttons
 * - Translation keys via t() function
 * - Shared ConfirmationModal component
 */

import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PlusIcon,
  PencilIcon,
  HomeIcon,
  HeartIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import { boardingApi, BoardingSlotConfig, BoardingType, Species, CreateConfigData, UpdateConfigData } from '../../api/boarding';
import { useScreenPermission } from '../../hooks/useScreenPermission';
import { ScreenPermissionGuard } from '../../components/common/ScreenPermissionGuard';
import { Button } from '../../components/common/Button';
import { LogoLoader } from '../../components/common/LogoLoader';
import { SelectionCardGroup } from '../../components/common/SelectionCard';

// =====================================================
// Types
// =====================================================

type FilterType = 'ALL' | 'BOARDING' | 'ICU';

interface ConfigModalState {
  isOpen: boolean;
  mode: 'create' | 'edit';
  config?: BoardingSlotConfig;
}

// =====================================================
// Main Component
// =====================================================

const BoardingIcuPage: React.FC = () => {
  const { t, i18n } = useTranslation('boarding');
  const isRtl = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const { canModify } = useScreenPermission('boardingAndIcu');

  // State
  const [filterType, setFilterType] = useState<FilterType>('ALL');
  const [showInactive, setShowInactive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [configModal, setConfigModal] = useState<ConfigModalState>({ isOpen: false, mode: 'create' });
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch configurations
  const { data: configs = [], isLoading } = useQuery({
    queryKey: ['boarding-configs', filterType, showInactive],
    queryFn: () => boardingApi.getConfigs({
      type: filterType !== 'ALL' ? filterType as BoardingType : undefined,
      isActive: showInactive ? undefined : true,
    }),
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: boardingApi.createConfig,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-configs'] });
      setConfigModal({ isOpen: false, mode: 'create' });
      showMessage('success', t('configCreated'));
    },
    onError: (error: any) => {
      showMessage('error', error.response?.data?.errorAr || error.response?.data?.error || t('createFailed'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateConfigData }) => boardingApi.updateConfig(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-configs'] });
      setConfigModal({ isOpen: false, mode: 'create' });
      showMessage('success', t('configUpdated'));
    },
    onError: (error: any) => {
      showMessage('error', error.response?.data?.errorAr || error.response?.data?.error || t('updateFailed'));
    },
  });


  // Helpers
  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 4000);
  };

  const getTypeIcon = (type: BoardingType) => {
    return type === 'BOARDING' ? (
      <HomeIcon className="w-6 h-6 text-blue-500" />
    ) : (
      <HeartIcon className="w-6 h-6 text-red-500" />
    );
  };

  const getSpeciesEmoji = (species: Species) => {
    return species === 'DOG' ? '🐕' : species === 'CAT' ? '🐈' : '🐾';
  };

  const getTypeLabel = (type: BoardingType) => {
    return type === 'BOARDING' ? t('boarding') : t('icu');
  };

  const getSpeciesLabel = (species: Species) => {
    if (species === 'DOG') return t('dog');
    if (species === 'CAT') return t('cat');
    return species;
  };

  // Filter configurations
  const filteredConfigs = configs.filter(config => {
    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const typeLabel = getTypeLabel(config.type).toLowerCase();
      const speciesLabel = getSpeciesLabel(config.species).toLowerCase();
      const nameEn = (config.nameEn || '').toLowerCase();
      const nameAr = config.nameAr || '';
      if (!typeLabel.includes(searchLower) &&
          !speciesLabel.includes(searchLower) &&
          !nameEn.includes(searchLower) &&
          !nameAr.includes(searchQuery)) {
        return false;
      }
    }
    return true;
  });

  return (
    <ScreenPermissionGuard screenName="boardingAndIcu">
      <div className={`p-6 ${isRtl ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800 dark:text-[var(--app-text-primary)] flex items-center gap-2">
              🏠 {t('title')}
            </h1>
            <p className="text-gray-600 dark:text-[var(--app-text-secondary)] mt-1">
              {t('subtitle')}
            </p>
          </div>
          {canModify && (
            <Button onClick={() => setConfigModal({ isOpen: true, mode: 'create' })} className="flex items-center gap-2">
              <PlusIcon className="w-5 h-5" />
              {t('createConfiguration')}
            </Button>
          )}
        </div>

        {/* Message */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`mb-4 p-4 rounded-lg border ${
                message.type === 'success'
                  ? 'bg-green-100 dark:bg-green-900/30 border-green-400 dark:border-green-700 text-green-700 dark:text-green-400'
                  : 'bg-red-100 dark:bg-red-900/30 border-red-400 dark:border-red-700 text-red-700 dark:text-red-400'
              }`}
            >
              {message.type === 'success' ? '✅' : '❌'} {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          {/* Type Filter */}
          <div className="flex flex-wrap gap-2">
            {(['ALL', 'BOARDING', 'ICU'] as FilterType[]).map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filterType === type
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-[var(--app-bg-elevated)] text-gray-700 dark:text-[var(--app-text-secondary)] hover:bg-gray-200 dark:hover:bg-[var(--app-bg-tertiary)]'
                }`}
              >
                {type === 'ALL' ? t('all') : getTypeLabel(type as BoardingType)}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative flex-1 max-w-xs">
            <MagnifyingGlassIcon className={`absolute ${isRtl ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400`} />
            <input
              type="text"
              placeholder={t('search')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRtl ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500`}
            />
          </div>

          {/* Show Inactive */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInactive}
              onChange={(e) => setShowInactive(e.target.checked)}
              className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700 dark:text-[var(--app-text-secondary)]">{t('showInactive')}</span>
          </label>
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center h-64">
            <LogoLoader />
          </div>
        )}

        {/* Empty State */}
        {!isLoading && filteredConfigs.length === 0 && (
          <div className="text-center py-12 bg-gray-50 dark:bg-[var(--app-bg-tertiary)] rounded-xl">
            <div className="text-6xl mb-4">🏠</div>
            <h3 className="text-lg font-semibold text-gray-700 dark:text-[var(--app-text-primary)] mb-2">
              {t('noConfigurations')}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">
              {t('startByCreating')}
            </p>
            {canModify && (
              <button
                onClick={() => setConfigModal({ isOpen: true, mode: 'create' })}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
              >
                <PlusIcon className="w-5 h-5" />
                {t('createConfiguration')}
              </button>
            )}
          </div>
        )}

        {/* Configurations Grid */}
        {!isLoading && filteredConfigs.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredConfigs.map((config) => (
              <motion.div
                key={config.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-sm dark:shadow-black/30 border border-gray-100 dark:border-[var(--app-border-default)] overflow-hidden hover:shadow-md transition-shadow ${
                  !config.isActive ? 'opacity-60' : ''
                }`}
              >
                {/* Card Header */}
                <div className={`px-4 py-3 ${config.type === 'BOARDING' ? 'bg-blue-100 dark:bg-blue-900/20' : 'bg-red-100 dark:bg-red-900/20'} border-b dark:border-[var(--app-border-default)]`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(config.type)}
                      <span className="text-2xl">{getSpeciesEmoji(config.species)}</span>
                    </div>
                    {!config.isActive && (
                      <span className="px-2 py-1 bg-gray-100 dark:bg-[var(--app-bg-elevated)] text-gray-600 dark:text-gray-400 text-xs rounded-full">
                        {t('inactive')}
                      </span>
                    )}
                  </div>
                  {/* Show name as primary title */}
                  <h3 className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)] mt-2">
                    {isRtl ? config.nameAr : config.nameEn}
                  </h3>
                  {/* Show type + species as subtitle */}
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {getSpeciesLabel(config.species)} • {getTypeLabel(config.type)}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-[var(--app-text-secondary)]">
                      {t('totalSlots')}
                    </span>
                    <span className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)]">{config.totalSlots}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 dark:text-[var(--app-text-secondary)]">
                      {t('available')}
                    </span>
                    <span className={`font-semibold ${
                      (config.availableSlots || 0) > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}>
                      {config.availableSlots || config.totalSlots}
                    </span>
                  </div>
                  {config.pricePerDay && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500 dark:text-[var(--app-text-secondary)]">
                        {t('pricePerDay')}
                      </span>
                      <span className="font-semibold text-gray-800 dark:text-[var(--app-text-primary)]">
                        {config.pricePerDay} {t('currency')}
                      </span>
                    </div>
                  )}
                </div>

                {/* Card Actions - Edit Only (Delete disabled by design) */}
                {canModify && (
                  <div className="px-4 py-3 border-t dark:border-[var(--app-border-default)]">
                    <button
                      onClick={() => setConfigModal({ isOpen: true, mode: 'edit', config })}
                      className="w-full flex items-center justify-center gap-1 px-3 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-700 dark:text-primary-400 rounded-lg hover:bg-primary-100 dark:hover:bg-primary-900/50 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      {t('edit')}
                    </button>
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}

        {/* Create/Edit Modal */}
        <ConfigModal
          isOpen={configModal.isOpen}
          mode={configModal.mode}
          config={configModal.config}
          onClose={() => setConfigModal({ isOpen: false, mode: 'create' })}
          onSave={(data) => {
            if (configModal.mode === 'create') {
              createMutation.mutate(data as CreateConfigData);
            } else if (configModal.config) {
              updateMutation.mutate({ id: configModal.config.id, data: data as UpdateConfigData });
            }
          }}
          isLoading={createMutation.isPending || updateMutation.isPending}
          t={t}
        />

      </div>
    </ScreenPermissionGuard>
  );
};

// =====================================================
// Config Modal Component
// =====================================================

interface ConfigModalProps {
  isOpen: boolean;
  mode: 'create' | 'edit';
  config?: BoardingSlotConfig;
  onClose: () => void;
  onSave: (data: CreateConfigData | UpdateConfigData) => void;
  isLoading: boolean;
  t: (key: string) => string;
}

const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, mode, config, onClose, onSave, isLoading, t }) => {
  const [nameEn, setNameEn] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [type, setType] = useState<BoardingType>('BOARDING');
  const [species, setSpecies] = useState<Species>('DOG');
  const [totalSlots, setTotalSlots] = useState('10');
  const [pricePerDay, setPricePerDay] = useState('');
  const [notes, setNotes] = useState('');
  const [isActive, setIsActive] = useState(true);

  // Handle Escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isLoading) {
        onClose();
      }
    },
    [isOpen, onClose, isLoading]
  );

  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.body.style.overflow = 'unset';
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, handleEscape]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && config) {
        setNameEn(config.nameEn || '');
        setNameAr(config.nameAr || '');
        setType(config.type);
        setSpecies(config.species);
        setTotalSlots(config.totalSlots.toString());
        setPricePerDay(config.pricePerDay?.toString() || '');
        setNotes(config.notes || '');
        setIsActive(config.isActive);
      } else {
        setNameEn('');
        setNameAr('');
        setType('BOARDING');
        setSpecies('DOG');
        setTotalSlots('10');
        setPricePerDay('');
        setNotes('');
        setIsActive(true);
      }
    }
  }, [isOpen, mode, config]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      onSave({
        nameEn,
        nameAr,
        type,
        species,
        totalSlots: parseInt(totalSlots),
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        notes: notes || null,
      });
    } else {
      onSave({
        nameEn,
        nameAr,
        totalSlots: parseInt(totalSlots),
        pricePerDay: pricePerDay ? parseFloat(pricePerDay) : null,
        notes: notes || null,
        isActive,
      });
    }
  };

  if (!isOpen) return null;

  // Use Portal to render modal at document.body level (fixes z-index issues with sticky headers)
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={isLoading ? undefined : onClose} />

      {/* Modal Content */}
      <div className="relative bg-white dark:bg-[var(--app-bg-card)] rounded-xl shadow-2xl dark:shadow-black/50 w-full max-w-md max-h-[90vh] flex flex-col animate-modal-appear">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-[var(--app-border-default)] flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-800 dark:text-[var(--app-text-primary)] flex items-center gap-2">
            🏠 {mode === 'create' ? t('createConfiguration') : t('editConfiguration')}
          </h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-2 text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Form - Scrollable Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1">
          {/* Name (English) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
              🏷️ {t('nameEn')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameEn}
              onChange={(e) => setNameEn(e.target.value)}
              placeholder={t('namePlaceholderEn')}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
              required
            />
          </div>

          {/* Name (Arabic) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
              🏷️ {t('nameAr')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
              placeholder={t('namePlaceholderAr')}
              dir="rtl"
              className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
              required
            />
          </div>

          {/* Type Selection (only for create) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
                📋 {t('type')}
              </label>
              <SelectionCardGroup<BoardingType>
                options={[
                  {
                    value: 'BOARDING',
                    label: t('boarding'),
                    sublabel: t('petHotel'),
                    icon: <HomeIcon className="w-8 h-8 text-secondary-500" />,
                  },
                  {
                    value: 'ICU',
                    label: t('icu'),
                    sublabel: t('intensiveCare'),
                    icon: <HeartIcon className="w-8 h-8 text-secondary-500" />,
                  },
                ]}
                value={type}
                onChange={setType}
              />
            </div>
          )}

          {/* Species Selection (only for create) */}
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
                🐾 {t('species')}
              </label>
              <SelectionCardGroup<Species>
                options={[
                  { value: 'DOG', label: t('dog'), emoji: '🐕' },
                  { value: 'CAT', label: t('cat'), emoji: '🐈' },
                ]}
                value={species}
                onChange={setSpecies}
              />
            </div>
          )}

          {/* Total Slots */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
              🔢 {t('numberOfSlots')}
            </label>
            <input
              type="number"
              min="1"
              value={totalSlots}
              onChange={(e) => setTotalSlots(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300"
              required
            />
          </div>

          {/* Price per Day */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
              💰 {t('pricePerDayOptional')}
            </label>
            <div className="relative">
              <input
                type="number"
                min="0"
                step="0.01"
                value={pricePerDay}
                onChange={(e) => setPricePerDay(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-2 pr-14 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 dark:text-gray-400 pointer-events-none">
                {t('currency')}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] mb-2 flex items-center gap-2">
              📝 {t('notesOptional')}
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 dark:border-[var(--app-border-default)] bg-white dark:bg-[var(--app-bg-elevated)] dark:text-[var(--app-text-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-secondary-300 focus:border-secondary-300 resize-none"
            />
          </div>

          {/* Active Toggle (only for edit) */}
          {mode === 'edit' && (
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="rounded border-gray-300 text-secondary-500 focus:ring-secondary-300 w-5 h-5"
              />
              <span className="text-sm font-medium text-gray-700 dark:text-[var(--app-text-secondary)] flex items-center gap-2">
                ✅ {t('active')}
              </span>
            </label>
          )}

          {/* Actions - Using shared Button component (matching AddPetModal/AddUserModal pattern) */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200 dark:border-[var(--app-border-default)]">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              {t('cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
            >
              {isLoading ? t('saving') : (mode === 'create' ? t('create') : t('save'))}
            </Button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
};

export default BoardingIcuPage;
