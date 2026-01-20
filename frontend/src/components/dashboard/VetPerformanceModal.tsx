import React from 'react';
import { useTranslation } from 'react-i18next';
import { Modal } from '../common/Modal';
import { VetPerformanceStats } from '../../api/dashboard';
import { UserCircleIcon, DocumentTextIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

interface VetPerformanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  vet: VetPerformanceStats;
}

export const VetPerformanceModal: React.FC<VetPerformanceModalProps> = ({
  isOpen,
  onClose,
  vet,
}) => {
  const { t, i18n } = useTranslation('dashboard');
  const isRtl = i18n.language === 'ar';

  const getPerformanceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceBgColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-100';
    if (rate >= 50) return 'bg-yellow-100';
    return 'bg-red-100';
  };

  const getProgressBarColor = (rate: number) => {
    if (rate >= 80) return 'bg-green-500';
    if (rate >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getPerformanceLabel = (rate: number) => {
    if (rate >= 80) return t('vetPerformance.performanceExcellent');
    if (rate >= 50) return t('vetPerformance.performanceGood');
    return t('vetPerformance.performanceNeedsImprovement');
  };

  const formatLastActivity = (dateStr: string | null) => {
    if (!dateStr) return t('vetPerformance.noActivity');

    const date = new Date(dateStr);
    return date.toLocaleDateString(isRtl ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={t('vetPerformance.detailsTitle')}
      size="md"
    >
      <div className="space-y-6">
        {/* Vet Info Header */}
        <div className="flex items-center gap-4 pb-4 border-b">
          <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
            <UserCircleIcon className="w-10 h-10 text-primary-600" />
          </div>
          <div>
            <h3 className="text-xl font-semibold text-gray-900">{vet.vetName}</h3>
            <p className="text-sm text-gray-500">
              {t('vetPerformance.lastActivity')}: {formatLastActivity(vet.lastActivity)}
            </p>
          </div>
        </div>

        {/* Performance Score */}
        <div className={`p-4 rounded-lg ${getPerformanceBgColor(vet.completionRate)}`}>
          <div className="flex items-center justify-between mb-2">
            <span className="font-medium text-gray-700">{t('vetPerformance.completionRate')}</span>
            <span className={`text-2xl font-bold ${getPerformanceColor(vet.completionRate)}`}>
              {vet.completionRate}%
            </span>
          </div>
          <div className="w-full bg-white/50 rounded-full h-3 mb-2">
            <div
              className={`h-3 rounded-full transition-all duration-300 ${getProgressBarColor(vet.completionRate)}`}
              style={{ width: `${vet.completionRate}%` }}
            />
          </div>
          <p className={`text-sm font-medium ${getPerformanceColor(vet.completionRate)}`}>
            {getPerformanceLabel(vet.completionRate)}
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-4">
          <div className="p-4 bg-gray-50 rounded-lg text-center">
            <DocumentTextIcon className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-2xl font-bold text-gray-900">{vet.totalRecords}</p>
            <p className="text-xs text-gray-500">{t('vetPerformance.totalRecords')}</p>
          </div>
          <div className="p-4 bg-green-50 rounded-lg text-center">
            <CheckCircleIcon className="w-8 h-8 mx-auto mb-2 text-green-500" />
            <p className="text-2xl font-bold text-green-600">{vet.completeRecords}</p>
            <p className="text-xs text-gray-500">{t('vetPerformance.complete')}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg text-center">
            <XCircleIcon className="w-8 h-8 mx-auto mb-2 text-red-500" />
            <p className="text-2xl font-bold text-red-600">{vet.incompleteRecords}</p>
            <p className="text-xs text-gray-500">{t('vetPerformance.incomplete')}</p>
          </div>
        </div>

        {/* Description */}
        <div className="p-4 bg-blue-50 rounded-lg">
          <p className="text-sm text-blue-800">
            {t('vetPerformance.description')}
          </p>
        </div>
      </div>
    </Modal>
  );
};
