/**
 * Boarding Management Page
 * Kanban board for managing boarding and ICU sessions
 */

import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  boardingApi,
  BoardingSessionWithDetails,
} from '../api/boarding';
import { useScreenPermission } from '../hooks/useScreenPermission';
import { BoardingKanbanBoard } from '../components/boarding/BoardingKanbanBoard';
import { BoardingSessionModal } from '../components/boarding/BoardingSessionModal';
import { CheckoutModal } from '../components/boarding/CheckoutModal';

type TabType = 'BOARDING' | 'ICU';

export const BoardingManagement = () => {
  const { t, i18n } = useTranslation('boardingManagement');
  const isRTL = i18n.language === 'ar';
  const queryClient = useQueryClient();
  const { canModify } = useScreenPermission('boardingManagement');

  // State
  const [activeTab, setActiveTab] = useState<TabType>('BOARDING');
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<BoardingSessionWithDetails | null>(null);
  const [checkoutSession, setCheckoutSession] = useState<BoardingSessionWithDetails | null>(null);

  // Fetch configs for sub-tabs
  const { data: configs = [] } = useQuery({
    queryKey: ['boarding-configs', activeTab],
    queryFn: () => boardingApi.getConfigs({ type: activeTab, isActive: true }),
  });

  // Filter configs for current tab
  const filteredConfigs = useMemo(() => {
    return configs.filter(c => c.type === activeTab);
  }, [configs, activeTab]);

  // Fetch Kanban data
  const {
    data: kanbanResponse,
    isLoading,
  } = useQuery({
    queryKey: ['boarding-kanban', activeTab, selectedConfigId],
    queryFn: () =>
      boardingApi.getKanbanSessions({
        type: activeTab,
        configId: selectedConfigId || undefined,
      }),
    refetchInterval: 30000, // Auto-refresh every 30 seconds
  });

  // Checkout mutation
  const checkoutMutation = useMutation({
    mutationFn: (id: string) => boardingApi.checkoutSession(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['boarding-kanban'] });
      queryClient.invalidateQueries({ queryKey: ['boarding-configs'] });
      setCheckoutSession(null);
    },
  });

  // Handle card click - show details modal
  const handleCardClick = (session: BoardingSessionWithDetails) => {
    setSelectedSession(session);
  };

  // Handle checkout button click
  const handleCheckoutClick = (session: BoardingSessionWithDetails) => {
    setCheckoutSession(session);
  };

  // Confirm checkout
  const handleConfirmCheckout = () => {
    if (checkoutSession) {
      checkoutMutation.mutate(checkoutSession.id);
    }
  };

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-brand-dark dark:text-[var(--app-text-primary)]">
          🏠 {t('title')}
        </h1>
        <p className="text-sm text-brand-dark/60 dark:text-[var(--app-text-tertiary)] mt-1">
          {t('subtitle', 'Manage boarding and ICU sessions')}
        </p>
      </div>

      {/* Main Tabs: Boarding | ICU */}
      <div className="mb-4">
        <div className="flex gap-2 border-b border-primary-200 dark:border-gray-700">
          {(['BOARDING', 'ICU'] as TabType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setSelectedConfigId(null);
              }}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-secondary-500 text-secondary-600 dark:text-secondary-400'
                  : 'border-transparent text-brand-dark/60 dark:text-gray-400 hover:text-brand-dark dark:hover:text-gray-200'
              }`}
            >
              {tab === 'BOARDING' ? t('tabs.boarding') : t('tabs.icu')}
              {kanbanResponse && activeTab === tab && (
                <span className="ml-2 px-1.5 py-0.5 text-xs bg-primary-100 dark:bg-primary-900/30 rounded-full">
                  {kanbanResponse.counts.total}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Sub-tabs: Filter by config (species) */}
      {filteredConfigs.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedConfigId(null)}
            className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
              selectedConfigId === null
                ? 'bg-secondary-500 text-white'
                : 'bg-primary-100 dark:bg-primary-900/30 text-brand-dark dark:text-gray-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
            }`}
          >
            {t('filters.all', 'All')}
          </button>
          {filteredConfigs.map((config) => (
            <button
              key={config.id}
              onClick={() => setSelectedConfigId(config.id)}
              className={`px-3 py-1.5 text-sm rounded-full transition-colors ${
                selectedConfigId === config.id
                  ? 'bg-secondary-500 text-white'
                  : 'bg-primary-100 dark:bg-primary-900/30 text-brand-dark dark:text-gray-300 hover:bg-primary-200 dark:hover:bg-primary-900/50'
              }`}
            >
              {isRTL ? config.nameAr : config.nameEn}
              <span className="ml-1 text-xs opacity-70">
                ({config.occupiedSlots}/{config.totalSlots})
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Kanban Board */}
      <motion.div
        key={`${activeTab}-${selectedConfigId}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        <BoardingKanbanBoard
          data={kanbanResponse?.data || { green: [], yellow: [], red: [] }}
          isLoading={isLoading}
          onCardClick={handleCardClick}
          onCheckout={handleCheckoutClick}
          hasFullAccess={canModify}
        />
      </motion.div>

      {/* Statistics Summary */}
      {kanbanResponse && (
        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="bg-[#CEE8DC] dark:bg-green-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-green-700 dark:text-green-400">
              {kanbanResponse.counts.green}
            </div>
            <div className="text-sm text-green-600 dark:text-green-500">
              {t('stats.safe', '5+ Days')}
            </div>
          </div>
          <div className="bg-[#F5DF59]/30 dark:bg-yellow-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">
              {kanbanResponse.counts.yellow}
            </div>
            <div className="text-sm text-yellow-600 dark:text-yellow-500">
              {t('stats.warning', '3 Days')}
            </div>
          </div>
          <div className="bg-[#FFCDD2] dark:bg-red-900/20 rounded-lg p-4 text-center">
            <div className="text-2xl font-bold text-red-700 dark:text-red-400">
              {kanbanResponse.counts.red}
            </div>
            <div className="text-sm text-red-600 dark:text-red-500">
              {t('stats.critical', '1 Day')}
            </div>
          </div>
        </div>
      )}

      {/* Session Details Modal */}
      {selectedSession && (
        <BoardingSessionModal
          session={selectedSession}
          isOpen={!!selectedSession}
          onClose={() => setSelectedSession(null)}
          onCheckout={() => {
            setSelectedSession(null);
            setCheckoutSession(selectedSession);
          }}
          hasFullAccess={canModify}
        />
      )}

      {/* Checkout Confirmation Modal */}
      {checkoutSession && (
        <CheckoutModal
          session={checkoutSession}
          isOpen={!!checkoutSession}
          onClose={() => setCheckoutSession(null)}
          onConfirm={handleConfirmCheckout}
          isLoading={checkoutMutation.isPending}
        />
      )}
    </div>
  );
};

export default BoardingManagement;
